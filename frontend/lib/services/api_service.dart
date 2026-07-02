import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class ApiService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final http.Client _client = http.Client();

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  Future<String?> get accessToken => _storage.read(key: _accessTokenKey);
  Future<String?> get refreshToken => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _accessTokenKey, value: access);
    await _storage.write(key: _refreshTokenKey, value: refresh);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  Future<Map<String, String>> _getHeaders({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (auth) {
      final token = await accessToken;
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<http.Response> get(String path, {bool auth = true}) async {
    final headers = await _getHeaders(auth: auth);
    final uri = Uri.parse('${ApiConfig.apiUrl}$path');
    return _client.get(uri, headers: headers).timeout(ApiConfig.timeout);
  }

  Future<http.Response> post(String path,
      {Object? body, bool auth = true}) async {
    final headers = await _getHeaders(auth: auth);
    final uri = Uri.parse('${ApiConfig.apiUrl}$path');
    return _client
        .post(uri, headers: headers, body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
  }

  Future<http.Response> put(String path, {Object? body}) async {
    final headers = await _getHeaders();
    final uri = Uri.parse('${ApiConfig.apiUrl}$path');
    return _client
        .put(uri, headers: headers, body: jsonEncode(body))
        .timeout(ApiConfig.timeout);
  }

  Future<http.Response> delete(String path) async {
    final headers = await _getHeaders();
    final uri = Uri.parse('${ApiConfig.apiUrl}$path');
    return _client.delete(uri, headers: headers).timeout(ApiConfig.timeout);
  }

  Future<http.Response> uploadFile(
      String path, File file, String fieldName) async {
    final token = await accessToken;
    final uri = Uri.parse('${ApiConfig.apiUrl}$path');
    final request = http.MultipartRequest('POST', uri);

    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.files.add(await http.MultipartFile.fromPath(fieldName, file.path));

    final streamedResponse =
        await request.send().timeout(ApiConfig.timeout);
    return http.Response.fromStream(streamedResponse);
  }

  Future<bool> tryRefreshToken() async {
    final storedRefreshToken = await refreshToken;
    if (storedRefreshToken == null) return false;

    try {
      final response = await post(
        '/auth/refresh',
        body: {'refresh_token': storedRefreshToken},
        auth: false,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await saveTokens(
          data['access_token'] ?? '',
          data['refresh_token'] ?? '',
        );
        return true;
      }
    } catch (_) {}

    await clearTokens();
    return false;
  }
}
