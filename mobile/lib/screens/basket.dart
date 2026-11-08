import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/basket.dart';
import '../widgets/common.dart';
import 'orders.dart';
import 'restaurants.dart';
import 'shell.dart';

class BasketScreen extends StatelessWidget {
  const BasketScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    return EmberScaffold(
      children: [
        if (cart.restaurant != null)
          Container(
            height: 90,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Ember.orange,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const KitImage('clock', size: 46),
                const SizedBox(width: 14),
                Text(
                  '${cart.restaurant!['delivery_time'] ?? '30-40'} ${app.t('min_short')}',
                  style: Ember.text(
                    18,
                    weight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        BasketView(
          onCheckout: () => go(context, const CheckoutScreen()),
          onBrowse: () => go(context, const RestaurantsScreen()),
        ),
      ],
    );
  }
}

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _form = GlobalKey<FormState>();
  late final AppState app = context.read<AppState>();
  late final _name = TextEditingController(text: app.user?['name'] ?? '');
  final _phone = TextEditingController();
  late final _email = TextEditingController(text: app.user?['email'] ?? '');
  late final _address = TextEditingController(text: app.address);
  final _notes = TextEditingController();
  String _payment = 'cash';
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _address, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final cart = context.read<CartState>();
    if (!_form.currentState!.validate() || cart.items.isEmpty) return;
    setState(() => _busy = true);
    try {
      // Only the selection is sent; the server calculates every price
      final order = await Api.instance.placeOrder({
        'restaurant_id': cart.restaurant!['id'],
        'fulfillment': cart.fulfillment,
        'items': [
          for (final i in cart.items)
            {
              'product_id': i.productId,
              'quantity': i.quantity,
              'size': i.size,
              'added_ingredient_ids': i.addedIds,
              'removed_ingredient_ids': i.removedIds,
            },
        ],
        'promo_code': cart.promoCode,
        'delivery_address': cart.fulfillment == 'delivery'
            ? _address.text.trim()
            : '',
        'customer_name': _name.text.trim(),
        'customer_phone': _phone.text.trim(),
        'customer_email': _email.text.trim(),
        'customer_notes': _notes.text.trim(),
        'payment_method': _payment,
      });
      if (cart.fulfillment == 'delivery') {
        await app.setAddress(_address.text.trim());
      }
      cart.clear();
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
      go(context, OrderSuccessScreen(order: order));
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
    final t = app.t;
    final delivery = cart.fulfillment == 'delivery';
    String? required(String? v, int min) =>
        (v == null || v.trim().length < min) ? t('please_fill') : null;

    Widget field(
      TextEditingController c,
      String label,
      IconData icon, {
      TextInputType? type,
      String? Function(String?)? validator,
      int lines = 1,
    }) => Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: c,
        keyboardType: type,
        validator: validator,
        maxLines: lines,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Padding(
            padding: const EdgeInsets.only(left: 14),
            child: Icon(icon),
          ),
          border: lines > 1
              ? OutlineInputBorder(borderRadius: BorderRadius.circular(28))
              : null,
          enabledBorder: lines > 1
              ? OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: const BorderSide(color: Color(0xFFCFCFCF)),
                )
              : null,
        ),
      ),
    );

    return EmberScaffold(
      children: [
        Text(
          t('checkout_title'),
          style: Ember.text(30, weight: FontWeight.w600),
        ),
        const SizedBox(height: 16),
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _card(
                '1. ${t('fulfillment')}',
                Row(
                  children: [
                    for (final o in [
                      ('delivery', 'scooter', t('delivery')),
                      ('collection', 'new_store', t('collection')),
                    ])
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: InkWell(
                            onTap: () => cart.setFulfillment(o.$1),
                            borderRadius: BorderRadius.circular(Ember.radius),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              decoration: BoxDecoration(
                                color: cart.fulfillment == o.$1
                                    ? Ember.line
                                    : null,
                                border: Border.all(
                                  color: cart.fulfillment == o.$1
                                      ? Colors.black
                                      : Ember.gray,
                                ),
                                borderRadius: BorderRadius.circular(
                                  Ember.radius,
                                ),
                              ),
                              child: Column(
                                children: [
                                  Opacity(
                                    opacity: cart.fulfillment == o.$1
                                        ? 1
                                        : 0.45,
                                    child: KitImage(o.$2, size: 36),
                                  ),
                                  Text(
                                    o.$3,
                                    style: Ember.text(
                                      15,
                                      weight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              _card(
                '2. ${t('delivery_details')}',
                Column(
                  children: [
                    field(
                      _name,
                      t('full_name'),
                      Icons.person_outline,
                      validator: (v) => required(v, 2),
                    ),
                    field(
                      _phone,
                      t('phone'),
                      Icons.phone_outlined,
                      type: TextInputType.phone,
                      validator: (v) =>
                          RegExp(
                            r'^\+?[\d\s()\-]{6,20}$',
                          ).hasMatch(v?.trim() ?? '')
                          ? null
                          : t('invalid_phone'),
                    ),
                    field(
                      _email,
                      t('email_optional'),
                      Icons.mail_outline,
                      type: TextInputType.emailAddress,
                    ),
                    if (delivery)
                      field(
                        _address,
                        t('delivery_address'),
                        Icons.location_on_outlined,
                        validator: (v) => required(v, 5),
                        lines: 2,
                      ),
                    field(
                      _notes,
                      t('notes_optional'),
                      Icons.edit_note,
                      lines: 2,
                    ),
                  ],
                ),
              ),
              _card(
                '3. ${t('payment_method')}',
                RadioGroup<String>(
                  groupValue: _payment,
                  onChanged: (v) => setState(() => _payment = v ?? 'cash'),
                  child: Column(
                    children: [
                      for (final p in [
                        ('cash', Icons.payments_outlined, t('pay_cash')),
                        ('card', Icons.credit_card, t('pay_card')),
                      ])
                        RadioListTile<String>(
                          value: p.$1,
                          activeColor: Ember.orange,
                          contentPadding: EdgeInsets.zero,
                          title: Row(
                            children: [
                              Icon(p.$2),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  p.$3,
                                  style: Ember.text(
                                    15,
                                    weight: FontWeight.w600,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
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
                      padding: const EdgeInsets.all(22),
                      child: Row(
                        children: [
                          const KitImage('basket_full', size: 44),
                          const SizedBox(width: 16),
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Text(
                                t('order_summary'),
                                style: Ember.text(
                                  24,
                                  weight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    for (final i in cart.items)
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Ember.orange,
                          child: Text(
                            '${i.quantity}x',
                            style: Ember.text(
                              13,
                              weight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        title: Text(
                          i.name,
                          style: Ember.text(
                            14,
                            weight: FontWeight.w600,
                            color: Ember.navy,
                          ),
                        ),
                        subtitle: i.size == null ? null : Text(i.size!),
                        trailing: Text(
                          app.price(i.unitPrice * i.quantity),
                          style: Ember.text(
                            15,
                            weight: FontWeight.w600,
                            color: Ember.green,
                          ),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _sum(t('subtotal'), app.price(cart.subtotal)),
                          if (cart.discount > 0)
                            _sum(
                              '${t('discounts')} (${cart.promoCode})',
                              '−${app.price(cart.discount)}',
                            ),
                          _sum(
                            t('delivery_fee'),
                            cart.deliveryFee > 0
                                ? app.price(cart.deliveryFee)
                                : t('free'),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            constraints: const BoxConstraints(minHeight: 64),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Ember.orange.withValues(alpha: 0.8),
                              border: Border.all(color: Colors.black),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: LabelValueRow(
                              label: Text(
                                t('total_to_pay'),
                                style: Ember.text(
                                  17,
                                  weight: FontWeight.w600,
                                  color: Colors.white,
                                  height: 1.2,
                                ),
                              ),
                              value: Text(
                                app.price(cart.total),
                                style: Ember.text(
                                  24,
                                  weight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          GreenButton(
                            _busy ? t('placing_order') : t('place_order'),
                            onPressed:
                                _busy ||
                                    cart.items.isEmpty ||
                                    cart.missingForMin > 0
                                ? null
                                : _submit,
                          ),
                          if (cart.missingForMin > 0)
                            Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: Text(
                                '${t('min_delivery_warning_1', {'min': app.price(cart.minOrder)})} ${t('min_delivery_more', {'amount': app.price(cart.missingForMin)})} ${t('min_delivery_warning_2')}',
                                textAlign: TextAlign.center,
                                style: Ember.text(
                                  13,
                                  weight: FontWeight.w600,
                                  color: Ember.red,
                                ),
                              ),
                            ),
                          const SizedBox(height: 8),
                          Text(
                            t('final_price_note'),
                            textAlign: TextAlign.center,
                            style: Ember.text(12, color: Colors.black54),
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
      ],
    );
  }

  Widget _card(String title, Widget child) => Container(
    margin: const EdgeInsets.only(bottom: 16),
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Ember.card,
      border: Border.all(color: Colors.black),
      borderRadius: BorderRadius.circular(Ember.radius),
    ),
    // Transparent Material so ListTile ink splashes paint above the card colour.
    child: Material(
      type: MaterialType.transparency,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Ember.text(19, weight: FontWeight.w600)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    ),
  );

  Widget _sum(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: LabelValueRow(
      label: Text(
        '$label:',
        style: Ember.text(
          16,
          weight: FontWeight.w600,
          color: Ember.navy,
          height: 1.2,
        ),
      ),
      value: Text(value, style: Ember.text(16)),
    ),
  );
}
