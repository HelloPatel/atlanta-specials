import { useEffect, useRef, useState } from 'react';

/**
 * CountUp — rolls a number from `from` to `to` when it scrolls into view.
 * Zero dependencies (IntersectionObserver + requestAnimationFrame).
 * Respects prefers-reduced-motion (jumps straight to the final value).
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1.6,
  delay = 0,
  prefix = '',
  suffix = '',
  separator = '',
  decimals = 0,
  className = '',
}) {
  const ref = useRef(null);
  const started = useRef(false);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let fallback = 0;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (prefersReduced) {
        setValue(to);
        return;
      }
      const startAt = performance.now() + delay * 1000;
      const durMs = Math.max(1, duration * 1000);
      const tick = (now) => {
        if (now < startAt) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = Math.min(1, (now - startAt) / durMs);
        // easeOutExpo — fast start, gentle settle
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(from + (to - from) * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 }
    );
    observer.observe(el);
    fallback = setTimeout(run, 1200);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration, delay]);

  const formatted = (() => {
    const fixed = Number(value).toFixed(decimals);
    if (!separator) return fixed;
    const [intPart, decPart] = fixed.split('.');
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart ? `${withSep}.${decPart}` : withSep;
  })();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
