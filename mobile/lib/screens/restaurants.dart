import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import 'home.dart';
import 'restaurant.dart';
import 'shell.dart';

/// All restaurants (optionally filtered by cuisine / area, or only those with deals).
class RestaurantsScreen extends StatefulWidget {
  final String? cuisine, area, title;
  final bool offersOnly;
  const RestaurantsScreen({
    super.key,
    this.cuisine,
    this.area,
    this.title,
    this.offersOnly = false,
  });
  @override
  State<RestaurantsScreen> createState() => _RestaurantsScreenState();
}

class _RestaurantsScreenState extends State<RestaurantsScreen> {
  final _q = TextEditingController();
  late String? _cuisine = widget.cuisine;
  late String? _area = widget.area;
  bool _openOnly = false;
  Future<List<dynamic>>? _future;
  Future<Map<String, dynamic>>? _home;
  String _lang = '';

  void _load() {
    _future = Api.instance.restaurants(
      cuisine: _cuisine,
      area: _area,
      q: _q.text.trim().isEmpty ? null : _q.text.trim(),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final lang = context.watch<AppState>().lang;
    if (lang != _lang) {
      _lang = lang;
      _home = Api.instance.home();
      _load();
    }
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    return EmberScaffold(
      onRefresh: () async => setState(_load),
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(22, 26, 22, 26),
          decoration: BoxDecoration(
            color: Ember.navy,
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.offersOnly
                    ? t('offers_page_title')
                    : (widget.title ?? t('restaurants_page_title')),
                style: Ember.text(
                  28,
                  weight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.offersOnly
                    ? t('offers_page_sub')
                    : t('restaurants_page_sub'),
                style: Ember.text(14, color: Colors.white70),
              ),
              const SizedBox(height: 18),
              TextField(
                controller: _q,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => setState(_load),
                decoration: InputDecoration(
                  hintText: t('search_restaurants'),
                  fillColor: Colors.white,
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(left: 14),
                    child: Icon(Icons.search),
                  ),
                ),
              ),
              if (_area != null) ...[
                const SizedBox(height: 12),
                InputChip(
                  label: Text(t('delivering_to', {'area': _area})),
                  onDeleted: () => setState(() {
                    _area = null;
                    _load();
                  }),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        FutureBuilder<Map<String, dynamic>>(
          future: _home,
          builder: (_, snap) {
            final cuisines = List<Map<String, dynamic>>.from(
              ((snap.data?['cuisines'] as List?) ?? []).map(
                (e) => Map<String, dynamic>.from(e),
              ),
            );
            return SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  for (final c in [
                    <String, dynamic>{'slug': null, 'name': t('filter_all')},
                    ...cuisines,
                  ])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text('${c['name']}'),
                        selected: _cuisine == c['slug'],
                        onSelected: (_) => setState(() {
                          _cuisine = c['slug'];
                          _load();
                        }),
                        selectedColor: Ember.orange,
                        showCheckmark: false,
                        labelStyle: Ember.text(
                          14,
                          color: _cuisine == c['slug']
                              ? Colors.white
                              : Colors.black,
                        ),
                        shape: const StadiumBorder(
                          side: BorderSide(color: Ember.gray),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
        SwitchListTile(
          value: _openOnly,
          onChanged: (v) => setState(() => _openOnly = v),
          title: Text(t('open_now_only'), style: Ember.text(15)),
          activeThumbColor: Ember.green,
          contentPadding: EdgeInsets.zero,
        ),
        FutureBuilder<List<dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) {
              return errorBox(snap.error!, () => setState(_load));
            }
            if (!snap.hasData) {
              return const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: EmberLottie(EmberAnim.loader, size: 72)),
              );
            }
            var list = snap.data!
                .map((e) => Map<String, dynamic>.from(e))
                .toList();
            if (_openOnly) {
              list = list.where((r) => r['open_now'] == true).toList();
            }
            if (widget.offersOnly) {
              list = list
                  .where((r) => numOf(r['discount_percent']) > 0)
                  .toList();
            }
            if (list.isEmpty) {
              return EmptyState(
                anim: EmberAnim.notFound,
                title: t('no_restaurants'),
                text: t('no_restaurants_desc'),
              );
            }
            return Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    t('restaurants_found', {'count': list.length}),
                    style: Ember.text(14, color: Colors.black54),
                  ),
                ),
                const SizedBox(height: 12),
                for (final r in list)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 18),
                    child: RestaurantCard(r),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

/// Wide restaurant card: cover photo with gradient, logo, name, cuisines; rating / time / min order.
class RestaurantCard extends StatelessWidget {
  final Map<String, dynamic> r;
  const RestaurantCard(this.r, {super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cuisines = (r['cuisines'] as List).map((c) => c['name']).join(' · ');
    return Semantics(
      container: true,
      button: true,
      label: '${r['name']}, $cuisines',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: () => go(context, RestaurantScreen(slug: r['slug'])),
        child: Container(
          decoration: BoxDecoration(
            color: Ember.card,
            borderRadius: BorderRadius.circular(Ember.radius),
            boxShadow: Ember.softShadow,
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    NetImage(r['cover_url'] ?? r['hero_image_url']),
                    const DecoratedBox(
                      decoration: BoxDecoration(gradient: Ember.dealGradient),
                    ),
                    if (numOf(r['discount_percent']) > 0)
                      Positioned(
                        right: 16,
                        top: 0,
                        child: DiscountBadge(
                          r['discount_percent'],
                          width: 70,
                          height: 52,
                          font: 16,
                        ),
                      ),
                    if (r['open_now'] != true)
                      Positioned(
                        left: 14,
                        top: 14,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(Ember.pill),
                          ),
                          child: Text(
                            r['opens_at'] != null
                                ? app.t('opens_at', {'time': r['opens_at']})
                                : app.t('closed_now'),
                            style: Ember.text(
                              12,
                              weight: FontWeight.w600,
                              color: Ember.navy,
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 14,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: ClipOval(
                              child: NetImage(
                                r['logo_url'],
                                width: 46,
                                height: 46,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${r['name']}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Ember.text(
                                    20,
                                    weight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  cuisines,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Ember.text(
                                    13,
                                    weight: FontWeight.w500,
                                    color: Ember.orange,
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
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      color: Ember.orange,
                      size: 18,
                    ),
                    Text(
                      numOf(r['rating']).toStringAsFixed(1),
                      style: Ember.text(13, weight: FontWeight.w600),
                    ),
                    const Spacer(),
                    const Icon(Icons.schedule, size: 16, color: Colors.black54),
                    Text(
                      ' ${r['delivery_time']} ${app.t('min_short')}',
                      style: Ember.text(13, color: Colors.black54),
                    ),
                    const Spacer(),
                    Text(
                      app.t('min_order_short', {
                        'amount': app.price(numOf(r['min_order'])),
                      }),
                      style: Ember.text(13, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
