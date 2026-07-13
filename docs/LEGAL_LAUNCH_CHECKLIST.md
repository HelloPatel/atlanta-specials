# Phera legal launch checklist

Last reviewed: July 12, 2026

This checklist is operational guidance, not legal advice. A Georgia-licensed attorney with technology, privacy, and intellectual-property experience should review the marked launch blockers.

## Launch blockers

- [ ] Form the operating entity and replace every policy placeholder with its full legal name and mailing address.
- [ ] Confirm `privacy@phera-wedding.com`, `legal@phera-wedding.com`, `copyright@phera-wedding.com`, and `security@phera-wedding.com` are monitored.
- [ ] Have counsel review the Terms, Privacy Policy, liability cap, indemnity, governing law, venue, COPPA posture, and multi-state privacy coverage.
- [ ] Deploy the updated Firestore rules and verify private wedding, guest, event, dietary, travel, accessibility, collaborator, and seating-rule records cannot be read anonymously.
- [ ] Sign in as each existing wedding owner and open the dashboard once to backfill minimized public projections before sharing public links.
- [ ] Register a DMCA designated agent and replace the DMCA status placeholder with the registered agent’s complete information.
- [ ] Complete a USPTO trademark clearance search for “Phera” and confusingly similar names before spending heavily on the brand.
- [ ] Accept and archive the applicable Google/Firebase Data Processing and Security Terms.
- [ ] Test privacy-request, deletion, breach-response, takedown, and account-recovery procedures with named owners and backups.
- [ ] Review the production site against WCAG 2.1 AA at minimum and fix blocking accessibility defects.

## Business formation and ownership

- [ ] Search the Georgia Corporations Division for the entity name.
- [ ] Form a Georgia LLC or other counsel-recommended entity and appoint a Georgia registered agent.
- [ ] Obtain an EIN directly from the IRS.
- [ ] Obtain the city or county occupational tax certificate or local business license required where the company operates.
- [ ] Create an operating agreement, founder agreement, equity records, and banking separation.
- [ ] Have founders, employees, designers, and contractors assign relevant code, designs, domains, content, and inventions to the entity.
- [ ] Calendar Georgia annual registration, tax, registered-agent, domain, trademark, and DMCA renewal dates.
- [ ] Ask a CPA about tax classification, sales-tax exposure for future paid plans, payroll, and recordkeeping.
- [ ] Consider cyber, technology errors and omissions, and general liability insurance.

## Privacy and data governance

- [ ] Maintain a data inventory listing each field, purpose, user group, storage location, access role, vendor, retention period, and deletion method.
- [ ] Use the minimum information needed. Do not request government IDs, payment-card data, passwords, or detailed medical records.
- [ ] Treat dietary, accessibility, child-guest, and travel information as sensitive and restrict it to wedding logistics.
- [ ] Add an explicit account-holder attestation before collecting sensitive guest information if counsel determines consent is required.
- [ ] Default public features to the least-public practical setting and clearly identify what a shared link exposes.
- [ ] Build self-service account export and deletion. Until then, follow `docs/PRIVACY_REQUEST_RUNBOOK.md`.
- [ ] Set documented retention periods for inactive accounts, wedding records, RSVP responses, logs, backups, and support requests.
- [ ] Document Phera’s response to Do Not Track and Global Privacy Control. Current policy: no sale or targeted advertising, so the signals do not change processing.
- [ ] Reassess state-law thresholds at least quarterly as users and revenue grow.
- [ ] Obtain counsel’s written COPPA analysis before allowing children to submit information directly or targeting any feature to children.

## Security and incident readiness

- [ ] Enforce Firebase App Check in production after validating all public flows.
- [ ] Review Firestore rules with emulator tests for anonymous, owner, editor, viewer, and attacker cases.
- [ ] Require multifactor authentication for production Firebase, hosting, domain, email, and source-control administrators.
- [ ] Restrict production access by role and review access quarterly.
- [ ] Enable audit logging, budget alerts, abuse alerts, secure backups, and restore testing.
- [ ] Keep dependencies and Firebase SDKs patched.
- [ ] Publish `SECURITY.md` and monitor the security inbox.
- [ ] Follow and rehearse `docs/DATA_BREACH_RESPONSE_PLAN.md`.

## Copyright, trademark, and user content

- [ ] Keep `COPYRIGHT.md` and copyright notices current.
- [ ] Register the DMCA agent at <https://dmca.copyright.gov/osp/> and renew the designation at least every three years.
- [ ] Follow `docs/DMCA_TAKEDOWN_RUNBOOK.md` and maintain a repeat-infringer log.
- [ ] Require users to confirm they own or have permission to upload photos, videos, music, logos, and written content.
- [ ] Preserve photographer and stock-asset licenses used in marketing.
- [ ] Consider U.S. Copyright Office registration for production software, original site copy, illustrations, and distinctive visual assets.
- [ ] Search and, if cleared, file the Phera trademark in the appropriate software and event-planning classes.

## Marketing, messaging, and games

- [ ] Keep claims accurate. Do not describe access codes as encryption or promise absolute security, uptime, legal compliance, or guaranteed data preservation.
- [ ] Do not send commercial email until a CAN-SPAM process includes truthful headers, a postal address, unsubscribe handling within 10 business days, and suppression records.
- [ ] Do not add automated SMS invitations or reminders until counsel approves TCPA consent language, opt-out handling, and vendor configuration.
- [ ] Do not offer prizes through games or predictions until counsel reviews contest and sweepstakes rules.
- [ ] Revisit payment, tax, PCI, refund, and subscription terms before charging users.

## Accessibility

- [ ] Maintain an accessibility owner and issue queue.
- [ ] Test keyboard access, focus order, labels, errors, contrast, zoom, reduced motion, mobile reflow, and screen-reader output.
- [ ] Test user-created wedding themes and uploaded content, not only Phera’s default interface.
- [ ] Monitor and answer accessibility requests sent through the legal contact address.

## Primary sources

- California Online Privacy Protection Act: <https://oag.ca.gov/privacy/caloppa>
- California Civil Code privacy threshold information: <https://cppa.ca.gov/regulations/cpi_adjustment.html>
- FTC children’s privacy resources: <https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy>
- 2025 COPPA rule amendments: <https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule>
- FTC CAN-SPAM compliance guide: <https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business>
- DOJ web accessibility guidance: <https://www.ada.gov/resources/web-guidance/>
- U.S. Copyright Office DMCA agent directory: <https://www.copyright.gov/dmca-directory/>
- DMCA agent registration: <https://dmca.copyright.gov/osp/>
- USPTO trademark search: <https://tmsearch.uspto.gov/>
- USPTO fee schedule: <https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule>
- Georgia entity registration guide: <https://sos.ga.gov/how-to-guide/how-guide-register-domestic-entity>
- Georgia consumer protection: <https://consumer.georgia.gov/>
- Firebase Data Processing and Security Terms: <https://firebase.google.com/terms/data-processing-terms>

## Laws to monitor

Georgia’s comprehensive privacy law was reported effective July 1, 2026, with thresholds that may exempt an early-stage company. Counsel must verify the enrolled law, current thresholds, and applicability directly from Georgia legislative sources. CalOPPA’s privacy-policy duty can apply without a revenue threshold when a commercial site collects California residents’ personal information.
