import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import '../screens/auth.dart';
import '../screens/shell.dart';
import 'common.dart';
import 'join.dart';

/// The kit's two store badges (App Store + Google Play, 284 x 42 artwork).
class StoreBadges extends StatelessWidget {
  final double width;
  const StoreBadges({super.key, this.width = 284});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Semantics(
      button: true,
      label: app.t('app_coming_soon'),
      excludeSemantics: true,
      child: GestureDetector(
        onTap: () => showMessage(context, app.t('app_coming_soon')),
        child: SvgPicture.asset(
          'assets/kit/app_badges.svg',
          width: width,
          height: width * 42 / 284,
        ),
      ),
    );
  }
}

/// Text page popup (legal pages, help).
void showTextPage(BuildContext context, String title, String body) {
  showEmberPopup(
    context,
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(26, 48, 26, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Ember.text(24, weight: FontWeight.w700, color: Ember.navy),
          ),
          const SizedBox(height: 16),
          for (final p in body.split('\n'))
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(p, style: Ember.text(15, height: 1.6)),
            ),
        ],
      ),
    ),
  );
}

/// Kit footer: gray band with the logo, store badges, company line,
/// "Get Exclusive Deals in your Inbox", social icons, legal pages and
/// important links, then the navy copyright bar.
class KitFooter extends StatefulWidget {
  const KitFooter({super.key});
  @override
  State<KitFooter> createState() => _KitFooterState();
}

class _KitFooterState extends State<KitFooter> {
  final _email = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _subscribe() async {
    final t = context.read<AppState>().t;
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      showMessage(context, t('invalid_email'), error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      await Api.instance.subscribe(email);
      _email.clear();
      if (mounted) showMessage(context, t('subscribed'));
    } on ApiError catch (e) {
      if (mounted) showMessage(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final t = app.t;
    void join(bool partner) => showJoinForm(
      context,
      partner: partner,
      onLogin: () => go(context, const LoginScreen()),
    );
    Widget heading(String text) => Text(
      text,
      style: Ember.text(
        18,
        weight: FontWeight.w700,
        color: Ember.navy,
        height: 43 / 18,
      ),
    );
    Widget link(String text, VoidCallback onTap) => Semantics(
      link: true,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 43,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              text,
              style: Ember.text(
                15,
              ).copyWith(decoration: TextDecoration.underline),
            ),
          ),
        ),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: Ember.footerBand,
          padding: const EdgeInsets.fromLTRB(26, 58, 26, 45),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Center(child: EmberLogo(height: 66)),
              const SizedBox(height: 31),
              const Center(child: StoreBadges(width: 361)),
              const SizedBox(height: 20),
              Text(
                t('company_line'),
                textAlign: TextAlign.center,
                style: Ember.text(15),
              ),
              const SizedBox(height: 64),
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: heading(t('footer_deals_title')),
              ),
              const SizedBox(height: 13),
              Container(
                height: 59,
                decoration: BoxDecoration(
                  color: Ember.gray,
                  borderRadius: BorderRadius.circular(Ember.pill),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        onSubmitted: (_) => _subscribe(),
                        style: Ember.text(14),
                        decoration: InputDecoration(
                          hintText: 'youremail@gmail.com',
                          hintStyle: Ember.text(14, color: Colors.black54),
                          filled: false,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.only(left: 25),
                        ),
                      ),
                    ),
                    Material(
                      color: Ember.orange,
                      shape: const StadiumBorder(),
                      child: InkWell(
                        customBorder: const StadiumBorder(),
                        onTap: _sending ? null : _subscribe,
                        child: Container(
                          height: 59,
                          constraints: const BoxConstraints(minWidth: 171),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          alignment: Alignment.center,
                          child: Text(
                            t('subscribe'),
                            style: Ember.text(
                              18,
                              weight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                t('no_spam'),
                textAlign: TextAlign.center,
                style: Ember.text(13, color: Ember.navy),
              ),
              const SizedBox(height: 22),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (final s in const [
                    'facebook',
                    'instagram',
                    'tiktok',
                    'snapchat',
                  ])
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 7),
                      child: Semantics(
                        label: s,
                        child: KitImage(s, size: 45),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 46),
              Padding(
                padding: const EdgeInsets.only(left: 19),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    heading(t('legal_pages')),
                    for (final (key, body) in const [
                      ('terms', 'legal_terms_body'),
                      ('privacy', 'legal_privacy_body'),
                      ('cookies', 'legal_cookies_body'),
                      ('pricing', 'legal_pricing_body'),
                    ])
                      link(
                        t(key),
                        () => showTextPage(context, t(key), t(body)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Padding(
                padding: const EdgeInsets.only(left: 25),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    heading(t('important_links')),
                    link(
                      t('get_help'),
                      () => showTextPage(
                        context,
                        t('get_help'),
                        '${t('q_late_a')}\n${t('q_wrong_a')}\n${t('q_contact_a')}',
                      ),
                    ),
                    link(t('add_restaurant'), () => join(true)),
                    link(t('sign_up_deliver'), () => join(false)),
                    link(t('create_business_account'), () => join(true)),
                  ],
                ),
              ),
            ],
          ),
        ),
        Container(
          color: Ember.navy,
          constraints: const BoxConstraints(minHeight: 83),
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Text(
            t('copyright_line', {'year': DateTime.now().year}),
            textAlign: TextAlign.center,
            style: Ember.text(15, color: Colors.white),
          ),
        ),
      ],
    );
  }
}
