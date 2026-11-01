import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
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
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        final data = snap.data;
        return EmberScaffold(
          onRefresh: () async => setState(_load),
          children: [
            const _Hero(),
            const SizedBox(height: 28),
            if (snap.hasError)
              ErrorState(error: snap.error!, onRetry: () => setState(_load))
            else if (data == null)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: EmberLottie(EmberAnim.loader, size: 72)),
              )
            else ...[
              _deals(context, data),
              const SizedBox(height: 28),
              _categories(context, data),
              const SizedBox(height: 28),
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
              SizedBox(
                height: 172,
                child: ListView.separated(
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
              const SizedBox(height: 32),
              const _KnowMore(),
              const SizedBox(height: 28),
              _stats(app, Map<String, dynamic>.from(data['stats'])),
            ],
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '${app.t('deals_title', {'percent': max.toInt()})} 🎊',
                style: Ember.text(16, weight: FontWeight.w700),
              ),
            ),
            Container(
              height: 38,
              padding: const EdgeInsets.only(left: 8, right: 4),
              decoration: BoxDecoration(
                border: Border.all(color: Ember.navy),
                borderRadius: BorderRadius.circular(Ember.pill),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _filter,
                  icon: const Icon(
                    Icons.expand_circle_down,
                    color: Ember.navy,
                    size: 18,
                  ),
                  style: Ember.text(11, color: Colors.black),
                  onChanged: (v) => setState(() => _filter = v ?? 'all'),
                  items: [
                    DropdownMenuItem(
                      value: 'all',
                      child: Text(app.t('filter_all')),
                    ),
                    for (final e in cuisines.entries)
                      DropdownMenuItem(value: e.key, child: Text(e.value)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        SizedBox(
          height: 220,
          child: ListView.separated(
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
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 28, 12, 28),
      decoration: BoxDecoration(
        color: Ember.section,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            app.t('popular_categories_title'),
            style: Ember.text(16, weight: FontWeight.w700),
          ),
          const SizedBox(height: 22),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 11,
              mainAxisSpacing: 11,
              childAspectRatio: 0.86,
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
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: Ember.orange,
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceEvenly,
        runSpacing: 18,
        children: [
          for (final e in items)
            SizedBox(
              width: 160,
              child: Column(
                children: [
                  Text(
                    '${e.$1}+',
                    style: Ember.text(
                      40,
                      weight: FontWeight.w300,
                      color: Colors.white,
                      height: 1,
                    ),
                  ),
                  Text(
                    e.$2,
                    textAlign: TextAlign.center,
                    style: Ember.text(
                      15,
                      weight: FontWeight.w700,
                      color: Colors.white,
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
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 32, 16, 24),
      decoration: BoxDecoration(
        color: Ember.gray.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(Ember.radius),
      ),
      child: Column(
        children: [
          Text(
            t('know_more_title'),
            textAlign: TextAlign.center,
            style: Ember.text(26, weight: FontWeight.w700),
          ),
          const SizedBox(height: 20),
          for (final q in _qs) ...[
            InkWell(
              onTap: () => setState(() => _open = _open == q ? '' : q),
              borderRadius: BorderRadius.circular(Ember.pill),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: _open == q ? Ember.orange : Colors.transparent,
                  borderRadius: BorderRadius.circular(Ember.pill),
                ),
                child: Text(
                  t(q),
                  textAlign: TextAlign.center,
                  style: Ember.text(17, weight: FontWeight.w700),
                ),
              ),
            ),
            if (_open == q)
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
                child: q == 'q_how'
                    ? Column(
                        children: [
                          for (final s in const [
                            (
                              'step_place_title',
                              'step_place_text',
                              Icons.shopping_bag_outlined,
                              Ember.orange,
                            ),
                            (
                              'step_track_title',
                              'step_track_text',
                              Icons.pedal_bike,
                              Ember.navy,
                            ),
                            (
                              'step_get_title',
                              'step_get_text',
                              Icons.inventory_2_outlined,
                              Ember.green,
                            ),
                          ])
                            Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: Ember.gray,
                                borderRadius: BorderRadius.circular(
                                  Ember.radius,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(s.$3, size: 48, color: s.$4),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          t(s.$1),
                                          style: Ember.text(
                                            16,
                                            weight: FontWeight.w700,
                                            color: Ember.navy,
                                          ),
                                        ),
                                        Text(
                                          t(s.$2),
                                          style: Ember.text(
                                            14,
                                            weight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      )
                    : Text(
                        t('${q}_a'),
                        textAlign: TextAlign.center,
                        style: Ember.text(15, height: 1.5),
                      ),
              ),
          ],
        ],
      ),
    );
  }
}

/// Shared retry box for other screens.
Widget errorBox(Object error, VoidCallback onRetry) =>
    ErrorState(error: error, onRetry: onRetry);
