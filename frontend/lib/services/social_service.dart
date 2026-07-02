import 'dart:convert';
import '../models/social_account.dart';
import 'api_service.dart';

class SocialService {
  final ApiService _api;

  SocialService(this._api);

  Future<String> getConnectUrl(String platform) async {
    final response = await _api.get('/social/connect?platform=$platform');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    final data = jsonDecode(response.body);
    return data['auth_url'] ?? '';
  }

  Future<List<SocialAccount>> getConnectedAccounts() async {
    final response = await _api.get('/social/accounts');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    final data = jsonDecode(response.body);
    final accounts = (data['accounts'] as List<dynamic>)
        .map((a) => SocialAccount.fromJson(a as Map<String, dynamic>))
        .toList();
    return accounts;
  }

  Future<void> disconnectAccount(String id) async {
    final response = await _api.delete('/social/accounts/$id');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }
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
