/**
 * StarBorder — an animated "shooting star" glow travels along the top and bottom
 * edges, framing the content in a subtle moving border. Pure CSS animation (see
 * `.rb-star-border` in index.css). Great for a hero/primary CTA.
 */
export default function StarBorder({
  as: Component = 'div',
  className = '',
  color = '#ec7a97', // wine-400
  speed = '6s',
  thickness = 1,
  radius = '1rem',
  children,
  style,
  ...rest
}) {
  return (
    <Component
      className={`rb-star-border ${className}`}
      style={{ padding: `${thickness}px`, borderRadius: radius, ...style }}
      {...rest}
    >
      <div
        className="rb-star-border__glow rb-star-border__bottom"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }}
      />
      <div
        className="rb-star-border__glow rb-star-border__top"
        style={{ background: `radial-gradient(circle, ${color}, transparent 12%)`, animationDuration: speed }}
      />
      <div className="rb-star-border__inner" style={{ borderRadius: `calc(${radius} - ${thickness}px)` }}>
        {children}
      </div>
    </Component>
  );
}
