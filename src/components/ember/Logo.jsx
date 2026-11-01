import { Link } from 'react-router-dom';

/** Ember wordmark (SVG in /public/brand). `variant="white"` for dark backgrounds. */
export default function Logo({ variant = 'dark', className = 'h-[44px] md:h-[53px] w-auto', linked = true }) {
  const img = (
    <img
      src={variant === 'white' ? '/brand/ember-logo-white.svg' : '/brand/ember-logo.svg'}
      alt="Ember"
      className={className}
      width="215"
      height="47"
    />
  );
  return linked ? <Link to="/" aria-label="Ember — home" className="inline-flex shrink-0">{img}</Link> : img;
}
