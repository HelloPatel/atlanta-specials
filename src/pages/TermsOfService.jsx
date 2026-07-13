import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { APP_NAME, LEGAL_EMAIL } from '../config/constants';

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      summary="These terms govern use of Phera, including responsibility for guest data, public wedding content, account security, and acceptable use."
    >
      <LegalSection title="1. Agreement and eligibility">
        <p>
          By creating an account, accessing, or using {APP_NAME}, you agree to these Terms and our Privacy Policy.
          You must be at least 18 years old and legally able to enter a contract. If you use Phera for another person
          or organization, you represent that you have authority to bind them.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          Phera provides tools for wedding planning, guest management, events, RSVPs, seating, wedding websites,
          photo coordination, games, and document exports. Phera is a planning tool, not a wedding planner, venue,
          travel agent, medical provider, legal adviser, or emergency service. You remain responsible for reviewing
          information and making final decisions.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and collaborators">
        <ul>
          <li>Provide accurate account information and keep login credentials secure.</li>
          <li>You are responsible for activity under your account and for choosing collaborators and permission levels.</li>
          <li>Notify us promptly if you suspect unauthorized access.</li>
          <li>Do not share access in a way that bypasses account or security controls.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Guest data and other people’s information">
        <p>
          You may enter information only when you have a lawful basis and any permission required to do so. You are
          responsible for providing required notices to guests, family members, vendors, and collaborators. Collect
          only information reasonably needed for the wedding. Do not use Phera to store government identifiers,
          payment-card data, financial account information, passwords, detailed medical records, or other information
          that is unnecessary for wedding planning.
        </p>
        <p>
          Dietary and accessibility information can be sensitive. Limit access, use it only for the stated planning
          purpose, and remove it when no longer needed.
        </p>
      </LegalSection>

      <LegalSection title="5. Your content and license to operate the service">
        <p>
          You retain ownership of content you submit, including text, guest lists, images, and wedding materials.
          You grant Phera a worldwide, non-exclusive, royalty-free license to host, copy, process, display, transmit,
          resize, and otherwise use that content only as reasonably necessary to operate, secure, improve, and provide
          the service as you direct. This license ends when the content is deleted, except for reasonable backup,
          legal, and security retention.
        </p>
        <p>
          You represent that you own your content or have permission to use and share it. You are responsible for
          obtaining photographer, venue, music, guest, and other releases or licenses needed for uploaded or published content.
        </p>
      </LegalSection>

      <LegalSection title="6. Public links">
        <p>
          Public wedding pages and shared links can be copied, forwarded, indexed, captured, or viewed by unintended
          recipients. You control whether to publish them and what to include. Access codes are not a substitute for
          careful data minimization. Phera is not responsible for a recipient’s independent copying or misuse after
          information is shared at your direction.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>You may not use Phera to:</p>
        <ul>
          <li>Break the law, infringe intellectual-property or privacy rights, impersonate others, or submit information without authority.</li>
          <li>Harass, threaten, exploit, discriminate against, or endanger another person.</li>
          <li>Upload malware, scrape the service, probe security, bypass access controls, or interfere with other users.</li>
          <li>Send spam, unsolicited marketing, fraudulent invitations, or deceptive messages.</li>
          <li>Publish illegal, defamatory, sexually exploitative, or otherwise harmful content.</li>
          <li>Resell or commercially exploit the service unless we agree in writing.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Phera intellectual property">
        <p>
          The Phera service, software, design, branding, documentation, and original content are owned by Phera or its
          licensors and are protected by intellectual-property laws. These Terms do not transfer ownership. You may not
          copy, modify, distribute, reverse engineer, or create derivative works from the service except where applicable
          law expressly permits it.
        </p>
      </LegalSection>

      <LegalSection title="9. Copyright complaints">
        <p>
          Do not upload content that infringes copyright. We may remove disputed content and suspend repeat infringers.
          Copyright notices should follow the process in our <a href="/copyright">Copyright and Takedown Policy</a>.
        </p>
      </LegalSection>

      <LegalSection title="10. Third-party services and links">
        <p>
          Phera relies on third-party services such as Google Firebase and may display links supplied by users. We do
          not control third-party services, websites, vendors, registries, hotels, or content. Their terms and privacy
          policies apply separately.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes, suspension, and termination">
        <p>
          We may add, change, suspend, or discontinue features. We may limit or terminate access when reasonably
          necessary for security, legal compliance, nonpayment if paid services are introduced, repeated infringement,
          or material violation of these Terms. You may stop using the service at any time and request account deletion.
        </p>
      </LegalSection>

      <LegalSection title="12. Disclaimers">
        <p className="legal-caps">
          To the maximum extent permitted by law, Phera is provided “as is” and “as available.” We disclaim all
          warranties, express or implied, including merchantability, fitness for a particular purpose, title,
          non-infringement, and any warranty that the service will be uninterrupted, error-free, secure, or preserve
          every item of data. Some jurisdictions do not allow certain disclaimers, so parts of this section may not apply.
        </p>
      </LegalSection>

      <LegalSection title="13. Limitation of liability">
        <p className="legal-caps">
          To the maximum extent permitted by law, Phera and its owners, officers, employees, contractors, and providers
          will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for
          lost profits, lost data, wedding costs, vendor losses, or reputational harm arising from the service. Our total
          liability for claims relating to the service will not exceed the greater of $100 or the amount you paid Phera
          during the 12 months before the event giving rise to the claim. Applicable law may provide rights that cannot
          be limited.
        </p>
      </LegalSection>

      <LegalSection title="14. Indemnity">
        <p>
          To the extent permitted by law, you agree to defend, indemnify, and hold Phera harmless from claims, losses,
          and expenses arising from your content, your handling of guest information, your public pages, your violation
          of these Terms, or your infringement of another person’s rights.
        </p>
      </LegalSection>

      <LegalSection title="15. Governing law and general terms">
        <p>
          Georgia law governs these Terms without regard to conflict-of-law rules, except where consumer law requires
          otherwise. Before launch, the operator must have licensed counsel select the correct court venue and decide
          whether an arbitration clause or class-action waiver is appropriate. If any provision is unenforceable, the
          rest remains effective. Failure to enforce a provision is not a waiver. These Terms and referenced policies
          are the entire agreement about the service.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact">
        <p>
          Questions about these Terms may be sent to <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
          Before commercial launch, add the operator’s full legal name and mailing address here.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
