import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

/// Shared frame for auth screens: logo, navy header with orange icon, card.
class _AuthFrame extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final List<Widget> children;
  const _AuthFrame({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.children,
  });
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Ember.section,
      appBar: AppBar(
        backgroundColor: Ember.section,
        elevation: 0,
        title: const EmberLogo(height: 32),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(18),
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
                    color: Ember.navy,
                    padding: const EdgeInsets.all(22),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 26,
                          backgroundColor: Ember.orange,
                          child: Icon(icon, color: Colors.white),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: Ember.text(
                                  22,
                                  weight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                subtitle,
                                style: Ember.text(13, color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: children,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Widget _gap() => const SizedBox(height: 14);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(), _password = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    final app = context.read<AppState>();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await Api.instance.login(_email.text.trim(), _password.text);
      await app.signedIn(res);
      if (mounted) Navigator.pop(context);
    } on ApiError catch (e) {
      setState(
        () =>
            _error = e.status == 401 ? app.t('invalid_credentials') : e.message,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    return _AuthFrame(
      icon: Icons.login,
      title: t('welcome_back'),
      subtitle: t('login_subtitle'),
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error!, style: Ember.text(14, color: Ember.red)),
          ),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          decoration: InputDecoration(
            labelText: t('email'),
            prefixIcon: const Icon(Icons.mail_outline),
          ),
        ),
        _gap(),
        TextField(
          controller: _password,
          obscureText: true,
          autofillHints: const [AutofillHints.password],
          onSubmitted: (_) => _submit(),
          decoration: InputDecoration(
            labelText: t('password'),
            prefixIcon: const Icon(Icons.lock_outline),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ForgotScreen()),
            ),
            child: Text(
              t('forgot_password'),
              style: Ember.text(13, color: Ember.orange),
            ),
          ),
        ),
        OrangeButton(
          _busy ? t('logging_in') : t('log_in'),
          onPressed: _busy ? null : _submit,
          height: 56,
        ),
        _gap(),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(t('no_account'), style: Ember.text(14)),
            TextButton(
              onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const RegisterScreen()),
              ),
              child: Text(
                t('create_one'),
                style: Ember.text(
                  14,
                  weight: FontWeight.w600,
                  color: Ember.orange,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController(),
      _email = TextEditingController(),
      _password = TextEditingController(),
      _code = TextEditingController();
  bool _busy = false, _otp = false;
  String? _error;

  Future<void> _run(Future<void> Function() f) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await f();
    } on ApiError catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    if (_otp) {
      return _AuthFrame(
        icon: Icons.mark_email_read_outlined,
        title: t('verify_email'),
        subtitle: t('code_sent_to', {'email': _email.text.trim()}),
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: Ember.text(14, color: Ember.red)),
            ),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            autofillHints: const [AutofillHints.oneTimeCode],
            style: Ember.text(
              28,
              weight: FontWeight.w700,
            ).copyWith(letterSpacing: 12),
            decoration: const InputDecoration(counterText: ''),
          ),
          _gap(),
          OrangeButton(
            _busy ? t('verifying') : t('verify_account'),
            height: 56,
            onPressed: _busy
                ? null
                : () => _run(() async {
                    final res = await Api.instance.verifyOtp(
                      _email.text.trim(),
                      _code.text.trim(),
                    );
                    await app.signedIn(res);
                    if (context.mounted) Navigator.pop(context);
                  }),
          ),
          TextButton(
            onPressed: () => _run(() async {
              await Api.instance.resendOtp(_email.text.trim());
              if (context.mounted) showMessage(context, t('new_code_sent'));
            }),
            child: Text(
              '${t('no_code')} ${t('resend')}',
              style: Ember.text(
                14,
                weight: FontWeight.w600,
                color: Ember.orange,
              ),
            ),
          ),
        ],
      );
    }
    return _AuthFrame(
      icon: Icons.person_add_alt,
      title: t('create_account_title'),
      subtitle: t('register_subtitle'),
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error!, style: Ember.text(14, color: Ember.red)),
          ),
        TextField(
          controller: _name,
          autofillHints: const [AutofillHints.name],
          decoration: InputDecoration(
            labelText: t('full_name'),
            prefixIcon: const Icon(Icons.person_outline),
          ),
        ),
        _gap(),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: t('email'),
            prefixIcon: const Icon(Icons.mail_outline),
          ),
        ),
        _gap(),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: InputDecoration(
            labelText: t('password'),
            helperText: t('password_hint'),
            prefixIcon: const Icon(Icons.lock_outline),
          ),
        ),
        _gap(),
        OrangeButton(
          _busy ? t('creating_account') : t('create_account'),
          height: 56,
          onPressed: _busy
              ? null
              : () => _run(() async {
                  if (_password.text.length < 8) {
                    throw ApiError(400, t('password_too_short'));
                  }
                  await Api.instance.register(
                    _name.text.trim(),
                    _email.text.trim(),
                    _password.text,
                  );
                  setState(() => _otp = true);
                }),
        ),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(t('have_account'), style: Ember.text(14)),
            TextButton(
              onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              ),
              child: Text(
                t('log_in'),
                style: Ember.text(
                  14,
                  weight: FontWeight.w600,
                  color: Ember.orange,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class ForgotScreen extends StatefulWidget {
  const ForgotScreen({super.key});
  @override
  State<ForgotScreen> createState() => _ForgotScreenState();
}

class _ForgotScreenState extends State<ForgotScreen> {
  final _email = TextEditingController();
  bool _sent = false, _busy = false;
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    return _AuthFrame(
      icon: Icons.key,
      title: t('reset_title'),
      subtitle: t('reset_subtitle'),
      children: [
        if (_sent)
          Text(
            t('reset_sent'),
            textAlign: TextAlign.center,
            style: Ember.text(15),
          )
        else ...[
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: t('email'),
              prefixIcon: const Icon(Icons.mail_outline),
            ),
          ),
          _gap(),
          OrangeButton(
            _busy ? t('sending') : t('send_reset_link'),
            height: 56,
            onPressed: _busy
                ? null
                : () async {
                    setState(() => _busy = true);
                    try {
                      await Api.instance.forgotPassword(_email.text.trim());
                      setState(() => _sent = true);
                    } on ApiError catch (e) {
                      if (context.mounted) {
                        showMessage(context, e.message, error: true);
                      }
                    } finally {
                      if (mounted) setState(() => _busy = false);
                    }
                  },
          ),
        ],
      ],
    );
  }
}
