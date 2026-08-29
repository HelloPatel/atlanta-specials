import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { PRIVACY_EMAIL } from '../config/constants';

export default function CookieNotice() {
  return (
    <LegalLayout
      title="Cookie and Local Storage Notice"
      summary="Phera currently uses essential browser storage and security technologies, not advertising cookies."
    >
      <LegalSection title="1. Technologies we use">
        <p>
          Phera and its providers may use cookies, local storage, session storage, software development kits, and
          similar technologies. These tools remember authentication state, preserve security tokens, remember limited
          interface preferences, and protect forms and databases against abuse.
        </p>
      </LegalSection>

      <LegalSection title="2. Essential purposes">
        <ul>
          <li><strong>Authentication:</strong> Firebase Authentication keeps users signed in and completes email login.</li>
          <li><strong>Security:</strong> Firebase App Check and Google reCAPTCHA evaluate abuse and automated traffic.</li>
          <li><strong>Preferences:</strong> local storage may remember onboarding completion and similar product settings.</li>
          <li><strong>Reliability:</strong> temporary browser storage may support navigation and service operation.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Advertising and analytics">
        <p>
          Phera does not currently use advertising cookies or cross-site behavioral advertising. We also do not
          currently use optional product analytics cookies. If we add non-essential analytics, advertising, or similar
          tracking, we will update this notice and provide consent or opt-out controls where required.
        </p>
      </LegalSection>

      <LegalSection title="4. Your controls">
        <p>
          Browser settings can block or delete cookies and site storage. Blocking essential storage may prevent login,
          security checks, or saved preferences from working. Questions may be sent to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="5. Do Not Track and Global Privacy Control">
        <p>
          Phera does not currently sell personal information or use cross-site behavioral advertising. As a result,
          Do Not Track and Global Privacy Control signals do not change the current service behavior. We will update
          this notice and honor legally required signals if our tracking practices change.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
