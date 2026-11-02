import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import 'common.dart';

final _phoneRe = RegExp(r'^\+?[\d\s()-]{6,20}$');

/// "Partner with us" / "Ride with us" application popups (kit "Get Started" buttons).
/// The same applications the website sends from /partner and /rider.
Future<void> showJoinForm(
  BuildContext context, {
  required bool partner,
  required VoidCallback onLogin,
}) {
  final app = context.read<AppState>();
  if (partner && !app.isLoggedIn) {
    // The server links a restaurant application to an account
    return showEmberPopup(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(26, 40, 26, 26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              app.t('partner_login_title'),
              style: Ember.text(22, weight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            Text(
              app.t('partner_login_text'),
              style: Ember.text(15, height: 1.5),
            ),
            const SizedBox(height: 22),
            Builder(
              builder: (ctx) => OrangeButton(
                app.t('log_in'),
                onPressed: () {
                  Navigator.pop(ctx);
                  onLogin();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
  return showEmberPopup(context, child: _JoinForm(partner: partner));
}

class _JoinForm extends StatefulWidget {
  final bool partner;
  const _JoinForm({required this.partner});
  @override
  State<_JoinForm> createState() => _JoinFormState();
}

class _JoinFormState extends State<_JoinForm> {
  final _form = GlobalKey<FormState>();
  late final AppState _app = context.read<AppState>();
  late final _name = TextEditingController(
    text: '${_app.user?['name'] ?? _app.user?['full_name'] ?? ''}',
  );
  late final _email = TextEditingController(
    text: '${_app.user?['email'] ?? ''}',
  );
  final _restaurant = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  String _vehicle = 'scooter';
  bool _sending = false;
  bool _sent = false;

  @override
  void dispose() {
    for (final c in [_name, _email, _restaurant, _phone, _address]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _sending = true);
    try {
      if (widget.partner) {
        await Api.instance.applyPartner({
          'restaurant_name': _restaurant.text.trim(),
          'contact_name': _name.text.trim(),
          'phone': _phone.text.trim(),
          'email': _email.text.trim(),
          'address': _address.text.trim(),
        });
      } else {
        await Api.instance.applyRider({
          'name': _name.text.trim(),
          'phone': _phone.text.trim(),
          'email': _email.text.trim(),
          'vehicle': _vehicle,
          'area': _address.text.trim(),
        });
      }
      if (mounted) setState(() => _sent = true);
    } on ApiError catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = _app.t;
    if (_sent) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(26, 44, 26, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Ember.green, size: 64),
            const SizedBox(height: 16),
            Text(
              t('application_sent'),
              textAlign: TextAlign.center,
              style: Ember.text(22, weight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              t(widget.partner ? 'application_sent_text' : 'rider_sent_text'),
              textAlign: TextAlign.center,
              style: Ember.text(15, height: 1.5),
            ),
          ],
        ),
      );
    }
    String? need(String? v, int min) =>
        (v == null || v.trim().length < min) ? t('please_fill') : null;
    Widget field(
      TextEditingController c,
      String label, {
      TextInputType? type,
      String? Function(String?)? validator,
    }) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        keyboardType: type,
        validator: validator,
        decoration: InputDecoration(labelText: label),
      ),
    );
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 36, 22, 22),
      child: Form(
        key: _form,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              t(widget.partner ? 'partner_form_title' : 'rider_form_title'),
              style: Ember.text(22, weight: FontWeight.w700),
            ),
            const SizedBox(height: 18),
            if (widget.partner)
              field(
                _restaurant,
                '${t('restaurant_name')} *',
                validator: (v) => need(v, 2),
              ),
            field(
              _name,
              '${t(widget.partner ? 'contact_person' : 'full_name')} *',
              type: TextInputType.name,
              validator: (v) => need(v, 2),
            ),
            field(
              _phone,
              '${t('phone')} *',
              type: TextInputType.phone,
              validator: (v) => _phoneRe.hasMatch(v?.trim() ?? '')
                  ? null
                  : t('invalid_phone'),
            ),
            field(
              _email,
              widget.partner ? '${t('email')} *' : t('email_optional'),
              type: TextInputType.emailAddress,
              validator: widget.partner ? (v) => need(v, 5) : null,
            ),
            field(
              _address,
              widget.partner ? '${t('restaurant_address')} *' : t('work_area'),
              validator: widget.partner ? (v) => need(v, 5) : null,
            ),
            if (!widget.partner) ...[
              Padding(
                padding: const EdgeInsets.only(left: 8, bottom: 8),
                child: Text(
                  t('vehicle'),
                  style: Ember.text(14, weight: FontWeight.w600),
                ),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final v in const ['bike', 'scooter', 'car'])
                    ChoiceChip(
                      label: Text(t('vehicle_$v')),
                      selected: _vehicle == v,
                      onSelected: (_) => setState(() => _vehicle = v),
                      selectedColor: Ember.orange,
                      labelStyle: Ember.text(
                        14,
                        color: _vehicle == v ? Colors.white : Colors.black,
                      ),
                      showCheckmark: false,
                      shape: const StadiumBorder(),
                    ),
                ],
              ),
              const SizedBox(height: 16),
            ],
            const SizedBox(height: 6),
            OrangeButton(
              _sending ? t('sending') : t('send_application'),
              onPressed: _sending ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
