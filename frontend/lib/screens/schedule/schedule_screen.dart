import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/post_provider.dart';
import '../../widgets/post_card.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<PostProvider>().loadPosts(status: 'scheduled');
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PostProvider>();
    final colorScheme = Theme.of(context).colorScheme;
    final scheduled = provider.posts;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scheduled Posts'),
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.loadPosts(status: 'scheduled'),
        child: provider.isLoading && scheduled.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : scheduled.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.schedule,
                            size: 64, color: colorScheme.primary),
                        const SizedBox(height: 16),
                        const Text('No scheduled posts'),
                        const SizedBox(height: 8),
                        Text(
                          'Schedule posts to publish later',
                          style: TextStyle(
                              color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: scheduled.length,
                    itemBuilder: (_, i) => PostCard(post: scheduled[i]),
                  ),
      ),
    );
  }
}
