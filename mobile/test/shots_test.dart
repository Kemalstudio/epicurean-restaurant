// Renders whole screens to PNG files for side-by-side comparison with the Figma kit.
//   flutter test test/shots_test.dart --dart-define=SHOTS_DIR=C:/path/to/out
// Skipped unless SHOTS_DIR is given.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:ember_app/core/api.dart';
import 'package:ember_app/core/state.dart';
import 'package:ember_app/core/theme.dart';
import 'package:ember_app/screens/basket.dart';
import 'package:ember_app/screens/home.dart';
import 'package:ember_app/screens/restaurant.dart';
import 'package:ember_app/screens/shell.dart';
import 'package:ember_app/widgets/common.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'layout_test.dart' show fixture, loadAppFonts, mockApi;

const outDir = String.fromEnvironment('SHOTS_DIR');

final shots = <String, (double, Widget Function())>{
  'home': (7000, () => const HomeScreen()),
  'restaurant': (8000, () => const RestaurantScreen(slug: 'napoli-wood-fire')),
  'basket': (1800, () => const BasketScreen()),
  'section_picker': (
    1000,
    () => const RestaurantScreen(slug: 'napoli-wood-fire'),
  ),
  'menu_drawer': (
    1000,
    () => const Scaffold(body: SizedBox(), endDrawer: AppMenu()),
  ),
};

void main() {
  setUpAll(() async {
    await loadAppFonts();
    final sdk = File(
      Platform.resolvedExecutable,
    ).parent.parent.parent.parent.path;
    final icons = File(
      '$sdk/artifacts/material_fonts/materialicons-regular.otf',
    );
    if (icons.existsSync()) {
      await (FontLoader('MaterialIcons')..addFont(
            Future.value(ByteData.sublistView(icons.readAsBytesSync())),
          ))
          .load();
    }
    NetImage.builderForTests = (url, fit, w, h) => Image.file(
      File('../public$url'),
      fit: fit,
      width: w,
      height: h,
      cacheWidth: 600,
      errorBuilder: (_, _, _) =>
          Container(width: w, height: h, color: Ember.gray),
    );
    Api.instance.client = mockApi();
  });

  for (final e in shots.entries) {
    testWidgets('shot ${e.key}', skip: outDir.isEmpty, (tester) async {
      tester.view.physicalSize = Size(430, e.value.$1);
      tester.view.devicePixelRatio = 1;
      SharedPreferences.setMockInitialValues({'lang': 'en'});
      final app = AppState();
      final cart = CartState();
      await cart.init();
      await app.init();
      if (e.key == 'basket') {
        final r = fixture('r_napoli-wood-fire_en');
        for (final p in (r['products'] as List).take(4)) {
          cart.add(
            product: Map<String, dynamic>.from(p),
            restaurantData: r,
            size: ((p['sizes'] as List?)?.isNotEmpty ?? false)
                ? p['sizes'][0]['name']
                : null,
          );
        }
      }
      final key = GlobalKey();
      await tester.pumpWidget(
        RepaintBoundary(
          key: key,
          child: MultiProvider(
            providers: [
              ChangeNotifierProvider.value(value: app),
              ChangeNotifierProvider.value(value: cart),
            ],
            child: MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: Ember.theme(),
              home: e.value.$2(),
            ),
          ),
        ),
      );
      for (var i = 0; i < 8; i++) {
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 250)),
        );
        await tester.pump(const Duration(milliseconds: 300));
      }
      if (e.key == 'section_picker') {
        await tester.ensureVisible(find.text('All dishes').first);
        await tester.pump();
        await tester.tap(find.text('All dishes').first);
        for (var i = 0; i < 4; i++) {
          await tester.pump(const Duration(milliseconds: 200));
        }
      }
      if (e.key == 'menu_drawer') {
        tester
            .state<ScaffoldState>(find.byType(Scaffold).first)
            .openEndDrawer();
        await tester.pump(const Duration(milliseconds: 600));
      }
      final boundary =
          key.currentContext!.findRenderObject()! as RenderRepaintBoundary;
      await tester.runAsync(() async {
        final img = await boundary.toImage();
        final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
        Directory(outDir).createSync(recursive: true);
        File(
          '$outDir/${e.key}.png',
        ).writeAsBytesSync(bytes!.buffer.asUint8List());
      });
      tester.view.resetPhysicalSize();
    });
  }
}
