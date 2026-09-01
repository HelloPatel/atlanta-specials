/**
 * ShimmerButton — a native button with a light sweep across its surface on hover
 * (smoothui / magicui signature). For the app's shared <Button>, you can instead
 * just add the `rb-shimmer` className. This is a standalone convenience wrapper.
 *
 * <ShimmerButton type="submit" className="w-full">Create account</ShimmerButton>
 */
export default function ShimmerButton({
  as: Tag = 'button',
  children,
  className = '',
  ...rest
}) {
  return (
    <Tag className={`rb-shimmer ${className}`} {...rest}>
      <span className="relative z-10">{children}</span>
    </Tag>
  );
}
