import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import 'shell.dart';

const _steps = [
  ('received', Icons.check_circle_outline),
  ('preparing', Icons.soup_kitchen_outlined),
  ('packaging', Icons.inventory_2_outlined),
  ('out_for_delivery', Icons.delivery_dining),
  ('delivered', Icons.home_outlined),
];

class OrderSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> order;
  const OrderSuccessScreen({super.key, required this.order});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    return EmberScaffold(
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF9F9F9),
            border: Border.all(color: Colors.black),
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                color: Ember.green,
                padding: const EdgeInsets.all(28),
                child: Column(
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(4),
                      child: const EmberLottie(
                        EmberAnim.success,
                        size: 110,
                        repeat: false,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      t('order_confirmed'),
                      style: Ember.text(
                        26,
                        weight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      t('order_confirmed_desc', {
                        'number': order['order_number'],
                      }),
                      textAlign: TextAlign.center,
                      style: Ember.text(15, color: Colors.white),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '${order['restaurant_name']} · ${app.price(numOf(order['total']))}',
                      textAlign: TextAlign.center,
                      style: Ember.text(16, weight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Ember.orange.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.schedule,
                            color: Colors.white,
                            size: 36,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order['fulfillment'] == 'collection'
                                      ? t('ready_for_pickup')
                                      : t('estimated_delivery'),
                                  style: Ember.text(
                                    14,
                                    weight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                Text(
                                  '${order['estimated_delivery'] ?? t('delivery_time_value')}',
                                  style: Ember.text(
                                    22,
                                    weight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (!app.isLoggedIn) ...[
                      const SizedBox(height: 14),
                      Text(
                        t('guest_order_note'),
                        style: Ember.text(13, color: Colors.black54),
                      ),
                    ],
                    const SizedBox(height: 20),
                    GreenButton(
                      t('track_order'),
                      height: 56,
                      onPressed: () {
                        Navigator.pop(context);
                        go(
                          context,
                          OrdersScreen(orderNumber: '${order['order_number']}'),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Track order: guest search by number + phone, and the order history for signed-in users.
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
  List<Map<String, dynamic>>? _mine;
  Timer? _timer;

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
    setState(() => _error = null);
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
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    final active =
        _mine
            ?.where((o) => !['delivered', 'cancelled'].contains(o['status']))
            .toList() ??
        [];
    return EmberScaffold(
      onRefresh: _loadMine,
      children: [
        Text(
          t('nav_track_order'),
          style: Ember.text(30, weight: FontWeight.w600),
        ),
        const SizedBox(height: 16),
        if (active.isNotEmpty) ...[
          OrderTrackerCard(order: active.first),
          const SizedBox(height: 20),
        ],
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Ember.gray,
            borderRadius: BorderRadius.circular(Ember.radius),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                t('track_by_number'),
                style: Ember.text(20, weight: FontWeight.w700),
              ),
              Text(
                t('track_by_number_sub'),
                style: Ember.text(13, color: Colors.black54),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _number,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  hintText: t('order_number_placeholder'),
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  hintText: '+993 6X XXXXXX',
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              OrangeButton(
                t('track_order'),
                onPressed: _track,
                icon: Icons.search,
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    _error!,
                    style: Ember.text(
                      14,
                      weight: FontWeight.w600,
                      color: Ember.red,
                    ),
                  ),
                ),
              if (_tracked != null) ...[
                const SizedBox(height: 16),
                OrderTrackerCard(order: _tracked!),
              ],
            ],
          ),
        ),
        if (app.isLoggedIn) ...[
          const SizedBox(height: 24),
          Text(
            t('order_history'),
            style: Ember.text(22, weight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          if (_mine == null)
            const Center(child: EmberLottie(EmberAnim.loader, size: 72)),
          if (_mine != null && _mine!.isEmpty)
            EmptyState(anim: EmberAnim.emptyBasket, title: t('no_orders')),
          for (final o in _mine ?? const <Map<String, dynamic>>[])
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Ember.card,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Ember.radius),
                side: const BorderSide(color: Colors.black12),
              ),
              child: ExpansionTile(
                title: Text(
                  '${o['restaurant_name']}',
                  style: Ember.text(16, weight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${o['order_number']} · ${app.price(numOf(o['total']))}',
                  style: Ember.text(13, color: Colors.black54),
                ),
                trailing: _StatusPill(status: '${o['status']}'),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: OrderTrackerCard(order: o, compact: true),
                  ),
                ],
              ),
            ),
        ],
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;
  const _StatusPill({required this.status});
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final color = switch (status) {
      'delivered' => Ember.line,
      'cancelled' => Ember.pink,
      'out_for_delivery' => Ember.green,
      'received' => Ember.navy,
      _ => Ember.orange,
    };
    final dark = ['delivered', 'cancelled'].contains(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(Ember.pill),
      ),
      child: Text(
        t('status_$status'),
        style: Ember.text(
          12,
          weight: FontWeight.w600,
          color: dark ? Ember.navy : Colors.white,
        ),
      ),
    );
  }
}

/// Status timeline of one order.
class OrderTrackerCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final bool compact;
  const OrderTrackerCard({
    super.key,
    required this.order,
    this.compact = false,
  });
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final status = '${order['status']}';
    if (status == 'cancelled') {
      return Row(
        children: [
          const Icon(Icons.cancel_outlined, color: Ember.red, size: 32),
          const SizedBox(width: 10),
          Text(
            t('order_was_cancelled'),
            style: Ember.text(15, weight: FontWeight.w600, color: Ember.red),
          ),
        ],
      );
    }
    final current = _steps
        .indexWhere((s) => s.$1 == status)
        .clamp(0, _steps.length - 1);
    return Container(
      padding: compact ? EdgeInsets.zero : const EdgeInsets.all(18),
      decoration: compact
          ? null
          : BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Ember.radius),
              boxShadow: Ember.softShadow,
            ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Live animation for orders that are being cooked or are on the way
          if (status == 'out_for_delivery' ||
              status == 'preparing' ||
              status == 'packaging')
            Center(
              child: EmberLottie(
                status == 'out_for_delivery'
                    ? EmberAnim.delivery
                    : EmberAnim.loader,
                size: compact ? 90 : 130,
              ),
            ),
          if (!compact) ...[
            Text(
              t('tracking_order', {'number': order['order_number']}),
              style: Ember.text(17, weight: FontWeight.w700),
            ),
            Text(
              '${order['restaurant_name'] ?? ''}',
              style: Ember.text(13, color: Colors.black54),
            ),
            const SizedBox(height: 14),
          ],
          for (var i = 0; i < _steps.length; i++)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: i <= current ? Ember.orange : Ember.line,
                        shape: BoxShape.circle,
                        border: i == current
                            ? Border.all(
                                color: Ember.orange.withValues(alpha: 0.3),
                                width: 4,
                              )
                            : null,
                      ),
                      child: Icon(
                        _steps[i].$2,
                        size: 20,
                        color: i <= current ? Colors.white : Colors.black38,
                      ),
                    ),
                    if (i < _steps.length - 1)
                      Container(
                        width: 2,
                        height: 22,
                        color: i < current ? Ember.orange : Ember.line,
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
                            weight: FontWeight.w600,
                            color: i <= current ? Colors.black : Colors.black38,
                          ),
                        ),
                        if (i == current)
                          Text(
                            t('step_${_steps[i].$1}_desc'),
                            style: Ember.text(12, color: Colors.black54),
                          ),
                      ],
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
