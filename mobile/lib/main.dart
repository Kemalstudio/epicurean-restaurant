import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/state.dart';
import 'core/theme.dart';
import 'screens/shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Automated UI tests (web build with --dart-define=E2E=true) need the semantics tree always on
  if (const bool.fromEnvironment('E2E')) {
    SemanticsBinding.instance.ensureSemantics();
  }
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final app = AppState();
  final cart = CartState();
  await cart.init();
  app.init(); // checks the saved session in the background; Root shows a loader meanwhile

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: app),
        ChangeNotifierProvider.value(value: cart),
      ],
      child: const EmberApp(),
    ),
  );
}

class EmberApp extends StatelessWidget {
  const EmberApp({super.key});
  @override
  Widget build(BuildContext context) {
    final lang = context.select<AppState, String>((a) => a.lang);
    return MaterialApp(
      title: 'Ember',
      debugShowCheckedModeBanner: false,
      theme: Ember.theme(),
      locale: Locale(lang),
      home: const Root(),
    );
  }
}
