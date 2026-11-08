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

/// Price without empty decimals ("110 TMT", "12.50 TMT").
String shortPrice(AppState app, num v) =>
    app.price(v).replaceFirst('.00 ', ' ');

bool hasOptions(Map<String, dynamic> p) =>
    ((p['default_ingredients'] as List?)?.length ?? 0) +
            ((p['optional_ingredients'] as List?)?.length ?? 0) >
        0 ||
    ((p['sizes'] as List?)?.length ?? 0) > 1;

/// Adds to the basket, asking first if the basket holds another restaurant's food.
Future<bool> addToBasket(
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
      child: Builder(
        builder: (ctx) => Padding(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                app.t('new_basket_title'),
                textAlign: TextAlign.center,
                style: Ember.text(
                  20,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                app.t('new_basket_desc', {
                  'current': cart.restaurant?['name'] ?? '',
                  'next': restaurant['name'],
                }),
                textAlign: TextAlign.center,
                style: Ember.text(14, color: Ember.text2, height: 1.6),
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                app.t('start_new_basket'),
                onPressed: () => Navigator.pop(ctx, true),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(
                  app.t('keep_basket'),
                  style: Ember.text(
                    14,
                    weight: FontWeight.w700,
                    color: Ember.orange,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (ok != true) return false;
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
  return true;
}

/// Opens the kit "Details" screen for a dish.
Future<void> openFood(
  BuildContext context,
  Map<String, dynamic> product,
  Map<String, dynamic> restaurant,
) => Navigator.of(context).push(
  MaterialPageRoute(
    builder: (_) => FoodDetailsScreen(product: product, restaurant: restaurant),
  ),
);

/// Kit dish card (153 wide): white, radius 24, soft shadow, photo on top,
/// bold name, gray subtitle, price and the orange round "+".
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
    final p = product;
    final available = p['is_available'] != false;
    final sizes = (p['sizes'] as List?) ?? const [];
    final first = sizes.isEmpty ? null : '${sizes.first['name']}';
    final discount = numOf(p['discount_percent']);

    Future<void> quickAdd() async {
      if (hasOptions(p)) {
        await openFood(context, p, restaurant);
      } else {
        await addToBasket(context, product: p, restaurant: restaurant);
      }
    }

    return Opacity(
      opacity: available ? 1 : 0.5,
      child: Semantics(
        button: true,
        label: '${p['name']}, ${shortPrice(app, priceOf(p, first))}',
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            onTap: available ? () => openFood(context, p, restaurant) : null,
            child: Ink(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: Ember.cardShadow,
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      children: [
                        Center(
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 114),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(15),
                              child: AspectRatio(
                                aspectRatio: 114 / 75,
                                child: NetImage(p['image_url']),
                              ),
                            ),
                          ),
                        ),
                        if (discount > 0)
                          Positioned(
                            left: 6,
                            top: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Ember.orange,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '-${discount.toInt()}%',
                                style: Ember.text(
                                  11,
                                  weight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '${p['name']}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(
                        15,
                        weight: FontWeight.w700,
                        color: Ember.navy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      available
                          ? '${p['description'] ?? restaurant['name']}'
                          : app.t('unavailable_now'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(13, color: Ember.text3),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              shortPrice(app, priceOf(p, first)),
                              style: Ember.text(
                                16,
                                weight: FontWeight.w700,
                                color: Ember.navy,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Tooltip(
                          message: app.t('add_to_basket'),
                          child: InkResponse(
                            onTap: available ? quickAdd : null,
                            radius: 24,
                            child: Container(
                              width: 30,
                              height: 30,
                              decoration: const BoxDecoration(
                                color: Ember.orange,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.add_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Picks a line icon for an ingredient by its name (English, Russian or Turkmen).
IconData ingredientIcon(String name) {
  final n = name.toLowerCase();
  bool has(List<String> words) => words.any(n.contains);
  if (has(['cheese', 'сыр', 'peýnir'])) return Icons.local_pizza_outlined;
  if (has(['bacon', 'бекон', 'meat', 'мяс', 'et'])) {
    return Icons.kebab_dining_outlined;
  }
  if (has(['onion', 'лук', 'sogan', 'garlic', 'чеснок', 'sarymsak'])) {
    return Icons.spa_outlined;
  }
  if (has(['jalap', 'халап', 'chili', 'перец', 'burç'])) {
    return Icons.local_fire_department_outlined;
  }
  if (has(['mushroom', 'гриб', 'kömelek'])) return Icons.forest_outlined;
  if (has(['tomato', 'томат', 'помидор', 'pomidor'])) {
    return Icons.circle_outlined;
  }
  if (has(['sauce', 'соус', 'souse', 'sous'])) return Icons.water_drop_outlined;
  if (has(['avocado', 'авокадо', 'awokado', 'olive', 'олив', 'zeýtun'])) {
    return Icons.egg_outlined;
  }
  return Icons.eco_outlined;
}

/// Kit "Details" screen: photo, restaurant pill, name, description, info
/// row, size circles, ingredient circles, and the gray bottom panel with
/// price, quantity stepper and ADD TO CART.
class FoodDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> product, restaurant;
  final String? initialSize;
  const FoodDetailsScreen({
    super.key,
    required this.product,
    required this.restaurant,
    this.initialSize,
  });
  @override
  State<FoodDetailsScreen> createState() => _FoodDetailsScreenState();
}

class _FoodDetailsScreenState extends State<FoodDetailsScreen> {
  String? size;
  final removed = <String>{}, added = <String>{};
  int qty = 1;
  bool busy = false;
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
    final t = app.t;
    final p = widget.product;
    final r = widget.restaurant;
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
    final available = p['is_available'] != false;

    Widget label(String text) =>
        Text(text.toUpperCase(), style: Ember.text(13, color: Ember.text1));

    Widget ingredient(String id, {required bool on, required bool extra}) {
      final name = '${ingredients[id]?['name'] ?? '…'}';
      final price = numOf(ingredients[id]?['price']);
      return Semantics(
        button: true,
        toggled: on,
        label: name,
        excludeSemantics: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(30),
          onTap: () => setState(() {
            if (extra) {
              on ? added.remove(id) : added.add(id);
            } else {
              on ? removed.add(id) : removed.remove(id);
            }
          }),
          child: SizedBox(
            width: 58,
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: on ? Ember.orangeSoft : Ember.field,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    ingredientIcon(name),
                    size: 24,
                    color: on ? Ember.orange : Ember.text2,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Ember.text(12, color: on ? Ember.text3 : Ember.text2)
                      .copyWith(
                        decoration: !extra && !on
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                ),
                if (extra && price > 0)
                  Text(
                    '+${shortPrice(app, price)}',
                    style: Ember.text(11, color: Ember.orange),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            TopBar(title: t('details')),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 44, 24, 32),
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(32),
                    child: AspectRatio(
                      aspectRatio: 327 / 184,
                      child: NetImage(p['image_url']),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      height: 47,
                      padding: const EdgeInsets.fromLTRB(16, 0, 20, 0),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE9E9E9)),
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ClipOval(
                            child: NetImage(
                              r['logo_url'] ?? r['cover_url'],
                              width: 22,
                              height: 22,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(
                              '${r['name']}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Ember.text(14, color: Ember.navy),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '${p['name']}',
                    style: Ember.text(
                      20,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                  if ('${p['description'] ?? ''}'.isNotEmpty) ...[
                    const SizedBox(height: 7),
                    Text(
                      '${p['description']}',
                      style: Ember.text(
                        14,
                        color: Ember.text2,
                        height: 24 / 14,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  MetaRow(
                    rating: numOf(p['rating'] ?? r['rating']),
                    fee: _feeText(app, r),
                    time:
                        '${p['prep_time'] ?? '${r['delivery_time']} ${t('min_short')}'}',
                  ),
                  if (sizes.length > 1) ...[
                    const SizedBox(height: 25),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 16, right: 16),
                          child: label('${t('size_label')}:'),
                        ),
                        Expanded(
                          child: Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              for (final s in sizes)
                                _SizeCircle(
                                  label: '${s['name']}',
                                  selected: size == s['name'],
                                  onTap: () => setState(() => size = s['name']),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (defaults.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    label(t('ingredients')),
                    const SizedBox(height: 19),
                    Wrap(
                      spacing: 11,
                      runSpacing: 15,
                      children: [
                        for (final id in defaults)
                          ingredient(
                            id,
                            on: !removed.contains(id),
                            extra: false,
                          ),
                      ],
                    ),
                  ],
                  if (optional.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    label(t('extra_toppings')),
                    const SizedBox(height: 19),
                    Wrap(
                      spacing: 11,
                      runSpacing: 15,
                      children: [
                        for (final id in optional)
                          ingredient(id, on: added.contains(id), extra: true),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            // Kit bottom panel: #F0F5FA, rounded top, price + stepper + button
            Container(
              padding: EdgeInsets.fromLTRB(
                24,
                20,
                24,
                24 + MediaQuery.paddingOf(context).bottom,
              ),
              decoration: const BoxDecoration(
                color: Ember.field,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            shortPrice(app, unit * qty),
                            style: Ember.text(28, color: Ember.navy),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      QtyStepper(
                        value: qty,
                        onChanged: (v) => setState(() => qty = v.clamp(1, 99)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    available ? t('add_to_cart') : t('unavailable_now'),
                    loading: busy,
                    onPressed: !available
                        ? null
                        : () async {
                            final nav = Navigator.of(context);
                            setState(() => busy = true);
                            final ok = await addToBasket(
                              context,
                              product: p,
                              restaurant: r,
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
                                  {
                                    'id': id,
                                    'name': ingredients[id]?['name'] ?? id,
                                  },
                              ],
                            );
                            if (!mounted) return;
                            setState(() => busy = false);
                            if (ok && nav.mounted) nav.pop();
                          },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _feeText(AppState app, Map<String, dynamic> r) {
    final fee = numOf(r['delivery_fee']);
    return fee <= 0 ? app.t('free') : shortPrice(app, fee);
  }
}

/// Kit size circle (48): light gray, orange with white bold text when chosen.
/// Long size names grow into a pill.
class _SizeCircle extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _SizeCircle({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: selected ? Ember.orangeSize : Ember.field,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: Text(
            label,
            style: Ember.text(
              16,
              weight: selected ? FontWeight.w700 : FontWeight.w400,
              color: selected ? Colors.white : Ember.navy,
            ),
          ),
        ),
      ),
    ),
  );
}
