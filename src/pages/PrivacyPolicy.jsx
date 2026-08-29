import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { APP_NAME, PRIVACY_EMAIL } from '../config/constants';

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      summary="This policy explains what Phera collects, why we use it, when information becomes public, and how to request access, correction, or deletion."
    >
      <LegalSection title="1. Scope and who is responsible">
        <p>
          This Privacy Policy applies to the {APP_NAME} website, wedding-planning workspace, public wedding pages,
          RSVP forms, seating tools, photo-group tools, games, and related services. In this policy, “Phera,” “we,”
          “us,” and “our” refer to the operator of the service.
        </p>
        <p>
          Couples and planners decide what guest information to enter and which wedding features to publish.
          They are responsible for having a lawful reason and appropriate permission to provide information about
          family members, guests, collaborators, and vendors.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <ul>
          <li><strong>Account information:</strong> name, email address, profile photo, authentication identifiers, account plan, and account timestamps.</li>
          <li><strong>Wedding information:</strong> couple names, dates, venues, event details, schedules, website content, registry and hotel links, photos, and publishing settings.</li>
          <li><strong>Guest and household information:</strong> names, contact details, family groups, invitation assignments, language, travel details, notes, tags, plus-one information, hotel needs, dietary preferences, accessibility needs, RSVP status, and seating assignments.</li>
          <li><strong>Public interaction information:</strong> RSVP responses, messages to the couple, table searches, photo-queue entries, and game or prediction responses.</li>
          <li><strong>Technical and security information:</strong> device and browser information, IP-derived information, authentication logs, error information, and signals used by Firebase App Check and Google reCAPTCHA to prevent abuse.</li>
          <li><strong>Communications:</strong> information you include when contacting support, privacy, legal, or copyright addresses.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How information is collected">
        <p>
          We collect information directly from account holders, through email authentication, from
          collaborators, from wedding guests using public features, and automatically through essential security
          and service technologies. A couple or planner may enter information about another person. If that happens,
          the account holder must provide any notice or obtain any consent required by law.
        </p>
      </LegalSection>

      <LegalSection title="4. How we use information">
        <ul>
          <li>Provide accounts, guest management, event planning, RSVPs, seating, websites, exports, and collaboration.</li>
          <li>Publish information an account holder deliberately makes available through a public or shared wedding link.</li>
          <li>Authenticate users, prevent fraud and abuse, secure the service, troubleshoot errors, and maintain availability.</li>
          <li>Respond to support, privacy, legal, and copyright requests.</li>
          <li>Comply with law, enforce our Terms, and protect users, guests, Phera, and others.</li>
          <li>Improve the service using aggregated or de-identified information where reasonably possible.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Public and shared wedding features">
        <p>
          Wedding websites, RSVP links, table-finder pages, photo queues, display screens, and leaderboards may be
          accessible to anyone who has the link. Depending on the feature and the account holder’s settings, visitors
          may see couple names, event details, guest or household names, photos, table assignments, and game results.
          A password or access code may discourage casual access, but it should not be treated as encryption or a
          guarantee that information will remain private.
        </p>
        <p>
          Account holders should publish only what they are comfortable sharing and should use individualized links
          where available. Do not publish sensitive contact, financial, identification, medical, or private family information.
        </p>
      </LegalSection>

      <LegalSection title="6. How we disclose information">
        <ul>
          <li><strong>Service providers:</strong> Google Firebase provides authentication, database, hosting-related, and security services. Providers may process information under their own contractual and privacy terms.</li>
          <li><strong>Account collaborators:</strong> owners may grant other people access to a wedding workspace. Their role determines what they can view or change.</li>
          <li><strong>Public visitors:</strong> information is disclosed when an account holder publishes or shares a wedding feature.</li>
          <li><strong>Legal and safety disclosures:</strong> we may disclose information when reasonably necessary to comply with law, protect rights or safety, investigate abuse, or respond to lawful process.</li>
          <li><strong>Business transactions:</strong> information may transfer as part of a merger, financing, acquisition, reorganization, bankruptcy, or sale of assets, subject to applicable law.</li>
        </ul>
        <p>
          Phera does not sell personal information for money and does not use personal information for cross-context
          behavioral advertising. If that changes, we will update this policy and provide legally required choices.
        </p>
      </LegalSection>

      <LegalSection title="7. Retention">
        <p>
          We keep information while an account is active and as reasonably necessary to provide the service, resolve
          disputes, enforce agreements, meet legal obligations, maintain security, and recover from backups. Retention
          depends on the type of information and why it is held. Account holders should remove guest information when
          it is no longer needed. You may request deletion using the contact information below.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices and privacy rights">
        <p>
          Account holders can correct or remove much of their content inside Phera. To request access, correction,
          deletion, a portable copy, or an appeal of a privacy decision, email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          We may need to verify your identity and authority. If information was entered by a couple or planner, we may
          direct the request to that account holder because they control the wedding record.
        </p>
        <p>
          Residents of certain states may have additional rights, including rights to know, access, correct, delete,
          obtain a copy, opt out of certain processing, and appeal. We will honor applicable rights and will not
          unlawfully discriminate against you for exercising them.
        </p>
        <p>
          Browsers may send Do Not Track or Global Privacy Control signals. Because Phera does not sell personal
          information or use cross-context behavioral advertising, these signals do not currently change how the
          service operates. If our practices change, we will honor legally required browser-based opt-out signals.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          Phera is intended for adults and is not directed to children under 13. Children may appear on a family guest
          list only when an adult account holder has authority to provide the information. Do not enter a child’s email,
          phone number, precise location, account credentials, or other unnecessary information. If you believe a child
          submitted information directly without appropriate permission, contact us so we can investigate and delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. Security and international processing">
        <p>
          We use administrative, technical, and organizational safeguards designed to protect information, including
          authenticated workspaces, role-based access, database rules, and abuse prevention. No service can guarantee
          absolute security. Information may be processed in the United States and other locations where our providers operate.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes and contact">
        <p>
          We may update this policy as the service or law changes. We will post the revised date and provide additional
          notice when required. Questions and requests may be sent to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        </p>
        <p><strong>Launch requirement:</strong> before commercial launch, replace this sentence with the operator’s full legal name and mailing address.</p>
      </LegalSection>
    </LegalLayout>
  );
}
