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
              () => go(context, const PersonalInfoScreen()),
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

/// Opens the kit "My Address" screen (home "Deliver to", cart, profile).
Future<void> showAddressPopup(BuildContext context) =>
    go(context, const AddressesScreen());

IconData _labelIcon(String? label) => switch (label) {
  'home' => Icons.home_outlined,
  'work' => Icons.work_outline_rounded,
  _ => Icons.location_on_outlined,
};

Color _labelColor(String? label) => switch (label) {
  'home' => const Color(0xFF2790C3),
  'work' => const Color(0xFFA03BB1),
  _ => Ember.orange,
};

/// Kit "My Address": saved address cards (icon, label, address, edit /
/// delete) and ADD NEW ADDRESS. Tapping a card makes it the delivery address.
class AddressesScreen extends StatelessWidget {
  const AddressesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.read<CartState>();
    final t = app.t;
    return EmberScaffold(
      header: TopBar(title: t('my_address')),
      bottom: Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          8,
          24,
          24 + MediaQuery.paddingOf(context).bottom,
        ),
        child: PrimaryButton(
          t('add_new_address'),
          onPressed: () => go(context, const AddAddressScreen()),
        ),
      ),
      children: [
        const SizedBox(height: 24),
        if (app.addresses.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Column(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 64,
                  color: Ember.text2,
                ),
                const SizedBox(height: 12),
                Text(
                  t('no_addresses'),
                  textAlign: TextAlign.center,
                  style: Ember.text(16, color: Ember.text2),
                ),
              ],
            ),
          ),
        for (var i = 0; i < app.addresses.length; i++)
          Builder(
            builder: (context) {
              final a = app.addresses[i];
              final full = AppState.fullAddress(a);
              final chosen = full == app.address;
              return Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Material(
                  color: Ember.field,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      app.setAddress(full);
                      cart.setFulfillment('delivery');
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(16, 18, 12, 18),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: chosen ? Ember.orange : Colors.transparent,
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              _labelIcon(a['label']),
                              color: _labelColor(a['label']),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t(
                                    'label_${a['label'] ?? 'other'}',
                                  ).toUpperCase(),
                                  style: Ember.text(14, color: Ember.navy),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  full,
                                  style: Ember.text(
                                    14,
                                    color: Ember.navy.withValues(alpha: 0.5),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            tooltip: t('edit'),
                            visualDensity: VisualDensity.compact,
                            onPressed: () => go(
                              context,
                              AddAddressScreen(index: i, initial: a),
                            ),
                            icon: const Icon(
                              Icons.edit_note_rounded,
                              color: Ember.orange,
                            ),
                          ),
                          IconButton(
                            tooltip: t('delete'),
                            visualDensity: VisualDensity.compact,
                            onPressed: () => app.deleteAddress(i),
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              color: Ember.orange,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

/// Kit "Add New Address": address, street + post code, apartment, the
/// Home / Work / Other label and SAVE LOCATION.
class AddAddressScreen extends StatefulWidget {
  final int? index;
  final Map<String, String>? initial;
  const AddAddressScreen({super.key, this.index, this.initial});
  @override
  State<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends State<AddAddressScreen> {
  final _form = GlobalKey<FormState>();
  late final _address = TextEditingController(
    text: widget.initial?['address'] ?? '',
  );
  late final _street = TextEditingController(
    text: widget.initial?['street'] ?? '',
  );
  late final _post = TextEditingController(
    text: widget.initial?['post_code'] ?? '',
  );
  late final _apartment = TextEditingController(
    text: widget.initial?['apartment'] ?? '',
  );
  late String _label = widget.initial?['label'] ?? 'home';

  @override
  void dispose() {
    for (final c in [_address, _street, _post, _apartment]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final app = context.read<AppState>();
    final cart = context.read<CartState>();
    await app.saveAddress({
      'label': _label,
      'address': _address.text.trim(),
      'street': _street.text.trim(),
      'post_code': _post.text.trim(),
      'apartment': _apartment.text.trim(),
    }, index: widget.index);
    cart.setFulfillment('delivery');
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    return EmberScaffold(
      header: TopBar(title: t('add_new_address')),
      bottom: Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          8,
          24,
          24 + MediaQuery.paddingOf(context).bottom,
        ),
        child: PrimaryButton(t('save_location'), onPressed: _save),
      ),
      children: [
        const SizedBox(height: 24),
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              KitField(
                label: t('address_word'),
                controller: _address,
                hint: t('address_placeholder'),
                autofill: const [AutofillHints.fullStreetAddress],
                prefix: const Icon(
                  Icons.location_on_rounded,
                  color: Color(0xFF6B6E82),
                ),
                validator: (v) => (v == null || v.trim().length < 3)
                    ? t('address_too_short')
                    : null,
              ),
              const SizedBox(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: KitField(label: t('street'), controller: _street),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: KitField(
                      label: t('post_code'),
                      controller: _post,
                      keyboard: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              KitField(label: t('apartment'), controller: _apartment),
              const SizedBox(height: 24),
              Text(
                t('label_as').toUpperCase(),
                style: Ember.text(13, color: Ember.text1),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final l in ['home', 'work', 'other'])
                    _LabelChip(
                      t('label_$l'),
                      selected: _label == l,
                      onTap: () => setState(() => _label = l),
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Kit "Label as" chip: light gray pill, orange with white text when chosen.
class _LabelChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LabelChip(this.label, {required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    child: Material(
      color: selected ? Ember.orange : Ember.field,
      shape: const StadiumBorder(),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Container(
          height: 45,
          constraints: const BoxConstraints(minWidth: 80),
          padding: const EdgeInsets.symmetric(horizontal: 22),
          child: Center(
            widthFactor: 1,
            child: Text(
              label,
              style: Ember.text(
                14,
                color: selected ? Colors.white : Ember.navy,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/// Kit "Personal Info": avatar, name, then a gray panel with full name,
/// email and phone rows.
class PersonalInfoScreen extends StatelessWidget {
  const PersonalInfoScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final u = app.user ?? {};
    final name = '${u['name'] ?? u['email'] ?? t('guest')}';
    Widget row(IconData icon, Color color, String label, String value) =>
        Padding(
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label.toUpperCase(),
                      style: Ember.text(14, color: Ember.navy),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: Ember.text(14, color: const Color(0xFF6B6E82)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
    return EmberScaffold(
      header: TopBar(title: t('personal_info')),
      children: [
        const SizedBox(height: 24),
        _ProfileHead(name: name, subtitle: '${u['email'] ?? ''}'),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          decoration: BoxDecoration(
            color: Ember.panel,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              row(
                Icons.person_outline_rounded,
                Ember.orange,
                t('full_name'),
                '${u['name'] ?? '—'}',
              ),
              row(
                Icons.mail_outline_rounded,
                const Color(0xFF413DFB),
                t('email'),
                '${u['email'] ?? '—'}',
              ),
              if ('${u['phone'] ?? ''}'.isNotEmpty)
                row(
                  Icons.phone_outlined,
                  const Color(0xFF369BFF),
                  t('phone_number'),
                  '${u['phone']}',
                ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Peach avatar circle with the initial, name and a gray line.
class _ProfileHead extends StatelessWidget {
  final String name, subtitle;
  const _ProfileHead({required this.name, required this.subtitle});
  @override
  Widget build(BuildContext context) => Row(
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
          style: Ember.text(40, weight: FontWeight.w700, color: Colors.white),
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
              style: Ember.text(20, weight: FontWeight.w700, color: Ember.navy),
            ),
            const SizedBox(height: 8),
            Text(subtitle, style: Ember.text(14, color: Ember.text2)),
          ],
        ),
      ),
    ],
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
