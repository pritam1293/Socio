import 'dart:convert';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  Future<AuthResponse> login(String email, String password) async {
    final response = await _api.post(
      '/auth/login',
      body: {'email': email, 'password': password},
      auth: false,
    );

    if (response.statusCode != 200) {
      final error = _parseError(response.body);
      throw Exception(error);
    }

    final data = jsonDecode(response.body);
    final authResponse = AuthResponse.fromJson(data);

    await _api.saveTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  Future<void> register(String email, String password, String fullName) async {
    final response = await _api.post(
      '/auth/register',
      body: {
        'email': email,
        'password': password,
        'full_name': fullName,
      },
      auth: false,
    );

    if (response.statusCode != 201) {
      final error = _parseError(response.body);
      throw Exception(error);
    }
  }

  Future<void> verifyEmail(String token) async {
    final response = await _api.get(
      '/auth/verify?token=$token',
      auth: false,
    );

    if (response.statusCode != 200) {
      final error = _parseError(response.body);
      throw Exception(error);
    }
  }

  Future<AuthResponse> refreshToken() async {
    final refresh = await _api.refreshToken;
    if (refresh == null) throw Exception('No refresh token');

    final response = await _api.post(
      '/auth/refresh',
      body: {'refresh_token': refresh},
      auth: false,
    );

    if (response.statusCode != 200) {
      await _api.clearTokens();
      throw Exception('Session expired');
    }

    final data = jsonDecode(response.body);
    final authResponse = AuthResponse.fromJson({
      'user': {},
      ...data,
    });

    await _api.saveTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _api.clearTokens();
  }

  String _parseError(String body) {
    try {
      final data = jsonDecode(body);
      return data['error'] ?? 'An error occurred';
    } catch (_) {
      return 'An error occurred';
    }
  }
}
