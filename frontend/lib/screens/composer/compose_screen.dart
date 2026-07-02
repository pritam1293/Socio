import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/post_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/platform_selector.dart';

class ComposeScreen extends StatefulWidget {
  const ComposeScreen({super.key});

  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  final _captionController = TextEditingController();
  final _hashtagController = TextEditingController();
  final List<String> _hashtags = [];
  final List<String> _selectedPlatforms = [];
  DateTime? _scheduledAt;
  bool _publishImmediately = true;

  @override
  void dispose() {
    _captionController.dispose();
    _hashtagController.dispose();
    super.dispose();
  }

  void _addHashtag() {
    final text = _hashtagController.text.trim();
    if (text.isNotEmpty && !_hashtags.contains(text)) {
      setState(() {
        _hashtags.add(text);
        _hashtagController.clear();
      });
    }
  }

  void _removeHashtag(String tag) {
    setState(() => _hashtags.remove(tag));
  }

  Future<void> _selectDateTime() async {
    final now = DateTime.now().add(const Duration(minutes: 5));
    final date = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(now),
    );
    if (time == null) return;

    setState(() {
      _scheduledAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
      _publishImmediately = false;
    });
  }

  Future<void> _submit() async {
    if (_selectedPlatforms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one platform')),
      );
      return;
    }

    final provider = context.read<PostProvider>();
    final post = await provider.createPost(
      caption: _captionController.text.trim(),
      hashtags: _hashtags,
      platforms: _selectedPlatforms,
      scheduledAt: _scheduledAt,
    );

    if (post != null && mounted) {
      if (_publishImmediately && _scheduledAt == null) {
        await provider.publishNow(post.id);
      }

      context.read<DashboardProvider>().loadDashboard();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_publishImmediately ? 'Post published!' : 'Post scheduled!')),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PostProvider>();
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Post'),
        actions: [
          TextButton(
            onPressed: provider.isLoading ? null : _submit,
            child: provider.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Post'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _captionController,
              maxLines: 5,
              maxLength: 280,
              decoration: const InputDecoration(
                hintText: "What's on your mind?",
                border: InputBorder.none,
                counterText: '',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: _hashtags.map((tag) {
                return Chip(
                  label: Text('#$tag'),
                  deleteIcon: const Icon(Icons.close, size: 18),
                  onDeleted: () => _removeHashtag(tag),
                );
              }).toList(),
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _hashtagController,
                    decoration: const InputDecoration(
                      hintText: 'Add hashtag',
                      prefixText: '#',
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    onSubmitted: (_) => _addHashtag(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: _addHashtag,
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Publish to',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            PlatformSelector(
              selectedPlatforms: _selectedPlatforms,
              onChanged: (platforms) {
                setState(() => _selectedPlatforms = platforms);
              },
            ),
            const SizedBox(height: 24),
            Text(
              'Schedule',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  RadioListTile<bool>(
                    title: const Text('Publish immediately'),
                    value: true,
                    groupValue: _publishImmediately,
                    onChanged: (v) {
                      setState(() {
                        _publishImmediately = v ?? true;
                        if (_publishImmediately) _scheduledAt = null;
                      });
                    },
                  ),
                  RadioListTile<bool>(
                    title: const Text('Schedule for later'),
                    subtitle: _scheduledAt != null
                        ? Text(
                            '${_scheduledAt!.day}/${_scheduledAt!.month}/${_scheduledAt!.year} '
                            'at ${_scheduledAt!.hour.toString().padLeft(2, '0')}:'
                            '${_scheduledAt!.minute.toString().padLeft(2, '0')}',
                          )
                        : null,
                    value: false,
                    groupValue: _publishImmediately,
                    onChanged: (v) {
                      setState(() => _publishImmediately = v ?? true);
                      _selectDateTime();
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                IconButton(
                  icon: Icon(Icons.image_outlined, color: colorScheme.primary),
                  onPressed: () {},
                ),
                IconButton(
                  icon: Icon(Icons.videocam_outlined,
                      color: colorScheme.primary),
                  onPressed: () {},
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
