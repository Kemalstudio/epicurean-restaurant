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

    return EmberScaffold(
      onRefresh: () async => setState(_load),
      children: [
        _Hero(r: r),
        const SizedBox(height: 22),
        TextField(
          onChanged: (v) => setState(() => _query = v),
          decoration: InputDecoration(
            hintText: t('search_menu'),
            fillColor: Colors.white,
            prefixIcon: const Padding(
              padding: EdgeInsets.only(left: 14),
              child: Icon(Icons.search),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(Ember.pill),
              borderSide: const BorderSide(color: Colors.black87),
            ),
          ),
        ),
        const SizedBox(height: 22),
        Text(
          t('order_from', {'name': r['name']}),
          textAlign: TextAlign.center,
          style: Ember.text(18, weight: FontWeight.w600),
        ),
        const SizedBox(height: 22),
        // "Menu  Pizzas ⌄" selector (kit Mobile Open Menu)
        InkWell(
          onTap: () => _pickSection(context, sections),
          borderRadius: BorderRadius.circular(Ember.radius),
          child: Container(
            height: 77,
            padding: const EdgeInsets.symmetric(horizontal: 22),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.black26),
              borderRadius: BorderRadius.circular(Ember.radius),
            ),
            child: Row(
              children: [
                const Icon(Icons.menu_book, size: 42),
                const SizedBox(width: 14),
                Text(t('menu'), style: Ember.text(30, weight: FontWeight.w600)),
                const Spacer(),
                Flexible(
                  child: Text(
                    _section == 'all'
                        ? t('all_dishes')
                        : '${sections.firstWhere((s) => s['id'] == _section)['name']}',
                    overflow: TextOverflow.ellipsis,
                    style: Ember.text(15),
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.expand_circle_down, color: Colors.black38),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        if (groups.isEmpty)
          EmptyState(
            anim: EmberAnim.notFound,
            title: t('no_dishes'),
            text: t('no_dishes_desc'),
          ),
        for (var gi = 0; gi < groups.length; gi++) ...[
          Row(
            children: [
              Expanded(
                child: Text(
                  '${groups[gi].$1['name']}',
                  style: Ember.text(30, weight: FontWeight.w600),
                ),
              ),
              if (gi == 0)
                ActionChip(
                  onPressed: () => setState(() => _sort = (_sort + 1) % 3),
                  label: Text(
                    _sort == 0
                        ? t('sort_by_price')
                        : _sort == 1
                        ? t('sort_price_low')
                        : t('sort_price_high'),
                  ),
                  avatar: const Icon(Icons.swap_vert, size: 18),
                  backgroundColor: Ember.section,
                  shape: const StadiumBorder(
                    side: BorderSide(color: Color(0xFFCFCFCF)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          for (final p in groups[gi].$2)
            Padding(
              padding: const EdgeInsets.only(bottom: 22),
              child: ProductCard(product: p, restaurant: r),
            ),
        ],
        for (final o in offers)
          Padding(
            padding: const EdgeInsets.only(bottom: 22),
            child: _OfferCard(offer: o, restaurant: r),
          ),
        _InfoBlock(r: r),
        const SizedBox(height: 28),
        _Reviews(r: r, onPosted: () => setState(_load)),
      ],
    );
  }

  void _pickSection(BuildContext context, List<Map<String, dynamic>> sections) {
    final t = context.read<AppState>().t;
    showEmberPopup(
      context,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(26, 32, 26, 20),
            child: Row(
              children: [
                const Icon(Icons.menu_book, size: 42),
                const SizedBox(width: 14),
                Text(t('menu'), style: Ember.text(30, weight: FontWeight.w600)),
              ],
            ),
          ),
          for (final s in [
            <String, dynamic>{'id': 'all', 'name': t('all_dishes')},
            ...sections,
          ])
            InkWell(
              onTap: () {
                setState(() => _section = s['id']);
                Navigator.pop(context);
              },
              child: Container(
                color: _section == s['id'] ? Ember.navy : null,
                padding: const EdgeInsets.symmetric(
                  horizontal: 26,
                  vertical: 18,
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
          const SizedBox(height: 16),
        ],
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

class _Hero extends StatelessWidget {
  final Map<String, dynamic> r;
  const _Hero({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final badges = [
      (
        Icons.assignment_turned_in_outlined,
        app.t('min_order_badge', {'amount': app.price(numOf(r['min_order']))}),
      ),
      (
        Icons.pedal_bike,
        app.t('delivery_in_badge', {'time': r['delivery_time']}),
      ),
    ];
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE2E2E2),
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(42, 42, 42, 0),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(Ember.radius),
                  child: AspectRatio(
                    aspectRatio: 228 / 142,
                    child: NetImage(r['hero_image_url'] ?? r['cover_url']),
                  ),
                ),
                Positioned(
                  left: -12,
                  bottom: -8,
                  child: Container(
                    width: 58,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(Ember.radius),
                      boxShadow: Ember.softShadow,
                    ),
                    child: Column(
                      children: [
                        Text(
                          numOf(r['rating']).toStringAsFixed(1),
                          style: Ember.text(22, height: 1),
                        ),
                        Stars(numOf(r['rating']), size: 9),
                        Text(
                          app.t('reviews_n', {'count': r['review_count'] ?? 0}),
                          textAlign: TextAlign.center,
                          style: Ember.text(7, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 34),
          Align(
            alignment: Alignment.centerLeft,
            child: Container(
              constraints: const BoxConstraints(minHeight: 61),
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 8),
              decoration: BoxDecoration(
                color: r['open_now'] == true ? Ember.orange : Ember.navy,
                borderRadius: const BorderRadius.horizontal(
                  right: Radius.circular(Ember.radius),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.schedule, color: Colors.white, size: 28),
                  const SizedBox(width: 12),
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
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 44, 16, 30),
            child: Column(
              children: [
                if ('${r['tagline'] ?? ''}'.isNotEmpty)
                  Text(
                    '${r['tagline']}',
                    textAlign: TextAlign.center,
                    style: Ember.text(13),
                  ),
                Text(
                  '${r['name']}',
                  textAlign: TextAlign.center,
                  style: Ember.text(
                    28,
                    weight: FontWeight.w700,
                    color: Ember.navy,
                  ),
                ),
                const SizedBox(height: 12),
                for (final b in badges)
                  Container(
                    margin: const EdgeInsets.only(top: 14),
                    height: 63,
                    constraints: const BoxConstraints(maxWidth: 330),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: Ember.navy,
                      border: Border.all(color: Colors.white),
                      borderRadius: BorderRadius.circular(Ember.pill),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(b.$1, color: Colors.white, size: 30),
                        const SizedBox(width: 12),
                        Flexible(
                          child: Text(
                            b.$2,
                            style: Ember.text(
                              16,
                              weight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  final Map<String, dynamic> offer, restaurant;
  const _OfferCard({required this.offer, required this.restaurant});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return GestureDetector(
      onTap: () {
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
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(Ember.radius),
        child: AspectRatio(
          aspectRatio: 496 / 325,
          child: Stack(
            fit: StackFit.expand,
            children: [
              NetImage(offer['image_url']),
              const DecoratedBox(
                decoration: BoxDecoration(gradient: Ember.dealGradient),
              ),
              Positioned(
                left: 20,
                top: 0,
                child: DiscountBadge(
                  offer['discount_percent'],
                  width: 70,
                  height: 66,
                  font: 18,
                ),
              ),
              Positioned(
                left: 22,
                right: 90,
                bottom: 26,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      app.t('special_offer'),
                      style: Ember.text(
                        15,
                        weight: FontWeight.w500,
                        color: Ember.orange,
                      ),
                    ),
                    Text(
                      '${offer['title']}',
                      style: Ember.text(
                        22,
                        weight: FontWeight.w700,
                        color: Colors.white,
                        height: 1.15,
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 90,
                  height: 82,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(45),
                    ),
                  ),
                  child: const Center(
                    child: CircleAvatar(
                      radius: 19,
                      backgroundColor: Ember.navy,
                      child: Icon(Icons.add, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoBlock extends StatelessWidget {
  final Map<String, dynamic> r;
  const _InfoBlock({required this.r});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final hours = r['hours'] is List ? List.from(r['hours']) : null;
    Widget hoursList(Color color) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hours == null)
          Text(t('hours_not_set'), style: Ember.text(14, color: color)),
        if (hours != null)
          for (var i = 0; i < 7; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text.rich(
                TextSpan(
                  style: Ember.text(14, color: color),
                  children: [
                    TextSpan(
                      text: '${t(_days[i])}: ',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(
                      text: hours[i] == null
                          ? t('closed_now')
                          : '${hours[i][0]}–${hours[i][1]}',
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
    Widget title(IconData icon, String text, Color color) => Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Row(
        children: [
          Icon(icon, size: 34, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Ember.text(22, weight: FontWeight.w700, color: color),
            ),
          ),
        ],
      ),
    );

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFBFBFB),
        borderRadius: BorderRadius.circular(Ember.radius),
        boxShadow: Ember.cardShadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                title(
                  Icons.local_shipping_outlined,
                  t('delivery_information'),
                  Colors.black,
                ),
                hoursList(Colors.black),
                Text.rich(
                  TextSpan(
                    style: Ember.text(14),
                    children: [
                      TextSpan(
                        text: '${t('estimated_delivery_time')}: ',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      TextSpan(text: '${r['delivery_time']} ${t('min_short')}'),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                title(
                  Icons.phone_in_talk_outlined,
                  t('contact_information'),
                  Colors.black,
                ),
                Text(t('allergy_note'), style: Ember.text(14, height: 1.8)),
                if ('${r['phone'] ?? ''}'.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(
                    t('phone_number'),
                    style: Ember.text(14, weight: FontWeight.w700),
                  ),
                  Text('${r['phone']}', style: Ember.text(18)),
                ],
                if ('${r['address'] ?? ''}'.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Text(
                    t('restaurant_address'),
                    style: Ember.text(14, weight: FontWeight.w700),
                  ),
                  Text('${r['address']}', style: Ember.text(16)),
                ],
              ],
            ),
          ),
          Container(
            color: Ember.navy,
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                title(
                  Icons.event_available,
                  t('operational_times'),
                  Colors.white,
                ),
                hoursList(Colors.white),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Reviews extends StatefulWidget {
  final Map<String, dynamic> r;
  final VoidCallback onPosted;
  const _Reviews({required this.r, required this.onPosted});
  @override
  State<_Reviews> createState() => _ReviewsState();
}

class _ReviewsState extends State<_Reviews> {
  int _page = 0;

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
                      icon: Icon(
                        Icons.star_rounded,
                        size: 34,
                        color: s <= rating ? Ember.orange : Ember.gray,
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

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final reviews = List<Map<String, dynamic>>.from(
      (widget.r['reviews'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    final pages = (reviews.length / 3).ceil().clamp(1, 999);
    final shown = reviews.skip(_page * 3).take(3).toList();
    Widget arrow(IconData i, VoidCallback f, String tip) => IconButton.filled(
      onPressed: f,
      icon: Icon(i, color: Ember.navy),
      tooltip: tip,
      style: IconButton.styleFrom(
        backgroundColor: Ember.orange,
        fixedSize: const Size(52, 52),
      ),
    );
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 32, 16, 32),
      decoration: BoxDecoration(
        color: Ember.gray,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  app.t('customer_reviews'),
                  style: Ember.text(24, weight: FontWeight.w700),
                ),
              ),
              arrow(
                Icons.chevron_left,
                () => setState(() => _page = (_page - 1 + pages) % pages),
                app.t('previous'),
              ),
              const SizedBox(width: 8),
              arrow(
                Icons.chevron_right,
                () => setState(() => _page = (_page + 1) % pages),
                app.t('next'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          if (shown.isEmpty)
            Text(
              app.t('no_reviews'),
              style: Ember.text(15, color: Colors.black54),
            ),
          for (final rev in shown)
            Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Ember.radius),
                boxShadow: Ember.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Ember.navy,
                        child: Text(
                          '${rev['avatar_letter'] ?? '${rev['author_name']}'.characters.first}',
                          style: Ember.text(
                            16,
                            weight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${rev['author_name']}',
                          style: Ember.text(16, weight: FontWeight.w600),
                        ),
                      ),
                      Stars(numOf(rev['rating'])),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('${rev['comment']}', style: Ember.text(14, height: 1.7)),
                ],
              ),
            ),
          const SizedBox(height: 8),
          OrangeButton(
            app.isLoggedIn ? app.t('write_review') : app.t('login_to_review'),
            onPressed: _write,
            height: 48,
          ),
        ],
      ),
    );
  }
}
