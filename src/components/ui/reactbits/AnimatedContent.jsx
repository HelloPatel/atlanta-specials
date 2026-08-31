import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedContent — fades + slides its children in the first time they enter the
 * viewport. Zero dependencies. A lightweight, reusable reveal for one-off blocks
 * that aren't inside an existing `.reveal` grid. Respects prefers-reduced-motion.
 */
export default function AnimatedContent({
  children,
  className = '',
  distance = 24,
  direction = 'vertical', // 'vertical' | 'horizontal'
  reverse = false,
  duration = 0.7,
  delay = 0,
  threshold = 0.15,
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

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
    const fb = setTimeout(() => setShown(true), 1400);
    return () => {
      io.disconnect();
      clearTimeout(fb);
      cancelAnimationFrame(raf);
    };
  }, [threshold]);

  const axis = direction === 'horizontal' ? 'X' : 'Y';
  const sign = reverse ? -1 : 1;
  const offset = shown ? 0 : distance * sign;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        willChange: 'opacity, transform',
        transition: `opacity ${duration}s cubic-bezier(0.22,1,0.36,1), transform ${duration}s cubic-bezier(0.22,1,0.36,1)`,
        transitionDelay: `${delay}s`,
        opacity: shown ? 1 : 0,
        transform: `translate${axis}(${offset}px)`,
      }}
    >
      {children}
    </Tag>
  );
}
