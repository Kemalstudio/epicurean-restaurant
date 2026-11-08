import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import '../widgets/join.dart';
import 'auth.dart';
import 'basket.dart';
import 'home.dart';
import 'orders.dart';
import 'restaurants.dart';

/// Push a screen with the standard transition.
Future<T?> go<T>(BuildContext context, Widget screen) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: (_) => screen));

/// Page frame used by the customer screens: a fixed kit top bar ([header]),
/// scrollable content and an optional fixed [bottom] panel.
class EmberScaffold extends StatelessWidget {
  final List<Widget> children;
  final Widget? header, bottom;
  final EdgeInsets padding;
  final Future<void> Function()? onRefresh;
  final Color background;
  const EmberScaffold({
    super.key,
    required this.children,
    this.header,
    this.bottom,
    this.padding = const EdgeInsets.fromLTRB(24, 0, 24, 32),
    this.onRefresh,
    this.background = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    final list = ListView(padding: padding, children: children);
    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        bottom: bottom == null,
        child: Column(
          children: [
            ?header,
            Expanded(
              child: onRefresh == null
                  ? list
                  : RefreshIndicator(
                      color: Ember.orange,
                      onRefresh: onRefresh!,
                      child: list,
                    ),
            ),
            ?bottom,
          ],
        ),
      ),
    );
  }
}

/// Opens the basket from any cart button.
void openBasket(BuildContext context) => go(context, const BasketScreen());

/// Kit "Profile" screen (the old side menu): avatar, then grouped rows with
/// colored round icons and a chevron.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final user = app.user;
    final name = '${user?['name'] ?? user?['email'] ?? t('guest')}';

    Widget row(
      IconData icon,
      Color color,
      String label,
      VoidCallback onTap, {
      String? value,
    }) => InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(label, style: Ember.text(16, color: Ember.text1)),
            ),
            if (value != null)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Text(value, style: Ember.text(14, color: Ember.text2)),
              ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF747783),
              size: 24,
            ),
          ],
        ),
      ),
    );
    Widget group(List<Widget> rows) => Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      decoration: BoxDecoration(
        color: Ember.panel,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: rows),
    );

    return EmberScaffold(
      header: TopBar(title: t('profile')),
      children: [
        const SizedBox(height: 20),
        Row(
          children: [
            Container(
              width: 100,
              height: 100,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Ember.peach,
                shape: BoxShape.circle,
              ),
              child: Text(
                name.characters.first.toUpperCase(),
                style: Ember.text(
                  40,
                  weight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 32),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Ember.text(
                      20,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user == null
                        ? t('profile_guest_hint')
                        : '${user['email'] ?? ''}',
                    style: Ember.text(14, color: Ember.text2),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        group([
          if (user != null)
            row(
              Icons.person_outline_rounded,
              Ember.orange,
              t('personal_info'),
              () => _showInfo(context),
            ),
          row(
            Icons.map_outlined,
            const Color(0xFF413DFB),
            t('addresses'),
            () => showAddressPopup(context),
          ),
        ]),
        group([
          row(
            Icons.shopping_bag_outlined,
            const Color(0xFF369BFF),
            t('cart'),
            () => openBasket(context),
          ),
          row(
            Icons.receipt_long_outlined,
            const Color(0xFFB33DFB),
            t('my_orders'),
            () => go(context, const OrdersScreen()),
          ),
          row(
            Icons.storefront_outlined,
            const Color(0xFFFB6F3D),
            t('nav_restaurants'),
            () => go(context, const RestaurantsScreen()),
          ),
          row(
            Icons.local_offer_outlined,
            const Color(0xFFFFAA2A),
            t('nav_special_offers'),
            () => go(context, const RestaurantsScreen(offersOnly: true)),
          ),
        ]),
        group([
          row(
            Icons.translate_rounded,
            const Color(0xFFFB6D3A),
            t('language'),
            () => _pickLanguage(context),
            value: const {
              'en': 'English',
              'ru': 'Русский',
              'tk': 'Türkmençe',
            }[app.lang],
          ),
          row(
            Icons.storefront_rounded,
            const Color(0xFF2AE1E1),
            t('add_restaurant'),
            () => showJoinForm(
              context,
              partner: true,
              onLogin: () => go(context, const LoginScreen()),
            ),
          ),
          row(
            Icons.two_wheeler_rounded,
            const Color(0xFF413DFB),
            t('sign_up_deliver'),
            () => showJoinForm(
              context,
              partner: false,
              onLogin: () => go(context, const LoginScreen()),
            ),
          ),
        ]),
        group([
          if (user != null)
            row(
              Icons.logout_rounded,
              const Color(0xFFFB4A59),
              t('log_out'),
              () async {
                await app.logout();
              },
            )
          else
            row(
              Icons.login_rounded,
              Ember.orange,
              t('login_signup'),
              () => go(context, const LoginScreen()),
            ),
        ]),
      ],
    );
  }

  void _showInfo(BuildContext context) {
    final app = context.read<AppState>();
    final u = app.user ?? {};
    showEmberPopup(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              app.t('personal_info'),
              style: Ember.text(20, weight: FontWeight.w700, color: Ember.navy),
            ),
            const SizedBox(height: 20),
            for (final e in [
              (app.t('full_name'), u['name']),
              (app.t('email'), u['email']),
              (app.t('phone'), u['phone']),
            ])
              if ('${e.$2 ?? ''}'.isNotEmpty) ...[
                Text(
                  e.$1.toUpperCase(),
                  style: Ember.text(13, color: Ember.text1),
                ),
                const SizedBox(height: 4),
                Text('${e.$2}', style: Ember.text(16, color: Ember.text2)),
                const SizedBox(height: 16),
              ],
          ],
        ),
      ),
    );
  }

  void _pickLanguage(BuildContext context) {
    final app = context.read<AppState>();
    showEmberPopup(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              app.t('language'),
              style: Ember.text(20, weight: FontWeight.w700, color: Ember.navy),
            ),
            const SizedBox(height: 16),
            for (final l in const [
              ('en', 'English'),
              ('ru', 'Русский'),
              ('tk', 'Türkmençe'),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SizedBox(
                  width: double.infinity,
                  child: KitChip(
                    l.$2,
                    selected: app.lang == l.$1,
                    onTap: () {
                      app.setLang(l.$1);
                      Navigator.pop(context);
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Delivery address popup in the kit form style.
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

        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 40),
                child: Text(
                  app.t('enter_address_title'),
                  style: Ember.text(
                    20,
                    weight: FontWeight.w700,
                    color: Ember.navy,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                app.t('enter_address_desc'),
                style: Ember.text(14, color: Ember.text2),
              ),
              const SizedBox(height: 24),
              KitField(
                label: app.t('delivery_address'),
                controller: ctrl,
                hint: app.t('address_placeholder'),
                action: TextInputAction.done,
                onSubmitted: (_) => submit(),
              ),
              if (error)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    app.t('address_too_short'),
                    style: Ember.text(13, color: Ember.red),
                  ),
                ),
              const SizedBox(height: 24),
              PrimaryButton(app.t('save'), onPressed: submit),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  cart.setFulfillment('collection');
                  Navigator.pop(ctx);
                },
                child: Text(
                  app.t('i_will_collect'),
                  style: Ember.text(
                    14,
                    weight: FontWeight.w700,
                    color: Ember.orange,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

/// Root: the kit splash (logo on white) while the saved session loads,
/// then the home screen.
class Root extends StatelessWidget {
  const Root({super.key});
  @override
  Widget build(BuildContext context) {
    final ready = context.watch<AppState>().ready;
    if (!ready) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(child: EmberLogo(height: 40)),
      );
    }
    return const HomeScreen();
  }
}

/// Small loader used while a screen's data arrives.
class LoadingBox extends StatelessWidget {
  const LoadingBox({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.all(48),
    child: Center(child: EmberLottie(EmberAnim.loader, size: 64)),
  );
}
