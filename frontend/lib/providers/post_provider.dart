import 'package:flutter/material.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../services/post_service.dart';

class PostProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  late final PostService _postService = PostService(_api);

  List<Post> _posts = [];
  bool _isLoading = false;
  String? _error;

  List<Post> get posts => _posts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadPosts({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _posts = await _postService.getPosts(status: status);
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Post?> createPost({
    String? caption,
    List<String> hashtags = const [],
    required List<String> platforms,
    DateTime? scheduledAt,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final post = await _postService.createPost(
        caption: caption,
        hashtags: hashtags,
        platforms: platforms,
        scheduledAt: scheduledAt,
      );
      _posts.insert(0, post);
      _isLoading = false;
      notifyListeners();
      return post;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<Post?> publishNow(String id) async {
    try {
      final post = await _postService.publishNow(id);
      final index = _posts.indexWhere((p) => p.id == id);
      if (index != -1) {
        _posts[index] = post;
      }
      notifyListeners();
      return post;
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return null;
    }
  }

  Future<void> deletePost(String id) async {
    try {
      await _postService.deletePost(id);
      _posts.removeWhere((p) => p.id == id);
      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
    }
  }
}
