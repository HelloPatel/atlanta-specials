/**
 * GradientText — flows a soft wine→saffron gradient across text (reactbits style).
 * Uses the `.rb-gradient-text` primitive in index.css; reduced-motion freezes it.
 *
 * <GradientText as="h1" className="text-5xl">Aditi & Rohan</GradientText>
 */
export default function GradientText({
  as: Tag = 'span',
  children,
  className = '',
  colors,                 // e.g. ['#ab204d', '#ed7824', '#ab204d']
  speed = 8,              // seconds per cycle
  style = {},
  ...rest
}) {
  const gradient = colors?.length
    ? `linear-gradient(120deg, ${colors.join(', ')})`
    : undefined;

  return (
    <Tag
      className={`rb-gradient-text ${className}`}
      style={{
        ...(gradient ? { backgroundImage: gradient } : {}),
        '--rb-gt-speed': `${speed}s`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
