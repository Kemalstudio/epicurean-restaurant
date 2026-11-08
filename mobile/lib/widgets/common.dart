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

/// Network photo with the kit's blue-gray placeholder.
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
      color: Ember.placeholder,
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

/// Kit round button (45 px): light gray with a dark icon, or the dark
/// variant used on the cart / login screens.
class RoundButton extends StatelessWidget {
  final Widget icon;
  final VoidCallback? onTap;
  final String tooltip;
  final double size;
  final Color color;
  const RoundButton({
    super.key,
    required this.icon,
    required this.onTap,
    required this.tooltip,
    this.size = 45,
    this.color = Ember.button,
  });
  @override
  Widget build(BuildContext context) => Tooltip(
    message: tooltip,
    child: Material(
      color: color,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: size,
          height: size,
          child: Center(child: icon),
        ),
      ),
    ),
  );
}

/// Round "<" button. [dark] is for the dark cart / login screens.
class BackButtonKit extends StatelessWidget {
  final bool dark, white;
  final VoidCallback? onTap;
  const BackButtonKit({
    super.key,
    this.dark = false,
    this.white = false,
    this.onTap,
  });
  @override
  Widget build(BuildContext context) => RoundButton(
    tooltip: MaterialLocalizations.of(context).backButtonTooltip,
    color: dark
        ? Ember.darkCard
        : white
        ? Colors.white
        : Ember.button,
    onTap: onTap ?? () => Navigator.maybePop(context),
    icon: Icon(
      Icons.chevron_left_rounded,
      size: 26,
      color: dark ? Colors.white : Ember.navy,
    ),
  );
}

/// Kit menu glyph: three left-aligned lines, the middle one longest.
class MenuGlyph extends StatelessWidget {
  const MenuGlyph({super.key});
  @override
  Widget build(BuildContext context) => SizedBox(
    width: 18,
    height: 14,
    child: CustomPaint(painter: _MenuGlyphPainter()),
  );
}

class _MenuGlyphPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Ember.navy
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(1, 1), const Offset(9, 1), p);
    canvas.drawLine(const Offset(1, 7), const Offset(17, 7), p);
    canvas.drawLine(const Offset(1, 13), const Offset(12, 13), p);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Kit dark cart button with the orange count badge.
class CartButton extends StatelessWidget {
  final VoidCallback onTap;
  const CartButton({super.key, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final count = context.watch<CartState>().count;
    return Semantics(
      button: true,
      label: '${app.t('open_basket')}: $count',
      excludeSemantics: true,
      child: SizedBox(
        width: 45,
        height: 49,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              top: 4,
              left: 0,
              child: RoundButton(
                tooltip: app.t('open_basket'),
                color: Ember.navy,
                onTap: onTap,
                icon: const Icon(
                  Icons.shopping_bag_outlined,
                  color: Colors.white,
                  size: 21,
                ),
              ),
            ),
            if (count > 0)
              Positioned(
                top: 0,
                right: 0,
                child: IgnorePointer(
                  child: BounceOnChange(
                    value: count,
                    child: Container(
                      constraints: const BoxConstraints(minWidth: 25),
                      height: 25,
                      padding: const EdgeInsets.symmetric(horizontal: 5),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Ember.orange,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Text(
                        '$count',
                        style: Ember.text(
                          16,
                          weight: FontWeight.w700,
                          color: Colors.white,
                          height: 1,
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
}

/// Kit screen top bar: back button, 17pt title, optional trailing widget.
class TopBar extends StatelessWidget {
  final String title;
  final Widget? trailing;
  final bool dark;
  final VoidCallback? onBack;
  final bool showBack;
  const TopBar({
    super.key,
    required this.title,
    this.trailing,
    this.dark = false,
    this.onBack,
    this.showBack = true,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(24, 6, 24, 0),
    child: SizedBox(
      height: 49,
      child: Row(
        children: [
          if (showBack) ...[
            BackButtonKit(dark: dark, onTap: onBack),
            const SizedBox(width: 16),
          ],
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Ember.text(17, color: dark ? Colors.white : Ember.navy),
            ),
          ),
          ?trailing,
        ],
      ),
    ),
  );
}

/// Kit search field (62 high, #F6F6F6, radius 10, gray magnifier).
class SearchField extends StatelessWidget {
  final String hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged, onSubmitted;
  final VoidCallback? onTap;
  final bool autofocus;
  const SearchField({
    super.key,
    required this.hint,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.autofocus = false,
  });
  @override
  Widget build(BuildContext context) {
    final readOnly = onTap != null;
    final ctrl = controller;
    return SizedBox(
      height: 62,
      child: TextField(
        controller: ctrl,
        readOnly: readOnly,
        onTap: onTap,
        autofocus: autofocus,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        textInputAction: TextInputAction.search,
        textAlignVertical: TextAlignVertical.center,
        style: Ember.text(14, color: Ember.navy),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: Ember.text(14, color: Ember.address),
          fillColor: Ember.search,
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
          prefixIcon: const Padding(
            padding: EdgeInsets.only(left: 18, right: 10),
            child: Icon(Icons.search_rounded, color: Ember.text2, size: 22),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 50),
          suffixIcon: ctrl == null || readOnly
              ? null
              : ValueListenableBuilder(
                  valueListenable: ctrl,
                  builder: (_, v, _) => v.text.isEmpty
                      ? const SizedBox.shrink()
                      : IconButton(
                          tooltip: MaterialLocalizations.of(
                            context,
                          ).deleteButtonTooltip,
                          onPressed: () {
                            ctrl.clear();
                            onChanged?.call('');
                          },
                          icon: const Icon(
                            Icons.cancel,
                            color: Color(0xFFCDCDCF),
                            size: 20,
                          ),
                        ),
                ),
        ),
      ),
    );
  }
}

/// "All Categories ............ See All >" row.
class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;
  const SectionHeader(this.title, {super.key, this.onSeeAll});
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Ember.text(20, color: Ember.text1),
          ),
        ),
        if (onSeeAll != null)
          InkWell(
            onTap: onSeeAll,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    app.t('see_all'),
                    style: Ember.text(16, color: const Color(0xFF333333)),
                  ),
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: Ember.text2,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// Kit info row: ☆ 4.7   🚚 Free   🕑 20 min (orange line icons).
class MetaRow extends StatelessWidget {
  final num? rating;
  final String? fee, time;
  final double gap;
  const MetaRow({super.key, this.rating, this.fee, this.time, this.gap = 24});
  @override
  Widget build(BuildContext context) {
    Widget item(IconData icon, String text, {bool bold = false}) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Ember.orange, size: 21),
        const SizedBox(width: 6),
        Text(
          text,
          style: Ember.text(
            bold ? 16 : 14,
            weight: bold ? FontWeight.w700 : FontWeight.w400,
            color: Ember.navy,
          ),
        ),
      ],
    );
    return Wrap(
      spacing: gap,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (rating != null)
          item(
            Icons.star_border_rounded,
            rating!.toStringAsFixed(1),
            bold: true,
          ),
        if (fee != null) item(Icons.local_shipping_outlined, fee!),
        if (time != null) item(Icons.access_time_rounded, time!),
      ],
    );
  }
}

/// Kit primary button: orange, 62 high, radius 12, bold uppercase label.
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final double height;
  const PrimaryButton(
    this.label, {
    super.key,
    this.onPressed,
    this.loading = false,
    this.height = 62,
  });
  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    width: double.infinity,
    child: FilledButton(
      onPressed: loading ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: Ember.orange,
        disabledBackgroundColor: Ember.orange.withValues(alpha: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 20),
      ),
      child: loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2.4,
                color: Colors.white,
              ),
            )
          : Text(
              label.toUpperCase(),
              textAlign: TextAlign.center,
              maxLines: 2,
              style: Ember.text(
                14,
                weight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
    ),
  );
}

/// Small kit buttons from "My Orders": filled orange or orange outline.
class SmallButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool outline;
  const SmallButton(
    this.label, {
    super.key,
    this.onPressed,
    this.outline = false,
  });
  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(6),
      side: const BorderSide(color: Ember.orange),
    );
    return SizedBox(
      height: 38,
      child: Material(
        color: outline ? Colors.white : Ember.orange,
        shape: shape,
        child: InkWell(
          onTap: onPressed,
          customBorder: shape,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Ember.text(
                  12,
                  weight: FontWeight.w700,
                  color: outline ? Ember.orange : Colors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Kit pill chip: white with a light outline, orange when chosen.
class KitChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  const KitChip(this.label, {super.key, this.selected = false, this.onTap});
  @override
  Widget build(BuildContext context) {
    final shape = StadiumBorder(
      side: BorderSide(
        color: selected ? Ember.orange : const Color(0xFFEDEDED),
        width: 2,
      ),
    );
    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? Ember.orange : Colors.white,
        shape: shape,
        child: InkWell(
          onTap: onTap,
          customBorder: shape,
          child: Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            alignment: Alignment.center,
            child: Text(
              label,
              maxLines: 1,
              style: Ember.text(
                16,
                color: selected ? Colors.white : Ember.navy,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Uppercase field label + kit gray field (login, checkout, address forms).
class KitField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboard;
  final String? Function(String?)? validator;
  final int maxLines;
  final Widget? suffix, prefix;
  final Iterable<String>? autofill;
  final TextInputAction? action;
  final ValueChanged<String>? onSubmitted;
  const KitField({
    super.key,
    required this.label,
    this.controller,
    this.hint,
    this.obscure = false,
    this.keyboard,
    this.validator,
    this.maxLines = 1,
    this.suffix,
    this.prefix,
    this.autofill,
    this.action,
    this.onSubmitted,
  });
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label.toUpperCase(), style: Ember.text(13, color: Ember.text1)),
      const SizedBox(height: 8),
      TextFormField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboard,
        validator: validator,
        maxLines: obscure ? 1 : maxLines,
        autofillHints: autofill,
        textInputAction: action,
        onFieldSubmitted: onSubmitted,
        style: Ember.text(14, color: Ember.navy),
        decoration: InputDecoration(
          hintText: hint,
          suffixIcon: suffix,
          prefixIcon: prefix,
        ),
      ),
    ],
  );
}

/// Kit quantity stepper: dark pill with round − / + buttons.
class QtyStepper extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final bool compact;
  const QtyStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.compact = false,
  });
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppState>();
    final b = compact ? 22.0 : 24.0;
    Widget btn(IconData icon, VoidCallback? onTap, String tip) => Tooltip(
      message: tip,
      child: InkResponse(
        onTap: onTap,
        radius: 22,
        child: Container(
          width: b,
          height: b,
          decoration: BoxDecoration(
            color: Ember.darkStep.withValues(alpha: onTap == null ? 0.5 : 1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: compact ? 14 : 16, color: Colors.white),
        ),
      ),
    );
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        btn(
          Icons.remove_rounded,
          value > min ? () => onChanged(value - 1) : null,
          app.t('decrease_quantity'),
        ),
        SizedBox(
          width: compact ? 34 : 44,
          child: Text(
            '$value',
            textAlign: TextAlign.center,
            style: Ember.text(16, weight: FontWeight.w700, color: Colors.white),
          ),
        ),
        btn(
          Icons.add_rounded,
          () => onChanged(value + 1),
          app.t('increase_quantity'),
        ),
      ],
    );
    if (compact) return row;
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Ember.dark,
        borderRadius: BorderRadius.circular(50),
      ),
      child: row,
    );
  }
}

/// Kit popup: white sheet (radius 20) over the dark backdrop, close button
/// in the corner.
Future<T?> showEmberPopup<T>(
  BuildContext context, {
  required Widget child,
  double inset = 24,
  bool showClose = true,
}) {
  return showDialog<T>(
    context: context,
    barrierColor: Ember.backdrop,
    builder: (ctx) => Dialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      insetPadding: EdgeInsets.symmetric(horizontal: inset, vertical: 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          child,
          if (showClose)
            Positioned(
              right: 12,
              top: 12,
              child: RoundButton(
                size: 40,
                tooltip: MaterialLocalizations.of(ctx).closeButtonLabel,
                onTap: () => Navigator.of(ctx).pop(),
                icon: const Icon(
                  Icons.close_rounded,
                  size: 20,
                  color: Ember.navy,
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

void showMessage(BuildContext context, String text, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(text),
      backgroundColor: error ? Ember.red : Ember.navy,
    ),
  );
}
