import { useCallback, useRef } from 'react';

/**
 * ClickSpark — bursts a ring of small sparks outward from the click point.
 * Zero dependencies; sparks are lightweight DOM nodes removed after they finish
 * (keyframes `rb-spark-fly` in index.css). Skipped under prefers-reduced-motion.
 * Uses onClickCapture so the spark fires even if the child navigates away.
 */
export default function ClickSpark({
  children,
  sparkColor = '#ab204d', // wine-700
  sparkCount = 9,
  sparkRadius = 22,
  duration = 450,
  className = '',
  as: Tag = 'span',
}) {
  const ref = useRef(null);

  const onClick = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (2 * Math.PI * i) / sparkCount;
        const spark = document.createElement('span');
        spark.className = 'rb-spark';
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.background = sparkColor;
        spark.style.setProperty('--rb-dx', `${Math.cos(angle) * sparkRadius}px`);
        spark.style.setProperty('--rb-dy', `${Math.sin(angle) * sparkRadius}px`);
        spark.style.animationDuration = `${duration}ms`;
        el.appendChild(spark);
        setTimeout(() => spark.remove(), duration + 60);
      }
    },
    [sparkColor, sparkCount, sparkRadius, duration]
  );

  return (
    <Tag ref={ref} onClickCapture={onClick} className={className} style={{ position: 'relative', display: 'inline-block' }}>
      {children}
    </Tag>
  );
}
