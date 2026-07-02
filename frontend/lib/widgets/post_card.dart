import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/post.dart';

class PostCard extends StatelessWidget {
  final Post post;
  final VoidCallback? onTap;

  const PostCard({super.key, required this.post, this.onTap});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _statusChip(post.status, colorScheme),
                  const Spacer(),
                  if (post.scheduledAt != null)
                    Text(
                      DateFormat('MMM d, HH:mm').format(post.scheduledAt!),
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
              if (post.caption != null && post.caption!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  post.caption!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ],
              if (post.hashtags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: post.hashtags.map((tag) {
                    return Text(
                      '#$tag',
                      style: TextStyle(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  }).toList(),
                ),
              ],
              if (post.platforms.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: post.platforms.map((p) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: _platformBadge(p.platform, p.status, colorScheme),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusChip(String status, ColorScheme colorScheme) {
    Color bgColor;
    Color fgColor;
    String label;

    switch (status) {
      case 'draft':
        bgColor = colorScheme.surfaceContainerHighest;
        fgColor = colorScheme.onSurfaceVariant;
        label = 'Draft';
        break;
      case 'scheduled':
        bgColor = Colors.blue.withOpacity(0.1);
        fgColor = Colors.blue;
        label = 'Scheduled';
        break;
      case 'published':
        bgColor = Colors.green.withOpacity(0.1);
        fgColor = Colors.green;
        label = 'Published';
        break;
      case 'failed':
        bgColor = Colors.red.withOpacity(0.1);
        fgColor = Colors.red;
        label = 'Failed';
        break;
      case 'partial':
        bgColor = Colors.orange.withOpacity(0.1);
        fgColor = Colors.orange;
        label = 'Partial';
        break;
      default:
        bgColor = colorScheme.surfaceContainerHighest;
        fgColor = colorScheme.onSurfaceVariant;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fgColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _platformBadge(String platform, String status, ColorScheme colorScheme) {
    IconData icon;
    switch (platform) {
      case 'twitter':
        icon = Icons.alternate_email;
        break;
      case 'reddit':
        icon = Icons.forum;
        break;
      case 'threads':
        icon = Icons.text_snippet;
        break;
      default:
        icon = Icons.share;
    }

    Color iconColor;
    switch (status) {
      case 'published':
        iconColor = Colors.green;
        break;
      case 'failed':
        iconColor = Colors.red;
        break;
      case 'pending':
        iconColor = colorScheme.onSurfaceVariant;
        break;
      default:
        iconColor = colorScheme.primary;
    }

    return Icon(icon, size: 20, color: iconColor);
  }
}
