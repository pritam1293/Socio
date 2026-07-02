import 'package:flutter/material.dart';

class PlatformSelector extends StatelessWidget {
  final List<String> selectedPlatforms;
  final ValueChanged<List<String>> onChanged;

  const PlatformSelector({
    super.key,
    required this.selectedPlatforms,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final platforms = [
      {
        'key': 'twitter',
        'name': 'X (Twitter)',
        'icon': Icons.alternate_email,
        'color': Colors.black,
      },
      {
        'key': 'reddit',
        'name': 'Reddit',
        'icon': Icons.forum,
        'color': const Color(0xFFFF4500),
      },
      {
        'key': 'threads',
        'name': 'Threads',
        'icon': Icons.text_snippet,
        'color': Colors.black,
      },
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: platforms.map((p) {
        final isSelected = selectedPlatforms.contains(p['key']);

        return FilterChip(
          selected: isSelected,
          avatar: Icon(
            p['icon'] as IconData,
            size: 18,
            color: isSelected ? Colors.white : (p['color'] as Color?) ?? colorScheme.primary,
          ),
          label: Text(p['name'] as String),
          onSelected: (selected) {
            final updated = List<String>.from(selectedPlatforms);
            if (selected) {
              updated.add(p['key'] as String);
            } else {
              updated.remove(p['key'] as String);
            }
            onChanged(updated);
          },
        );
      }).toList(),
    );
  }
}
