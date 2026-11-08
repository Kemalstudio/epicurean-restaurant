// Renders whole screens to PNG files for side-by-side comparison with the Figma kit.
//   flutter test test/shots_test.dart --dart-define=SHOTS_DIR=C:/path/to/out
// Skipped unless SHOTS_DIR is given.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:ember_app/core/api.dart';
import 'package:ember_app/core/state.dart';
import 'package:ember_app/core/theme.dart';
import 'package:ember_app/screens/auth.dart';
import 'package:ember_app/screens/basket.dart';
import 'package:ember_app/screens/home.dart';
import 'package:ember_app/screens/orders.dart';
import 'package:ember_app/screens/restaurant.dart';
import 'package:ember_app/screens/restaurants.dart';
import 'package:ember_app/screens/shell.dart';
import 'package:ember_app/widgets/common.dart';
import 'package:ember_app/widgets/product.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'layout_test.dart' show fixture, loadAppFonts, mockApi;

const outDir = String.fromEnvironment('SHOTS_DIR');

/// Kit frame heights (375 wide), so shots line up with the Figma screens.
final shots = <String, (double, Widget Function())>{
  'home': (812, () => const HomeScreen()),
  'home_long': (2400, () => const HomeScreen()),
  'search': (812, () => const RestaurantsScreen(search: true)),
  'restaurant': (812, () => const RestaurantScreen(slug: 'napoli-wood-fire')),
  'restaurant_long': (
    2000,
    () => const RestaurantScreen(slug: 'napoli-wood-fire'),
  ),
  'food_details': (
    903,
    () => Builder(
      builder: (context) {
        final r = fixture('r_napoli-wood-fire_en');
        final p = Map<String, dynamic>.from((r['products'] as List).first);
        return FoodDetailsScreen(product: p, restaurant: r);
      },
    ),
  ),
  'basket': (812, () => const BasketScreen()),
  'checkout': (812, () => const CheckoutScreen()),
  'orders': (812, () => const OrdersScreen()),
  'login': (812, () => const LoginScreen()),
  'register': (812, () => const RegisterScreen()),
  'profile': (996, () => const ProfileScreen()),
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
      tester.view.physicalSize = Size(375, e.value.$1);
      tester.view.devicePixelRatio = 1;
      tester.view.padding = const FakeViewPadding(top: 44);
      SharedPreferences.setMockInitialValues({'lang': 'en'});
      final app = AppState();
      final cart = CartState();
      await cart.init();
      await app.init();
      if (e.key == 'basket' || e.key == 'checkout') {
        final r = fixture('r_napoli-wood-fire_en');
        for (final p in (r['products'] as List).take(2)) {
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
