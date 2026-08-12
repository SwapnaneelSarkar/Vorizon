import { Bullets, LegalLayout, Section } from '../components/LegalLayout';

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="August 12, 2026">
      <Section title="1. Acceptance of terms">
        <p>
          These Terms of Service (“Terms”) govern your access to and use of the Vorizon platform and
          related services (the “Service”) provided by Vorizon (“we”, “us”). By creating an account or
          using the Service, you agree to these Terms. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. The Service">
        <p>
          Vorizon provides an AI employee platform for building, testing and deploying AI voice agents
          that handle inbound and outbound phone conversations, together with tools to capture and
          qualify leads and to connect external advertising, messaging and CRM platforms. Features may
          change, improve or be discontinued over time.
        </p>
      </Section>

      <Section title="3. Accounts & eligibility">
        <p>
          You must provide accurate information, keep your credentials secure, and be authorized to
          act on behalf of your business. You are responsible for all activity under your account and
          for the actions of users you invite to your organization.
        </p>
      </Section>

      <Section title="4. Acceptable use & telephony compliance">
        <p>You agree not to use the Service to:</p>
        <Bullets
          items={[
            'Place calls or send messages to individuals without the consent required by applicable law.',
            'Violate the TCPA, DNC rules, anti-spam laws, or any telephony, messaging or advertising regulations that apply to you.',
            'Upload unlawful content or contact lists you are not permitted to use.',
            'Infringe others’ rights, transmit malware, or attempt to disrupt or reverse-engineer the Service.',
          ]}
        />
        <p>
          You are solely responsible for obtaining and maintaining the consents needed to contact the
          individuals on your lists, for honoring opt-out and Do-Not-Call requests, and for complying
          with all laws applicable to your campaigns. Vorizon provides compliance tools (consent
          capture, DNC, opt-out, recording disclosure) but does not provide legal advice.
        </p>
      </Section>

      <Section title="5. Connected platforms">
        <p>
          When you connect a third-party account (e.g. Google Ads, Meta, WhatsApp, HubSpot), you
          authorize Vorizon to access and act on that account as needed to provide the features you
          use. You must comply with each connected platform’s terms and policies, and you represent
          that you are authorized to connect those accounts. You can disconnect any platform at any
          time.
        </p>
      </Section>

      <Section title="6. Billing & payments">
        <p>
          Paid features are billed on a usage basis (for example, per conversation minute) and/or via
          the plans presented in the Service. Payments are processed by our payment provider. Charges
          are calculated from your actual usage. Except where required by law, payments are
          non-refundable.
        </p>
      </Section>

      <Section title="7. AI-generated content">
        <p>
          The Service uses AI models to generate responses, summaries and lead qualifications. AI
          output may be inaccurate or incomplete and should not be relied upon as professional advice.
          You are responsible for reviewing and supervising the AI’s behavior, including during the
          testing/interview stage before activation.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          The Service, including its software, design and content, is owned by Vorizon and protected
          by intellectual-property laws. You retain ownership of the business content and data you
          upload, and you grant us the rights needed to operate the Service on your behalf.
        </p>
      </Section>

      <Section title="9. Third-party services">
        <p>
          The Service integrates with third-party providers and platforms. We are not responsible for
          the availability, content or practices of those third parties, and your use of them is
          governed by their own terms.
        </p>
      </Section>

      <Section title="10. Disclaimers & limitation of liability">
        <p>
          The Service is provided “as is” and “as available” without warranties of any kind, to the
          fullest extent permitted by law. To the maximum extent permitted by law, Vorizon will not be
          liable for any indirect, incidental, special or consequential damages, or for lost profits,
          revenues, data or business, arising from your use of the Service.
        </p>
      </Section>

      <Section title="11. Indemnification">
        <p>
          You agree to indemnify and hold Vorizon harmless from claims, losses and expenses arising
          from your use of the Service, your content or campaigns, or your violation of these Terms or
          applicable law — including any telephony, messaging or advertising regulations.
        </p>
      </Section>

      <Section title="12. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate access if you
          violate these Terms or use the Service in a way that could cause harm or legal exposure. On
          termination, your right to use the Service ends; certain provisions survive termination.
        </p>
      </Section>

      <Section title="13. Changes to these terms">
        <p>
          We may update these Terms from time to time. Material changes will be reflected by the “Last
          updated” date above. Your continued use of the Service after changes take effect constitutes
          acceptance.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          Questions about these Terms? Contact us at{' '}
          <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
            crowdbuzz.company@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
