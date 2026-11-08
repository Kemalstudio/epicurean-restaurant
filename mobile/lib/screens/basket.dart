import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/animated.dart';
import '../widgets/common.dart';
import '../widgets/product.dart';
import 'orders.dart';
import 'restaurants.dart';
import 'shell.dart';

/// Kit "My Cart": dark screen with the items (EDIT / DONE toggles the red
/// remove buttons) and the white bottom sheet with the delivery address,
/// total, breakdown and PLACE ORDER.
class BasketScreen extends StatefulWidget {
  const BasketScreen({super.key});
  @override
  State<BasketScreen> createState() => _BasketScreenState();
}

class _BasketScreenState extends State<BasketScreen> {
  bool _editing = false;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    final t = app.t;

    if (cart.items.isEmpty) {
      return EmberScaffold(
        header: TopBar(title: t('cart')),
        children: [
          const SizedBox(height: 40),
          EmptyState(
            anim: EmberAnim.emptyBasket,
            title: t('cart_empty'),
            text: t('cart_empty_desc'),
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            t('browse_restaurants'),
            onPressed: () => go(context, const RestaurantsScreen()),
          ),
        ],
      );
    }

    return Scaffold(
      backgroundColor: Ember.dark,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            TopBar(
              title: t('cart'),
              dark: true,
              trailing: TextButton(
                onPressed: () => setState(() => _editing = !_editing),
                child: Text(
                  (_editing ? t('done') : t('edit')).toUpperCase(),
                  style:
                      Ember.text(
                        16,
                        weight: FontWeight.w700,
                        color: _editing ? Ember.green : Ember.orange,
                      ).copyWith(
                        decoration: TextDecoration.underline,
                        decorationColor: _editing ? Ember.green : Ember.orange,
                      ),
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                children: [
                  for (final i in cart.items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 32),
                      child: _CartLine(item: i, editing: _editing),
                    ),
                ],
              ),
            ),
            const _CartSheet(),
          ],
        ),
      ),
    );
  }
}

/// One dark cart row: rounded photo | name, price, size + stepper; red ✕
/// in edit mode.
class _CartLine extends StatelessWidget {
  final CartItem item;
  final bool editing;
  const _CartLine({required this.item, required this.editing});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.read<CartState>();
    final notes = [
      if (item.size != null) item.size!,
      ...item.addedNames.map((n) => '+ $n'),
      ...item.removedNames.map((n) => '− $n'),
    ];
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(25),
          child: Container(
            width: 136,
            height: 117,
            color: Ember.darkCard,
            child: item.image.isEmpty ? null : NetImage(item.image),
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      item.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(18, color: Colors.white),
                    ),
                  ),
                  if (editing)
                    Tooltip(
                      message: app.t('remove_item'),
                      child: InkResponse(
                        onTap: () => cart.setQuantity(item, 0),
                        child: Container(
                          width: 27,
                          height: 27,
                          decoration: const BoxDecoration(
                            color: Ember.red,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 17,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                shortPrice(app, item.unitPrice * item.quantity),
                style: Ember.text(
                  20,
                  weight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      notes.join(', '),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(
                        15,
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                  QtyStepper(
                    compact: true,
                    min: 0,
                    value: item.quantity,
                    onChanged: (v) => cart.setQuantity(item, v),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// White bottom sheet of the cart.
class _CartSheet extends StatelessWidget {
  const _CartSheet();
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    final t = app.t;
    final delivery = cart.fulfillment == 'delivery';
    final short = cart.missingForMin;

    return Container(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        24 + MediaQuery.paddingOf(context).bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  (delivery ? t('delivery_address') : t('collection'))
                      .toUpperCase(),
                  style: Ember.text(14, color: Ember.text2),
                ),
              ),
              InkWell(
                onTap: () => showAddressPopup(context),
                child: Text(
                  t('edit').toUpperCase(),
                  style: Ember.text(14, color: Ember.orange).copyWith(
                    decoration: TextDecoration.underline,
                    decorationColor: Ember.orange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Material(
            color: Ember.field,
            borderRadius: BorderRadius.circular(Ember.fieldRadius),
            child: InkWell(
              onTap: () => showAddressPopup(context),
              borderRadius: BorderRadius.circular(Ember.fieldRadius),
              child: Container(
                height: 62,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    delivery
                        ? (app.address.isEmpty ? t('no_address') : app.address)
                        : t('collection_sub'),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Ember.text(16, color: const Color(0xFF32343E)),
                  ),
                ),
              ),
            ),
          ),
          if (short > 0) ...[
            const SizedBox(height: 10),
            Text(
              '${t('min_delivery_warning_1', {'min': shortPrice(app, cart.minOrder)})} ${t('min_delivery_more', {'amount': shortPrice(app, short)})} ${t('min_delivery_warning_2')}',
              style: Ember.text(13, color: Ember.red),
            ),
          ],
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                '${t('total').toUpperCase()}:',
                style: Ember.text(14, color: Ember.text2),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    shortPrice(app, cart.total),
                    style: Ember.text(30, color: Ember.navy),
                  ),
                ),
              ),
              InkWell(
                onTap: () => _showBreakdown(context),
                child: Row(
                  children: [
                    Text(
                      t('breakdown'),
                      style: Ember.text(14, color: Ember.orange),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Ember.text2,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            t('place_order'),
            onPressed: short > 0
                ? null
                : () => go(context, const CheckoutScreen()),
          ),
        ],
      ),
    );
  }

  /// Subtotal / discount / delivery, the promo code and delivery or pickup.
  void _showBreakdown(BuildContext context) {
    showEmberPopup(context, child: const _Breakdown());
  }
}

class _Breakdown extends StatefulWidget {
  const _Breakdown();
  @override
  State<_Breakdown> createState() => _BreakdownState();
}

class _BreakdownState extends State<_Breakdown> {
  final _code = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final app = context.read<AppState>();
    final cart = context.read<CartState>();
    if (_code.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      final res = await Api.instance.checkPromo(
        _code.text.trim(),
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
    Widget line(String a, String b, {bool bold = false}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: LabelValueRow(
        label: Text(
          a,
          style: Ember.text(
            bold ? 16 : 14,
            weight: bold ? FontWeight.w700 : FontWeight.w400,
            color: bold ? Ember.navy : Ember.text3,
          ),
        ),
        value: Text(
          b,
          style: Ember.text(
            bold ? 18 : 14,
            weight: FontWeight.w700,
            color: Ember.navy,
          ),
        ),
      ),
    );
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t('breakdown'),
            style: Ember.text(20, weight: FontWeight.w700, color: Ember.navy),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              for (final f in [
                ('delivery', t('delivery')),
                ('collection', t('collection')),
              ]) ...[
                Expanded(
                  child: KitChip(
                    f.$2,
                    selected: cart.fulfillment == f.$1,
                    onTap: () => cart.setFulfillment(f.$1),
                  ),
                ),
                if (f.$1 == 'delivery') const SizedBox(width: 10),
              ],
            ],
          ),
          const SizedBox(height: 16),
          line(t('subtotal'), shortPrice(app, cart.subtotal)),
          if (cart.discount > 0)
            line(
              '${t('discounts')} (${cart.promoCode})',
              '−${shortPrice(app, cart.discount)}',
            ),
          line(
            t('delivery_fee'),
            cart.deliveryFee > 0
                ? shortPrice(app, cart.deliveryFee)
                : t('free'),
          ),
          const Divider(height: 24, color: Ember.line),
          line(t('total'), shortPrice(app, cart.total), bold: true),
          const SizedBox(height: 20),
          if (cart.promoCode != null)
            Row(
              children: [
                const Icon(Icons.local_offer_outlined, color: Ember.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${cart.promoCode} ${t('promo_active')}',
                    style: Ember.text(14, weight: FontWeight.w700),
                  ),
                ),
                TextButton(
                  onPressed: () => cart.setPromo(null, 0),
                  child: Text(
                    t('remove_promo'),
                    style: Ember.text(13, color: Ember.red),
                  ),
                ),
              ],
            )
          else
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: KitField(
                    label: t('apply_coupon'),
                    controller: _code,
                    hint: t('promo_placeholder'),
                    action: TextInputAction.done,
                    onSubmitted: (_) => _apply(),
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 96,
                  child: PrimaryButton(
                    t('apply'),
                    loading: _busy,
                    onPressed: _apply,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

/// Checkout: contact details and the payment method, in the kit form style.
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
    Widget gap() => const SizedBox(height: 24);

    Widget method(String value, IconData icon, String label) {
      final on = _payment == value;
      return Expanded(
        child: Semantics(
          button: true,
          selected: on,
          label: label,
          excludeSemantics: true,
          child: GestureDetector(
            onTap: () => setState(() => _payment = value),
            child: Column(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      height: 72,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Ember.field,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: on ? Ember.orange : Ember.field,
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        icon,
                        size: 30,
                        color: on ? Ember.orange : Ember.text3,
                      ),
                    ),
                    if (on)
                      Positioned(
                        right: -6,
                        top: -6,
                        child: Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: Ember.orange,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.check_rounded,
                            size: 13,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: Ember.text(14, color: Ember.text3),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return EmberScaffold(
      header: TopBar(title: t('checkout_title')),
      bottom: Container(
        padding: EdgeInsets.fromLTRB(
          24,
          16,
          24,
          16 + MediaQuery.paddingOf(context).bottom,
        ),
        color: Colors.white,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  '${t('total').toUpperCase()}:',
                  style: Ember.text(14, color: Ember.text2),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      shortPrice(app, cart.total),
                      style: Ember.text(30, color: Ember.navy),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              t('place_order'),
              loading: _busy,
              onPressed: cart.items.isEmpty ? null : _submit,
            ),
          ],
        ),
      ),
      children: [
        const SizedBox(height: 24),
        Row(
          children: [
            method('cash', Icons.payments_outlined, t('pay_cash')),
            const SizedBox(width: 16),
            method('card', Icons.credit_card_rounded, t('pay_card')),
          ],
        ),
        gap(),
        Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              KitField(
                label: t('full_name'),
                controller: _name,
                autofill: const [AutofillHints.name],
                validator: (v) => required(v, 2),
              ),
              gap(),
              KitField(
                label: t('phone'),
                controller: _phone,
                hint: '+993 6X XX XX XX',
                keyboard: TextInputType.phone,
                autofill: const [AutofillHints.telephoneNumber],
                validator: (v) =>
                    RegExp(r'^\+?[\d\s()\-]{6,20}$').hasMatch(v?.trim() ?? '')
                    ? null
                    : t('invalid_phone'),
              ),
              gap(),
              KitField(
                label: t('email_optional'),
                controller: _email,
                hint: 'example@gmail.com',
                keyboard: TextInputType.emailAddress,
                autofill: const [AutofillHints.email],
              ),
              if (delivery) ...[
                gap(),
                KitField(
                  label: t('delivery_address'),
                  controller: _address,
                  autofill: const [AutofillHints.fullStreetAddress],
                  validator: (v) => required(v, 5),
                ),
              ],
              gap(),
              KitField(
                label: t('notes_optional'),
                controller: _notes,
                maxLines: 3,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
