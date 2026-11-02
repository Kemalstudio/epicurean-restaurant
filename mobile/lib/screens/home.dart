import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
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
    // Kit "Mobile Home": cards sit 11px from the screen edge, section titles 21px;
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
            const SizedBox(height: 22),
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
              pad(
                SectionTitle(
                  t('popular_restaurants'),
                  trailing: TextButton(
                    onPressed: () => go(context, const RestaurantsScreen()),
                    child: Text(
                      t('see_all'),
                      style: Ember.text(
                        14,
                        weight: FontWeight.w600,
                        color: Ember.orange,
                      ),
                    ),
                  ),
                ),
                21,
              ),
              SizedBox(
                height: 156,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 21),
                  scrollDirection: Axis.horizontal,
                  itemCount: (data['popular'] as List).length,
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (_, i) {
                    final r = Map<String, dynamic>.from(data['popular'][i]);
                    return RestaurantTile(
                      r,
                      onTap: () =>
                          go(context, RestaurantScreen(slug: r['slug'])),
                    );
                  },
                ),
              ),
            ],
            const SizedBox(height: 40),
            pad(
              _JoinCard(
                image: '/img/1600565193348-f74bd3c7ccdf-1200.webp',
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
                image: '/img/1617347454431-f49d7ff5c3b1-1200.webp',
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
            const SizedBox(height: 40),
            const _Footer(),
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
          padding: const EdgeInsets.symmetric(horizontal: 21),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  '${app.t('deals_title', {'percent': max.toInt()})} 🎊',
                  style: Ember.text(16, weight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 8),
              // Kit filter pill: round arrow on the left, small text
              PopupMenuButton<String>(
                tooltip: app.t('filter_all'),
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
                    minWidth: 110,
                    maxWidth: 170,
                  ),
                  padding: const EdgeInsets.only(left: 10, right: 14),
                  decoration: BoxDecoration(
                    border: Border.all(color: Ember.navy),
                    borderRadius: BorderRadius.circular(Ember.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.expand_circle_down,
                        color: Ember.navy,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          options[_filter] ?? options['all']!,
                          overflow: TextOverflow.ellipsis,
                          style: Ember.text(11, color: Colors.black),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        SizedBox(
          // 150 photo + 10 gap + caption (one 13pt line, two 14pt lines),
          // grown with the system font scale.
          height:
              164 +
              MediaQuery.textScalerOf(context).scale(13) * 1.5 +
              MediaQuery.textScalerOf(context).scale(14) * 1.2 * 2,
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
      color: const Color(0xFFEBEBEB),
      padding: const EdgeInsets.fromLTRB(14, 28, 14, 39),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 7),
            child: Text(
              app.t('popular_categories_title'),
              style: Ember.text(16, weight: FontWeight.w600),
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
    // Kit: one column, big light numbers, thin lines between
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 70, 24, 70),
      decoration: BoxDecoration(
        color: Ember.orange,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              Container(
                width: 193,
                height: 1,
                margin: const EdgeInsets.symmetric(vertical: 40),
                color: Colors.white.withValues(alpha: 0.6),
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
            const SizedBox(height: 6),
            Text(
              items[i].$2,
              textAlign: TextAlign.center,
              style: Ember.text(
                22,
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
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 36),
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
          const SizedBox(height: 10),
          Text(
            t('hero_title_1'),
            textAlign: TextAlign.center,
            style: Ember.text(
              32,
              weight: FontWeight.w600,
              color: Colors.white,
              height: 1.1,
            ),
          ),
          Text(
            t('hero_title_2'),
            textAlign: TextAlign.center,
            style: Ember.text(
              32,
              weight: FontWeight.w600,
              color: Ember.orange,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            t('hero_search_label'),
            textAlign: TextAlign.center,
            style: Ember.text(13, color: Colors.white),
          ),
          const SizedBox(height: 18),
          Stack(
            alignment: Alignment.centerRight,
            children: [
              TextField(
                controller: _ctrl,
                onSubmitted: (_) => _search(),
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: t('hero_search_placeholder'),
                  fillColor: Colors.white,
                  // kit: plain white pill, no outline
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Ember.pill),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.fromLTRB(28, 18, 70, 18),
                ),
              ),
              Material(
                color: Ember.orange,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: _search,
                  child: SizedBox(
                    width: 57,
                    height: 57,
                    child: Center(
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Ember.navy, width: 2),
                        ),
                        child: const Icon(
                          Icons.chevron_right,
                          color: Ember.navy,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Kit "Partner with us" / "Ride with us" card: photo, white tab on top,
/// orange kicker, white title and a small orange "Get Started" pill.
class _JoinCard extends StatelessWidget {
  final String image, tab, kicker, title;
  final bool partner;
  const _JoinCard({
    required this.image,
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
      borderRadius: BorderRadius.circular(Ember.radius),
      child: SizedBox(
        height: 223,
        child: Stack(
          fit: StackFit.expand,
          children: [
            NetImage(image),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [Color(0x0003081F), Color(0xCC03081F)],
                ),
              ),
            ),
            Positioned(
              left: 36,
              top: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 7,
                ),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(Ember.radius),
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
              bottom: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    kicker,
                    style: Ember.text(
                      15,
                      weight: FontWeight.w500,
                      color: Ember.orange,
                    ),
                  ),
                  Text(
                    title,
                    style: Ember.text(
                      24,
                      weight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Material(
                    color: Ember.orange,
                    shape: const StadiumBorder(),
                    child: InkWell(
                      customBorder: const StadiumBorder(),
                      onTap: open,
                      child: Container(
                        height: 40,
                        padding: const EdgeInsets.symmetric(horizontal: 26),
                        // widthFactor 1: the pill is as wide as its label (kit)
                        child: Center(
                          widthFactor: 1,
                          child: Text(
                            t('get_started'),
                            style: Ember.text(
                              13,
                              weight: FontWeight.w600,
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

/// Kit "Know more about us!": questions on white (the open one is an orange pill),
/// the answer in a navy block below — "How does it work?" shows the three step cards.
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
        const SizedBox(height: 40),
        for (final q in _qs)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 39),
            child: Semantics(
              selected: _open == q,
              child: Material(
                color: _open == q ? Ember.orange : Colors.transparent,
                shape: const StadiumBorder(),
                child: InkWell(
                  customBorder: const StadiumBorder(),
                  onTap: () => setState(() => _open = q),
                  child: Container(
                    constraints: const BoxConstraints(minHeight: 62),
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                    child: Text(
                      t(q),
                      textAlign: TextAlign.center,
                      style: Ember.text(
                        _open == q ? 17 : 16,
                        weight: FontWeight.w700,
                        color: Ember.navy,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        const SizedBox(height: 30),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 13),
          padding: const EdgeInsets.fromLTRB(20, 62, 20, 44),
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
        (
          'step_place_title',
          'step_place_text',
          Icons.shopping_bag_outlined,
          Ember.orange,
        ),
        ('step_track_title', 'step_track_text', Icons.pedal_bike, Ember.navy),
        (
          'step_get_title',
          'step_get_text',
          Icons.inventory_2_outlined,
          Ember.green,
        ),
      ])
        Container(
          width: 238,
          margin: const EdgeInsets.only(bottom: 34),
          padding: const EdgeInsets.fromLTRB(18, 30, 18, 26),
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
                  17,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
              const SizedBox(height: 18),
              Icon(s.$3, size: 96, color: s.$4),
              const SizedBox(height: 18),
              Text(
                t(s.$2),
                textAlign: TextAlign.center,
                style: Ember.text(15, weight: FontWeight.w500, height: 1.5),
              ),
            ],
          ),
        ),
      Text(
        t('how_summary'),
        textAlign: TextAlign.center,
        style: Ember.text(15, color: Colors.white, height: 1.6),
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
            style: Ember.text(15, color: Colors.white, height: 1.6),
          ),
        ],
      );
}

/// Kit footer: gray band with the logo, deals-by-email form, then the navy copyright bar.
class _Footer extends StatefulWidget {
  const _Footer();
  @override
  State<_Footer> createState() => _FooterState();
}

class _FooterState extends State<_Footer> {
  final _email = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _subscribe() async {
    final t = context.read<AppState>().t;
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      showMessage(context, t('invalid_email'), error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      await Api.instance.subscribe(email);
      _email.clear();
      if (mounted) showMessage(context, t('subscribed'));
    } on ApiError catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: const Color(0xFFE8E8E8),
          padding: const EdgeInsets.fromLTRB(26, 56, 26, 48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(child: EmberLogo(height: 58)),
              const SizedBox(height: 22),
              Text(
                t('company_line'),
                textAlign: TextAlign.center,
                style: Ember.text(15, height: 1.5),
              ),
              const SizedBox(height: 44),
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Text(
                  t('footer_deals_title'),
                  style: Ember.text(
                    17,
                    weight: FontWeight.w700,
                    color: Ember.navy,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Container(
                height: 59,
                decoration: BoxDecoration(
                  color: Ember.gray,
                  borderRadius: BorderRadius.circular(Ember.pill),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        onSubmitted: (_) => _subscribe(),
                        style: Ember.text(15),
                        decoration: const InputDecoration(
                          hintText: 'youremail@gmail.com',
                          filled: false,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.only(left: 24),
                        ),
                      ),
                    ),
                    Material(
                      color: Ember.orange,
                      shape: const StadiumBorder(),
                      child: InkWell(
                        customBorder: const StadiumBorder(),
                        onTap: _sending ? null : _subscribe,
                        child: Container(
                          height: 59,
                          padding: const EdgeInsets.symmetric(horizontal: 26),
                          alignment: Alignment.center,
                          child: Text(
                            t('subscribe'),
                            style: Ember.text(16, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Text(
                t('no_spam'),
                textAlign: TextAlign.center,
                style: Ember.text(13, color: Ember.navy),
              ),
            ],
          ),
        ),
        Container(
          color: Ember.navy,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Text(
            '© ${DateTime.now().year} Ember. ${t('copyright')}',
            textAlign: TextAlign.center,
            style: Ember.text(15, color: Colors.white),
          ),
        ),
      ],
    );
  }
}

/// Shared retry box for other screens.
Widget errorBox(Object error, VoidCallback onRetry) =>
    ErrorState(error: error, onRetry: onRetry);
