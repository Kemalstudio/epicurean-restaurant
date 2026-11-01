import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import 'auth.dart';
import 'basket.dart';
import 'home.dart';
import 'orders.dart';
import 'restaurants.dart';

/// Push a screen with the standard transition.
Future<T?> go<T>(BuildContext context, Widget screen) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => screen));

/// Page frame used by every customer screen: kit header + scrollable content + app menu.
class EmberScaffold extends StatelessWidget {
  final List<Widget> children;
  final EdgeInsets padding;
  final Future<void> Function()? onRefresh;
  const EmberScaffold({
    super.key,
    required this.children,
    this.padding = const EdgeInsets.fromLTRB(11, 8, 11, 32),
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      endDrawer: const AppMenu(),
      body: SafeArea(
        child: Builder(
          builder: (ctx) {
            // ctx is below the Scaffold, so the header can open its drawer
            final content = ListView(
              padding: EdgeInsets.zero,
              children: [
                EmberHeader(
                  onMenu: () => Scaffold.of(ctx).openEndDrawer(),
                  onAccount: () => go(
                    ctx,
                    app.isLoggedIn ? const OrdersScreen() : const LoginScreen(),
                  ),
                  onBasket: () => go(ctx, const BasketScreen()),
                  onAddress: () => showAddressPopup(ctx),
                ),
                Padding(
                  padding: padding,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: children,
                  ),
                ),
              ],
            );
            return onRefresh == null
                ? content
                : RefreshIndicator(
                    color: Ember.orange,
                    onRefresh: onRefresh!,
                    child: content,
                  );
          },
        ),
      ),
    );
  }
}

/// Navy side menu (app navigation, account, language).
class AppMenu extends StatelessWidget {
  const AppMenu({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    void open(Widget s) {
      Navigator.pop(context);
      go(context, s);
    }

    Widget item(
      IconData icon,
      String label,
      VoidCallback onTap, {
      Color color = Colors.white,
    }) => ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: Ember.text(18, weight: FontWeight.w600, color: color),
      ),
      onTap: onTap,
    );

    return Drawer(
      backgroundColor: Ember.navy,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
              child: Align(
                alignment: Alignment.centerLeft,
                child: EmberLogo(white: true),
              ),
            ),
            item(Icons.home_outlined, t('nav_home'), () {
              Navigator.pop(context);
              Navigator.of(context).popUntil((r) => r.isFirst);
            }),
            item(
              Icons.storefront_outlined,
              t('nav_restaurants'),
              () => open(const RestaurantsScreen()),
            ),
            item(
              Icons.local_offer_outlined,
              t('nav_special_offers'),
              () => open(const RestaurantsScreen(offersOnly: true)),
            ),
            item(
              Icons.shopping_basket_outlined,
              t('my_basket'),
              () => open(const BasketScreen()),
            ),
            item(
              Icons.receipt_long_outlined,
              t('nav_track_order'),
              () => open(const OrdersScreen()),
            ),
            const Divider(color: Colors.white24, height: 32),
            if (app.isLoggedIn) ...[
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 4,
                ),
                child: Text(
                  '${app.user?['email']}',
                  style: Ember.text(13, color: Colors.white60),
                ),
              ),
              item(Icons.logout, t('log_out'), () async {
                Navigator.pop(context);
                await app.logout();
              }, color: Ember.pink),
            ] else
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: OrangeButton(
                  t('login_signup'),
                  onPressed: () => open(const LoginScreen()),
                ),
              ),
            const Divider(color: Colors.white24, height: 32),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                t('language'),
                style: Ember.text(13, color: Colors.white60),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                children: [
                  for (final l in const [
                    ('en', 'English'),
                    ('ru', 'Русский'),
                    ('tk', 'Türkmençe'),
                  ])
                    ChoiceChip(
                      label: Text(l.$2),
                      selected: app.lang == l.$1,
                      onSelected: (_) => app.setLang(l.$1),
                      selectedColor: Ember.orange,
                      labelStyle: Ember.text(
                        14,
                        weight: FontWeight.w600,
                        color: app.lang == l.$1 ? Colors.white : Ember.navy,
                      ),
                      showCheckmark: false,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "Please enter your address" popup (kit: Mobile Popup 3).
Future<void> showAddressPopup(BuildContext context) {
  final app = context.read<AppState>();
  final cart = context.read<CartState>();
  final ctrl = TextEditingController(text: app.address);
  var error = false; // lives outside the builder so it survives setState
  return showEmberPopup(
    context,
    child: StatefulBuilder(
      builder: (ctx, setState) {
        void submit() {
          if (ctrl.text.trim().length < 3) {
            setState(() => error = true);
            return;
          }
          app.setAddress(ctrl.text.trim());
          cart.setFulfillment('delivery');
          Navigator.pop(ctx);
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                const SizedBox(
                  height: 190,
                  width: double.infinity,
                  child: NetImage('/img/1526367790999-0150786686a2-500.webp'),
                ),
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(width: 6, color: Ember.orange),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 28, 22, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    app.t('enter_address_title_1'),
                    style: Ember.text(
                      24,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                      height: 1.15,
                    ),
                  ),
                  Text(
                    app.t('enter_address_title_2'),
                    style: Ember.text(
                      24,
                      weight: FontWeight.w700,
                      color: error ? Ember.red : Ember.navy,
                    ).copyWith(decoration: TextDecoration.underline),
                  ),
                  const SizedBox(height: 14),
                  Text(app.t('enter_address_desc'), style: Ember.text(14)),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: ctrl,
                          autofocus: true,
                          onSubmitted: (_) => submit(),
                          decoration: InputDecoration(
                            hintText: app.t('address_placeholder'),
                            fillColor: const Color(0xFFEFEFEF),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Material(
                        color: Ember.orange,
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: submit,
                          child: const SizedBox(
                            width: 56,
                            height: 56,
                            child: Icon(
                              Icons.arrow_forward_ios,
                              color: Ember.navy,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (error)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(
                        app.t('address_too_short'),
                        style: Ember.text(
                          14,
                          weight: FontWeight.w700,
                          color: Ember.red,
                        ),
                      ),
                    ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      const Expanded(child: Divider(color: Ember.orange)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Text(
                          app.t('or_word'),
                          style: Ember.text(16, weight: FontWeight.w700),
                        ),
                      ),
                      const Expanded(child: Divider(color: Ember.orange)),
                    ],
                  ),
                  Center(
                    child: TextButton(
                      onPressed: () {
                        cart.setFulfillment('collection');
                        Navigator.pop(ctx);
                      },
                      child: Text(
                        app.t('i_will_collect'),
                        style: Ember.text(
                          16,
                          weight: FontWeight.w700,
                          color: Colors.black,
                        ).copyWith(decoration: TextDecoration.underline),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    ),
  );
}

/// Root: waits for state, then shows the home screen.
class Root extends StatelessWidget {
  const Root({super.key});
  @override
  Widget build(BuildContext context) {
    final ready = context.watch<AppState>().ready;
    if (!ready) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              EmberLogo(height: 48),
              SizedBox(height: 24),
              EmberLottie(EmberAnim.loader, size: 72),
            ],
          ),
        ),
      );
    }
    return const HomeScreen();
  }
}
