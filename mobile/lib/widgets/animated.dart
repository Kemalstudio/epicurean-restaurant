import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import '../core/api.dart';
import '../core/state.dart';
import '../core/theme.dart';
import 'common.dart';

/// Lottie animations in assets/lottie (Ember artwork; any LottieFiles JSON with the same name works).
enum EmberAnim { loader, emptyBasket, notFound, noInternet, success, delivery }

const _files = {
  EmberAnim.loader: 'loader',
  EmberAnim.emptyBasket: 'empty_basket',
  EmberAnim.notFound: 'not_found',
  EmberAnim.noInternet: 'no_internet',
  EmberAnim.success: 'success',
  EmberAnim.delivery: 'delivery',
};

class EmberLottie extends StatelessWidget {
  final EmberAnim anim;
  final double size;
  final bool repeat;
  final String? semanticLabel;
  const EmberLottie(
    this.anim, {
    super.key,
    this.size = 160,
    this.repeat = true,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    // Respect "reduce motion": show the first frame without looping
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final child = Lottie.asset(
      'assets/lottie/${_files[anim]}.json',
      width: size,
      height: size,
      repeat: repeat && !reduce,
      animate: !reduce || !repeat,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => SizedBox(width: size, height: size),
    );
    return semanticLabel == null
        ? ExcludeSemantics(child: child)
        : Semantics(label: semanticLabel, image: true, child: child);
  }
}

/// Branded loading indicator (flickering Ember flame).
class EmberLoader extends StatelessWidget {
  final double size;
  final EdgeInsets padding;
  const EmberLoader({
    super.key,
    this.size = 72,
    this.padding = const EdgeInsets.all(40),
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: padding,
    child: Center(
      child: EmberLottie(
        EmberAnim.loader,
        size: size,
        semanticLabel: context.read<AppState>().t('loading'),
      ),
    ),
  );
}

/// Empty / error state: animation + title + text + optional action.
class EmptyState extends StatelessWidget {
  final EmberAnim anim;
  final String title;
  final String? text, actionLabel;
  final VoidCallback? onAction;
  const EmptyState({
    super.key,
    required this.anim,
    required this.title,
    this.text,
    this.actionLabel,
    this.onAction,
  });
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
    child: Column(
      children: [
        EmberLottie(anim, size: 170),
        const SizedBox(height: 20),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Ember.text(19, weight: FontWeight.w700, color: Ember.navy),
        ),
        if (text != null && text!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            text!,
            textAlign: TextAlign.center,
            style: Ember.text(14, color: Ember.text2),
          ),
        ],
        if (actionLabel != null && onAction != null) ...[
          const SizedBox(height: 18),
          PrimaryButton(actionLabel!, onPressed: onAction, height: 52),
        ],
      ],
    ),
  );
}

/// Error state chosen by the kind of error: no connection, not found, or generic.
class ErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const ErrorState({super.key, required this.error, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    final t = context.watch<AppState>().t;
    final status = error is ApiError ? (error as ApiError).status : -1;
    if (status == 0) {
      return EmptyState(
        anim: EmberAnim.noInternet,
        title: t('no_connection_title'),
        text: '$error',
        actionLabel: t('try_again'),
        onAction: onRetry,
      );
    }
    if (status == 404) {
      return EmptyState(
        anim: EmberAnim.notFound,
        title: t('not_found_title'),
        text: t('not_found_desc'),
        actionLabel: t('try_again'),
        onAction: onRetry,
      );
    }
    return EmptyState(
      anim: EmberAnim.notFound,
      title: t('load_failed'),
      text: '$error',
      actionLabel: t('try_again'),
      onAction: onRetry,
    );
  }
}

/// Small bounce whenever [value] changes (e.g. basket count).
class BounceOnChange extends StatefulWidget {
  final Object value;
  final Widget child;
  const BounceOnChange({super.key, required this.value, required this.child});
  @override
  State<BounceOnChange> createState() => _BounceOnChangeState();
}

class _BounceOnChangeState extends State<BounceOnChange>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 450),
  );
  late final Animation<double> _scale = TweenSequence<double>([
    TweenSequenceItem(
      tween: Tween<double>(
        begin: 1.0,
        end: 1.28,
      ).chain(CurveTween(curve: Curves.easeOut)),
      weight: 40,
    ),
    TweenSequenceItem(
      tween: Tween<double>(
        begin: 1.28,
        end: 0.92,
      ).chain(CurveTween(curve: Curves.easeInOut)),
      weight: 30,
    ),
    TweenSequenceItem(
      tween: Tween<double>(
        begin: 0.92,
        end: 1.0,
      ).chain(CurveTween(curve: Curves.easeOut)),
      weight: 30,
    ),
  ]).animate(_c);

  @override
  void didUpdateWidget(covariant BounceOnChange old) {
    super.didUpdateWidget(old);
    if (old.value != widget.value) _c.forward(from: 0);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      ScaleTransition(scale: _scale, child: widget.child);
}
