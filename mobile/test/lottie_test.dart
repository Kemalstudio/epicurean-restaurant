import 'dart:io';

import 'package:ember_app/widgets/animated.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lottie/lottie.dart';

void main() {
  // Every bundled animation must be readable by the Flutter Lottie parser
  const files = [
    'loader',
    'empty_basket',
    'not_found',
    'no_internet',
    'success',
    'delivery',
  ];
  for (final name in files) {
    test('$name.json parses', () async {
      final bytes = await File('assets/lottie/$name.json').readAsBytes();
      final composition = await LottieComposition.fromBytes(bytes);
      expect(composition.duration, greaterThan(Duration.zero));
      expect(composition.bounds.width, 240);
      expect(composition.layers, isNotEmpty);
    });
  }

  testWidgets('EmberLottie renders without errors', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: EmberLottie(EmberAnim.notFound, size: 160)),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(Lottie), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
