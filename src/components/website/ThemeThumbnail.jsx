import { useEffect, useMemo, useRef, useState } from 'react';
import WeddingWebsitePreview from './WeddingWebsitePreview';

// Width the preview is authored against. We render the real hero at this width so
// container queries resolve to the desktop layout, then scale the whole thing down
// to fit the card. The result is a faithful "first screen" of each template.
const DESIGN_WIDTH = 1200;

// A live, scaled-down hero of a real template so the picker previews the actual
// site instead of a color swatch. Mounts only when scrolled near the viewport to
// keep 20+ previews light.
export default function ThemeThumbnail({ wedding, themeKey, config: configOverride, heroDate, aspect = '16 / 10' }) {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;

    const measure = () => {
      const w = el.clientWidth;
      if (w) setWidth(w);
    };
    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          intersectionObserver.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    intersectionObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  const config = useMemo(() => {
    if (configOverride) return { ...configOverride, websitePublished: true };
    return {
      websiteTheme: themeKey,
      websitePublished: true,
      websiteHero: { date: heroDate || '', tagline: '' },
      websiteGallery: { enabled: false, images: [] },
    };
  }, [configOverride, themeKey, heroDate]);

  const scale = width ? width / DESIGN_WIDTH : 0;

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-2xl border border-black/5 bg-gray-100"
      style={{ aspectRatio: aspect }}
      aria-hidden="true"
    >
      {visible && scale > 0 ? (
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: DESIGN_WIDTH, transform: `scale(${scale})` }}
        >
          <WeddingWebsitePreview wedding={wedding} config={config} events={[]} previewMode heroOnly />
        </div>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200" />
      )}
    </div>
  );
}
