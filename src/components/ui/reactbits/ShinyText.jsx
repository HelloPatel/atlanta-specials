/**
 * ShinyText — a soft highlight sweeps across the text on a loop.
 * Pure CSS (see `.rb-shiny` in index.css). Colors are driven by CSS vars so it
 * can match any palette. Defaults to the wine brand tones.
 */
export default function ShinyText({
  text,
  children,
  className = '',
  baseColor = '#ab204d', // wine-700
  shineColor = '#f4aabb', // wine-300
  speed = 4.5, // seconds per sweep
  as: Tag = 'span',
}) {
  return (
    <Tag
      className={`rb-shiny ${className}`}
      style={{
        '--rb-base': baseColor,
        '--rb-shine': shineColor,
        '--rb-shine-speed': `${speed}s`,
      }}
    >
      {text ?? children}
    </Tag>
  );
}
