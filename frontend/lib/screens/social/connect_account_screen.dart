import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/social_provider.dart';

class ConnectAccountScreen extends StatefulWidget {
  const ConnectAccountScreen({super.key});

  @override
  State<ConnectAccountScreen> createState() => _ConnectAccountScreenState();
}

class _ConnectAccountScreenState extends State<ConnectAccountScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<SocialProvider>().loadAccounts();
    });
  }

  Future<void> _connectPlatform(String platform) async {
    final social = context.read<SocialProvider>();
    final url = await social.getConnectUrl(platform);

    if (url != null && mounted) {
      try {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open $platform authorization page'),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final social = context.watch<SocialProvider>();
    final colorScheme = Theme.of(context).colorScheme;

    final platforms = [
      {
        'name': 'X (Twitter)',
        'key': 'twitter',
        'icon': Icons.alternate_email,
        'color': Colors.black,
      },
      {
        'name': 'Reddit',
        'key': 'reddit',
        'icon': Icons.forum,
        'color': const Color(0xFFFF4500),
      },
      {
        'name': 'Threads',
        'key': 'threads',
        'icon': Icons.text_snippet,
        'color': Colors.black,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connected Accounts'),
      ),
      body: RefreshIndicator(
        onRefresh: () => social.loadAccounts(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Connect your social media accounts to start publishing.',
              style: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            ...platforms.map((p) {
              final isConnected = social.accounts.any(
                (a) => a.platform == p['key'] && a.isActive,
              );

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Theme.of(context)
                        .colorScheme
                        .surfaceContainerHighest,
                    child: Icon(
                      p['icon'] as IconData,
                      color: isConnected ? Colors.green : colorScheme.primary,
                    ),
                  ),
                  title: Text(p['name'] as String),
                  subtitle: Text(
                    isConnected ? 'Connected' : 'Not connected',
                    style: TextStyle(
                      color:
                          isConnected ? Colors.green : colorScheme.onSurfaceVariant,
                    ),
                  ),
                  trailing: isConnected
                      ? TextButton(
                          onPressed: () {
                            final account = social.accounts.firstWhere(
                                (a) => a.platform == p['key'] && a.isActive);
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Disconnect Account'),
                                content: Text(
                                  'Are you sure you want to disconnect your ${p['name']} account?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('Cancel'),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      social.disconnectAccount(account.id);
                                      Navigator.pop(ctx);
                                    },
                                    style: TextButton.styleFrom(
                                      foregroundColor:
                                          colorScheme.error,
                                    ),
                                    child: const Text('Disconnect'),
                                  ),
                                ],
                              ),
                            );
                          },
                          style: TextButton.styleFrom(
                            foregroundColor: colorScheme.error,
                          ),
                          child: const Text('Disconnect'),
                        )
                      : FilledButton.tonal(
                          onPressed: () =>
                              _connectPlatform(p['key'] as String),
                          child: const Text('Connect'),
                        ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
