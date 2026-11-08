// Layout audit for every screen: phone sizes x languages x system font scale.
// Fails on any "RenderFlex overflowed" / layout exception and prints where it happened.
import 'dart:convert';
import 'dart:io';

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
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Map<String, dynamic> fixture(String name) =>
    jsonDecode(File('test/fixtures/$name.json').readAsStringSync())
        as Map<String, dynamic>;
List<dynamic> fixtureList(String name) =>
    jsonDecode(File('test/fixtures/$name.json').readAsStringSync())
        as List<dynamic>;

http.Client mockApi() => MockClient((req) async {
  final lang = req.url.queryParameters['lang'] ?? 'en';
  final p = req.url.path.replaceFirst(RegExp(r'^/api'), '');
  String? file;
  if (p == '/home') file = 'home_$lang';
  if (p == '/restaurants') file = 'restaurants_$lang';
  if (p.startsWith('/restaurants/')) file = 'r_${p.split('/').last}_$lang';
  if (p == '/Ingredient') file = 'ingredients_$lang';
  if (file != null && File('test/fixtures/$file.json').existsSync()) {
    return http.Response.bytes(
      File('test/fixtures/$file.json').readAsBytesSync(),
      200,
      headers: {'content-type': 'application/json'},
    );
  }
  if (p == '/Order/filter') return http.Response('[]', 200);
  return http.Response('{"message":"Not found"}', 404);
});

const sizes = [Size(320, 568), Size(360, 740), Size(390, 844), Size(430, 932)];
const langs = ['en', 'ru', 'tk'];
const scales = [1.0, 1.3];

/// Screens to check; each builds inside the app providers.
final screens = <String, Widget Function()>{
  'home': () => const HomeScreen(),
  'restaurants': () => const RestaurantsScreen(),
  'restaurant': () => const RestaurantScreen(slug: 'napoli-wood-fire'),
  'restaurant_burger': () => const RestaurantScreen(slug: 'burger-lab'),
  'basket': () => const BasketScreen(),
  'checkout': () => const CheckoutScreen(),
  'orders': () => const OrdersScreen(orderNumber: 'EM-TEST12345'),
  'success': () => OrderSuccessScreen(
    order: const {
      'order_number': 'EM-MVXOBMJJ4E3A',
      'restaurant_name': 'Napoli Wood Fire',
      'total': 1234.5,
      'estimated_delivery': '25-35 min',
      'fulfillment': 'delivery',
      'status': 'received',
    },
  ),
  'login': () => const LoginScreen(),
  'register': () => const RegisterScreen(),
  'food_details': () => Builder(
    builder: (context) {
      final r = fixture('r_napoli-wood-fire_${context.read<AppState>().lang}');
      final p = Map<String, dynamic>.from((r['products'] as List).first);
      return FoodDetailsScreen(product: p, restaurant: r);
    },
  ),
  'profile': () => const ProfileScreen(),
  'search': () => const RestaurantsScreen(search: true),
  'addresses': () => const AddressesScreen(),
  'add_address': () => const AddAddressScreen(),
  'personal_info': () => const PersonalInfoScreen(),
};

/// The test binding renders text with a stub font where every glyph is a 1em square,
/// which makes text far wider than on a device. Load the app's real fonts instead.
Future<void> loadAppFonts() async {
  final families = <String, List<String>>{};
  for (final f in Directory(
    'assets/fonts',
  ).listSync().whereType<File>().where((f) => f.path.endsWith('.ttf'))) {
    final name = f.uri.pathSegments.last.split('-').first; // Sen-400.ttf -> Sen
    families.putIfAbsent(name, () => []).add(f.path);
  }
  for (final e in families.entries) {
    final loader = FontLoader(e.key);
    for (final path in e.value) {
      loader.addFont(
        Future.value(ByteData.sublistView(File(path).readAsBytesSync())),
      );
    }
    await loader.load();
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await loadAppFonts();
    NetImage.disableForTests = true;
    Api.instance.client = mockApi();
  });

  final failures = <String>[];

  for (final entry in screens.entries) {
    testWidgets('layout: ${entry.key}', (tester) async {
      final problems = <String>[];
      for (final size in sizes) {
        for (final lang in langs) {
          for (final scale in scales) {
            tester.view.physicalSize = size;
            tester.view.devicePixelRatio = 1;
            tester.platformDispatcher.textScaleFactorTestValue = scale;

            SharedPreferences.setMockInitialValues({'lang': lang});
            final app = AppState();
            final cart = CartState();
            await cart.init();
            await app.init();
            if (['basket', 'checkout'].contains(entry.key)) {
              final r = fixture('r_napoli-wood-fire_$lang');
              for (final p in (r['products'] as List).take(3)) {
                cart.add(
                  product: Map<String, dynamic>.from(p),
                  restaurantData: r,
                  size: ((p['sizes'] as List?)?.isNotEmpty ?? false)
                      ? p['sizes'][0]['name']
                      : null,
                );
              }
            }

            final errors = <String>[];
            final previous = FlutterError.onError;
            FlutterError.onError = (d) {
              // Append the source location of the offending widget (lib/... file:line).
              final where = RegExp(
                r'lib/[\w/]+\.dart:\d+',
              ).firstMatch(d.toString())?.group(0);
              errors.add(
                '${d.exceptionAsString().split('\n').first}${where != null ? '  @ $where' : ''}',
              );
            };

            await tester.pumpWidget(
              MultiProvider(
                providers: [
                  ChangeNotifierProvider.value(value: app),
                  ChangeNotifierProvider.value(value: cart),
                ],
                child: MaterialApp(theme: Ember.theme(), home: entry.value()),
              ),
            );
            await tester.pump(const Duration(milliseconds: 300));
            await tester.pump(const Duration(milliseconds: 300));
            // Scroll through the whole page so every widget gets laid out
            final scrollables = find.byType(Scrollable);
            for (var i = 0; i < 14 && scrollables.evaluate().isNotEmpty; i++) {
              await tester.drag(
                scrollables.first,
                const Offset(0, -500),
                warnIfMissed: false,
              );
              await tester.pump(const Duration(milliseconds: 120));
            }
            FlutterError.onError = previous;
            final ex = tester.takeException();
            if (ex != null) errors.add('$ex'.split('\n').first);

            for (final e in errors.toSet()) {
              problems.add('${size.width.toInt()}px $lang x$scale: $e');
            }
            await tester.pumpWidget(const SizedBox());
            await tester.pump(const Duration(milliseconds: 50));
          }
        }
      }
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
      if (problems.isNotEmpty) {
        failures.add(
          '${entry.key}:\n  ${problems.take(400).join('\n  ')}${problems.length > 12 ? '\n  ... ${problems.length - 12} more' : ''}',
        );
        // ignore: avoid_print
        print(
          '\n### ${entry.key} — ${problems.length} problem(s)\n  ${problems.take(400).join('\n  ')}',
        );
      }
      expect(problems, isEmpty, reason: problems.take(5).join('\n'));
    });
  }
}
