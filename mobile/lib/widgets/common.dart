import 'dart:math' as math;

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

/// "Label ........ value" row that never overflows: the label wraps onto a
/// second line and a too-wide value (e.g. a big price) scales down to fit.
class LabelValueRow extends StatelessWidget {
  final Widget label, value;
  final double gap;
  const LabelValueRow({
    super.key,
    required this.label,
    required this.value,
    this.gap = 12,
  });
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) => Row(
      children: [
        Expanded(child: label),
        SizedBox(width: gap),
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: box.maxWidth * 0.62),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: value,
          ),
        ),
      ],
    ),
  );
}

/// Network photo with gray placeholder (kit placeholder color).
class NetImage extends StatelessWidget {
  /// Widget tests have no network or cache directory: show placeholders instead.
  static bool disableForTests = false;

  /// Screenshot tests: draw photos from local files instead of the network.
  static Widget Function(String url, BoxFit fit, double? width, double? height)?
  builderForTests;

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
    final test = builderForTests;
    if (test != null && (url ?? '').isNotEmpty) {
      return test(url!, fit, width, height);
    }
    if (src.isEmpty || disableForTests) return placeholder;
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

//// Icon or picture exported from the Figma kit (assets/kit/).
class KitImage extends StatelessWidget {
  final String name;
  final double? size, width, height;
  final BoxFit fit;
  final Color? color;
  const KitImage(
    this.name, {
    super.key,
    this.size,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.color,
  });
  @override
  Widget build(BuildContext context) => Image.asset(
    'assets/kit/${name.contains('.') ? name : '$name.png'}',
    width: width ?? size,
    height: height ?? size,
    fit: fit,
    color: color,
    filterQuality: FilterQuality.medium,
    excludeFromSemantics: true,
  );
}

/// Kit header (430 wide): logo | menu icon, the orange account block and
/// green basket block (77 high), then the address line.
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
          height: 92,
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: Ember.rule)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Padding(
                padding: EdgeInsets.only(left: 16),
                child: Center(child: EmberLogo()),
              ),
              const Spacer(),
              Container(
                width: 107,
                decoration: const BoxDecoration(
                  border: Border(left: BorderSide(color: Ember.rule)),
                ),
                child: Semantics(
                  button: true,
                  label: app.t('open_menu'),
                  child: InkWell(
                    onTap: onMenu,
                    child: const Center(child: KitImage('menu', size: 65)),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 77,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 210,
                child: Semantics(
                  container: true,
                  child: MergeSemantics(
                    child: Material(
                      color: Ember.orange,
                      child: InkWell(
                        onTap: onAccount,
                        child: Padding(
                          padding: const EdgeInsets.only(left: 30, right: 8),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                alignment: Alignment.center,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: name == null
                                    ? const Icon(
                                        Icons.person,
                                        color: Ember.orange,
                                        size: 28,
                                      )
                                    : Text(
                                        '$name'.characters.first.toUpperCase(),
                                        style: Ember.text(
                                          18,
                                          weight: FontWeight.w700,
                                          color: Ember.orange,
                                        ),
                                      ),
                              ),
                              const SizedBox(width: 11),
                              Expanded(
                                child: Text(
                                  name == null
                                      ? app.t('login_signup')
                                      : '$name',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Ember.text(
                                    14,
                                    weight: FontWeight.w600,
                                    height: 1.2,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                flex: 220,
                child: Semantics(
                  container: true,
                  button: true,
                  label: '${app.t('open_basket')}: ${app.price(cart.total)}',
                  excludeSemantics: true,
                  child: Material(
                    color: Ember.green,
                    child: InkWell(
                      onTap: onBasket,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 37, right: 8),
                        child: Row(
                          children: [
                            BounceOnChange(
                              value: cart.count,
                              child: Badge(
                                isLabelVisible: cart.count > 0,
                                label: Text('${cart.count}'),
                                backgroundColor: Ember.orange,
                                child: const KitImage('basket', size: 45),
                              ),
                            ),
                            const SizedBox(width: 17),
                            Flexible(
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  app.price(cart.total),
                                  style: Ember.text(
                                    16,
                                    weight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
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
              padding: const EdgeInsets.fromLTRB(16, 11, 34, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const KitImage('location', size: 25),
                  const SizedBox(width: 8),
                  Flexible(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 190),
                      child: Text(
                        app.address.isEmpty ? app.t('no_address') : app.address,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Ember.text(14),
                      ),
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

/// Navy discount badge with rounded bottom corners (kit 46 x 38, radius 4).
class DiscountBadge extends StatelessWidget {
  final num percent;
  final double width, height, font, radius;
  const DiscountBadge(
    this.percent, {
    super.key,
    this.width = 46,
    this.height = 38,
    this.font = 15,
    this.radius = 4,
  });
  @override
  Widget build(BuildContext context) => Container(
    constraints: BoxConstraints(minWidth: width),
    height: height,
    padding: const EdgeInsets.symmetric(horizontal: 4),
    decoration: BoxDecoration(
      color: Ember.navy,
      borderRadius: BorderRadius.vertical(bottom: Radius.circular(radius)),
    ),
    // widthFactor 1: as wide as the text (or [width]), never the whole row
    child: Center(
      widthFactor: 1,
      child: Text(
        '-$percent%',
        style: Ember.text(font, weight: FontWeight.w700, color: Colors.white),
      ),
    ),
  );
}

/// Kit photo gradient (clear -> navy) used on deal, partner and offer cards.
/// [degrees] is the CSS linear-gradient angle from the design.
LinearGradient kitPhotoGradient(double degrees) {
  final r = (degrees - 90) * math.pi / 180;
  final dx = math.cos(r), dy = math.sin(r);
  return LinearGradient(
    begin: Alignment(-dx, -dy),
    end: Alignment(dx, dy),
    colors: const [Color(0x00FFFFFF), Color(0x3003081F), Color(0xE303081F)],
    stops: const [0.0094, 0.5169, 0.879],
  );
}

/// Mobile deal card (kit: 150 x 150 photo, "Restaurant" + bold name below).
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
      label: '${r['name']}, -${r['discount_percent']}%',
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
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: kitPhotoGradient(245.7),
                        ),
                      ),
                      if (numOf(r['discount_percent']) > 0)
                        Positioned(
                          right: 17,
                          top: 0,
                          child: DiscountBadge(r['discount_percent']),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(left: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      app.t('restaurant_word'),
                      style: Ember.text(
                        13,
                        weight: FontWeight.w500,
                        color: Ember.orange,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${r['name']}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(
                        14,
                        weight: FontWeight.w700,
                        color: Ember.navy,
                        height: 17 / 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Popular category tile (kit 189 x 211): photo + navy caption,
/// bold orange title and white count.
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
                Expanded(child: NetImage(c['image_url'])),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 8, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${c['name']}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Ember.text(
                          13,
                          weight: FontWeight.w700,
                          color: Ember.orange,
                          height: 1.3,
                        ),
                      ),
                      Text(
                        app.t('restaurants_count', {
                          'count': c['restaurant_count'],
                        }),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Ember.text(13, color: Colors.white, height: 1.3),
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

/// Popular restaurant tile (kit 122 x 156): logo + orange caption.
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
                SizedBox(
                  height: 104,
                  width: double.infinity,
                  child: NetImage(r['logo_url']),
                ),
                Expanded(
                  child: Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      '${r['name']}',
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(
                        13,
                        weight: FontWeight.w700,
                        color: Colors.white,
                        height: 16 / 13,
                      ),
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

/// Horizontal row of [RestaurantTile]s with a bold title (kit "Popular Restaurants").
class RestaurantStrip extends StatelessWidget {
  final String title;
  final List<Map<String, dynamic>> items;
  final void Function(Map<String, dynamic>) onTap;
  const RestaurantStrip({
    super.key,
    required this.title,
    required this.items,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 21),
        child: Text(title, style: Ember.text(16, weight: FontWeight.w700)),
      ),
      const SizedBox(height: 29),
      SizedBox(
        height: 156,
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 21),
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (_, i) =>
              RestaurantTile(items[i], onTap: () => onTap(items[i])),
        ),
      ),
    ],
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

/// Kit green action button (342 x 70, radius 8) with the white round arrow
/// on the left — "Checkout!" / "Next Step".
class GreenButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final double height;
  const GreenButton(this.label, {super.key, this.onPressed, this.height = 70});
  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
      side: const BorderSide(color: Color(0x1C000000)),
    );
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: Ember.green,
        shape: shape,
        child: InkWell(
          onTap: onPressed,
          customBorder: shape,
          child: SizedBox(
            height: height,
            child: Row(
              children: [
                const SizedBox(width: 20),
                KitImage('forward_white', size: height > 60 ? 35 : 28),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 35, left: 8),
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Ember.text(
                        height > 60 ? 24 : 18,
                        weight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
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

/// Kit "Total to pay  £127.90" bar: 70 high, orange at 80%, radius 8.
class TotalToPay extends StatelessWidget {
  final String label, amount;
  const TotalToPay({super.key, required this.label, required this.amount});
  @override
  Widget build(BuildContext context) => Container(
    constraints: const BoxConstraints(minHeight: 70),
    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 8),
    decoration: BoxDecoration(
      color: const Color(0xCCFC8A06),
      border: Border.all(color: const Color(0x1C000000)),
      borderRadius: BorderRadius.circular(8),
    ),
    child: LabelValueRow(
      label: Text(
        label,
        style: Ember.text(20, weight: FontWeight.w600, color: Colors.white),
      ),
      value: Text(
        amount,
        style: Ember.text(36, weight: FontWeight.w600, color: Colors.white),
      ),
    ),
  );
}

/// Kit gray pill (#F6F6F6, 52 high) with a faded round arrow on the right:
/// "Sort by Pricing", "Choose your free item..", "Apply Coupon Code here".
class KitPill extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Widget? trailing;
  final double height;
  final EdgeInsets padding;
  const KitPill(
    this.label, {
    super.key,
    this.onTap,
    this.trailing,
    this.height = 52,
    this.padding = const EdgeInsets.only(left: 29, right: 12),
  });
  @override
  Widget build(BuildContext context) => Material(
    color: Ember.section,
    shape: const StadiumBorder(side: BorderSide(color: Color(0xFFCFCFCF))),
    child: InkWell(
      onTap: onTap,
      customBorder: const StadiumBorder(),
      child: Container(
        constraints: BoxConstraints(minHeight: height),
        padding: padding,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Ember.text(16),
              ),
            ),
            const SizedBox(width: 10),
            trailing ?? const KitDownArrow(),
          ],
        ),
      ),
    ),
  );
}

/// The kit's faded round "forward" arrow turned to point down (30 x 30, 40%).
class KitDownArrow extends StatelessWidget {
  final double size;
  const KitDownArrow({super.key, this.size = 30});
  @override
  Widget build(BuildContext context) => Opacity(
    opacity: 0.4,
    child: RotatedBox(quarterTurns: 1, child: KitImage('forward', size: size)),
  );
}

/// Kit popup: white card (radius 12) over a near-black backdrop, with the
/// orange round close button sticking out of the top-right corner.
Future<T?> showEmberPopup<T>(
  BuildContext context, {
  required Widget child,
  double inset = 19,
  bool closeInside = false,
  bool showClose = true,
}) {
  return showDialog<T>(
    context: context,
    barrierColor: Ember.backdrop,
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: EdgeInsets.fromLTRB(inset, 56, inset, 32),
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
          if (showClose)
            Positioned(
              right: closeInside ? 22 : -14,
              top: -35,
              child: Semantics(
                button: true,
                label: MaterialLocalizations.of(ctx).closeButtonLabel,
                child: Material(
                  color: Ember.orange,
                  shape: const CircleBorder(),
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => Navigator.of(ctx).pop(),
                    child: SizedBox(
                      width: closeInside ? 70 : 80,
                      height: closeInside ? 70 : 80,
                      child: Center(
                        child: KitImage('close', size: closeInside ? 33 : 38),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

/// Orange kit stars (empty ones gray).
class Stars extends StatelessWidget {
  final num value;
  final double size;
  const Stars(this.value, {super.key, this.size = 14});
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      for (var i = 1; i <= 5; i++)
        Padding(
          padding: EdgeInsets.only(right: size * 0.18),
          child: KitImage(
            'star',
            size: size,
            color: i <= value.round() ? null : const Color(0xFFD9D9D9),
          ),
        ),
    ],
  );
}

/// Kit chilli scale 0–5: tilted chillies, red for the level, gray for the rest.
class SpiceLevel extends StatelessWidget {
  final int level;
  const SpiceLevel(this.level, {super.key});
  @override
  Widget build(BuildContext context) {
    if (level <= 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          for (var i = 1; i <= 5; i++)
            SizedBox(
              width: 18,
              height: 27,
              child: OverflowBox(
                maxWidth: 27,
                child: Transform.rotate(
                  angle: -22.82 * math.pi / 180,
                  child: KitImage(
                    i <= level ? 'chili_red' : 'chili_gray',
                    size: 20.6,
                  ),
                ),
              ),
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
