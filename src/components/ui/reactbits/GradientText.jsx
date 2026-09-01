/**
 * GradientText — renders a solid wine heading. The animated wine/saffron gradient
 * was retired in favor of one calm brand color; the API is unchanged so callers
 * (colors/speed are accepted but ignored) keep working.
 *
 * <GradientText as="h1" className="text-5xl">Aditi & Rohan</GradientText>
 */
export default function GradientText({
  as: Tag = 'span',
  children,
  className = '',
  colors,                 // accepted for compatibility, no longer used
  speed,                  // accepted for compatibility, no longer used
  style = {},
  ...rest
}) {
  return (
    <Tag className={`text-wine-700 ${className}`} style={style} {...rest}>
      {children}
    </Tag>
  );
}

