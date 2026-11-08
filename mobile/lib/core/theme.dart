import 'package:flutter/material.dart';

/// Colors and styles from the Figma kit "Food Delivery App (Community)":
/// Sen type, orange #FF7622 accent, dark #181C2E / #121223, soft gray fields.
class Ember {
  // Accent
  static const orange = Color(0xFFFF7622);
  static const orangeText = Color(0xFFFC6E2A); // "DELIVER TO" label
  static const orangeSoft = Color(0xFFFFEBE4); // ingredient circles
  static const orangeSize = Color(0xFFF58D1D); // chosen size
  static const yellow = Color(0xFFFFD27C); // chosen category chip
  static const peach = Color(0xFFFFC6AE); // profile avatar

  // Dark
  static const navy = Color(0xFF181C2E); // headings, cart button
  static const dark = Color(0xFF121223); // login / cart backgrounds
  static const darkCard = Color(0xFF2A2A39); // round buttons on dark
  static const darkStep = Color(0xFF41414F); // +/- on the dark stepper

  // Text
  static const text1 = Color(0xFF32343E); // body / section titles
  static const text2 = Color(0xFFA0A5BA); // secondary
  static const text3 = Color(0xFF646982); // muted
  static const address = Color(0xFF676767);

  // Surfaces
  static const field = Color(0xFFF0F5FA); // inputs, bottom panels
  static const button = Color(0xFFECF0F4); // round light buttons
  static const search = Color(0xFFF6F6F6); // home search
  static const panel = Color(0xFFF6F8FA); // profile groups
  static const line = Color(0xFFEBEBEB);
  static const placeholder = Color(0xFF98A8B8); // image placeholder

  // States
  static const green = Color(0xFF059C6A);
  static const red = Color(0xFFE04444);

  // Legacy names still used by a few widgets
  static const gray = Color(0xFFD9D9D9);
  static const grayDark = text2;
  static const light = panel;
  static const card = Colors.white;
  static const section = field;
  static const chili = red;
  static const backdrop = Color(0xB3121223);

  static const radius = 12.0; // image corners
  static const fieldRadius = 10.0;
  static const pill = 100.0;

  /// Sen covers Latin and Turkmen letters; Russian falls back to Montserrat.
  static const fontFallback = ['MontserratCyr'];

  /// Kit cards: very soft gray shadow.
  static const cardShadow = [
    BoxShadow(color: Color(0x1F96969A), offset: Offset(0, 4), blurRadius: 30),
  ];
  static const softShadow = [
    BoxShadow(color: Color(0x1496969A), offset: Offset(0, 4), blurRadius: 20),
  ];
  static const popupShadow = [
    BoxShadow(color: Color(0x33000000), offset: Offset(0, 12), blurRadius: 40),
  ];

  static TextStyle text(
    double size, {
    FontWeight weight = FontWeight.w400,
    Color color = text1,
    double? height,
  }) => TextStyle(
    fontFamily: 'Sen',
    fontFamilyFallback: fontFallback,
    fontSize: size,
    fontWeight: weight,
    color: color,
    height: height,
  );

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      fontFamily: 'Sen',
      colorScheme: ColorScheme.fromSeed(
        seedColor: orange,
        primary: orange,
        secondary: navy,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: Colors.white,
      splashFactory: InkRipple.splashFactory,
    );
    final fieldBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(fieldRadius),
      borderSide: BorderSide.none,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        fontFamily: 'Sen',
        fontFamilyFallback: fontFallback,
        bodyColor: text1,
        displayColor: text1,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: field,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 19,
          vertical: 20,
        ),
        hintStyle: text(14, color: text2),
        border: fieldBorder,
        enabledBorder: fieldBorder,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
          borderSide: const BorderSide(color: orange),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
          borderSide: const BorderSide(color: red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(fieldRadius),
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
