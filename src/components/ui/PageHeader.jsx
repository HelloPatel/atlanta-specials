import { motion } from 'motion/react';
import { SplitText } from './reactbits';

const EASE = [0.22, 1, 0.36, 1];

/**
 * One consistent page header across the whole dashboard: an optional eyebrow,
 * a title, a subtitle, and a right-aligned actions slot. It springs in on load
 * so every page opens with the same calm entrance instead of the old, slightly
 * different inline header blocks each page rolled by hand.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  align = 'end',
  className = '',
}) {
  return (
    <header
      className={`mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:justify-between ${
        align === 'center' ? 'sm:items-center' : 'sm:items-end'
      } ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-wine-600"
          >
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
              className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-br from-wine-500 to-wine-700 shadow-[0_0_0_3px_rgba(136,19,55,0.12)]"
            />
            {eyebrow}
          </motion.p>
        )}

        <SplitText
          as="h1"
          text={title}
          className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl"
          stagger={0.05}
          duration={0.6}
          y={16}
        />

        <motion.span
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
          style={{ transformOrigin: 'left' }}
          className="mt-2 block h-[3px] w-10 rounded-full bg-gradient-to-r from-wine-600 to-wine-400"
        />

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.22 }}
            className="mt-2 max-w-2xl text-xs leading-relaxed text-gray-500 sm:text-sm"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
          className="flex flex-shrink-0 flex-wrap items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </header>
  );
}
