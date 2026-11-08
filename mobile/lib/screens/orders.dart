import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import '../widgets/product.dart';
import 'shell.dart';

const _steps = [
  ('received', Icons.check_circle_outline),
  ('preparing', Icons.soup_kitchen_outlined),
  ('packaging', Icons.inventory_2_outlined),
  ('out_for_delivery', Icons.delivery_dining_outlined),
  ('delivered', Icons.home_outlined),
];

bool _isActive(Map<String, dynamic> o) =>
    !['delivered', 'cancelled'].contains(o['status']);

/// Order placed: success animation, number, estimated time, TRACK ORDER.
class OrderSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> order;
  const OrderSuccessScreen({super.key, required this.order});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    return EmberScaffold(
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 32),
      bottom: Padding(
        padding: EdgeInsets.fromLTRB(
          24,
          8,
          24,
          24 + MediaQuery.paddingOf(context).bottom,
        ),
        child: PrimaryButton(
          t('track_order'),
          onPressed: () {
            Navigator.pop(context);
            go(context, OrdersScreen(orderNumber: '${order['order_number']}'));
          },
        ),
      ),
      children: [
        const Center(
          child: EmberLottie(EmberAnim.success, size: 200, repeat: false),
        ),
        const SizedBox(height: 24),
        Text(
          t('order_confirmed'),
          textAlign: TextAlign.center,
          style: Ember.text(24, weight: FontWeight.w800, color: Ember.navy),
        ),
        const SizedBox(height: 12),
        Text(
          t('order_confirmed_desc', {'number': order['order_number']}),
          textAlign: TextAlign.center,
          style: Ember.text(16, color: Ember.text2, height: 1.5),
        ),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Ember.panel,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              LabelValueRow(
                label: Text(
                  '${order['restaurant_name'] ?? ''}',
                  style: Ember.text(14, color: Ember.text3),
                ),
                value: Text(
                  shortPrice(app, numOf(order['total'])),
                  style: Ember.text(
                    16,
                    weight: FontWeight.w700,
                    color: Ember.navy,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.access_time_rounded,
                    color: Ember.orange,
                    size: 22,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      order['fulfillment'] == 'collection'
                          ? t('ready_for_pickup')
                          : t('estimated_delivery'),
                      style: Ember.text(14, color: Ember.text3),
                    ),
                  ),
                  Text(
                    '${order['estimated_delivery'] ?? t('delivery_time_value')}',
                    style: Ember.text(
                      14,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (!app.isLoggedIn) ...[
          const SizedBox(height: 16),
          Text(
            t('guest_order_note'),
            textAlign: TextAlign.center,
            style: Ember.text(13, color: Ember.text2),
          ),
        ],
      ],
    );
  }
}

/// Kit "My Orders": Ongoing / History tabs with order cards; guests track
/// an order by its number and phone.
class OrdersScreen extends StatefulWidget {
  final String? orderNumber;
  const OrdersScreen({super.key, this.orderNumber});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late final _number = TextEditingController(text: widget.orderNumber ?? '');
  final _phone = TextEditingController();
  Map<String, dynamic>? _tracked;
  String? _error;
  bool _busy = false;
  List<Map<String, dynamic>>? _mine;
  Timer? _timer;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _loadMine();
    // Statuses change in the restaurant panel — refresh while the screen is open
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _loadMine());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _number.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _loadMine() async {
    final app = context.read<AppState>();
    if (!app.isLoggedIn) return;
    try {
      final list = await Api.instance.myOrders('${app.user!['id']}');
      if (mounted) {
        setState(
          () => _mine = list.map((e) => Map<String, dynamic>.from(e)).toList(),
        );
      }
    } catch (_) {}
  }

  Future<void> _track() async {
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      final o = await Api.instance.track(
        _number.text.trim().toUpperCase(),
        _phone.text,
      );
      setState(() => _tracked = o);
    } on ApiError catch (e) {
      setState(() {
        _tracked = null;
        _error = e.message;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final list = (_mine ?? const <Map<String, dynamic>>[])
        .where((o) => _tab == 0 ? _isActive(o) : !_isActive(o))
        .toList();

    Widget tab(int i, String label) => Expanded(
      child: Semantics(
        button: true,
        selected: _tab == i,
        child: InkWell(
          onTap: () => setState(() => _tab = i),
          child: Container(
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: _tab == i ? Ember.orange : const Color(0xFFCED7DF),
                  width: _tab == i ? 2 : 1,
                ),
              ),
            ),
            child: Text(
              label,
              style: Ember.text(
                14,
                weight: _tab == i ? FontWeight.w700 : FontWeight.w400,
                color: _tab == i ? Ember.orange : const Color(0xFFA5A7B9),
              ),
            ),
          ),
        ),
      ),
    );

    return EmberScaffold(
      header: Column(
        children: [
          TopBar(title: t('my_orders')),
          if (app.isLoggedIn) ...[
            const SizedBox(height: 12),
            Row(children: [tab(0, t('ongoing')), tab(1, t('history'))]),
          ],
        ],
      ),
      onRefresh: _loadMine,
      children: [
        const SizedBox(height: 24),
        if (app.isLoggedIn) ...[
          if (_mine == null) const LoadingBox(),
          if (_mine != null && list.isEmpty)
            EmptyState(anim: EmberAnim.emptyBasket, title: t('no_orders')),
          for (final o in list) _OrderCard(order: o),
          const SizedBox(height: 16),
        ],
        // Track by number (guests, or orders placed without an account)
        Text(t('track_by_number'), style: Ember.text(20, color: Ember.text1)),
        const SizedBox(height: 6),
        Text(
          t('track_by_number_sub'),
          style: Ember.text(14, color: Ember.text2),
        ),
        const SizedBox(height: 20),
        KitField(
          label: t('order_number'),
          controller: _number,
          hint: t('order_number_placeholder'),
        ),
        const SizedBox(height: 20),
        KitField(
          label: t('phone'),
          controller: _phone,
          hint: '+993 6X XX XX XX',
          keyboard: TextInputType.phone,
        ),
        const SizedBox(height: 24),
        PrimaryButton(t('track_order'), loading: _busy, onPressed: _track),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!, style: Ember.text(14, color: Ember.red)),
          ),
        if (_tracked != null) ...[
          const SizedBox(height: 24),
          OrderTrackerCard(order: _tracked!),
        ],
      ],
    );
  }
}

/// Kit order card: photo | name, price | items, #number; Track / Details.
class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  const _OrderCard({required this.order});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final o = order;
    final items = (o['items'] as List?) ?? const [];
    final count = items.fold<int>(
      0,
      (n, i) => n + numOf(i is Map ? i['quantity'] : 1, 1).toInt(),
    );
    final image = items
        .whereType<Map>()
        .map((i) => i['product_image'])
        .firstWhere((x) => x != null, orElse: () => null);
    final active = _isActive(o);

    void showTracker() => showEmberPopup(
      context,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
        child: OrderTrackerCard(order: o),
      ),
    );

    return Container(
      padding: const EdgeInsets.only(bottom: 24),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFEEF2F6))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 60,
                  height: 60,
                  child: image == null
                      ? Container(
                          color: Ember.placeholder,
                          child: const Icon(
                            Icons.restaurant_rounded,
                            color: Colors.white,
                          ),
                        )
                      : NetImage(image),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${o['restaurant_name'] ?? ''}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Ember.text(
                              14,
                              weight: FontWeight.w700,
                              color: Ember.navy,
                            ),
                          ),
                        ),
                        Text(
                          '#${o['order_number']}',
                          style: Ember.text(14, color: Ember.text3).copyWith(
                            decoration: TextDecoration.underline,
                            decorationColor: Ember.text3,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          shortPrice(app, numOf(o['total'])),
                          style: Ember.text(
                            14,
                            weight: FontWeight.w700,
                            color: Ember.navy,
                          ),
                        ),
                        Container(
                          width: 1,
                          height: 16,
                          margin: const EdgeInsets.symmetric(horizontal: 14),
                          color: const Color(0xFFCACCDA),
                        ),
                        Expanded(
                          child: Text(
                            t('items_count', {'count': count}),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Ember.text(12, color: Ember.text3),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t('status_${o['status']}'),
                      style: Ember.text(
                        12,
                        weight: FontWeight.w700,
                        color: o['status'] == 'cancelled'
                            ? Ember.red
                            : active
                            ? Ember.orange
                            : Ember.green,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: SmallButton(
                  active ? t('track_order') : t('details'),
                  onPressed: showTracker,
                ),
              ),
              const SizedBox(width: 50),
              Expanded(
                child: SmallButton(
                  t('details'),
                  outline: true,
                  onPressed: () => _showItems(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showItems(BuildContext context) {
    final app = context.read<AppState>();
    final items = ((order['items'] as List?) ?? const [])
        .whereType<Map>()
        .toList();
    showEmberPopup(
      context,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 40),
              child: Text(
                '#${order['order_number']}',
                style: Ember.text(
                  20,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
            ),
            const SizedBox(height: 16),
            for (final i in items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: LabelValueRow(
                  label: Text(
                    '${i['quantity'] ?? 1} × ${i['product_name'] ?? ''}${i['size'] == null ? '' : ' (${i['size']})'}',
                    style: Ember.text(14, color: Ember.text3),
                  ),
                  value: Text(
                    i['total_price'] == null
                        ? ''
                        : shortPrice(app, numOf(i['total_price'])),
                    style: Ember.text(
                      14,
                      weight: FontWeight.w700,
                      color: Ember.navy,
                    ),
                  ),
                ),
              ),
            const Divider(height: 24, color: Ember.line),
            LabelValueRow(
              label: Text(
                app.t('total'),
                style: Ember.text(
                  16,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
              value: Text(
                shortPrice(app, numOf(order['total'])),
                style: Ember.text(
                  18,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Status timeline of one order.
class OrderTrackerCard extends StatelessWidget {
  final Map<String, dynamic> order;
  const OrderTrackerCard({super.key, required this.order});
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final status = '${order['status']}';
    if (status == 'cancelled') {
      return Row(
        children: [
          const Icon(Icons.cancel_outlined, color: Ember.red, size: 32),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              t('order_was_cancelled'),
              style: Ember.text(15, weight: FontWeight.w700, color: Ember.red),
            ),
          ),
        ],
      );
    }
    final current = _steps
        .indexWhere((s) => s.$1 == status)
        .clamp(0, _steps.length - 1);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (status == 'out_for_delivery' ||
            status == 'preparing' ||
            status == 'packaging')
          Center(
            child: EmberLottie(
              status == 'out_for_delivery'
                  ? EmberAnim.delivery
                  : EmberAnim.loader,
              size: 120,
            ),
          ),
        Text(
          t('tracking_order', {'number': order['order_number']}),
          style: Ember.text(17, weight: FontWeight.w700, color: Ember.navy),
        ),
        Text(
          '${order['restaurant_name'] ?? ''}',
          style: Ember.text(14, color: Ember.text2),
        ),
        const SizedBox(height: 16),
        for (var i = 0; i < _steps.length; i++)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: i <= current ? Ember.orange : Ember.field,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _steps[i].$2,
                      size: 19,
                      color: i <= current ? Colors.white : Ember.text2,
                    ),
                  ),
                  if (i < _steps.length - 1)
                    Container(
                      width: 2,
                      height: 22,
                      color: i < current ? Ember.orange : Ember.field,
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t('status_${_steps[i].$1}'),
                        style: Ember.text(
                          14,
                          weight: i == current
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: i <= current ? Ember.navy : Ember.text2,
                        ),
                      ),
                      if (i == current)
                        Text(
                          t('step_${_steps[i].$1}_desc'),
                          style: Ember.text(12, color: Ember.text2),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }
}
