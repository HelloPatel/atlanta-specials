import { useRef } from 'react';

/**
 * SpotlightCard — a soft wine-tinted radial glow follows the cursor across the
 * card on hover. Zero dependencies; the glow is a pointer-events-none ::after
 * layer (see `.rb-spotlight` in index.css) so it never disturbs layout or clicks.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(171, 32, 77, 0.14)', // wine-700 @ ~14%
  radius = 220,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--rb-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--rb-y', `${e.clientY - r.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      className={`rb-spotlight ${className}`}
      style={{ '--rb-spot': spotlightColor, '--rb-spot-radius': `${radius}px`, ...rest.style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
