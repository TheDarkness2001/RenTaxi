import 'package:flutter/material.dart';

class AppTheme {
  static const _accent = Color(0xFF30D158);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: _accent, brightness: Brightness.light),
        scaffoldBackgroundColor: const Color(0xFFF5F5F7),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: _accent, brightness: Brightness.dark),
        scaffoldBackgroundColor: const Color(0xFF0A0A0F),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: _accent,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      );
}
