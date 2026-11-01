import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import 'common.dart';

double priceOf(Map<String, dynamic> p, String? size) {
  final sizes = (p['sizes'] as List?) ?? const [];
  final s = size == null
      ? null
      : sizes.cast<Map>().where((x) => x['name'] == size).firstOrNull;
  return (numOf(p['base_price']) + numOf(s?['price_modifier'])) *
      (1 - numOf(p['discount_percent']) / 100);
}

bool hasOptions(Map<String, dynamic> p) =>
    ((p['default_ingredients'] as List?)?.length ?? 0) +
        ((p['optional_ingredients'] as List?)?.length ?? 0) >
    0;

/// Adds to the basket, asking first if the basket holds another restaurant's food.
Future<void> addToBasket(
  BuildContext context, {
  required Map<String, dynamic> product,
  required Map<String, dynamic> restaurant,
  String? size,
  List<Map<String, dynamic>> added = const [],
  List<Map<String, dynamic>> removed = const [],
  int quantity = 1,
}) async {
  final cart = context.read<CartState>();
  final app = context.read<AppState>();
  var replace = false;
  if (cart.conflictsWith('${restaurant['id']}')) {
    final ok = await showEmberPopup<bool>(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(28, 40, 28, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              app.t('new_basket_title'),
              textAlign: TextAlign.center,
              style: Ember.text(22, weight: FontWeight.w700, color: Ember.navy),
            ),
            const SizedBox(height: 12),
            Text(
              app.t('new_basket_desc', {
                'current': cart.restaurant?['name'] ?? '',
                'next': restaurant['name'],
              }),
              textAlign: TextAlign.center,
              style: Ember.text(14, color: Colors.black87),
            ),
            const SizedBox(height: 24),
            OrangeButton(
              app.t('start_new_basket'),
              onPressed: () => Navigator.pop(context, true),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(
                app.t('keep_basket'),
                style: Ember.text(
                  15,
                  weight: FontWeight.w600,
                  color: Ember.navy,
                ),
              ),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;
    replace = true;
  }
  cart.add(
    product: product,
    restaurantData: restaurant,
    size: size,
    added: added,
    removed: removed,
    quantity: quantity,
    replace: replace,
  );
  if (context.mounted) {
    showMessage(context, '${product['name']} — ${app.t('add_to_basket')} ✓');
  }
}

/// Menu item card with size/price buttons (kit: Mobile Restaurant).
class ProductCard extends StatelessWidget {
  final Map<String, dynamic> product, restaurant;
  const ProductCard({
    super.key,
    required this.product,
    required this.restaurant,
  });

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final sizes = List<Map<String, dynamic>>.from(
      ((product['sizes'] as List?) ?? []).map(
        (e) => Map<String, dynamic>.from(e),
      ),
    );
    final options = sizes.isEmpty
        ? [
            <String, dynamic>{'name': null},
          ]
        : sizes;
    final available = product['is_available'] != false;

    Future<void> choose(String? size) async {
      if (hasOptions(product)) {
        await showEmberPopup(
          context,
          child: OptionsSheet(
            product: product,
            restaurant: restaurant,
            initialSize: size,
          ),
        );
      } else {
        await addToBasket(
          context,
          product: product,
          restaurant: restaurant,
          size: size,
        );
      }
    }

    return Opacity(
      opacity: available ? 1 : 0.6,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Ember.card,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.black26),
          boxShadow: Ember.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${product['name']}',
                        style: Ember.text(
                          20,
                          weight: FontWeight.w600,
                          height: 1.2,
                        ),
                      ),
                      SpiceLevel(
                        (product['spice_level'] as num?)?.toInt() ?? 0,
                      ),
                      if ('${product['description'] ?? ''}'.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          '${product['description']}',
                          style: Ember.text(14, height: 1.7),
                        ),
                      ],
                      if (numOf(product['discount_percent']) > 0) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Ember.navy,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '−${product['discount_percent']}%',
                            style: Ember.text(
                              13,
                              weight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                ClipOval(
                  child: NetImage(
                    product['image_url'],
                    width: 117,
                    height: 117,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (!available)
              Text(
                app.t('unavailable_now'),
                style: Ember.text(
                  14,
                  weight: FontWeight.w600,
                  color: Ember.red,
                ),
              )
            else
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (var i = 0; i < options.length; i++)
                    _SizeButton(
                      label: options[i]['name'] ?? app.t('add_to_basket'),
                      price: app.price(priceOf(product, options[i]['name'])),
                      dark: i == 0 && options[i]['name'] != null,
                      onTap: () => choose(options[i]['name']),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _SizeButton extends StatelessWidget {
  final String label, price;
  final bool dark;
  final VoidCallback onTap;
  const _SizeButton({
    required this.label,
    required this.price,
    required this.dark,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    button: true,
    label: '$label $price',
    excludeSemantics: true,
    child: Material(
      color: dark ? Ember.navy : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: const BorderSide(color: Ember.navy),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: Ember.text(
                  14,
                  weight: FontWeight.w700,
                  color: dark ? Colors.white : Colors.black,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                height: 39,
                constraints: const BoxConstraints(minWidth: 90),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: Ember.green,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  price,
                  style: Ember.text(
                    14,
                    weight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

/// Customisation popup (kit: "Customise Pizza").
class OptionsSheet extends StatefulWidget {
  final Map<String, dynamic> product, restaurant;
  final String? initialSize;
  const OptionsSheet({
    super.key,
    required this.product,
    required this.restaurant,
    this.initialSize,
  });
  @override
  State<OptionsSheet> createState() => _OptionsSheetState();
}

class _OptionsSheetState extends State<OptionsSheet> {
  String? size;
  final removed = <String>{}, added = <String>{};
  int qty = 1;
  Map<String, Map<String, dynamic>> ingredients = {};

  @override
  void initState() {
    super.initState();
    final sizes = (widget.product['sizes'] as List?) ?? [];
    size =
        widget.initialSize ?? (sizes.isNotEmpty ? sizes.first['name'] : null);
    Api.instance
        .ingredients()
        .then((list) {
          if (mounted) {
            setState(
              () => ingredients = {
                for (final i in list)
                  '${i['id']}': Map<String, dynamic>.from(i),
              },
            );
          }
        })
        .catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final p = widget.product;
    final discount = 1 - numOf(p['discount_percent']) / 100;
    final extras = added.fold(
      0.0,
      (s, id) => s + numOf(ingredients[id]?['price']),
    );
    final unit = priceOf(p, size) + extras * discount;
    final defaults = List<String>.from(p['default_ingredients'] ?? []);
    final optional = List<String>.from(p['optional_ingredients'] ?? []);
    final sizes = List<Map<String, dynamic>>.from(
      ((p['sizes'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)),
    );

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(height: 140, child: NetImage(p['image_url'])),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          '${widget.restaurant['name']}',
                          style: Ember.text(16, weight: FontWeight.w700),
                        ),
                      ),
                      const Icon(Icons.chevron_right),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    app.t('customise_title', {'name': p['name']}),
                    style: Ember.text(24, weight: FontWeight.w700, height: 1.2),
                  ),
                  if (sizes.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final s in sizes)
                          ChoiceChip(
                            label: Text(
                              '${s['name']} · ${app.price(priceOf(p, s['name']))}',
                            ),
                            selected: size == s['name'],
                            onSelected: (_) => setState(() => size = s['name']),
                            selectedColor: Ember.navy,
                            labelStyle: Ember.text(
                              13,
                              weight: FontWeight.w700,
                              color: size == s['name']
                                  ? Colors.white
                                  : Colors.black,
                            ),
                            showCheckmark: false,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                              side: const BorderSide(color: Ember.navy),
                            ),
                          ),
                      ],
                    ),
                  ],
                  if (defaults.isNotEmpty)
                    _Group(
                      title: app.t('included_ingredients'),
                      icon: Icons.eco,
                      children: [
                        for (final id in defaults)
                          _Check(
                            label: '${ingredients[id]?['name'] ?? '…'}',
                            value: !removed.contains(id),
                            onChanged: (v) => setState(
                              () => v ? removed.remove(id) : removed.add(id),
                            ),
                          ),
                      ],
                    ),
                  if (optional.isNotEmpty)
                    _Group(
                      title: app.t('extra_toppings'),
                      icon: Icons.restaurant,
                      children: [
                        for (final id in optional)
                          _Check(
                            label: '${ingredients[id]?['name'] ?? '…'}',
                            extra: numOf(ingredients[id]?['price']) > 0
                                ? '+${app.price(numOf(ingredients[id]?['price']))}'
                                : null,
                            value: added.contains(id),
                            onChanged: (v) => setState(
                              () => v ? added.add(id) : added.remove(id),
                            ),
                          ),
                      ],
                    ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Container(
                        height: 54,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Ember.orange.withValues(alpha: 0.8),
                          border: Border.all(color: Colors.black),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          children: [
                            Text(
                              app.t('total_to_pay'),
                              style: Ember.text(
                                14,
                                weight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              app.price(unit * qty),
                              style: Ember.text(
                                22,
                                weight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      IconButton.filled(
                        onPressed: qty > 1 ? () => setState(() => qty--) : null,
                        icon: const Icon(Icons.remove),
                        style: IconButton.styleFrom(
                          backgroundColor: Ember.navy,
                        ),
                        tooltip: app.t('decrease_quantity'),
                      ),
                      Text(
                        '$qty',
                        style: Ember.text(16, weight: FontWeight.w700),
                      ),
                      IconButton.filled(
                        onPressed: qty < 99
                            ? () => setState(() => qty++)
                            : null,
                        icon: const Icon(Icons.add),
                        style: IconButton.styleFrom(
                          backgroundColor: Ember.navy,
                        ),
                        tooltip: app.t('increase_quantity'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  GreenButton(
                    app.t('add_to_basket'),
                    height: 56,
                    onPressed: () async {
                      final nav = Navigator.of(context);
                      await addToBasket(
                        context,
                        product: p,
                        restaurant: widget.restaurant,
                        size: size,
                        quantity: qty,
                        added: [
                          for (final id in added)
                            {
                              'id': id,
                              'name': ingredients[id]?['name'] ?? id,
                              'price': ingredients[id]?['price'] ?? 0,
                            },
                        ],
                        removed: [
                          for (final id in removed)
                            {'id': id, 'name': ingredients[id]?['name'] ?? id},
                        ],
                      );
                      if (nav.mounted) nav.pop();
                    },
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(
                        app.t('take_me_back'),
                        style: Ember.text(
                          14,
                          weight: FontWeight.w600,
                          color: Colors.black,
                        ).copyWith(decoration: TextDecoration.underline),
                      ),
                    ),
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

class _Group extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  const _Group({
    required this.title,
    required this.icon,
    required this.children,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 34),
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(16, 36, 16, 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.black26),
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          child: Wrap(spacing: 8, runSpacing: 4, children: children),
        ),
        Positioned(
          left: 10,
          top: -22,
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Ember.orange,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Ember.navy),
              ),
              Transform.translate(
                offset: const Offset(-8, 0),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 9, 16, 9),
                  decoration: const BoxDecoration(
                    color: Ember.navy,
                    borderRadius: BorderRadius.horizontal(
                      right: Radius.circular(4),
                    ),
                  ),
                  child: Text(
                    title,
                    style: Ember.text(
                      14,
                      weight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Check extends StatelessWidget {
  final String label;
  final String? extra;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _Check({
    required this.label,
    required this.value,
    required this.onChanged,
    this.extra,
  });
  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: CheckboxListTile(
      value: value,
      onChanged: (v) => onChanged(v ?? false),
      controlAffinity: ListTileControlAffinity.leading,
      dense: true,
      contentPadding: EdgeInsets.zero,
      activeColor: Ember.green,
      title: Text(label, style: Ember.text(15, weight: FontWeight.w700)),
      secondary: extra == null
          ? null
          : Text(
              extra!,
              style: Ember.text(
                12,
                weight: FontWeight.w600,
                color: Ember.green,
              ),
            ),
    ),
  );
}
