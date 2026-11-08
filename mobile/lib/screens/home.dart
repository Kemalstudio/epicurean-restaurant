import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import '../widgets/footer.dart';
import '../widgets/join.dart';
import 'auth.dart';
import 'restaurant.dart';
import 'restaurants.dart';
import 'shell.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<Map<String, dynamic>>? _future;
  String _lang = '';
  String _filter = 'all';

  void _load() => _future = Api.instance.home();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final lang = context.watch<AppState>().lang;
    if (lang != _lang) {
      _lang =
          lang; // names come translated from the server — reload on language change
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    // Kit "Mobile Home" (430 wide): cards sit 11–21px from the screen edge;
    // the categories band and the footer run edge to edge.
    Widget pad(Widget child, [double h = 11]) => Padding(
      padding: EdgeInsets.symmetric(horizontal: h),
      child: child,
    );
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        final data = snap.data;
        return EmberScaffold(
          padding: const EdgeInsets.only(top: 10),
          onRefresh: () async => setState(_load),
          children: [
            pad(const _Hero()),
            const SizedBox(height: 29),
            if (snap.hasError)
              pad(
                ErrorState(error: snap.error!, onRetry: () => setState(_load)),
              )
            else if (data == null)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: EmberLottie(EmberAnim.loader, size: 72)),
              )
            else ...[
              _deals(context, data),
              const SizedBox(height: 23),
              _categories(context, data),
              const SizedBox(height: 29),
              RestaurantStrip(
                title: t('popular_restaurants'),
                items: List<Map<String, dynamic>>.from(
                  (data['popular'] as List).map(
                    (e) => Map<String, dynamic>.from(e),
                  ),
                ),
                onTap: (r) => go(context, RestaurantScreen(slug: r['slug'])),
              ),
            ],
            const SizedBox(height: 39),
            pad(const _AppPromo(), 21),
            const SizedBox(height: 54),
            pad(
              _JoinCard(
                image: 'partner.jpg',
                angle: 231.6,
                tab: t('partner_tab_label'),
                kicker: t('partner_kicker'),
                title: t('partner_title'),
                partner: true,
              ),
              21,
            ),
            const SizedBox(height: 30),
            pad(
              _JoinCard(
                image: 'rider.jpg',
                angle: 231.3,
                tab: t('rider_tab_label'),
                kicker: t('rider_kicker'),
                title: t('rider_title'),
                partner: false,
              ),
              21,
            ),
            const SizedBox(height: 45),
            const _KnowMore(),
            if (data != null && data['stats'] is Map) ...[
              const SizedBox(height: 36),
              pad(_stats(app, Map<String, dynamic>.from(data['stats'])), 13),
            ],
            const SizedBox(height: 63),
            const KitFooter(),
          ],
        );
      },
    );
  }

  Widget _deals(BuildContext context, Map<String, dynamic> data) {
    final app = context.read<AppState>();
    final deals = List<Map<String, dynamic>>.from(
      (data['deals'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    if (deals.isEmpty) return const SizedBox.shrink();
    final cuisines = <String, String>{};
    for (final d in deals) {
      for (final c in d['cuisines'] as List) {
        cuisines[c['slug']] = c['name'];
      }
    }
    final shown = _filter == 'all'
        ? deals
        : deals
              .where(
                (d) => (d['cuisines'] as List).any((c) => c['slug'] == _filter),
              )
              .toList();
    final max = deals
        .map((d) => numOf(d['discount_percent']))
        .fold(0.0, (a, b) => a > b ? a : b);
    final options = {'all': app.t('filter_all'), ...cuisines};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 21, right: 21),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  '${app.t('deals_title', {'percent': max.toInt()})} ${app.t('discount_offers')} 🎊',
                  style: Ember.text(16, weight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 8),
              // Kit filter pill 132 x 38: navy outline, small round arrow, 10pt text
              PopupMenuButton<String>(
                tooltip: app.t('filter_by_cuisine'),
                onSelected: (v) => setState(() => _filter = v),
                itemBuilder: (_) => [
                  for (final e in options.entries)
                    PopupMenuItem(
                      value: e.key,
                      child: Text(e.value, style: Ember.text(14)),
                    ),
                ],
                child: Container(
                  height: 38,
                  constraints: const BoxConstraints(
                    minWidth: 132,
                    maxWidth: 170,
                  ),
                  padding: const EdgeInsets.only(left: 9, right: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Ember.navy),
                    borderRadius: BorderRadius.circular(Ember.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const RotatedBox(
                        quarterTurns: 1,
                        child: KitImage('next', size: 18),
                      ),
                      const SizedBox(width: 7),
                      Flexible(
                        child: Text(
                          options[_filter] ?? options['all']!,
                          overflow: TextOverflow.ellipsis,
                          style: Ember.text(10),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 23),
        SizedBox(
          // 150 photo + 10 gap + caption (one 13pt line, two 14pt lines),
          // grown with the system font scale.
          height:
              166 +
              MediaQuery.textScalerOf(context).scale(13) * 1.5 +
              MediaQuery.textScalerOf(context).scale(17) * 2,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 11),
            scrollDirection: Axis.horizontal,
            itemCount: shown.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (_, i) => DealCardSmall(
              shown[i],
              onTap: () =>
                  go(context, RestaurantScreen(slug: shown[i]['slug'])),
            ),
          ),
        ),
      ],
    );
  }

  Widget _categories(BuildContext context, Map<String, dynamic> data) {
    final app = context.read<AppState>();
    final list = List<Map<String, dynamic>>.from(
      (data['cuisines'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    // Kit: light gray band across the whole screen, 189 x 211 tiles, 20px apart
    return Container(
      width: double.infinity,
      color: Ember.band,
      padding: const EdgeInsets.fromLTRB(14, 28, 14, 44),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 7),
            child: Text(
              app.t('popular_categories_title'),
              style: Ember.text(16, weight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 29),
          GridView.builder(
            padding: EdgeInsets.zero,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 20,
              mainAxisSpacing: 26,
              childAspectRatio: 189 / 211,
            ),
            itemCount: list.length,
            itemBuilder: (_, i) => CuisineTile(
              list[i],
              onTap: () => go(
                context,
                RestaurantsScreen(
                  cuisine: list[i]['slug'],
                  title: list[i]['name'],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stats(AppState app, Map<String, dynamic> s) {
    final items = [
      (s['riders'], app.t('stat_riders')),
      (s['orders_delivered'], app.t('stat_orders')),
      (s['restaurants'], app.t('stat_restaurants')),
      (s['food_items'], app.t('stat_food')),
    ].where((e) => numOf(e.$1) > 0).toList();
    if (items.isEmpty) return const SizedBox.shrink();
    // 789900 -> 789,900 (kit)
    String fmt(dynamic v) => numOf(v).toInt().toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
    // Kit: 406 wide orange card, one column, light 64pt numbers,
    // bold 24pt labels, thin 194px lines between
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 78, 16, 60),
      decoration: BoxDecoration(
        color: Ember.orange,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              Container(
                width: 194,
                height: 1,
                margin: const EdgeInsets.only(top: 38, bottom: 44),
                color: Ember.gray,
              ),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                '${fmt(items[i].$1)}+',
                style: Ember.text(
                  64,
                  weight: FontWeight.w300,
                  color: Colors.white,
                  height: 1,
                ),
              ),
            ),
            Text(
              items[i].$2,
              textAlign: TextAlign.center,
              style: Ember.text(
                24,
                weight: FontWeight.w700,
                color: Colors.white,
                height: 1.2,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Hero extends StatefulWidget {
  const _Hero();
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  late final TextEditingController _ctrl = TextEditingController(
    text: context.read<AppState>().address,
  );
  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _search() {
    final app = context.read<AppState>();
    final v = _ctrl.text.trim();
    if (v.isNotEmpty) app.setAddress(v);
    go(context, RestaurantsScreen(area: v.isEmpty ? null : v));
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    // Kit: navy 403 x 283 card, radius 12
    return Container(
      constraints: const BoxConstraints(minHeight: 283),
      padding: const EdgeInsets.fromLTRB(20, 33, 20, 43),
      decoration: BoxDecoration(
        color: Ember.navy,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        children: [
          Text(
            t('hero_kicker'),
            textAlign: TextAlign.center,
            style: Ember.text(12, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(text: '${t('hero_title_1')}\n'),
                TextSpan(
                  text: t('hero_title_2'),
                  style: const TextStyle(color: Ember.orange),
                ),
              ],
            ),
            textAlign: TextAlign.center,
            style: Ember.text(
              34,
              weight: FontWeight.w600,
              color: Colors.white,
              height: 36 / 34,
            ),
          ),
          const SizedBox(height: 11),
          Text(
            t('hero_search_label'),
            textAlign: TextAlign.center,
            style: Ember.text(13, color: Colors.white),
          ),
          const SizedBox(height: 16),
          // Kit: 293 x 57 white pill, the 57px orange round button overlaps its end
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 300),
            child: Stack(
              alignment: Alignment.centerRight,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 7),
                  child: SizedBox(
                    height: 57,
                    child: TextField(
                      controller: _ctrl,
                      onSubmitted: (_) => _search(),
                      textInputAction: TextInputAction.search,
                      style: Ember.text(15),
                      decoration: InputDecoration(
                        hintText: t('hero_search_placeholder'),
                        hintStyle: Ember.text(15, color: Colors.black87),
                        fillColor: Colors.white,
                        filled: true,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Ember.pill),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Ember.pill),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.fromLTRB(
                          30,
                          18,
                          62,
                          18,
                        ),
                      ),
                    ),
                  ),
                ),
                Semantics(
                  button: true,
                  label: t('search'),
                  child: Material(
                    color: Ember.orange,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: _search,
                      child: const SizedBox(
                        width: 57,
                        height: 57,
                        child: Center(child: KitImage('next', size: 34)),
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
}

/// Kit "Ember-ing is more Personalised & Instant": gray gradient card with
/// the store badges and the couple photo standing on its bottom edge.
class _AppPromo extends StatelessWidget {
  const _AppPromo();
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final title = Ember.text(
      32,
      weight: FontWeight.w700,
      color: Ember.navy,
    ).copyWith(letterSpacing: -1.92);
    return ClipRRect(
      borderRadius: BorderRadius.circular(Ember.radius),
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFEEEEEE), Color(0xFFE0E1DC)],
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 57),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Wrap(
                alignment: WrapAlignment.center,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 10,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: EmberLogo(height: 30),
                  ),
                  Text(t('app_title_rest'), style: title),
                ],
              ),
            ),
            const SizedBox(height: 2),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: t('app_personalised'),
                    style: const TextStyle(
                      color: Ember.orange,
                      decoration: TextDecoration.underline,
                      decorationColor: Ember.orange,
                    ),
                  ),
                  TextSpan(text: ' ${t('app_instant')}'),
                ],
              ),
              textAlign: TextAlign.center,
              style: Ember.text(
                24,
                weight: FontWeight.w500,
                color: Ember.navy,
              ).copyWith(letterSpacing: -1.44),
            ),
            const SizedBox(height: 13),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                t('app_download'),
                textAlign: TextAlign.center,
                style: Ember.text(16).copyWith(letterSpacing: -0.96),
              ),
            ),
            const SizedBox(height: 30),
            const StoreBadges(),
            const SizedBox(height: 17),
            SizedBox(
              height: 256,
              width: 340,
              child: Stack(
                children: [
                  const Positioned(
                    left: 0,
                    top: 0,
                    width: 322,
                    height: 253,
                    child: Opacity(
                      opacity: 0.2,
                      child: KitImage('friends_shadow.webp', fit: BoxFit.cover),
                    ),
                  ),
                  const Positioned(
                    left: 9,
                    top: 3,
                    width: 322,
                    height: 253,
                    child: KitImage('friends.webp', fit: BoxFit.cover),
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

/// Kit "Partner with us" / "Ride with us" card: 391 x 223 photo (radius 4),
/// white tab on top, orange kicker, white title and a small "Get Started" pill.
class _JoinCard extends StatelessWidget {
  final String image, tab, kicker, title;
  final double angle;
  final bool partner;
  const _JoinCard({
    required this.image,
    required this.angle,
    required this.tab,
    required this.kicker,
    required this.title,
    required this.partner,
  });
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    void open() => showJoinForm(
      context,
      partner: partner,
      onLogin: () => go(context, const LoginScreen()),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: SizedBox(
        height: 223,
        child: Stack(
          fit: StackFit.expand,
          children: [
            KitImage(image, fit: BoxFit.cover),
            DecoratedBox(
              decoration: BoxDecoration(gradient: kitPhotoGradient(angle)),
            ),
            Positioned(
              left: 36,
              top: 0,
              child: Container(
                height: 33,
                constraints: const BoxConstraints(minWidth: 191),
                padding: const EdgeInsets.symmetric(horizontal: 11),
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(4),
                  ),
                ),
                child: Text(
                  tab,
                  style: Ember.text(
                    13,
                    weight: FontWeight.w700,
                    color: Ember.navy,
                  ),
                ),
              ),
            ),
            Positioned(
              left: 36,
              right: 20,
              bottom: 23,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    kicker,
                    style: Ember.text(
                      16,
                      weight: FontWeight.w500,
                      color: Ember.orange,
                      height: 1.3,
                    ),
                  ),
                  Text(
                    title,
                    style: Ember.text(
                      24,
                      weight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Material(
                    color: Ember.orange,
                    shape: const StadiumBorder(),
                    child: InkWell(
                      customBorder: const StadiumBorder(),
                      onTap: open,
                      child: Container(
                        height: 29,
                        constraints: const BoxConstraints(minWidth: 119),
                        padding: const EdgeInsets.symmetric(horizontal: 22),
                        child: Center(
                          widthFactor: 1,
                          child: Text(
                            t('get_started'),
                            style: Ember.text(
                              11,
                              weight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                        ),
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

/// Kit "Know more about us!": questions on white (the open one is an orange
/// pill), the answer in a navy block below — "How does it work?" shows the
/// three gray step cards with the kit illustrations.
class _KnowMore extends StatefulWidget {
  const _KnowMore();
  @override
  State<_KnowMore> createState() => _KnowMoreState();
}

class _KnowMoreState extends State<_KnowMore> {
  String _open = 'q_how';
  static const _qs = ['q_how', 'q_payment', 'q_track', 'q_discounts', 'q_area'];
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final q18 = Ember.text(
      18,
      weight: FontWeight.w700,
      color: Ember.navy,
    ).copyWith(letterSpacing: -0.36);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            t('know_more_title'),
            textAlign: TextAlign.center,
            style: Ember.text(26, weight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 46),
        for (final q in _qs)
          Padding(
            padding: EdgeInsets.fromLTRB(
              39,
              _open == q && q != _qs.first ? 9 : 0,
              45,
              _open == q ? 18 : 0,
            ),
            child: Semantics(
              selected: _open == q,
              child: Material(
                color: _open == q ? Ember.orange : Colors.transparent,
                shape: const StadiumBorder(),
                child: InkWell(
                  customBorder: const StadiumBorder(),
                  onTap: () => setState(() => _open = q),
                  child: Container(
                    constraints: BoxConstraints(
                      minHeight: _open == q ? 62 : 61,
                    ),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    child: Text(
                      t(q),
                      textAlign: TextAlign.center,
                      style: _open == q
                          ? q18.copyWith(color: Colors.black)
                          : q18,
                    ),
                  ),
                ),
              ),
            ),
          ),
        const SizedBox(height: 53),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 13),
          padding: const EdgeInsets.fromLTRB(20, 62, 20, 43),
          decoration: BoxDecoration(
            color: Ember.navy,
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          child: _open == 'q_how' ? _steps(t) : _answer(t, _open),
        ),
      ],
    );
  }

  Widget _steps(String Function(String, [Map<String, Object?>]) t) => Column(
    children: [
      for (final s in const [
        ('step_place_title', 'step_place_text', 'step_order', 128.0),
        ('step_track_title', 'step_track_text', 'step_track', 115.0),
        ('step_get_title', 'step_get_text', 'step_get', 128.0),
      ])
        Container(
          width: 238,
          constraints: const BoxConstraints(minHeight: 285),
          margin: const EdgeInsets.only(bottom: 34),
          padding: const EdgeInsets.fromLTRB(16, 31, 16, 22),
          decoration: BoxDecoration(
            color: Ember.gray,
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          child: Column(
            children: [
              Text(
                t(s.$1),
                textAlign: TextAlign.center,
                style: Ember.text(
                  18,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ).copyWith(letterSpacing: -0.36),
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 128,
                child: Center(child: KitImage(s.$3, size: s.$4)),
              ),
              const SizedBox(height: 5),
              Text(
                t(s.$2),
                textAlign: TextAlign.center,
                style: Ember.text(
                  16,
                  weight: FontWeight.w500,
                  height: 25 / 16,
                ).copyWith(letterSpacing: -0.32),
              ),
            ],
          ),
        ),
      const SizedBox(height: 2),
      Text(
        t('how_summary'),
        textAlign: TextAlign.center,
        style: Ember.text(
          16,
          color: Colors.white,
        ).copyWith(letterSpacing: -0.32),
      ),
    ],
  );

  Widget _answer(String Function(String, [Map<String, Object?>]) t, String q) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t(q),
            textAlign: TextAlign.center,
            style: Ember.text(20, weight: FontWeight.w700, color: Ember.orange),
          ),
          const SizedBox(height: 14),
          Text(
            t('${q}_a'),
            textAlign: TextAlign.center,
            style: Ember.text(16, color: Colors.white, height: 1.6),
          ),
        ],
      );
}

/// Shared retry box for other screens.
Widget errorBox(Object error, VoidCallback onRetry) =>
    ErrorState(error: error, onRetry: onRetry);
