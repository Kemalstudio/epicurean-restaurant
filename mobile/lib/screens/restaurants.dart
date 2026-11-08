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

/// Kit "Search": back + title + cart, search field, category keyword chips,
/// then the restaurants — compact "Suggested Restaurants" rows while
/// searching, big cards when browsing a category or the offers.
class RestaurantsScreen extends StatefulWidget {
  final String? cuisine, area, title;
  final bool offersOnly, search;
  const RestaurantsScreen({
    super.key,
    this.cuisine,
    this.area,
    this.title,
    this.offersOnly = false,
    this.search = false,
  });
  @override
  State<RestaurantsScreen> createState() => _RestaurantsScreenState();
}

class _RestaurantsScreenState extends State<RestaurantsScreen> {
  final _q = TextEditingController();
  late String? _cuisine = widget.cuisine;
  late final String? _area = widget.area;
  Future<List<dynamic>>? _future;
  Future<Map<String, dynamic>>? _home;
  String _lang = '';

  bool get _searching => widget.search || _q.text.trim().isNotEmpty;

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
    final title = widget.search
        ? t('search')
        : widget.offersOnly
        ? t('offers_page_title')
        : (widget.title ?? t('restaurants_page_title'));
    return EmberScaffold(
      header: TopBar(
        title: title,
        trailing: CartButton(onTap: () => openBasket(context)),
      ),
      onRefresh: () async => setState(_load),
      children: [
        const SizedBox(height: 24),
        SearchField(
          hint: t('search_dishes'),
          controller: _q,
          autofocus: widget.search,
          onChanged: (_) => setState(_load),
          onSubmitted: (_) => setState(_load),
        ),
        const SizedBox(height: 24),
        Text(t('all_categories'), style: Ember.text(20, color: Ember.text1)),
        const SizedBox(height: 12),
        _keywords(),
        const SizedBox(height: 32),
        FutureBuilder<List<dynamic>>(
          future: _future,
          builder: (context, snap) {
            if (snap.hasError) {
              return ErrorState(
                error: snap.error!,
                onRetry: () => setState(_load),
              );
            }
            if (!snap.hasData) return const LoadingBox();
            var list = List<Map<String, dynamic>>.from(
              snap.data!.map((e) => Map<String, dynamic>.from(e)),
            );
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
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _searching
                      ? t('suggested_restaurants')
                      : t('open_restaurants'),
                  style: Ember.text(20, color: Ember.text1),
                ),
                const SizedBox(height: 20),
                for (final r in list)
                  _searching
                      ? _SuggestionRow(
                          r,
                          onTap: () =>
                              go(context, RestaurantScreen(slug: r['slug'])),
                        )
                      : Padding(
                          padding: const EdgeInsets.only(bottom: 28),
                          child: RestaurantCard(
                            r,
                            onTap: () =>
                                go(context, RestaurantScreen(slug: r['slug'])),
                          ),
                        ),
              ],
            );
          },
        ),
      ],
    );
  }

  /// Category chips ("Recent Keywords" style); tapping one filters the list.
  Widget _keywords() => FutureBuilder<Map<String, dynamic>>(
    future: _home,
    builder: (_, snap) {
      final t = context.read<AppState>().t;
      final cuisines = List<Map<String, dynamic>>.from(
        ((snap.data?['cuisines'] as List?) ?? []).map(
          (e) => Map<String, dynamic>.from(e),
        ),
      );
      final items = [
        <String, dynamic>{'slug': null, 'name': t('filter_all')},
        ...cuisines,
      ];
      return SizedBox(
        height: 46,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (_, i) => KitChip(
            '${items[i]['name']}',
            selected: _cuisine == items[i]['slug'],
            onTap: () => setState(() {
              _cuisine = items[i]['slug'];
              _load();
            }),
          ),
        ),
      );
    },
  );
}

/// Kit "Suggested Restaurants" row: 60 x 50 photo, name, ☆ rating, divider.
class _SuggestionRow extends StatelessWidget {
  final Map<String, dynamic> r;
  final VoidCallback onTap;
  const _SuggestionRow(this.r, {required this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Ember.line)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: NetImage(
              r['cover_url'] ?? r['logo_url'],
              width: 60,
              height: 50,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${r['name']}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Ember.text(16, color: Ember.navy),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.star_border_rounded,
                      color: Ember.orange,
                      size: 18,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      numOf(r['rating']).toStringAsFixed(1),
                      style: Ember.text(16, color: Ember.navy),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
