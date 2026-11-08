import 'package:flutter/material.dart';

/// Colors and styles from the Figma kit "Food Delivery Website & App Design UI Kit".
class Ember {
  static const orange = Color(0xFFFC8A06);
  static const navy = Color(0xFF03081F);
  static const green = Color(0xFF028643);
  static const gray = Color(0xFFD9D9D9);
  static const grayDark = Color(0xFFA6A6A6);
  static const light = Color(0xFFFAFAFA);
  static const card = Color(0xFFFDFDFD);
  static const section = Color(0xFFF6F6F6);
  static const line = Color(0xFFEEEEEE);
  static const red = Color(0xFFD03131);
  static const chili = Color(0xFFE12B25);
  static const pink = Color(0xFFFFB1B1);

  /// Thin gray header rules (kit #B3B3B3).
  static const rule = Color(0xFFB3B3B3);

  /// Gray bands: categories (#D9D9D9 at 50%) and footer (#D9D9D9 at 60%) on white.
  static const band = Color(0xFFECECEC);
  static const footerBand = Color(0xFFE8E8E8);

  /// Popup backdrop (kit rgba(14,14,14,0.95)).
  static const backdrop = Color(0xF20E0E0E);

  static const radius = 12.0;
  static const pill = 120.0;

  /// Poppins for Latin; per-glyph fallback to Latin Extended (Turkmen) and Cyrillic (Russian).
  static const fontFallback = ['PoppinsExt', 'MontserratCyr'];

  static const cardShadow = [
    BoxShadow(color: Color(0x40000000), offset: Offset(5, 5), blurRadius: 34),
  ];
  static const softShadow = [
    BoxShadow(color: Color(0x40000000), offset: Offset(0, 4), blurRadius: 4),
  ];
  static const popupShadow = [
    BoxShadow(color: Color(0x80000000), offset: Offset(20, 24), blurRadius: 44),
  ];

  /// Photo overlay gradient used on deal / offer cards.
  static const dealGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [Color(0x00FFFFFF), Color(0x3003081F), Color(0xE303081F)],
    stops: [0, 0.58, 1],
  );

  static TextStyle text(
    double size, {
    FontWeight weight = FontWeight.w400,
    Color color = Colors.black,
    double? height,
  }) => TextStyle(
    fontFamily: 'Poppins',
    fontFamilyFallback: fontFallback,
    fontSize: size,
    fontWeight: weight,
    color: color,
    height: height,
  );

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      fontFamily: 'Poppins',
      colorScheme: ColorScheme.fromSeed(
        seedColor: orange,
        primary: orange,
        secondary: navy,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: Colors.white,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        fontFamily: 'Poppins',
        fontFamilyFallback: fontFallback,
        bodyColor: Colors.black,
        displayColor: Colors.black,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: section,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 18,
        ),
        hintStyle: text(15, color: Colors.black54),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(pill),
          borderSide: const BorderSide(color: Color(0xFFCFCFCF)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(pill),
          borderSide: const BorderSide(color: Color(0xFFCFCFCF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(pill),
          borderSide: const BorderSide(color: orange, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(pill),
          borderSide: const BorderSide(color: red),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: navy,
        contentTextStyle: text(14, color: Colors.white),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
