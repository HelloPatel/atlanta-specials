import { Children } from 'react';

/**
 * Marquee — a seamless horizontal scroller with edge fade (reactbits/magicui).
 * Duplicates children so the loop is gapless; pauses on hover. Reduced-motion
 * halts it. Good for a soft strip of testimonials, logos, or event names.
 *
 * <Marquee speed={30}>{items.map(...)}</Marquee>
 */
export default function Marquee({
  children,
  className = '',
  speed = 32,            // seconds per full pass
  gap = '2rem',
  reverse = false,
}) {
  const items = Children.toArray(children);
  return (
    <div
      className={`rb-marquee-mask ${className}`}
      style={{ '--rb-mq-speed': `${speed}s`, '--rb-mq-dir': reverse ? 'reverse' : 'normal' }}
    >
      <div className="rb-marquee-track" style={{ gap }}>
        {items}
        {items}
      </div>
    </div>
  );
}
