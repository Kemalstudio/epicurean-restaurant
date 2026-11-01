import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Plays a Lottie animation from /public/lottie (Ember artwork; any LottieFiles JSON with the same name works).
 * The light lottie-web player is loaded on demand, so pages without animations don't pay for it.
 * With "reduce motion" enabled in the OS, the first frame is shown without animating.
 */
export default function LottieAnim({ name, size = 180, loop = true, className = '', label }) {
  const ref = useRef(null);

  useEffect(() => {
    let anim;
    let cancelled = false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({
        container: ref.current,
        renderer: 'svg',
        loop: loop && !reduce,
        autoplay: !reduce,
        path: `/lottie/${name}.json`,
      });
    });
    return () => { cancelled = true; anim?.destroy(); };
  }, [name, loop]);

  return (
    <div
      ref={ref}
      className={`mx-auto ${className}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/** Empty / error state with an animation, title, text and optional action (button or link). */
export function EmptyState({ anim, title, text, action, to, onAction, size = 190 }) {
  return (
    <div className="py-10 text-center">
      <LottieAnim name={anim} size={size} />
      <h2 className="mt-5 text-[22px] font-bold text-ember-navy">{title}</h2>
      {text && <p className="mx-auto mt-1 max-w-[460px] text-[15px] text-black/60">{text}</p>}
      {action && to && <Link to={to} className="btn-orange mt-6 h-[50px] text-[16px]">{action}</Link>}
      {action && onAction && <button type="button" onClick={onAction} className="btn-orange mt-6 h-[50px] text-[16px]">{action}</button>}
    </div>
  );
}

/** Picks the animation for a failed request: no connection vs. other errors. */
export function errorAnim(error) {
  return error?.request && !error?.response ? 'no_internet' : 'not_found';
}
