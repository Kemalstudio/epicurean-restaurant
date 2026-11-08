import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

/// Kit "Log In" frame: dark top with a centered title and subtitle, white
/// rounded sheet with the form.
class _AuthFrame extends StatelessWidget {
  final String title, subtitle;
  final List<Widget> children;
  const _AuthFrame({
    required this.title,
    required this.subtitle,
    required this.children,
  });
  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Scaffold(
      backgroundColor: Ember.dark,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Stack(
              children: [
                const Positioned.fill(child: _AuthDecor()),
                Padding(
                  padding: EdgeInsets.fromLTRB(24, top + 6, 24, 50),
                  child: Column(
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Navigator.canPop(context)
                            ? const BackButtonKit(white: true)
                            : const SizedBox(height: 45),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: Ember.text(
                          30,
                          weight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        textAlign: TextAlign.center,
                        style: Ember.text(
                          16,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SliverFillRemaining(
            hasScrollBody: false,
            child: Container(
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
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: children,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The kit's faint line fan in the top-left corner of the dark header.
class _AuthDecor extends StatelessWidget {
  const _AuthDecor();
  @override
  Widget build(BuildContext context) =>
      IgnorePointer(child: CustomPaint(painter: _FanPainter()));
}

class _FanPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: 0.06)
      ..strokeWidth = 2;
    const center = Offset(-20, -20);
    for (var a = 0.0; a <= 1.58; a += 0.09) {
      final dir = Offset.fromDirection(a);
      canvas.drawLine(center + dir * 60, center + dir * 150, p);
    }
    final dash = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(size.width - 70, 0)
      ..quadraticBezierTo(
        size.width - 10,
        size.height * 0.35,
        size.width + 20,
        size.height * 0.7,
      );
    for (final m in path.computeMetrics()) {
      for (var d = 0.0; d < m.length; d += 14) {
        canvas.drawPath(m.extractPath(d, d + 7), dash);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

Widget _gap() => const SizedBox(height: 24);

Widget _errorText(String? e) => e == null
    ? const SizedBox.shrink()
    : Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Text(e, style: Ember.text(14, color: Ember.red)),
      );

/// "Don't have an account?  SIGN UP" line.
Widget _switchLine(String text, String action, VoidCallback onTap) => Wrap(
  alignment: WrapAlignment.center,
  crossAxisAlignment: WrapCrossAlignment.center,
  children: [
    Text(text, style: Ember.text(16, color: Ember.text3)),
    TextButton(
      onPressed: onTap,
      child: Text(
        action.toUpperCase(),
        style: Ember.text(14, weight: FontWeight.w700, color: Ember.orange),
      ),
    ),
  ],
);

class _PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final ValueChanged<String>? onSubmitted;
  final bool newPassword;
  const _PasswordField({
    required this.controller,
    required this.label,
    this.onSubmitted,
    this.newPassword = false,
  });
  @override
  State<_PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<_PasswordField> {
  bool _hidden = true;
  @override
  Widget build(BuildContext context) => KitField(
    label: widget.label,
    controller: widget.controller,
    obscure: _hidden,
    hint: '• • • • • • • • • •',
    autofill: [
      widget.newPassword ? AutofillHints.newPassword : AutofillHints.password,
    ],
    onSubmitted: widget.onSubmitted,
    suffix: IconButton(
      tooltip: widget.label,
      onPressed: () => setState(() => _hidden = !_hidden),
      icon: Icon(
        _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        color: const Color(0xFFB4B9CA),
      ),
    ),
  );
}

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
      title: t('log_in'),
      subtitle: t('login_subtitle'),
      children: [
        _errorText(_error),
        KitField(
          label: t('email'),
          controller: _email,
          hint: 'example@gmail.com',
          keyboard: TextInputType.emailAddress,
          autofill: const [AutofillHints.email],
          action: TextInputAction.next,
        ),
        _gap(),
        _PasswordField(
          controller: _password,
          label: t('password'),
          onSubmitted: (_) => _submit(),
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
              style: Ember.text(14, color: Ember.orange),
            ),
          ),
        ),
        const SizedBox(height: 8),
        PrimaryButton(t('log_in'), loading: _busy, onPressed: _submit),
        const SizedBox(height: 28),
        _switchLine(
          t('no_account'),
          t('sign_up'),
          () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const RegisterScreen()),
          ),
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
      // Kit "Verification": code boxes under the dark header
      return _AuthFrame(
        title: t('verify_email'),
        subtitle: t('code_sent_to', {'email': _email.text.trim()}),
        children: [
          _errorText(_error),
          Text(
            t('code').toUpperCase(),
            style: Ember.text(13, color: Ember.text1),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            autofillHints: const [AutofillHints.oneTimeCode],
            style: Ember.text(
              26,
              weight: FontWeight.w700,
              color: Ember.navy,
            ).copyWith(letterSpacing: 14),
            decoration: const InputDecoration(counterText: ''),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => _run(() async {
                await Api.instance.resendOtp(_email.text.trim());
                if (context.mounted) showMessage(context, t('new_code_sent'));
              }),
              child: Text(
                t('resend'),
                style: Ember.text(
                  14,
                  weight: FontWeight.w700,
                  color: Ember.navy,
                ).copyWith(decoration: TextDecoration.underline),
              ),
            ),
          ),
          const SizedBox(height: 8),
          PrimaryButton(
            t('verify_account'),
            loading: _busy,
            onPressed: () => _run(() async {
              final res = await Api.instance.verifyOtp(
                _email.text.trim(),
                _code.text.trim(),
              );
              await app.signedIn(res);
              if (context.mounted) Navigator.pop(context);
            }),
          ),
        ],
      );
    }
    return _AuthFrame(
      title: t('sign_up'),
      subtitle: t('register_subtitle'),
      children: [
        _errorText(_error),
        KitField(
          label: t('full_name'),
          controller: _name,
          hint: 'John Doe',
          autofill: const [AutofillHints.name],
          action: TextInputAction.next,
        ),
        _gap(),
        KitField(
          label: t('email'),
          controller: _email,
          hint: 'example@gmail.com',
          keyboard: TextInputType.emailAddress,
          autofill: const [AutofillHints.email],
          action: TextInputAction.next,
        ),
        _gap(),
        _PasswordField(
          controller: _password,
          label: t('password'),
          newPassword: true,
        ),
        const SizedBox(height: 6),
        Text(t('password_hint'), style: Ember.text(12, color: Ember.text2)),
        const SizedBox(height: 32),
        PrimaryButton(
          t('sign_up'),
          loading: _busy,
          onPressed: () => _run(() async {
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
        const SizedBox(height: 20),
        _switchLine(
          t('have_account'),
          t('log_in'),
          () => Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          ),
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
      title: t('forgot_password'),
      subtitle: t('reset_subtitle'),
      children: [
        if (_sent)
          Text(
            t('reset_sent'),
            textAlign: TextAlign.center,
            style: Ember.text(16, color: Ember.text3, height: 1.5),
          )
        else ...[
          KitField(
            label: t('email'),
            controller: _email,
            hint: 'example@gmail.com',
            keyboard: TextInputType.emailAddress,
            autofill: const [AutofillHints.email],
          ),
          const SizedBox(height: 30),
          PrimaryButton(
            t('send_code'),
            loading: _busy,
            onPressed: () async {
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
