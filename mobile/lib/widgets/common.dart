import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../core/config.dart';
import '../core/state.dart';
import '../core/theme.dart';
import 'animated.dart';

double numOf(dynamic v, [double f = 0]) =>
    v is num ? v.toDouble() : (double.tryParse('$v') ?? f);

/// Network photo with gray placeholder (kit placeholder color).
class NetImage extends StatelessWidget {
  final String? url;
  final BoxFit fit;
  final double? width, height;
  const NetImage(
    this.url, {
    super.key,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });
  @override
  Widget build(BuildContext context) {
    final src = AppConfig.image(url);
    final placeholder = Container(
      width: width,
      height: height,
      color: Ember.gray,
    );
    if (src.isEmpty) return placeholder;
    return CachedNetworkImage(
      imageUrl: src,
      fit: fit,
      width: width,
      height: height,
      placeholder: (_, _) => placeholder,
      errorWidget: (_, _, _) => placeholder,
    );
  }
}

class EmberLogo extends StatelessWidget {
  final double height;
  final bool white;
  const EmberLogo({super.key, this.height = 38, this.white = false});
  @override
  Widget build(BuildContext context) => SvgPicture.asset(
    white ? 'assets/brand/ember-logo-white.svg' : 'assets/brand/ember-logo.svg',
    height: height,
    semanticsLabel: 'Ember',
  );
}

/// Kit header: logo | hamburger, then orange account block + green basket block, then address line.
class EmberHeader extends StatelessWidget {
  final VoidCallback onMenu, onAccount, onBasket, onAddress;
  const EmberHeader({
    super.key,
    required this.onMenu,
    required this.onAccount,
    required this.onBasket,
    required this.onAddress,
  });
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final cart = context.watch<CartState>();
    final name = app.user?['name'] ?? app.user?['email'];
    return Column(
      children: [
        Container(
          height: 91,
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.black)),
          ),
          child: Row(
            children: [
              const Padding(
                padding: EdgeInsets.only(left: 16),
                child: EmberLogo(),
              ),
              const Spacer(),
              Container(
                width: 107,
                decoration: const BoxDecoration(
                  border: Border(left: BorderSide(color: Colors.black)),
                ),
                child: IconButton(
                  onPressed: onMenu,
                  icon: const Icon(Icons.menu, size: 52),
                  tooltip: app.t('open_menu'),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 77,
          child: Row(
            children: [
              Expanded(
                child: Semantics(
                  container: true,
                  child: MergeSemantics(
                    child: InkWell(
                      onTap: onAccount,
                      child: Container(
                        color: Ember.orange,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: Colors.white,
                              child: name == null
                                  ? const Icon(
                                      Icons.person_outline,
                                      color: Ember.orange,
                                    )
                                  : Text(
                                      '$name'.characters.first.toUpperCase(),
                                      style: Ember.text(
                                        16,
                                        weight: FontWeight.w700,
                                        color: Ember.orange,
                                      ),
                                    ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                name == null ? app.t('login_signup') : '$name',
                                overflow: TextOverflow.ellipsis,
                                style: Ember.text(14, weight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Semantics(
                  container: true,
                  button: true,
                  label: '${app.t('open_basket')}: ${app.price(cart.total)}',
                  excludeSemantics: true,
                  child: InkWell(
                    onTap: onBasket,
                    child: Container(
                      color: Ember.green,
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          BounceOnChange(
                            value: cart.count,
                            child: Badge(
                              isLabelVisible: cart.count > 0,
                              label: Text('${cart.count}'),
                              backgroundColor: Ember.orange,
                              child: const Icon(
                                Icons.shopping_basket_outlined,
                                color: Colors.white,
                                size: 42,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Text(
                            app.price(cart.total),
                            style: Ember.text(
                              16,
                              weight: FontWeight.w600,
                              color: Colors.white,
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
        Semantics(
          container: true,
          button: true,
          label: app.address.isEmpty
              ? app.t('no_address')
              : '${app.t('change_location')}: ${app.address}',
          excludeSemantics: true,
          child: InkWell(
            onTap: onAddress,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.location_on, size: 24),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      app.address.isEmpty ? app.t('no_address') : app.address,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(14),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Navy discount badge with rounded bottom corners.
class DiscountBadge extends StatelessWidget {
  final num percent;
  final double width, height, font;
  const DiscountBadge(
    this.percent, {
    super.key,
    this.width = 46,
    this.height = 38,
    this.font = 15,
  });
  @override
  Widget build(BuildContext context) => Container(
    width: width,
    height: height,
    alignment: Alignment.center,
    decoration: const BoxDecoration(
      color: Ember.navy,
      borderRadius: BorderRadius.vertical(
        bottom: Radius.circular(Ember.radius),
      ),
    ),
    child: Text(
      '−$percent%',
      style: Ember.text(font, weight: FontWeight.w700, color: Colors.white),
    ),
  );
}

/// Mobile deal card (150x150 photo + text below).
class DealCardSmall extends StatelessWidget {
  final Map<String, dynamic> r;
  final VoidCallback onTap;
  const DealCardSmall(this.r, {super.key, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Semantics(
      container: true,
      button: true,
      label: '${r['name']}, −${r['discount_percent']}%',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: SizedBox(
          width: 150,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(Ember.radius),
                child: SizedBox(
                  height: 150,
                  width: 150,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      NetImage(r['cover_url'] ?? r['hero_image_url']),
                      const DecoratedBox(
                        decoration: BoxDecoration(gradient: Ember.dealGradient),
                      ),
                      if (numOf(r['discount_percent']) > 0)
                        Positioned(
                          right: 16,
                          top: 0,
                          child: DiscountBadge(r['discount_percent']),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                app.t('restaurant_word'),
                style: Ember.text(
                  13,
                  weight: FontWeight.w500,
                  color: Ember.orange,
                ),
              ),
              Text(
                '${r['name']}',
                maxLines: 2,
                style: Ember.text(14, weight: FontWeight.w600, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Popular category tile: photo + navy footer, orange title, white count.
class CuisineTile extends StatelessWidget {
  final Map<String, dynamic> c;
  final VoidCallback onTap;
  const CuisineTile(this.c, {super.key, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Semantics(
      container: true,
      button: true,
      label:
          '${c['name']}, ${app.t('restaurants_count', {'count': c['restaurant_count']})}',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(Ember.radius),
          child: Container(
            color: Ember.navy,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AspectRatio(
                  aspectRatio: 238 / 203,
                  child: NetImage(c['image_url']),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${c['name']}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Ember.text(
                          14,
                          weight: FontWeight.w700,
                          color: Ember.orange,
                        ),
                      ),
                      Text(
                        app.t('restaurants_count', {
                          'count': c['restaurant_count'],
                        }),
                        style: Ember.text(12, color: Colors.white),
                      ),
                    ],
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

/// Popular restaurant tile: photo + orange footer with white name.
class RestaurantTile extends StatelessWidget {
  final Map<String, dynamic> r;
  final VoidCallback onTap;
  final double width;
  const RestaurantTile(
    this.r, {
    super.key,
    required this.onTap,
    this.width = 122,
  });
  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    button: true,
    label: '${r['name']}',
    excludeSemantics: true,
    child: GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: width,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(Ember.radius),
          child: Container(
            color: Ember.orange,
            child: Column(
              children: [
                AspectRatio(aspectRatio: 1, child: NetImage(r['logo_url'])),
                Container(
                  height: 50,
                  alignment: Alignment.center,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    '${r['name']}',
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    style: Ember.text(
                      13,
                      weight: FontWeight.w700,
                      color: Colors.white,
                      height: 1.15,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  final String text;
  final Widget? trailing;
  const SectionTitle(this.text, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(
      children: [
        Expanded(
          child: Text(text, style: Ember.text(16, weight: FontWeight.w700)),
        ),
        ?trailing,
      ],
    ),
  );
}

/// Orange pill button.
class OrangeButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final double height;
  final IconData? icon;
  const OrangeButton(
    this.label, {
    super.key,
    this.onPressed,
    this.height = 52,
    this.icon,
  });
  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    child: FilledButton.icon(
      onPressed: onPressed,
      icon: icon == null ? const SizedBox.shrink() : Icon(icon, size: 20),
      label: Text(
        label,
        style: Ember.text(16, weight: FontWeight.w600, color: Colors.white),
      ),
      style: FilledButton.styleFrom(
        backgroundColor: Ember.orange,
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 28),
      ),
    ),
  );
}

/// Green action button with white round arrow (kit "Checkout!" / "Next Step").
class GreenButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final double height;
  const GreenButton(this.label, {super.key, this.onPressed, this.height = 70});
  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Material(
      color: enabled ? Ember.green : Ember.pink,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          height: height,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Positioned(
                left: 20,
                child: Container(
                  width: 35,
                  height: 35,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_forward,
                    color: enabled ? Ember.green : Ember.pink,
                    size: 22,
                  ),
                ),
              ),
              Text(
                label,
                style: Ember.text(
                  height > 60 ? 24 : 18,
                  weight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Kit popup: white card with orange round close button on the top-right corner.
Future<T?> showEmberPopup<T>(BuildContext context, {required Widget child}) {
  return showDialog<T>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.7),
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 22, vertical: 40),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(Ember.radius),
              boxShadow: Ember.popupShadow,
            ),
            clipBehavior: Clip.antiAlias,
            child: child,
          ),
          Positioned(
            right: -14,
            top: -24,
            child: Material(
              color: Ember.orange,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () => Navigator.of(ctx).pop(),
                child: const SizedBox(
                  width: 58,
                  height: 58,
                  child: Icon(Icons.close, color: Colors.white, size: 34),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class Stars extends StatelessWidget {
  final num value;
  final double size;
  const Stars(this.value, {super.key, this.size = 14});
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      for (var i = 1; i <= 5; i++)
        Icon(
          Icons.star_rounded,
          size: size,
          color: i <= value.round() ? Ember.orange : Ember.gray,
        ),
    ],
  );
}

/// Red chilli scale 0–5.
class SpiceLevel extends StatelessWidget {
  final int level;
  const SpiceLevel(this.level, {super.key});
  @override
  Widget build(BuildContext context) {
    if (level <= 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          for (var i = 1; i <= 5; i++)
            Icon(
              Icons.local_fire_department,
              size: 18,
              color: i <= level ? Ember.chili : const Color(0xFF8E8E8E),
            ),
        ],
      ),
    );
  }
}

void showMessage(BuildContext context, String text, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(text),
      backgroundColor: error ? Ember.red : Ember.navy,
    ),
  );
}
