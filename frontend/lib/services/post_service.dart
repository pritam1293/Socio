import 'dart:convert';
import '../models/post.dart';
import 'api_service.dart';

class PostService {
  final ApiService _api;

  PostService(this._api);

  Future<Post> createPost({
    String? caption,
    List<String> hashtags = const [],
    required List<String> platforms,
    DateTime? scheduledAt,
    List<String> mediaIds = const [],
  }) async {
    final body = <String, dynamic>{
      'platforms': platforms,
      'hashtags': hashtags,
      'media_ids': mediaIds,
    };
    if (caption != null && caption.isNotEmpty) {
      body['caption'] = caption;
    }
    if (scheduledAt != null) {
      body['scheduled_at'] = scheduledAt.toUtc().toIso8601String();
    }

    final response = await _api.post('/posts', body: body);

    if (response.statusCode != 201) {
      throw Exception(_parseError(response.body));
    }

    return Post.fromJson(jsonDecode(response.body));
  }

  Future<List<Post>> getPosts({String? status, int limit = 20, int offset = 0}) async {
    var path = '/posts?limit=$limit&offset=$offset';
    if (status != null) {
      path += '&status=$status';
    }

    final response = await _api.get(path);

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    final data = jsonDecode(response.body);
    final posts = (data['posts'] as List<dynamic>)
        .map((p) => Post.fromJson(p as Map<String, dynamic>))
        .toList();
    return posts;
  }

  Future<Post> getPost(String id) async {
    final response = await _api.get('/posts/$id');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    return Post.fromJson(jsonDecode(response.body));
  }

  Future<Post> updatePost(String id, {
    String? caption,
    List<String>? hashtags,
    List<String>? platforms,
    DateTime? scheduledAt,
    List<String>? mediaIds,
  }) async {
    final body = <String, dynamic>{};
    if (caption != null) body['caption'] = caption;
    if (hashtags != null) body['hashtags'] = hashtags;
    if (platforms != null) body['platforms'] = platforms;
    if (mediaIds != null) body['media_ids'] = mediaIds;
    if (scheduledAt != null) {
      body['scheduled_at'] = scheduledAt.toUtc().toIso8601String();
    }

    final response = await _api.put('/posts/$id', body: body);

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    return Post.fromJson(jsonDecode(response.body));
  }

  Future<void> deletePost(String id) async {
    final response = await _api.delete('/posts/$id');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }
  }

  Future<Post> publishNow(String id) async {
    final response = await _api.post('/posts/$id/publish');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    return Post.fromJson(jsonDecode(response.body));
  }

  Future<DashboardData> getDashboard() async {
    final response = await _api.get('/posts/dashboard');

    if (response.statusCode != 200) {
      throw Exception(_parseError(response.body));
    }

    return DashboardData.fromJson(jsonDecode(response.body));
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
