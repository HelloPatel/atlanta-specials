/**
 * BorderBeam — a light traveling around a rounded border (animate-ui / magicui
 * signature), tuned to the wine/saffron palette. Absolutely positioned inside a
 * `position: relative` parent whose radius it inherits. Reduced-motion freezes it.
 *
 * <div className="relative rounded-2xl ...">
 *   <BorderBeam />
 *   ...content...
 * </div>
 */
export default function BorderBeam({
  className = '',
  color = '#ab204d',      // wine-700
  speed = 7,              // seconds per lap
  thickness = 1.5,        // border thickness in px
  style = {},
}) {
  return (
    <span
      aria-hidden="true"
      className={`rb-beam ${className}`}
      style={{
        '--rb-beam-color': color,
        '--rb-beam-speed': `${speed}s`,
        '--rb-beam-thickness': `${thickness}px`,
        ...style,
      }}
    />
  );
}
