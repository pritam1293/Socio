class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );

  static const String apiVersion = '/api/v1';

  static String get apiUrl => '$baseUrl$apiVersion';

  static const Duration timeout = Duration(seconds: 30);

  static const int maxRetries = 3;
}
