import LegalLayout, { LegalSection } from '../components/legal/LegalLayout';
import { COPYRIGHT_EMAIL } from '../config/constants';

export default function CopyrightPolicy() {
  return (
    <LegalLayout
      title="Copyright and Takedown Policy"
      summary="Phera respects creators’ rights and expects users to upload only content they own or have permission to use."
    >
      <LegalSection title="1. Your responsibility">
        <p>
          You must own or have permission to upload and publish photos, videos, writing, graphics, music, logos, and
          other materials. Paying a photographer or receiving a copy of a photo does not always transfer copyright.
          Review the applicable contract or license before publishing professional work.
        </p>
      </LegalSection>

      <LegalSection title="2. Copyright notice">
        <p>
          Except for user content and third-party materials, the Phera software, interface, branding, original text,
          graphics, and documentation are protected by copyright and other intellectual-property laws. No permission
          is granted to copy or redistribute them except as expressly allowed by our Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Takedown notice">
        <p>
          If you believe material on Phera infringes your copyright, send a written notice to
          {' '}<a href={`mailto:${COPYRIGHT_EMAIL}`}>{COPYRIGHT_EMAIL}</a> containing:
        </p>
        <ol>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the copyrighted work, or a representative list if one notice covers multiple works.</li>
          <li>Identification and location of the allegedly infringing material, including the relevant Phera URL.</li>
          <li>Your name, mailing address, telephone number, and email address.</li>
          <li>A statement that you have a good-faith belief the use is not authorized by the owner, its agent, or law.</li>
          <li>A statement, under penalty of perjury, that the notice is accurate and you are authorized to act for the owner.</li>
        </ol>
        <p>
          Misrepresenting infringement may create liability. Consider speaking with an attorney before sending a notice.
        </p>
      </LegalSection>

      <LegalSection title="4. Counter-notice">
        <p>
          If your content was removed by mistake or misidentification, you may send a counter-notice containing your
          signature, identification of the removed material and its former location, a statement under penalty of
          perjury that removal resulted from mistake or misidentification, your contact information, and the consent
          to jurisdiction and service of process required by applicable copyright law.
        </p>
      </LegalSection>

      <LegalSection title="5. Repeat infringement">
        <p>
          Phera may remove content and suspend or terminate accounts of repeat infringers in appropriate circumstances.
          We may send a valid notice or counter-notice to the user who supplied the disputed material.
        </p>
      </LegalSection>

      <LegalSection title="6. DMCA agent status">
        <p>
          Email notices may be sent to the address above. Before relying on the statutory DMCA safe harbor, Phera must
          designate and maintain an agent with the U.S. Copyright Office, publish the agent’s complete contact
          information here, adopt a repeat-infringer policy, and follow the required notice and counter-notice process.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
