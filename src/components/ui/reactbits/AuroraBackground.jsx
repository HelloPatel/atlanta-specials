/**
 * AuroraBackground — three soft, slowly-drifting blobs of warm brand light that
 * sit behind content as an ambient backdrop. Pure CSS animation (see `.rb-aurora`
 * in index.css); pointer-events are off so it never disturbs interaction. Drop it
 * in as an absolutely-positioned layer:
 *
 *   <div className="relative overflow-hidden">
 *     <AuroraBackground className="absolute inset-0 -z-10" />
 *     ...content...
 *   </div>
 */
export default function AuroraBackground({
  className = '',
  colors = ['#f9d0d9', '#fad5b0', '#f4aabb'], // wine-200, phera-200, wine-300
  opacity = 0.6,
}) {
  const blobs = [
    { cls: 'rb-aurora--1', style: { width: '46vw', height: '46vw', top: '-10%', left: '-8%' }, color: colors[0] },
    { cls: 'rb-aurora--2', style: { width: '40vw', height: '40vw', top: '18%', right: '-12%' }, color: colors[1] },
    { cls: 'rb-aurora--3', style: { width: '36vw', height: '36vw', bottom: '-14%', left: '22%' }, color: colors[2] },
  ];
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      {blobs.map((b, i) => (
        <div
          key={i}
          className={`rb-aurora ${b.cls}`}
          style={{
            ...b.style,
            opacity,
            background: `radial-gradient(circle at 40% 40%, ${b.color}, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
