// Premium SVG ornament library for the wedding-website templates.
//
// These are hand-tuned, resolution-independent motifs inspired by the visual
// language of fine Indian wedding stationery — cusped Mughal arches, quarter
// mandalas, peacocks, hanging bells (toran), botanical sprays, lotus marks and
// filigree dividers. Everything draws with `currentColor` so a single `color`
// (or a wrapping text color) themes the whole motif, and every stroke uses
// `vectorEffect="non-scaling-stroke"` so hairlines stay crisp when a hero is
// scaled down into a thumbnail. No external image assets, no network requests.

const NONSCALE = { vectorEffect: 'non-scaling-stroke' };

function baseProps(className, style, extra) {
  return {
    className,
    style: { color: 'currentColor', ...style },
    'aria-hidden': true,
    focusable: false,
    ...extra,
  };
}

// A quarter mandala meant to sit in a corner. Rotate via className/style to
// place it in any of the four corners. Concentric scalloped rings + radiating
// petals give the fine "gold foil corner" look from premium invitations.
export function MandalaCorner({ className = '', style, opacity = 0.9 }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" {...baseProps(className, { opacity, ...style })}>
      <g stroke="currentColor" strokeWidth="1.1" {...NONSCALE}>
        <path d="M0 0 C0 66 54 120 120 120" opacity="0.55" />
        <path d="M0 0 C0 50 40 90 90 90" opacity="0.7" />
        <path d="M0 0 C0 34 26 60 60 60" opacity="0.85" />
        {/* radiating petals */}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 6) * (Math.PI / 2);
          const r1 = 60;
          const r2 = 92;
          const x1 = Math.cos(a) * r1;
          const y1 = Math.sin(a) * r1;
          const x2 = Math.cos(a) * r2;
          const y2 = Math.sin(a) * r2;
          const mx = Math.cos(a + 0.22) * ((r1 + r2) / 2);
          const my = Math.sin(a + 0.22) * ((r1 + r2) / 2);
          const nx = Math.cos(a - 0.22) * ((r1 + r2) / 2);
          const ny = Math.sin(a - 0.22) * ((r1 + r2) / 2);
          return (
            <path
              key={i}
              d={`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} Q${nx.toFixed(1)} ${ny.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} Z`}
              opacity="0.7"
            />
          );
        })}
      </g>
      <g fill="currentColor">
        <circle cx="14" cy="14" r="3" />
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 4) * (Math.PI / 2);
          return <circle key={i} cx={Math.cos(a) * 42} cy={Math.sin(a) * 42} r="1.6" opacity="0.85" />;
        })}
      </g>
    </svg>
  );
}

// A cusped / multifoil Mughal arch outline used to frame a portrait or a hero
// block. Draws a double keyline with small foils along the inner curve and a
// finial at the crown — the silhouette shared by nearly all the reference cards.
export function MughalArch({ className = '', style, strokeWidth = 1.4, foils = 9 }) {
  const w = 200;
  const springLine = 150; // where the arch meets the jambs
  const cx = w / 2;
  const top = 26;
  // Build the cusped top as a series of small arcs between spring points.
  const left = 20;
  const right = w - 20;
  const span = right - left;
  const points = [];
  for (let i = 0; i <= foils; i += 1) {
    const t = i / foils;
    const x = left + t * span;
    // parabolic arch height profile
    const y = springLine - Math.sin(t * Math.PI) * (springLine - top);
    points.push([x, y]);
  }
  let d = `M${left} ${springLine}`;
  for (let i = 1; i < points.length; i += 1) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const mx = (px + x) / 2;
    const my = (py + y) / 2 + 7; // dip creates the cusp
    d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return (
    <svg viewBox="0 0 200 260" fill="none" {...baseProps(className, style)}>
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...NONSCALE}>
        {/* jambs */}
        <path d={`M${left} 250 L${left} ${springLine}`} />
        <path d={`M${right} 250 L${right} ${springLine}`} />
        {/* cusped arch */}
        <path d={d} />
        {/* inner keyline */}
        <path d={`M${left + 8} 250 L${left + 8} ${springLine + 4} Q${cx} ${top + 26} ${right - 8} ${springLine + 4} L${right - 8} 250`} opacity="0.5" />
        {/* crown finial */}
        <path d={`M${cx} ${top} L${cx} ${top - 14}`} />
        <circle cx={cx} cy={top - 18} r="3.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

// A single hanging bell on a beaded string, topped by a small marigold — the
// toran valance element. Meant to be repeated across the top of a hero.
export function HangingBell({ className = '', style, stringLength = 26 }) {
  return (
    <svg viewBox="0 0 40 96" fill="none" {...baseProps(className, style)}>
      <g stroke="currentColor" strokeWidth="1.2" {...NONSCALE}>
        <path d={`M20 0 L20 ${stringLength}`} opacity="0.6" />
      </g>
      {/* marigold cap */}
      <g fill="currentColor">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={20 + Math.cos(a) * 5} cy={stringLength + 5 + Math.sin(a) * 5} r="2.4" opacity="0.85" />;
        })}
        <circle cx="20" cy={stringLength + 5} r="2.6" />
      </g>
      {/* bell body */}
      <g transform={`translate(0 ${stringLength + 12})`}>
        <path
          d="M20 2 C13 2 9 8 9 20 C9 30 5 34 4 40 L36 40 C35 34 31 30 31 20 C31 8 27 2 20 2 Z"
          fill="currentColor"
          opacity="0.16"
        />
        <path
          d="M20 2 C13 2 9 8 9 20 C9 30 5 34 4 40 L36 40 C35 34 31 30 31 20 C31 8 27 2 20 2 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
          {...NONSCALE}
        />
        <circle cx="20" cy="45" r="2.6" fill="currentColor" />
        <path d="M20 2 L20 -4" stroke="currentColor" strokeWidth="1.3" {...NONSCALE} />
        <circle cx="20" cy="-6" r="2.2" fill="currentColor" />
      </g>
    </svg>
  );
}

// A stylised peacock with a fanned tail of eye-feathers. Refined line-art, not a
// literal illustration — reads beautifully as a themed accent in a corner.
export function PeacockMotif({ className = '', style, opacity = 0.9 }) {
  const feathers = 9;
  return (
    <svg viewBox="0 0 180 180" fill="none" {...baseProps(className, { opacity, ...style })}>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" {...NONSCALE}>
        {/* tail fan */}
        {Array.from({ length: feathers }).map((_, i) => {
          const spread = 1.35; // radians total
          const a = -Math.PI / 2 - spread / 2 + (i / (feathers - 1)) * spread;
          const ox = 60;
          const oy = 120;
          const len = 92;
          const x = ox + Math.cos(a) * len;
          const y = oy + Math.sin(a) * len;
          return (
            <g key={i}>
              <path d={`M${ox} ${oy} Q${ox + Math.cos(a) * len * 0.5 + 10} ${oy + Math.sin(a) * len * 0.5} ${x.toFixed(1)} ${y.toFixed(1)}`} opacity="0.55" />
              <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="5.5" opacity="0.9" />
              <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.2" fill="currentColor" stroke="none" />
            </g>
          );
        })}
        {/* body + neck */}
        <path d="M60 120 C56 104 54 90 62 78 C68 69 78 66 84 70" strokeWidth="1.6" />
        {/* head */}
        <circle cx="86" cy="66" r="5.5" fill="currentColor" stroke="none" />
        {/* beak */}
        <path d="M91 66 L98 64" strokeWidth="1.4" />
        {/* crest */}
        <path d="M86 60 L86 52 M83 61 L80 54 M89 61 L92 54" strokeWidth="1" opacity="0.8" />
        {/* feet / perch */}
        <path d="M60 120 L60 132 M52 132 L68 132" opacity="0.7" />
      </g>
    </svg>
  );
}

// A botanical corner spray — a curved stem with leaves and two blossoms. Softer
// than the mandala; pairs with garden / pastel palettes.
export function BotanicalSpray({ className = '', style, opacity = 0.85 }) {
  return (
    <svg viewBox="0 0 150 160" fill="none" {...baseProps(className, { opacity, ...style })}>
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" {...NONSCALE}>
        <path d="M6 154 C40 140 62 108 70 70 C74 50 74 30 72 10" />
        {/* leaves */}
        {[
          [26, 128, -35],
          [44, 104, -20],
          [58, 78, -8],
          [68, 50, 6],
        ].map(([x, y, rot], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <path d="M0 0 C10 -6 18 -4 22 4 C16 10 6 10 0 0 Z" fill="currentColor" opacity="0.14" />
            <path d="M0 0 C10 -6 18 -4 22 4 C16 10 6 10 0 0 Z" fill="none" />
            <path d="M2 2 L18 3" strokeWidth="0.8" opacity="0.6" />
          </g>
        ))}
      </g>
      {/* blossoms */}
      {[
        [72, 12, 7],
        [86, 34, 5.5],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          {Array.from({ length: 6 }).map((_, p) => {
            const a = (p / 6) * Math.PI * 2;
            return (
              <circle
                key={p}
                cx={cx + Math.cos(a) * r}
                cy={cy + Math.sin(a) * r}
                r={r * 0.62}
                fill="currentColor"
                opacity="0.16"
                stroke="currentColor"
                strokeWidth="1"
                {...NONSCALE}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.5} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

// A symmetrical filigree divider with a central lotus/paisley and scrolling
// vines — a refined replacement for a plain rule between sections.
export function FiligreeDivider({ className = '', style, width = 240 }) {
  return (
    <svg viewBox="0 0 240 32" fill="none" {...baseProps(className, { width, ...style })}>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" {...NONSCALE}>
        {/* mirrored scrolls */}
        <path d="M120 16 C104 16 96 8 82 8 C70 8 66 16 54 16 C44 16 40 10 30 12" opacity="0.8" />
        <path d="M120 16 C136 16 144 8 158 8 C170 8 174 16 186 16 C196 16 200 10 210 12" opacity="0.8" />
        <path d="M30 12 C24 13 20 16 14 16" opacity="0.6" />
        <path d="M210 12 C216 13 220 16 226 16" opacity="0.6" />
        <circle cx="12" cy="16" r="1.8" fill="currentColor" />
        <circle cx="228" cy="16" r="1.8" fill="currentColor" />
        {/* central lotus */}
        <path d="M120 4 C126 10 126 20 120 26 C114 20 114 10 120 4 Z" fill="currentColor" fillOpacity="0.14" />
        <path d="M120 6 C112 12 108 12 104 12 C110 18 116 18 120 24 C124 18 130 18 136 12 C132 12 128 12 120 6 Z" fill="currentColor" fillOpacity="0.14" />
      </g>
      <circle cx="120" cy="16" r="2.4" fill="currentColor" />
    </svg>
  );
}

// A compact lotus mark for eyebrows / auspicious openers.
export function LotusMark({ className = '', style }) {
  return (
    <svg viewBox="0 0 56 34" fill="none" {...baseProps(className, style)}>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...NONSCALE}>
        <path d="M28 30 C28 22 24 14 28 6 C32 14 28 22 28 30 Z" fill="currentColor" fillOpacity="0.16" />
        <path d="M28 30 C22 26 14 24 10 16 C20 16 26 22 28 30 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M28 30 C34 26 42 24 46 16 C36 16 30 22 28 30 Z" fill="currentColor" fillOpacity="0.12" />
        <path d="M28 30 C22 28 8 28 2 24" opacity="0.6" />
        <path d="M28 30 C34 28 48 28 54 24" opacity="0.6" />
      </g>
    </svg>
  );
}

// Four mandala corners as one overlay — the single easiest lift for any hero or
// card. Pointer-events off so it never blocks interaction.
export function CornerFrame({ className = '', color, opacity = 0.5, size = 96, inset = 12 }) {
  const style = { color, opacity };
  const s = `${size}px`;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <MandalaCorner style={{ position: 'absolute', top: inset, left: inset, width: s, height: s, ...style }} />
      <MandalaCorner style={{ position: 'absolute', top: inset, right: inset, width: s, height: s, transform: 'scaleX(-1)', ...style }} />
      <MandalaCorner style={{ position: 'absolute', bottom: inset, left: inset, width: s, height: s, transform: 'scaleY(-1)', ...style }} />
      <MandalaCorner style={{ position: 'absolute', bottom: inset, right: inset, width: s, height: s, transform: 'scale(-1,-1)', ...style }} />
    </div>
  );
}

export default {
  MandalaCorner,
  MughalArch,
  HangingBell,
  PeacockMotif,
  BotanicalSpray,
  FiligreeDivider,
  LotusMark,
  CornerFrame,
};
