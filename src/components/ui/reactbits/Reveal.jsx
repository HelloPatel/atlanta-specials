import { motion } from 'motion/react';

/**
 * Motion (motion.dev) reveal helpers — physics-based scroll choreography that
 * pure CSS can't do as smoothly. Kept intentionally subtle to match the wine /
 * blush theme. Motion automatically respects prefers-reduced-motion.
 */

const spring = { type: 'spring', stiffness: 120, damping: 20, mass: 0.9 };

// A single element that springs up + fades in the first time it enters view.
export function Reveal({
  children,
  y = 22,
  delay = 0,
  once = true,
  amount = 0.3,
  className = '',
  as = 'div',
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ ...spring, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

// Container that staggers the entrance of its <RevealItem> children on mount.
// Use for above-the-fold content (hero) where scroll-reveal doesn't fire.
export function RevealStagger({
  children,
  className = '',
  stagger = 0.12,
  delayChildren = 0.05,
  as = 'div',
  inView = false, // false = animate on mount; true = animate when scrolled into view
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  const variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
  const animateProps = inView
    ? { whileInView: 'show', viewport: { once: true, amount: 0.3 } }
    : { animate: 'show' };
  return (
    <MotionTag className={className} variants={variants} initial="hidden" {...animateProps} {...rest}>
      {children}
    </MotionTag>
  );
}

// A child of RevealStagger — springs up + fades in as its turn comes.
export function RevealItem({ children, y = 24, className = '', as = 'div', ...rest }) {
  const MotionTag = motion[as] || motion.div;
  const variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: spring },
  };
  return (
    <MotionTag className={className} variants={variants} {...rest}>
      {children}
    </MotionTag>
  );
}
