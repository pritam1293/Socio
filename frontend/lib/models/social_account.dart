class SocialAccount {
  final String id;
  final String platform;
  final String? platformUsername;
  final bool isActive;
  final DateTime createdAt;

  SocialAccount({
    required this.id,
    required this.platform,
    this.platformUsername,
    required this.isActive,
    required this.createdAt,
  });

  factory SocialAccount.fromJson(Map<String, dynamic> json) {
    return SocialAccount(
      id: json['id'] ?? '',
      platform: json['platform'] ?? '',
      platformUsername: json['platform_username'],
      isActive: json['is_active'] ?? false,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}
