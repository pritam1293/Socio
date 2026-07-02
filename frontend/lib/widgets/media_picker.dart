import 'package:flutter/material.dart';

class MediaPicker extends StatelessWidget {
  final List<String> mediaUrls;
  final ValueChanged<List<String>> onChanged;
  final int maxFiles;

  const MediaPicker({
    super.key,
    required this.mediaUrls,
    required this.onChanged,
    this.maxFiles = 4,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (mediaUrls.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: mediaUrls.length + (mediaUrls.length < maxFiles ? 1 : 0),
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, index) {
                if (index >= mediaUrls.length) {
                  return GestureDetector(
                    onTap: _pickMedia,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: colorScheme.outlineVariant,
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.add_photo_alternate_outlined,
                        color: colorScheme.primary,
                        size: 32,
                      ),
                    ),
                  );
                }

                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        width: 100,
                        height: 100,
                        color: colorScheme.surfaceContainerHighest,
                        child: const Icon(Icons.image),
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () {
                          final updated = List<String>.from(mediaUrls);
                          updated.removeAt(index);
                          onChanged(updated);
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          padding: const EdgeInsets.all(4),
                          child: const Icon(
                            Icons.close,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
        if (mediaUrls.isEmpty)
          OutlinedButton.icon(
            onPressed: _pickMedia,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: const Text('Add Media'),
          ),
      ],
    );
  }

  void _pickMedia() {}
}
