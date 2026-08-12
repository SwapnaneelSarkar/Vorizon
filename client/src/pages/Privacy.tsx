import { Bullets, LegalLayout, Section } from '../components/LegalLayout';

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 12, 2026">
      <Section title="1. Introduction">
        <p>
          Vorizon (“Vorizon”, “we”, “us”) provides an AI employee platform that helps businesses run
          inbound and outbound phone conversations, capture and qualify leads, and connect their
          advertising, messaging and CRM tools into one workflow. This Privacy Policy explains what
          information we collect, how we use it, and the choices you have. It applies to the Vorizon
          web application and related services (the “Service”).
        </p>
      </Section>

      <Section title="2. Information we collect">
        <Bullets
          items={[
            <>
              <strong>Account &amp; business information</strong> — your name, email, phone, company
              name, industry, and the business details you provide when creating an account or an AI
              employee.
            </>,
            <>
              <strong>Content you upload</strong> — company knowledge (descriptions, FAQs, documents,
              pricing, policies), AI responsibilities, and contact lists you import for campaigns.
            </>,
            <>
              <strong>Call data</strong> — for calls placed or received through the Service: phone
              numbers, timestamps, duration, outcome, and, where enabled, call recordings and
              transcripts.
            </>,
            <>
              <strong>Connected-platform data</strong> — when you connect an external account (e.g.
              Google Ads, Meta, WhatsApp, HubSpot), we access the specific data you authorize, such
              as ad campaigns, leads, contacts and conversion events, to operate the features you
              use.
            </>,
            <>
              <strong>Payment information</strong> — processed by our payment provider (Razorpay). We
              store payment status and references, not full card numbers.
            </>,
            <>
              <strong>Usage &amp; technical data</strong> — log data such as IP address, request
              metadata and diagnostic information used to operate and secure the Service.
            </>,
          ]}
        />
      </Section>

      <Section title="3. How we use information">
        <Bullets
          items={[
            'To provide and operate the Service — building AI employees, running campaigns, placing and metering calls, and capturing and qualifying leads.',
            'To connect and act on your authorized external accounts (advertising, messaging, CRM) on your behalf.',
            'To process billing and calculate usage-based charges.',
            'To secure the Service, prevent abuse, debug issues, and comply with legal obligations.',
            'To communicate with you about your account (e.g. transactional emails, verification and password resets).',
          ]}
        />
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="4. Connected platforms (OAuth)">
        <p>
          When you connect a third-party account, you authorize Vorizon to access that account
          through the platform’s official API using OAuth. We request only the permissions needed for
          the feature, for example:
        </p>
        <Bullets
          items={[
            'Advertising (Google Ads, Meta Ads) — to manage campaigns and retrieve performance and conversion data.',
            'Lead sources (Meta Lead Ads, Facebook Pages, Instagram) — to receive new leads for qualification.',
            'Messaging (WhatsApp Business, Gmail) — to send follow-up messages you initiate.',
            'CRM (HubSpot, Salesforce, Zoho) — to sync leads, contacts and deals.',
            'Calendar (Google Calendar) — to book appointments.',
          ]}
        />
        <p>
          Access tokens for connected accounts are <strong>encrypted at rest</strong>. You can
          disconnect any platform at any time from the Integrations page, which revokes Vorizon’s
          stored access. Your use of a connected platform is also governed by that platform’s own
          terms and privacy policy.
        </p>
      </Section>

      <Section title="5. Service providers (subprocessors)">
        <p>We rely on trusted providers to run the Service, including:</p>
        <Bullets
          items={[
            'Google Cloud / Firebase and MongoDB Atlas — hosting and data storage.',
            'Razorpay — payment processing.',
            'Resend — transactional email.',
            'Retell AI and/or Exotel — voice telephony for AI calls.',
            'AI model providers (e.g. OpenAI, Anthropic) — to generate AI responses and lead qualification, where enabled.',
          ]}
        />
        <p>These providers process data only as needed to deliver their part of the Service.</p>
      </Section>

      <Section title="6. AI calling & telephony compliance">
        <p>
          The Service is designed to help you comply with telephony regulations such as the TCPA and
          similar local laws. Before AI calling is enabled, your organization must record explicit
          consent (we store the consent status, timestamp and IP address). We support Do-Not-Call
          (DNC) lists, per-contact opt-out, and configurable call-recording disclosures. You are
          responsible for obtaining the necessary consent to contact the individuals on your lists
          and for complying with applicable laws.
        </p>
      </Section>

      <Section title="7. Data storage & security">
        <p>
          We use industry-standard measures to protect your data, including encryption of stored
          OAuth tokens and secrets, transport encryption (HTTPS), access controls, and signed
          webhooks. No method of transmission or storage is completely secure, but we work to protect
          your information and limit access to it.
        </p>
      </Section>

      <Section title="8. Data retention">
        <p>
          We retain your information for as long as your account is active or as needed to provide the
          Service, comply with legal obligations, resolve disputes and enforce agreements. You may
          request deletion of your account and associated data as described below.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct, export or delete your
          personal information, and to withdraw consent. To exercise these rights, contact us at{' '}
          <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
            crowdbuzz.company@gmail.com
          </a>
          . Individuals contacted by AI calls can opt out at any time, and opted-out numbers are added
          to the Do-Not-Call list.
        </p>
      </Section>

      <Section title="10. International transfers">
        <p>
          Vorizon operates using cloud infrastructure that may process and store data in countries
          other than your own. Where required, we take steps to ensure appropriate safeguards for such
          transfers.
        </p>
      </Section>

      <Section title="11. Children">
        <p>The Service is intended for businesses and is not directed to individuals under 18.</p>
      </Section>

      <Section title="12. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by
          the “Last updated” date above, and where appropriate we will provide additional notice.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Questions about this policy or your data? Contact us at{' '}
          <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
            crowdbuzz.company@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
