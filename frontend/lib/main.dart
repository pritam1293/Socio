import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/dashboard_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PostProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ],
      child: const SocioApp(),
    ),
  );
}
