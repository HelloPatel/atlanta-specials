import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { LEGAL_EMAIL } from '../config/constants';

export default function AccessibilityStatement() {
  return (
    <LegalLayout
      title="Accessibility Statement"
      summary="Phera aims to make wedding planning and guest-facing pages usable by people with disabilities."
    >
      <LegalSection title="Our commitment">
        <p>
          We work toward substantial conformance with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
          Our product includes keyboard navigation, visible focus indicators, responsive layouts, accessible form
          labels, reduced-motion support, and larger guest-facing controls. Accessibility is an ongoing process.
        </p>
      </LegalSection>

      <LegalSection title="User-created content">
        <p>
          Couples and planners control much of the text, color, imagery, links, and event information on public wedding
          pages. We encourage account holders to use clear language, sufficient contrast, meaningful image descriptions,
          captions where appropriate, and accessible alternatives for important information.
        </p>
      </LegalSection>

      <LegalSection title="Feedback and assistance">
        <p>
          If you cannot access a feature or need information in another format, email
          {' '}<a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> with the page or feature, the problem you encountered,
          your browser or assistive technology if you wish to share it, and your preferred contact method. We will make
          reasonable efforts to respond and provide an alternative.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
