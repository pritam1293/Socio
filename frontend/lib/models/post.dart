class Post {
  final String id;
  final String userId;
  final String? caption;
  final List<String> hashtags;
  final String status;
  final DateTime? scheduledAt;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<PostPlatform> platforms;
  final List<MediaFile> mediaFiles;

  Post({
    required this.id,
    required this.userId,
    this.caption,
    required this.hashtags,
    required this.status,
    this.scheduledAt,
    this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.platforms,
    required this.mediaFiles,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      caption: json['caption'],
      hashtags: List<String>.from(json['hashtags'] ?? []),
      status: json['status'] ?? 'draft',
      scheduledAt: json['scheduled_at'] != null
          ? DateTime.parse(json['scheduled_at'])
          : null,
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'])
          : null,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
      platforms: (json['platforms'] as List<dynamic>?)
              ?.map((p) => PostPlatform.fromJson(p))
              .toList() ??
          [],
      mediaFiles: (json['media_files'] as List<dynamic>?)
              ?.map((m) => MediaFile.fromJson(m))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'caption': caption,
      'hashtags': hashtags,
      'status': status,
      'scheduled_at': scheduledAt?.toIso8601String(),
      'published_at': publishedAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class PostPlatform {
  final String id;
  final String postId;
  final String platform;
  final String status;
  final String? platformPostId;
  final DateTime? publishedAt;
  final String? errorMessage;

  PostPlatform({
    required this.id,
    required this.postId,
    required this.platform,
    required this.status,
    this.platformPostId,
    this.publishedAt,
    this.errorMessage,
  });

  factory PostPlatform.fromJson(Map<String, dynamic> json) {
    return PostPlatform(
      id: json['id'] ?? '',
      postId: json['post_id'] ?? '',
      platform: json['platform'] ?? '',
      status: json['status'] ?? 'pending',
      platformPostId: json['platform_post_id'],
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'])
          : null,
      errorMessage: json['error_message'],
    );
  }
}

class MediaFile {
  final String id;
  final String postId;
  final String fileUrl;
  final String fileType;
  final String? fileName;
  final int? fileSize;

  MediaFile({
    required this.id,
    required this.postId,
    required this.fileUrl,
    required this.fileType,
    this.fileName,
    this.fileSize,
  });

  factory MediaFile.fromJson(Map<String, dynamic> json) {
    return MediaFile(
      id: json['id'] ?? '',
      postId: json['post_id'] ?? '',
      fileUrl: json['file_url'] ?? '',
      fileType: json['file_type'] ?? 'image',
      fileName: json['file_name'],
      fileSize: json['file_size'],
    );
  }
}

class DashboardData {
  final DashboardOverview overview;
  final List<Post> upcoming;
  final List<Post> published;
  final List<Post> failed;
  final List<Post> drafts;

  DashboardData({
    required this.overview,
    required this.upcoming,
    required this.published,
    required this.failed,
    required this.drafts,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      overview: DashboardOverview.fromJson(json['overview'] ?? {}),
      upcoming: (json['upcoming'] as List<dynamic>?)
              ?.map((p) => Post.fromJson(p))
              .toList() ??
          [],
      published: (json['published'] as List<dynamic>?)
              ?.map((p) => Post.fromJson(p))
              .toList() ??
          [],
      failed: (json['failed'] as List<dynamic>?)
              ?.map((p) => Post.fromJson(p))
              .toList() ??
          [],
      drafts: (json['drafts'] as List<dynamic>?)
              ?.map((p) => Post.fromJson(p))
              .toList() ??
          [],
    );
  }
}

class DashboardOverview {
  final int drafts;
  final int scheduled;
  final int published;
  final int failed;

  DashboardOverview({
    required this.drafts,
    required this.scheduled,
    required this.published,
    required this.failed,
  });

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    return DashboardOverview(
      drafts: json['drafts'] ?? 0,
      scheduled: json['scheduled'] ?? 0,
      published: json['published'] ?? 0,
      failed: json['failed'] ?? 0,
    );
  }
}
