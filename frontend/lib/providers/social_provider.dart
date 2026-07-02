import 'package:flutter/material.dart';
import '../models/social_account.dart';
import '../services/api_service.dart';
import '../services/social_service.dart';

class SocialProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  late final SocialService _socialService = SocialService(_api);

  List<SocialAccount> _accounts = [];
  bool _isLoading = false;
  String? _error;

  List<SocialAccount> get accounts => _accounts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAccounts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _accounts = await _socialService.getConnectedAccounts();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<String?> getConnectUrl(String platform) async {
    try {
      return await _socialService.getConnectUrl(platform);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  Future<void> disconnectAccount(String id) async {
    try {
      await _socialService.disconnectAccount(id);
      _accounts.removeWhere((a) => a.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }
}
