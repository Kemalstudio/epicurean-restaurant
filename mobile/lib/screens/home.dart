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

/// Kit "Home V.1": deliver-to header, greeting, search, category chips and
/// the open restaurants list.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<Map<String, dynamic>>? _future;
  String _lang = '';
  String _category = 'all';

  void _load() => _future = Api.instance.home();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final lang = context.watch<AppState>().lang;
    if (lang != _lang) {
      _lang = lang; // names come translated from the server
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
          header: const _Top(),
          onRefresh: () async => setState(_load),
          children: [
            const SizedBox(height: 24),
            _greeting(app),
            const SizedBox(height: 16),
            SearchField(
              hint: t('search_dishes'),
              onTap: () => go(context, const RestaurantsScreen(search: true)),
            ),
            const SizedBox(height: 32),
            if (snap.hasError)
              ErrorState(error: snap.error!, onRetry: () => setState(_load))
            else if (data == null)
              const LoadingBox()
            else ...[
              SectionHeader(
                t('all_categories'),
                onSeeAll: () => go(context, const RestaurantsScreen()),
              ),
              const SizedBox(height: 20),
              _categories(data),
              const SizedBox(height: 32),
              SectionHeader(
                t('open_restaurants'),
                onSeeAll: () => go(
                  context,
                  RestaurantsScreen(
                    cuisine: _category == 'all' ? null : _category,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              ..._restaurants(data),
            ],
          ],
        );
      },
    );
  }

  Widget _greeting(AppState app) {
    final h = DateTime.now().hour;
    final part = h < 12
        ? app.t('good_morning')
        : h < 18
        ? app.t('good_afternoon')
        : app.t('good_evening');
    final name = '${app.user?['name'] ?? ''}'.split(' ').first;
    return Text.rich(
      TextSpan(
        style: Ember.text(16, color: const Color(0xFF1E1D1D)),
        children: [
          TextSpan(
            text: name.isEmpty
                ? app.t('hey_guest')
                : app.t('hey_name', {'name': name}),
          ),
          const TextSpan(text: ' '),
          TextSpan(
            text: part,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _categories(Map<String, dynamic> data) {
    final app = context.read<AppState>();
    final list = List<Map<String, dynamic>>.from(
      (data['cuisines'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    final items = [
      <String, dynamic>{'slug': 'all', 'name': app.t('filter_all')},
      ...list,
    ];
    return SizedBox(
      height: 76,
      child: ListView.separated(
        clipBehavior: Clip.none,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(bottom: 16),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, i) => _CategoryChip(
          category: items[i],
          selected: _category == items[i]['slug'],
          onTap: () => setState(() => _category = items[i]['slug']),
        ),
      ),
    );
  }

  List<Widget> _restaurants(Map<String, dynamic> data) {
    final app = context.read<AppState>();
    final all = List<Map<String, dynamic>>.from(
      (data['popular'] as List).map((e) => Map<String, dynamic>.from(e)),
    );
    final shown = _category == 'all'
        ? all
        : all
              .where(
                (r) => ((r['cuisines'] as List?) ?? []).any(
                  (c) => c['slug'] == _category,
                ),
              )
              .toList();
    if (shown.isEmpty) {
      return [
        EmptyState(
          anim: EmberAnim.notFound,
          title: app.t('no_restaurants'),
          text: app.t('no_restaurants_desc'),
        ),
      ];
    }
    return [
      for (final r in shown)
        Padding(
          padding: const EdgeInsets.only(bottom: 28),
          child: RestaurantCard(
            r,
            onTap: () => go(context, RestaurantScreen(slug: r['slug'])),
          ),
        ),
    ];
  }
}

/// Kit home top row: menu button, "DELIVER TO" + address ▾, cart.
class _Top extends StatelessWidget {
  const _Top();
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 6, 24, 0),
      child: Row(
        children: [
          RoundButton(
            tooltip: app.t('open_menu'),
            onTap: () => go(context, const ProfileScreen()),
            icon: const MenuGlyph(),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Semantics(
              button: true,
              label:
                  '${app.t('deliver_to')}: ${app.address.isEmpty ? app.t('no_address') : app.address}',
              excludeSemantics: true,
              child: InkWell(
                onTap: () => showAddressPopup(context),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        app.t('deliver_to').toUpperCase(),
                        style: Ember.text(
                          12,
                          weight: FontWeight.w700,
                          color: Ember.orangeText,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              app.address.isEmpty
                                  ? app.t('no_address')
                                  : app.address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Ember.text(14, color: Ember.address),
                            ),
                          ),
                          const Icon(
                            Icons.arrow_drop_down_rounded,
                            color: Ember.navy,
                            size: 24,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          CartButton(onTap: () => openBasket(context)),
        ],
      ),
    );
  }
}

/// Kit category chip (60 high): round photo + bold name, yellow when chosen.
class _CategoryChip extends StatelessWidget {
  final Map<String, dynamic> category;
  final bool selected;
  final VoidCallback onTap;
  const _CategoryChip({
    required this.category,
    required this.selected,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    final img = category['image_url'];
    return Semantics(
      button: true,
      selected: selected,
      label: '${category['name']}',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 60,
          padding: const EdgeInsets.fromLTRB(8, 8, 20, 8),
          decoration: BoxDecoration(
            color: selected ? Ember.yellow : Colors.white,
            borderRadius: BorderRadius.circular(39),
            boxShadow: Ember.cardShadow,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Ember.placeholder,
                  shape: BoxShape.circle,
                ),
                clipBehavior: Clip.antiAlias,
                child: img == null
                    ? const Icon(
                        Icons.restaurant_rounded,
                        color: Colors.white,
                        size: 22,
                      )
                    : NetImage(img, width: 44, height: 44),
              ),
              const SizedBox(width: 12),
              Text(
                '${category['name']}',
                style: Ember.text(
                  14,
                  weight: FontWeight.w700,
                  color: Ember.text1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Kit restaurant card: 137 high photo, name, cuisines, ☆ / delivery / time.
class RestaurantCard extends StatelessWidget {
  final Map<String, dynamic> r;
  final VoidCallback onTap;
  const RestaurantCard(this.r, {super.key, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    final cuisines = ((r['cuisines'] as List?) ?? [])
        .map((c) => '${c['name']}')
        .join(' - ');
    return Semantics(
      button: true,
      label: '${r['name']}',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Ember.radius),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(Ember.radius),
              child: SizedBox(
                height: 137,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    NetImage(r['cover_url'] ?? r['hero_image_url']),
                    if (numOf(r['discount_percent']) > 0)
                      Positioned(
                        left: 12,
                        top: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Ember.orange,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '-${numOf(r['discount_percent']).toInt()}%',
                            style: Ember.text(
                              13,
                              weight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${r['name']}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Ember.text(20, color: Ember.navy),
            ),
            const SizedBox(height: 5),
            if (cuisines.isNotEmpty)
              Text(
                cuisines,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Ember.text(14, color: Ember.text2),
              ),
            const SizedBox(height: 14),
            MetaRow(
              rating: numOf(r['rating']),
              fee: deliveryFeeText(app, r),
              time: '${r['delivery_time'] ?? '30-40'} ${app.t('min_short')}',
            ),
          ],
        ),
      ),
    );
  }
}

/// "Free" when delivery costs nothing, otherwise the fee.
String deliveryFeeText(AppState app, Map<String, dynamic> r) {
  final fee = numOf(r['delivery_fee']);
  return fee <= 0 ? app.t('free') : app.price(fee).replaceFirst('.00 ', ' ');
}
