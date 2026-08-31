import { useRef, useState } from 'react';

/**
 * Magnet — the wrapped element leans gently toward the cursor while hovered and
 * springs back on leave. Zero dependencies. Disabled under prefers-reduced-motion.
 */
export default function Magnet({
  children,
  strength = 0.3,
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const move = (e) => {
    if (prefersReduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    setPos({ x, y });
  };
  const reset = () => setPos({ x: 0, y: 0 });

  return (
    <Tag
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      className={className}
      style={{
        display: 'inline-block',
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
