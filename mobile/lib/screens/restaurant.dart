import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import '../widgets/footer.dart';
import '../widgets/product.dart';
import 'auth.dart';
import 'home.dart';
import 'shell.dart';

const _days = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/// Restaurant page (kit: Mobile Restaurant).
class RestaurantScreen extends StatefulWidget {
  final String slug;
  const RestaurantScreen({super.key, required this.slug});
  @override
  State<RestaurantScreen> createState() => _RestaurantScreenState();
}

class _RestaurantScreenState extends State<RestaurantScreen> {
  Future<Map<String, dynamic>>? _future;
  String _lang = '';
  String _section = 'all';
  String _query = '';
  int _sort = 0; // 0 none, 1 asc, 2 desc

  void _load() => _future = Api.instance.restaurant(widget.slug);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final lang = context.watch<AppState>().lang;
    if (lang != _lang) {
      _lang = lang;
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.hasError) {
          return EmberScaffold(
            children: [errorBox(snap.error!, () => setState(_load))],
          );
        }
        if (!snap.hasData) {
          return const EmberScaffold(
            children: [
              Padding(
                padding: EdgeInsets.all(60),
                child: Center(child: EmberLottie(EmberAnim.loader, size: 72)),
              ),
            ],
          );
        }
        return _content(context, snap.data!);
      },
    );
  }

  Widget _content(BuildContext context, Map<String, dynamic> r) {
    final app = context.watch<AppState>();
    final t = app.t;
    final sections = List<Map<String, dynamic>>.from(
      (r['sections'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    var products = List<Map<String, dynamic>>.from(
      (r['products'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    final q = _query.toLowerCase();
    if (q.isNotEmpty) {
      products = products
          .where(
            (p) => '${p['name']} ${p['description'] ?? ''}'
                .toLowerCase()
                .contains(q),
          )
          .toList();
    }
    if (_sort != 0) {
      products.sort(
        (a, b) =>
            (_sort == 1 ? 1 : -1) *
            numOf(a['base_price']).compareTo(numOf(b['base_price'])),
      );
    }
    final groups =
        (_section == 'all'
                ? sections
                : sections.where((s) => s['id'] == _section))
            .map(
              (s) => (
                s,
                products.where((p) => p['section_id'] == s['id']).toList(),
              ),
            )
            .where((g) => g.$2.isNotEmpty)
            .toList();
    final offers = List<Map<String, dynamic>>.from(
      (r['offers'] as List).map((e) => Map<String, dynamic>.from(e)),
    );

    // Kit "Mobile Restaurant" (430 wide): each block keeps its own side
    // margins from the mockup; the map, reviews band and footer run edge to edge.
    Widget pad(Widget child, double l, [double? r]) => Padding(
      padding: EdgeInsets.only(left: l, right: r ?? l),
      child: child,
    );
    final similar = List<Map<String, dynamic>>.from(
      ((r['similar'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)),
    );

    return EmberScaffold(
      padding: const EdgeInsets.only(top: 13),
      onRefresh: () async => setState(_load),
      children: [
        pad(_Hero(r: r), 16),
        const SizedBox(height: 23),
        pad(
          SizedBox(
            height: 63,
            child: TextField(
              onChanged: (v) => setState(() => _query = v),
              textAlignVertical: TextAlignVertical.center,
              style: Ember.text(18, weight: FontWeight.w600, color: Ember.navy),
              decoration: InputDecoration(
                hintText: t('search_menu'),
                hintStyle: Ember.text(
                  18,
                  weight: FontWeight.w600,
                  color: Ember.navy.withValues(alpha: 0.6),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.fromLTRB(64, 0, 24, 0),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Ember.pill),
                  borderSide: const BorderSide(color: Ember.navy),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Ember.pill),
                  borderSide: const BorderSide(color: Ember.navy, width: 1.5),
                ),
              ),
            ),
          ),
          42,
          44,
        ),
        const SizedBox(height: 32),
        pad(
          Text(
            t('order_from', {'name': r['name']}),
            textAlign: TextAlign.center,
            style: Ember.text(18, weight: FontWeight.w600),
          ),
          16,
        ),
        const SizedBox(height: 47),
        // "Menu  Pizzas ⌄" selector: 405 x 78, radius 12, 30% black outline
        pad(
          Material(
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Ember.radius),
              side: const BorderSide(color: Color(0x4D000000)),
            ),
            child: InkWell(
              onTap: () => _pickSection(context, sections),
              customBorder: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Ember.radius),
              ),
              child: SizedBox(
                height: 78,
                child: Row(
                  children: [
                    const SizedBox(width: 21),
                    const KitImage('restaurant_menu', size: 55),
                    const SizedBox(width: 20),
                    Flexible(
                      flex: 3,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          t('menu'),
                          style: Ember.text(32, weight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: Text(
                        _section == 'all'
                            ? t('all_dishes')
                            : '${sections.firstWhere((s) => s['id'] == _section)['name']}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.right,
                        style: Ember.text(16),
                      ),
                    ),
                    const SizedBox(width: 24),
                    const KitDownArrow(),
                    const SizedBox(width: 19),
                  ],
                ),
              ),
            ),
          ),
          9,
          16,
        ),
        const SizedBox(height: 15),
        if (groups.isEmpty)
          pad(
            EmptyState(
              anim: EmberAnim.notFound,
              title: t('no_dishes'),
              text: t('no_dishes_desc'),
            ),
            18,
          ),
        for (var gi = 0; gi < groups.length; gi++) ...[
          if (gi > 0) const SizedBox(height: 8),
          pad(
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  flex: 2,
                  child: Text(
                    '${groups[gi].$1['name']}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Ember.text(32, weight: FontWeight.w600),
                  ),
                ),
                if (gi == 0) ...[
                  const SizedBox(width: 10),
                  Flexible(
                    flex: 3,
                    child: KitPill(
                      _sort == 0
                          ? t('sort_by_price')
                          : _sort == 1
                          ? t('sort_price_low')
                          : t('sort_price_high'),
                      onTap: () => setState(() => _sort = (_sort + 1) % 3),
                      padding: const EdgeInsets.only(left: 29, right: 13),
                    ),
                  ),
                ],
              ],
            ),
            30,
            16,
          ),
          const SizedBox(height: 22),
          for (final p in groups[gi].$2)
            pad(
              Padding(
                padding: const EdgeInsets.only(bottom: 27),
                child: ProductCard(product: p, restaurant: r),
              ),
              18,
              19,
            ),
        ],
        for (final o in offers)
          pad(
            Padding(
              padding: const EdgeInsets.only(bottom: 28),
              child: _OfferCard(offer: o, restaurant: r),
            ),
            18,
            24,
          ),
        if (offers.isEmpty) const SizedBox(height: 1),
        pad(_InfoBlock(r: r), 23, 24),
        const SizedBox(height: 40),
        _MapCard(r: r),
        const SizedBox(height: 66),
        _Reviews(r: r, onPosted: () => setState(_load)),
        if (similar.isNotEmpty) ...[
          const SizedBox(height: 38),
          RestaurantStrip(
            title: t('similar_restaurants'),
            items: similar,
            onTap: (s) => go(context, RestaurantScreen(slug: s['slug'])),
          ),
        ],
        const SizedBox(height: 46),
        const KitFooter(),
      ],
    );
  }

  /// Kit "Mobile Open Menu": white card (inset 30), menu icon + "Menu",
  /// then one 83-high row per section, the chosen one navy.
  void _pickSection(BuildContext context, List<Map<String, dynamic>> sections) {
    final t = context.read<AppState>().t;
    showEmberPopup(
      context,
      inset: 30,
      showClose: false,
      child: Container(
        color: Ember.light,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(36, 50, 26, 46),
                child: Row(
                  children: [
                    const KitImage('restaurant_menu', size: 50),
                    const SizedBox(width: 23),
                    Flexible(
                      child: Text(
                        t('menu'),
                        style: Ember.text(32, weight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              for (final s in [
                <String, dynamic>{'id': 'all', 'name': t('all_dishes')},
                ...sections,
              ])
                Semantics(
                  selected: _section == s['id'],
                  button: true,
                  child: InkWell(
                    onTap: () {
                      setState(() => _section = s['id']);
                      Navigator.pop(context);
                    },
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 67),
                      margin: const EdgeInsets.only(bottom: 16),
                      color: _section == s['id'] ? Ember.navy : null,
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 34,
                        vertical: 12,
                      ),
                      child: Text(
                        '${s['name']}',
                        style: Ember.text(
                          20,
                          weight: FontWeight.w700,
                          color: _section == s['id']
                              ? Colors.white
                              : const Color(0xFF282828),
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

String openText(AppState app, Map<String, dynamic> r) {
  if (r['open_now'] == true) {
    return r['closes_at'] != null
        ? app.t('open_until', {'time': r['closes_at']})
        : app.t('open_now');
  }
  return r['opens_at'] != null
      ? app.t('opens_at', {'time': r['opens_at']})
      : app.t('closed_now');
}

/// "24th September, 2023" / "24 сентября 2023" / "24 sentýabr 2023".
String reviewDate(AppState app, dynamic iso) {
  final d = DateTime.tryParse('${iso ?? ''}')?.toLocal();
  if (d == null) return '';
  final month = app.t('months').split(',')[d.month - 1];
  if (app.lang != 'en') return '${d.day} $month ${d.year}';
  final n = d.day;
  final suffix = (n >= 11 && n <= 13)
      ? 'th'
      : const {1: 'st', 2: 'nd', 3: 'rd'}[n % 10] ?? 'th';
  return '$n$suffix $month, ${d.year}';
}

/// Kit hero card (398 x 593): faint restaurant photo under 90% gray, the
/// 228 x 142 photo with the rating badge, the orange "Open until" tab and
/// two navy pills.
class _Hero extends StatelessWidget {
  final Map<String, dynamic> r;
  const _Hero({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    Widget pill(String icon, String text) => Container(
      constraints: const BoxConstraints(minHeight: 63, maxWidth: 330),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      decoration: BoxDecoration(
        color: Ember.navy,
        border: Border.all(color: Colors.white),
        borderRadius: BorderRadius.circular(Ember.pill),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          KitImage(icon, size: 34),
          const SizedBox(width: 15),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                text,
                maxLines: 1,
                style: Ember.text(
                  18,
                  weight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(Ember.radius),
      child: Stack(
        children: [
          Positioned.fill(
            child: NetImage(r['cover_url'] ?? r['hero_image_url']),
          ),
          const Positioned.fill(child: ColoredBox(color: Color(0xE6E2E2E2))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 43),
              Center(
                child: SizedBox(
                  width: 228,
                  height: 145,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(Ember.radius),
                        child: SizedBox(
                          width: 228,
                          height: 142,
                          child: NetImage(
                            r['hero_image_url'] ?? r['cover_url'],
                          ),
                        ),
                      ),
                      Positioned(left: -22, top: 83, child: _RatingBadge(r: r)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 31),
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 335,
                  constraints: const BoxConstraints(minHeight: 61),
                  margin: const EdgeInsets.only(left: 1, right: 40),
                  padding: const EdgeInsets.fromLTRB(62, 8, 16, 8),
                  decoration: BoxDecoration(
                    color: r['open_now'] == true ? Ember.orange : Ember.navy,
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(Ember.radius),
                    ),
                  ),
                  child: Row(
                    children: [
                      const KitImage('clock', size: 29),
                      const SizedBox(width: 13),
                      Flexible(
                        child: Text(
                          openText(app, r),
                          style: Ember.text(
                            18,
                            weight: FontWeight.w600,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 50),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 34),
                child: Column(
                  children: [
                    if ('${r['tagline'] ?? ''}'.isNotEmpty)
                      Text(
                        '${r['tagline']}',
                        textAlign: TextAlign.center,
                        style: Ember.text(13, color: Ember.navy),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      '${r['name']}',
                      textAlign: TextAlign.center,
                      style: Ember.text(
                        28,
                        weight: FontWeight.w700,
                        color: Ember.navy,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 13),
                    pill(
                      'order_completed',
                      app.t('min_order_badge', {
                        'amount': shortPrice(app, numOf(r['min_order'])),
                      }),
                    ),
                    const SizedBox(height: 15),
                    pill(
                      'motocross',
                      app.t('delivery_in_badge', {'time': r['delivery_time']}),
                    ),
                    const SizedBox(height: 49),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Small white rating card (kit 53 x 62): "4.7", stars, "N reviews".
class _RatingBadge extends StatelessWidget {
  final Map<String, dynamic> r;
  const _RatingBadge({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Container(
      width: 53,
      height: 62,
      padding: const EdgeInsets.symmetric(horizontal: 3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Column(
          children: [
            Text(
              numOf(r['rating']).toStringAsFixed(1),
              style: Ember.text(
                24,
                color: const Color(0xFF222222),
                height: 1.1,
              ),
            ),
            Stars(numOf(r['rating']), size: 7),
            const SizedBox(height: 2),
            Text(
              app.t('reviews_n', {'count': r['review_count'] ?? 0}),
              style: Ember.text(6, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}

/// Kit offer card (388 x 325): photo, navy-fade gradient, "-20%" tab,
/// "Special Offer" + title, and the white corner with the plus button.
class _OfferCard extends StatelessWidget {
  final Map<String, dynamic> offer, restaurant;
  const _OfferCard({required this.offer, required this.restaurant});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    void apply() {
      final cart = context.read<CartState>();
      final code = offer['promo_code'];
      if (code == null) return;
      if (cart.restaurant != null &&
          cart.restaurant!['id'] != restaurant['id']) {
        showMessage(context, app.t('offer_other_basket'), error: true);
      } else {
        cart.setPromo(code, numOf(offer['discount_percent']));
        showMessage(context, app.t('offer_code_hint', {'code': code}));
      }
    }

    return Semantics(
      button: true,
      label: '${app.t('special_offer')}: ${offer['title']}',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: apply,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(Ember.radius),
          child: AspectRatio(
            aspectRatio: 388 / 325,
            child: Stack(
              fit: StackFit.expand,
              children: [
                NetImage(offer['image_url']),
                DecoratedBox(
                  decoration: BoxDecoration(gradient: kitPhotoGradient(241.67)),
                ),
                if (numOf(offer['discount_percent']) > 0)
                  Positioned(
                    left: 23,
                    top: 0,
                    child: DiscountBadge(
                      numOf(offer['discount_percent']).toInt(),
                      width: 69,
                      height: 66,
                      font: 18,
                      radius: 12,
                    ),
                  ),
                Positioned(
                  left: 23,
                  right: 82,
                  bottom: 24,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        app.t('special_offer'),
                        style: Ember.text(
                          18,
                          weight: FontWeight.w500,
                          color: Ember.orange,
                        ),
                      ),
                      Text(
                        '${offer['title']}',
                        style: Ember.text(
                          24,
                          weight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 76,
                    height: 89,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(45),
                      ),
                    ),
                    alignment: const Alignment(-0.05, -0.1),
                    child: const KitImage('plus', width: 38, height: 49),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Kit info card (383 wide, #FBFBFB, radius 4): delivery hours, contact
/// details, and the navy "Operational Times" card inside it.
class _InfoBlock extends StatelessWidget {
  final Map<String, dynamic> r;
  const _InfoBlock({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final hours = r['hours'] is List ? List.from(r['hours']) : null;
    const shadow = [
      BoxShadow(color: Color(0x40000000), offset: Offset(5, 5), blurRadius: 14),
    ];

    Widget line(String label, String value, Color color, double size) =>
        Padding(
          padding: EdgeInsets.symmetric(vertical: (46 - size * 1.5) / 2),
          child: Text.rich(
            TextSpan(
              style: Ember.text(size, color: color, height: 1.5),
              children: [
                TextSpan(
                  text: '$label: ',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                TextSpan(text: value),
              ],
            ),
          ),
        );
    List<Widget> hoursList(Color color, double size) => [
      if (hours == null)
        line(t('operational_times'), t('hours_not_set'), color, size),
      if (hours != null)
        for (var i = 0; i < 7; i++)
          line(
            t(_days[i]),
            hours[i] == null
                ? t('closed_now')
                : '${hours[i][0]}–${hours[i][1]}',
            color,
            size,
          ),
    ];
    Widget title(Widget icon, String text, Color color, double gap) => Row(
      children: [
        icon,
        SizedBox(width: gap),
        Expanded(
          child: Text(
            text,
            style: Ember.text(20, weight: FontWeight.w700, color: color),
          ),
        ),
      ],
    );
    Widget label(String text) => Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Text(
        text,
        style: Ember.text(20, weight: FontWeight.w700, height: 46 / 20),
      ),
    );
    Widget value(String text) => Text(
      text,
      style: Ember.text(20, color: Ember.navy, height: 48 / 20),
    );

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFBFBFB),
        borderRadius: BorderRadius.circular(4),
        boxShadow: shadow,
      ),
      padding: const EdgeInsets.fromLTRB(11, 69, 13, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                title(
                  const KitImage('tracking', size: 45),
                  t('delivery_information'),
                  Ember.navy,
                  11,
                ),
                const SizedBox(height: 26),
                ...hoursList(Colors.black, 14),
                line(
                  t('estimated_delivery_time'),
                  '${r['delivery_time']} ${t('min_short')}',
                  Colors.black,
                  14,
                ),
                const SizedBox(height: 28),
                title(
                  const KitImage('id_verified', size: 45),
                  t('contact_information'),
                  Ember.navy,
                  11,
                ),
                const SizedBox(height: 20),
                Text(t('allergy_note'), style: Ember.text(20, height: 46 / 20)),
                if ('${r['phone'] ?? ''}'.isNotEmpty) ...[
                  label(t('phone_number')),
                  value('${r['phone']}'),
                ],
                if ('${r['website'] ?? ''}'.isNotEmpty) ...[
                  label(t('website')),
                  value('${r['website']}'),
                ],
              ],
            ),
          ),
          const SizedBox(height: 40),
          Container(
            decoration: BoxDecoration(
              color: Ember.navy,
              borderRadius: BorderRadius.circular(4),
              boxShadow: shadow,
            ),
            padding: const EdgeInsets.fromLTRB(43, 16, 20, 34),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                title(
                  const KitImage('clock1', width: 32, height: 45),
                  t('operational_times'),
                  Colors.white,
                  22,
                ),
                const SizedBox(height: 20),
                ...hoursList(Colors.white, 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Kit map card: full-width map picture (radius 12) with the navy address
/// card on top — name, area, address, phone and website in orange.
class _MapCard extends StatelessWidget {
  final Map<String, dynamic> r;
  const _MapCard({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    Widget label(String text) => Text(
      text,
      style: Ember.text(
        18,
        weight: FontWeight.w700,
        color: Colors.white,
        height: 46 / 18,
      ),
    );
    Widget value(String text) => Text(
      text,
      style: Ember.text(24, color: Ember.orange, height: 38 / 24),
    );
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Ember.radius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            offset: Offset(5, 5),
            blurRadius: 14,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Ember.radius),
        child: Stack(
          children: [
            const Positioned.fill(
              child: Opacity(
                opacity: 0.9,
                child: KitImage('map.jpg', fit: BoxFit.cover),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(23, 111, 46, 80),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(33, 44, 20, 40),
                decoration: BoxDecoration(
                  color: const Color(0xF703081F),
                  borderRadius: BorderRadius.circular(Ember.radius),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${r['name']}',
                      style: Ember.text(
                        32,
                        weight: FontWeight.w700,
                        color: Colors.white,
                        height: 38 / 32,
                      ),
                    ),
                    if ('${r['area'] ?? ''}'.isNotEmpty)
                      Text(
                        '${r['area']}',
                        style: Ember.text(
                          22,
                          weight: FontWeight.w600,
                          color: Ember.orange,
                          height: 38 / 22,
                        ),
                      ),
                    const SizedBox(height: 22),
                    if ('${r['address'] ?? ''}'.isNotEmpty)
                      Text(
                        '${r['address']}',
                        style: Ember.text(
                          18,
                          color: Colors.white,
                          height: 31 / 18,
                        ),
                      ),
                    if ('${r['phone'] ?? ''}'.isNotEmpty) ...[
                      label(app.t('phone_number')),
                      value('${r['phone']}'),
                    ],
                    if ('${r['website'] ?? ''}'.isNotEmpty) ...[
                      label(app.t('website')),
                      value('${r['website']}'),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Kit "Customer Reviews" band: big rating card, a row of 389-wide review
/// cards and the two orange round arrows.
class _Reviews extends StatefulWidget {
  final Map<String, dynamic> r;
  final VoidCallback onPosted;
  const _Reviews({required this.r, required this.onPosted});
  @override
  State<_Reviews> createState() => _ReviewsState();
}

class _ReviewsState extends State<_Reviews> {
  final _pages = PageController(viewportFraction: 404 / 430);

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  Future<void> _write() async {
    final app = context.read<AppState>();
    if (!app.isLoggedIn) {
      go(context, const LoginScreen());
      return;
    }
    var rating = 5;
    final ctrl = TextEditingController();
    final sent = await showEmberPopup<bool>(
      context,
      child: StatefulBuilder(
        builder: (ctx, setState) => Padding(
          padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                app.t('write_review'),
                style: Ember.text(22, weight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  for (var s = 1; s <= 5; s++)
                    IconButton(
                      onPressed: () => setState(() => rating = s),
                      icon: KitImage(
                        'star',
                        size: 30,
                        color: s <= rating ? null : Ember.gray,
                      ),
                      tooltip: '$s / 5',
                    ),
                ],
              ),
              TextField(
                controller: ctrl,
                maxLines: 4,
                maxLength: 1000,
                decoration: InputDecoration(
                  hintText: app.t('review_placeholder'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Ember.radius),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Ember.radius),
                    borderSide: const BorderSide(color: Ember.gray),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OrangeButton(
                  app.t('post_review'),
                  onPressed: () async {
                    try {
                      await Api.instance.postReview(
                        '${widget.r['id']}',
                        rating,
                        ctrl.text.trim(),
                      );
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } on ApiError catch (e) {
                      if (ctx.mounted) showMessage(ctx, e.message, error: true);
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (sent == true && mounted) {
      showMessage(context, app.t('review_posted'));
      widget.onPosted();
    }
  }

  void _turn(int by) {
    if (!_pages.hasClients) return;
    _pages.animateToPage(
      ((_pages.page ?? 0).round() + by).clamp(0, 999),
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final r = widget.r;
    final reviews = List<Map<String, dynamic>>.from(
      ((r['reviews'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)),
    );
    Widget arrow(bool next) => Semantics(
      button: true,
      label: app.t(next ? 'next' : 'previous'),
      child: Material(
        color: Ember.orange,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: () => _turn(next ? 1 : -1),
          child: SizedBox(
            width: 75,
            height: 75,
            child: Center(
              child: RotatedBox(
                quarterTurns: next ? 2 : 0,
                child: const KitImage('back', size: 36),
              ),
            ),
          ),
        ),
      ),
    );
    final textScale = MediaQuery.textScalerOf(context).scale(1);

    return Container(
      width: double.infinity,
      color: Ember.band,
      padding: const EdgeInsets.fromLTRB(0, 56, 0, 49),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              app.t('customer_reviews'),
              textAlign: TextAlign.center,
              style: Ember.text(32, weight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 22),
          Semantics(
            button: true,
            label: app.isLoggedIn
                ? app.t('write_review')
                : app.t('login_to_review'),
            child: GestureDetector(
              onTap: _write,
              child: Container(
                width: 153,
                height: 178,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(Ember.radius),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Column(
                    children: [
                      Text(
                        numOf(r['rating']).toStringAsFixed(1),
                        style: Ember.text(
                          64,
                          color: const Color(0xFF222222),
                          height: 1.2,
                        ),
                      ),
                      Stars(numOf(r['rating']), size: 20),
                      const SizedBox(height: 6),
                      Text(
                        app.t('reviews_n', {
                          'count': r['review_count'] ?? reviews.length,
                        }),
                        style: Ember.text(16, color: const Color(0xFF70757A)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 57),
          if (reviews.isEmpty)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 9),
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                app.t('no_reviews'),
                textAlign: TextAlign.center,
                style: Ember.text(16, color: Colors.black54),
              ),
            )
          else ...[
            SizedBox(
              height: 295 * (textScale < 1 ? 1 : textScale),
              child: PageView.builder(
                controller: _pages,
                padEnds: false,
                itemCount: reviews.length,
                itemBuilder: (_, i) => Padding(
                  padding: const EdgeInsets.only(left: 9, right: 6),
                  child: _ReviewCard(review: reviews[i]),
                ),
              ),
            ),
            const SizedBox(height: 23),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [arrow(false), const SizedBox(width: 22), arrow(true)],
            ),
          ],
          const SizedBox(height: 24),
          TextButton(
            onPressed: _write,
            child: Text(
              app.isLoggedIn ? app.t('write_review') : app.t('login_to_review'),
              style: Ember.text(
                16,
                weight: FontWeight.w600,
                color: Ember.navy,
              ).copyWith(decoration: TextDecoration.underline),
            ),
          ),
        ],
      ),
    );
  }
}

/// Kit review card (389 x 295, radius 4): avatar | orange rule | name and
/// place, stars and date on the right, then the comment.
class _ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;
  const _ReviewCard({required this.review});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final name = '${review['author_name'] ?? ''}';
    final letter =
        '${review['avatar_letter'] ?? (name.isEmpty ? '?' : name.characters.first)}';
    final place = '${review['location'] ?? ''}';
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 41, 12, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: CircleAvatar(
                  radius: 22.5,
                  backgroundColor: Ember.navy,
                  child: Text(
                    letter.toUpperCase(),
                    style: Ember.text(
                      18,
                      weight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(width: 1.6, height: 54, color: Ember.orange),
              const SizedBox(width: 10),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Ember.text(
                          18,
                          weight: FontWeight.w600,
                          color: Ember.navy,
                          height: 21 / 18,
                        ),
                      ),
                      if (place.isNotEmpty)
                        Text(
                          place,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Ember.text(
                            16,
                            color: Ember.orange,
                            height: 21 / 16,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Stars(numOf(review['rating']), size: 13.3),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const KitImage('timespan', width: 18, height: 25),
                        const SizedBox(width: 6),
                        Text(
                          reviewDate(app, review['created_at']),
                          style: Ember.text(11, height: 21 / 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 9),
              child: Text(
                '${review['comment'] ?? ''}',
                overflow: TextOverflow.fade,
                style: Ember.text(16, height: 27 / 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
