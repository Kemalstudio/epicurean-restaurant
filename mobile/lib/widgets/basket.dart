import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import 'animated.dart';
import 'common.dart';

/// "My Basket" (kit: Mobile Cart).
class BasketView extends StatelessWidget {
  final VoidCallback onCheckout;
  final VoidCallback onBrowse;
  const BasketView({
    super.key,
    required this.onCheckout,
    required this.onBrowse,
  });

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    final t = app.t;
    final blocked = cart.items.isEmpty || cart.missingForMin > 0;

    return Container(
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
            height: 117,
            color: Ember.green,
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Row(
              children: [
                const Icon(
                  Icons.shopping_basket_outlined,
                  color: Colors.white,
                  size: 58,
                ),
                const SizedBox(width: 28),
                Text(
                  t('my_basket'),
                  style: Ember.text(
                    28,
                    weight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          if (cart.items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  const EmberLottie(EmberAnim.emptyBasket, size: 150),
                  Text(
                    t('cart_empty'),
                    style: Ember.text(
                      16,
                      weight: FontWeight.w600,
                      color: Ember.navy,
                    ),
                  ),
                  Text(
                    t('cart_empty_desc'),
                    textAlign: TextAlign.center,
                    style: Ember.text(14, color: Colors.black54),
                  ),
                  const SizedBox(height: 20),
                  OrangeButton(
                    t('browse_restaurants'),
                    onPressed: onBrowse,
                    height: 48,
                  ),
                ],
              ),
            )
          else ...[
            if (cart.restaurant != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Colors.black)),
                ),
                child: Row(
                  children: [
                    ClipOval(
                      child: NetImage(
                        cart.restaurant!['logo_url'],
                        width: 36,
                        height: 36,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${cart.restaurant!['name']}',
                        style: Ember.text(
                          15,
                          weight: FontWeight.w600,
                          color: Ember.navy,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            for (final item in cart.items) _Line(item: item),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: Column(
                children: [
                  _row(t('subtotal'), app.price(cart.subtotal)),
                  _row(
                    t('discounts'),
                    cart.discount > 0
                        ? '−${app.price(cart.discount)}'
                        : app.price(0),
                  ),
                  _row(
                    t('delivery_fee'),
                    cart.deliveryFee > 0
                        ? app.price(cart.deliveryFee)
                        : t('free'),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Colors.black),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 70,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(
                      color: Ember.orange.withValues(alpha: 0.8),
                      border: Border.all(color: Colors.black),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text(
                          t('total_to_pay'),
                          style: Ember.text(
                            18,
                            weight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          app.price(cart.total),
                          style: Ember.text(
                            26,
                            weight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const _PromoField(),
                ],
              ),
            ),
            const Divider(height: 1, color: Colors.black),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  _FulfillmentTile(
                    value: 'delivery',
                    icon: Icons.delivery_dining,
                    label: t('delivery'),
                    sub: cart.restaurant?['delivery_time'] != null
                        ? '${cart.restaurant!['delivery_time']} ${t('min_short')}'
                        : '',
                  ),
                  Container(
                    width: 1,
                    height: 90,
                    color: Colors.black26,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                  ),
                  _FulfillmentTile(
                    value: 'collection',
                    icon: Icons.storefront,
                    label: t('collection'),
                    sub: t('collection_sub'),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Colors.black),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  GreenButton(
                    t('checkout_btn'),
                    onPressed: blocked ? null : onCheckout,
                  ),
                  if (cart.missingForMin > 0) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Ember.navy,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text.rich(
                        TextSpan(
                          style: Ember.text(
                            15,
                            weight: FontWeight.w600,
                            color: Colors.white,
                          ),
                          children: [
                            TextSpan(
                              text:
                                  '${t('min_delivery_warning_1', {'min': app.price(cart.minOrder)})} ',
                            ),
                            TextSpan(
                              text: t('min_delivery_more', {
                                'amount': app.price(cart.missingForMin),
                              }),
                              style: const TextStyle(
                                color: Ember.orange,
                                decoration: TextDecoration.underline,
                                decorationColor: Ember.orange,
                              ),
                            ),
                            TextSpan(text: ' ${t('min_delivery_warning_2')}'),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5),
    child: Row(
      children: [
        Text(
          '$label:',
          style: Ember.text(18, weight: FontWeight.w600, color: Ember.navy),
        ),
        const Spacer(),
        Text(value, style: Ember.text(20, color: const Color(0xFF212121))),
      ],
    ),
  );
}

class _Line extends StatelessWidget {
  final CartItem item;
  const _Line({required this.item});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    final cart = context.read<CartState>();
    final notes = [
      if (item.size != null) item.size!,
      ...item.removedNames.map((n) => '${app.t('no_word')} $n'),
      ...item.addedNames.map((n) => '+ $n'),
    ].join(', ');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.black)),
      ),
      child: Row(
        children: [
          Container(
            width: 45,
            height: 45,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Ember.orange,
              shape: BoxShape.circle,
            ),
            child: Text(
              '${item.quantity}x',
              style: Ember.text(
                20,
                weight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  app.price(item.unitPrice * item.quantity),
                  style: Ember.text(
                    18,
                    weight: FontWeight.w600,
                    color: Ember.green,
                  ),
                ),
                Text(
                  item.name,
                  style: Ember.text(
                    15,
                    weight: FontWeight.w600,
                    color: Ember.navy,
                  ),
                ),
                if (notes.isNotEmpty) Text(notes, style: Ember.text(13)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _qtyButton(
                      Icons.remove,
                      () => cart.setQuantity(item, item.quantity - 1),
                      app.t('decrease_quantity'),
                    ),
                    const SizedBox(width: 8),
                    _qtyButton(
                      Icons.add,
                      () => cart.setQuantity(item, item.quantity + 1),
                      app.t('increase_quantity'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => cart.setQuantity(item, 0),
            tooltip: app.t('remove_item'),
            icon: Container(
              width: 35,
              height: 35,
              decoration: BoxDecoration(
                color: const Color(0xFF8E8E8E),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 22),
            ),
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onTap, String tooltip) =>
      Tooltip(
        message: tooltip,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Container(
            width: 30,
            height: 30,
            decoration: const BoxDecoration(
              color: Ember.navy,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 16),
          ),
        ),
      );
}

class _FulfillmentTile extends StatelessWidget {
  final String value, label, sub;
  final IconData icon;
  const _FulfillmentTile({
    required this.value,
    required this.icon,
    required this.label,
    required this.sub,
  });
  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartState>();
    final active = cart.fulfillment == value;
    return Expanded(
      child: Semantics(
        selected: active,
        button: true,
        child: InkWell(
          onTap: () => cart.setFulfillment(value),
          borderRadius: BorderRadius.circular(Ember.radius),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: active
                ? BoxDecoration(
                    color: Ember.line,
                    border: Border.all(color: Colors.black),
                    borderRadius: BorderRadius.circular(Ember.radius),
                  )
                : null,
            child: Column(
              children: [
                Icon(
                  icon,
                  size: 35,
                  color: active ? Ember.green : Colors.black38,
                ),
                Text(
                  label,
                  style: Ember.text(
                    16,
                    weight: FontWeight.w600,
                    color: active ? Colors.black : Colors.black45,
                  ),
                ),
                if (sub.isNotEmpty)
                  Text(
                    sub,
                    style: Ember.text(
                      13,
                      color: active ? Colors.black : Colors.black45,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PromoField extends StatefulWidget {
  const _PromoField();
  @override
  State<_PromoField> createState() => _PromoFieldState();
}

class _PromoFieldState extends State<_PromoField> {
  final _ctrl = TextEditingController();
  bool _open = false, _busy = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final app = context.read<AppState>();
    final cart = context.read<CartState>();
    if (_ctrl.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      final res = await Api.instance.checkPromo(
        _ctrl.text.trim(),
        cart.subtotal,
        cart.restaurant?['id'],
      );
      cart.setPromo(res['code'], numOf(res['discount_percent']));
      if (mounted) {
        showMessage(
          context,
          '${app.t('promo_applied')}: ${app.t('promo_applied_desc', {'percent': res['discount_percent']})}',
        );
      }
      setState(() => _open = false);
    } on ApiError catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    final pill = BoxDecoration(
      color: Ember.section,
      border: Border.all(color: const Color(0xFFCFCFCF)),
      borderRadius: BorderRadius.circular(Ember.pill),
    );
    if (cart.promoCode != null) {
      return Container(
        height: 52,
        padding: const EdgeInsets.only(left: 28, right: 8),
        decoration: pill,
        child: Row(
          children: [
            Expanded(
              child: Text(
                '${cart.promoCode} ${app.t('promo_active')}',
                style: Ember.text(15, weight: FontWeight.w600),
              ),
            ),
            IconButton(
              onPressed: () => cart.setPromo(null, 0),
              tooltip: app.t('remove_promo'),
              icon: const Icon(Icons.cancel, color: Ember.grayDark),
            ),
          ],
        ),
      );
    }
    if (!_open) {
      return InkWell(
        onTap: () => setState(() => _open = true),
        borderRadius: BorderRadius.circular(Ember.pill),
        child: Container(
          height: 52,
          padding: const EdgeInsets.only(left: 28, right: 12),
          decoration: pill,
          child: Row(
            children: [
              Expanded(
                child: Text(app.t('apply_coupon'), style: Ember.text(15)),
              ),
              Container(
                width: 30,
                height: 30,
                decoration: const BoxDecoration(
                  color: Ember.green,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_forward,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _ctrl,
            autofocus: true,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              hintText: app.t('promo_placeholder'),
              fillColor: Colors.white,
            ),
            onSubmitted: (_) => _apply(),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton(
          onPressed: _busy ? null : _apply,
          style: FilledButton.styleFrom(
            backgroundColor: Ember.green,
            minimumSize: const Size(0, 52),
            shape: const StadiumBorder(),
          ),
          child: Text(app.t('apply')),
        ),
      ],
    );
  }
}
