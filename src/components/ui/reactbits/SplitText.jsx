import { useEffect, useRef, useState } from 'react';

/**
 * SplitText — reveals text one word at a time (fade + rise + de-blur) the first
 * time it scrolls into view. Zero dependencies; pure CSS transitions staggered
 * by inline transitionDelay. Respects prefers-reduced-motion.
 */
export default function SplitText({
  text = '',
  className = '',
  as: Tag = 'span',
  delay = 0, // seconds before the first word
  stagger = 0.06, // seconds between words
  duration = 0.7,
  y = 20,
  threshold = 0.2,
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const words = String(text).split(' ');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            raf = requestAnimationFrame(() => setShown(true));
            io.disconnect();
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    const fb = setTimeout(() => setShown(true), 1200);
    return () => {
      io.disconnect();
      clearTimeout(fb);
      cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          <span
            style={{
              display: 'inline-block',
              willChange: 'opacity, transform, filter',
              transition: `opacity ${duration}s cubic-bezier(0.22,1,0.36,1), transform ${duration}s cubic-bezier(0.22,1,0.36,1), filter ${duration}s ease`,
              transitionDelay: `${delay + i * stagger}s`,
              opacity: shown ? 1 : 0,
              transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
              filter: shown ? 'blur(0)' : 'blur(6px)',
            }}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
