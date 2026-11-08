import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
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

/// Kit "Restaurant View": full-width photo with round back / more buttons
/// and page dots, info row, name, description, section chips and a
/// two-column grid of dishes.
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
        if (snap.hasError || !snap.hasData) {
          return EmberScaffold(
            header: const TopBar(title: ''),
            children: [
              if (snap.hasError)
                ErrorState(error: snap.error!, onRetry: () => setState(_load))
              else
                const LoadingBox(),
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
    final products = List<Map<String, dynamic>>.from(
      (r['products'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    final offers = List<Map<String, dynamic>>.from(
      ((r['offers'] as List?) ?? []).map((e) => Map<String, dynamic>.from(e)),
    );
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

    return Scaffold(
      backgroundColor: Colors.white,
      body: RefreshIndicator(
        color: Ember.orange,
        onRefresh: () async => setState(_load),
        child: ListView(
          padding: EdgeInsets.only(
            bottom: 32 + MediaQuery.paddingOf(context).bottom,
          ),
          children: [
            _Gallery(
              r: r,
              onMore: () => go(context, RestaurantInfoScreen(r: r)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 25, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MetaRow(
                    rating: numOf(r['rating']),
                    fee: deliveryFeeText(app, r),
                    time: '${r['delivery_time']} ${t('min_short')}',
                    gap: 36,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${r['name']}',
                    style: Ember.text(
                      20,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                  if (r['open_now'] != true) ...[
                    const SizedBox(height: 4),
                    Text(
                      openText(app, r),
                      style: Ember.text(
                        14,
                        weight: FontWeight.w700,
                        color: Ember.red,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    '${r['description'] ?? r['tagline'] ?? ''}',
                    style: Ember.text(14, color: Ember.text2, height: 24 / 14),
                  ),
                  for (final o in offers) ...[
                    const SizedBox(height: 20),
                    _OfferStrip(offer: o, restaurant: r),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              height: 46,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  for (final s in [
                    <String, dynamic>{'id': 'all', 'name': t('all_dishes')},
                    ...sections,
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: KitChip(
                        '${s['name']}',
                        selected: _section == s['id'],
                        onTap: () => setState(() => _section = s['id']),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            if (groups.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: EmptyState(
                  anim: EmberAnim.notFound,
                  title: t('no_dishes'),
                  text: t('no_dishes_desc'),
                ),
              ),
            for (final g in groups) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  '${g.$1['name']} (${g.$2.length})',
                  style: Ember.text(20, color: Ember.text1),
                ),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _Grid(products: g.$2, restaurant: r),
              ),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }
}

/// Two dishes per row, 21 apart (kit grid).
class _Grid extends StatelessWidget {
  final List<Map<String, dynamic>> products;
  final Map<String, dynamic> restaurant;
  const _Grid({required this.products, required this.restaurant});
  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (var i = 0; i < products.length; i += 2)
        Padding(
          padding: const EdgeInsets.only(bottom: 21),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ProductCard(
                  product: products[i],
                  restaurant: restaurant,
                ),
              ),
              const SizedBox(width: 21),
              Expanded(
                child: i + 1 < products.length
                    ? ProductCard(
                        product: products[i + 1],
                        restaurant: restaurant,
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
    ],
  );
}

/// Kit photo header (321 high, rounded bottom corners) with white round
/// back / more buttons and the page dots.
class _Gallery extends StatefulWidget {
  final Map<String, dynamic> r;
  final VoidCallback onMore;
  const _Gallery({required this.r, required this.onMore});
  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  int _page = 0;
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    final r = widget.r;
    final images = <String>{
      for (final k in ['cover_url', 'hero_image_url'])
        if ('${r[k] ?? ''}'.isNotEmpty) '${r[k]}',
      for (final o in (r['offers'] as List?) ?? [])
        if ('${o['image_url'] ?? ''}'.isNotEmpty) '${o['image_url']}',
    }.toList();
    final top = MediaQuery.paddingOf(context).top;
    return SizedBox(
      height: 321 + top,
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (images.isEmpty)
              const ColoredBox(color: Ember.placeholder)
            else
              PageView(
                onPageChanged: (i) => setState(() => _page = i),
                children: [for (final i in images) NetImage(i)],
              ),
            Positioned(
              left: 24,
              top: top + 6,
              child: const BackButtonKit(white: true),
            ),
            Positioned(
              right: 24,
              top: top + 6,
              child: RoundButton(
                color: Colors.white,
                tooltip: app.t('restaurant_info'),
                onTap: widget.onMore,
                icon: const Icon(
                  Icons.more_horiz_rounded,
                  color: Ember.navy,
                  size: 26,
                ),
              ),
            ),
            if (images.length > 1)
              Positioned(
                left: 0,
                right: 0,
                bottom: 12,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (var i = 0; i < images.length; i++)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: i == _page ? 18 : 10,
                        height: i == _page ? 18 : 10,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i == _page
                              ? Colors.transparent
                              : Colors.white.withValues(alpha: 0.6),
                          border: i == _page
                              ? Border.all(color: Colors.white, width: 2)
                              : null,
                        ),
                        child: i == _page
                            ? Center(
                                child: Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              )
                            : null,
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

/// Promo code strip: orange tinted, "-20%  First Order Discount  WELCOME".
class _OfferStrip extends StatelessWidget {
  final Map<String, dynamic> offer, restaurant;
  const _OfferStrip({required this.offer, required this.restaurant});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final code = offer['promo_code'];
    return InkWell(
      borderRadius: BorderRadius.circular(Ember.radius),
      onTap: code == null
          ? null
          : () {
              final cart = context.read<CartState>();
              if (cart.restaurant != null &&
                  cart.restaurant!['id'] != restaurant['id']) {
                showMessage(context, app.t('offer_other_basket'), error: true);
              } else {
                cart.setPromo(code, numOf(offer['discount_percent']));
                showMessage(context, app.t('offer_code_hint', {'code': code}));
              }
            },
      child: Ink(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: Ember.orangeSoft,
          borderRadius: BorderRadius.circular(Ember.radius),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Ember.orange,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '-${numOf(offer['discount_percent']).toInt()}%',
                style: Ember.text(
                  14,
                  weight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${offer['title']}',
                    style: Ember.text(
                      15,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                  if (code != null)
                    Text(
                      app.t('promo_code_label', {'code': code}),
                      style: Ember.text(12, color: Ember.text3),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Ember.orange),
          ],
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

/// Restaurant details behind the "…" button: delivery terms, contacts,
/// opening hours and the reviews, in the kit's gray grouped panels.
class RestaurantInfoScreen extends StatefulWidget {
  final Map<String, dynamic> r;
  const RestaurantInfoScreen({super.key, required this.r});
  @override
  State<RestaurantInfoScreen> createState() => _RestaurantInfoScreenState();
}

class _RestaurantInfoScreenState extends State<RestaurantInfoScreen> {
  late final List<Map<String, dynamic>> _reviews = List.from(
    ((widget.r['reviews'] as List?) ?? []).map(
      (e) => Map<String, dynamic>.from(e),
    ),
  );

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
        builder: (ctx, setState) => SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                app.t('write_review'),
                style: Ember.text(
                  20,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  for (var s = 1; s <= 5; s++)
                    IconButton(
                      onPressed: () => setState(() => rating = s),
                      tooltip: '$s / 5',
                      icon: Icon(
                        s <= rating
                            ? Icons.star_rounded
                            : Icons.star_border_rounded,
                        size: 32,
                        color: Ember.orange,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: ctrl,
                maxLines: 4,
                maxLength: 1000,
                style: Ember.text(14, color: Ember.navy),
                decoration: InputDecoration(
                  hintText: app.t('review_placeholder'),
                ),
              ),
              const SizedBox(height: 12),
              PrimaryButton(
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
            ],
          ),
        ),
      ),
    );
    if (sent == true && mounted) {
      showMessage(context, app.t('review_posted'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final r = widget.r;
    final hours = r['hours'] is List ? List.from(r['hours']) : null;

    Widget panel(String title, List<Widget> children) => Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        color: Ember.panel,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: Ember.text(13, color: Ember.text1)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
    Widget line(String label, String value) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: LabelValueRow(
        label: Text(label, style: Ember.text(14, color: Ember.text3)),
        value: Text(
          value,
          style: Ember.text(14, weight: FontWeight.w700, color: Ember.navy),
        ),
      ),
    );

    return EmberScaffold(
      header: TopBar(title: '${r['name']}'),
      children: [
        const SizedBox(height: 24),
        panel(t('delivery_information'), [
          line(
            t('estimated_delivery_time'),
            '${r['delivery_time']} ${t('min_short')}',
          ),
          line(t('min_order'), shortPrice(app, numOf(r['min_order']))),
          line(t('delivery_fee'), deliveryFeeText(app, r)),
          if (numOf(r['free_delivery_from']) > 0)
            line(
              t('free_delivery_from', {
                'amount': shortPrice(app, numOf(r['free_delivery_from'])),
              }),
              '',
            ),
        ]),
        panel(t('contact_information'), [
          if ('${r['address'] ?? ''}'.isNotEmpty)
            line(t('restaurant_address'), '${r['address']}'),
          if ('${r['phone'] ?? ''}'.isNotEmpty)
            line(t('phone_number'), '${r['phone']}'),
          if ('${r['website'] ?? ''}'.isNotEmpty)
            line(t('website'), '${r['website']}'),
          const SizedBox(height: 6),
          Text(t('allergy_note'), style: Ember.text(13, color: Ember.text2)),
        ]),
        panel(t('operational_times'), [
          if (hours == null)
            Text(t('hours_not_set'), style: Ember.text(14, color: Ember.text2))
          else
            for (var i = 0; i < 7; i++)
              line(
                t(_days[i]),
                hours[i] == null
                    ? t('closed_now')
                    : '${hours[i][0]}–${hours[i][1]}',
              ),
        ]),
        Row(
          children: [
            Expanded(
              child: Text(
                t('customer_reviews'),
                style: Ember.text(20, color: Ember.text1),
              ),
            ),
            const Icon(Icons.star_rounded, color: Ember.orange, size: 22),
            const SizedBox(width: 4),
            Text(
              numOf(r['rating']).toStringAsFixed(1),
              style: Ember.text(16, weight: FontWeight.w700, color: Ember.navy),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_reviews.isEmpty)
          Text(t('no_reviews'), style: Ember.text(14, color: Ember.text2)),
        for (final rev in _reviews)
          Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: Ember.cardShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: Ember.peach,
                      child: Text(
                        '${rev['avatar_letter'] ?? '${rev['author_name'] ?? '?'}'.characters.first}'
                            .toUpperCase(),
                        style: Ember.text(
                          16,
                          weight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${rev['author_name'] ?? ''}',
                            style: Ember.text(
                              15,
                              weight: FontWeight.w700,
                              color: Ember.navy,
                            ),
                          ),
                          Text(
                            reviewDate(app, rev['created_at']),
                            style: Ember.text(12, color: Ember.text2),
                          ),
                        ],
                      ),
                    ),
                    for (var s = 1; s <= 5; s++)
                      Icon(
                        s <= numOf(rev['rating']).round()
                            ? Icons.star_rounded
                            : Icons.star_border_rounded,
                        color: Ember.orange,
                        size: 16,
                      ),
                  ],
                ),
                if ('${rev['comment'] ?? ''}'.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    '${rev['comment']}',
                    style: Ember.text(14, color: Ember.text3, height: 1.6),
                  ),
                ],
              ],
            ),
          ),
        const SizedBox(height: 12),
        PrimaryButton(
          app.isLoggedIn ? t('write_review') : t('login_to_review'),
          onPressed: _write,
        ),
      ],
    );
  }
}
