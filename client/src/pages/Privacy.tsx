import { Bullets, LegalLayout, Section } from '../components/LegalLayout';

/** Sub-heading used for nested subsections inside a Section (e.g. “1.1 Account information”). */
function SubHeading({ children }: { children: string }) {
  return <p className="pt-1 font-semibold text-slate-800">{children}</p>;
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="August 18, 2026">
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">
        <p>
          Vorizon (“Vorizon”, “we”, “us”, or “our”) is an AI-powered voice-agent platform that
          enables businesses and users to create, configure, and operate AI voice agents for inbound
          and outbound calls.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, store, disclose, and protect information
          when you use the Vorizon website, platform, applications, and related services
          (collectively, the “Services”).
        </p>
        <p>By using Vorizon, you agree to the practices described in this Privacy Policy.</p>
      </div>

      <Section title="1. Information we collect">
        <p>Depending on how you use Vorizon, we may collect the following categories of information.</p>

        <SubHeading>1.1 Account information</SubHeading>
        <p>When you create an account, we may collect:</p>
        <Bullets
          items={[
            'Name',
            'Email address',
            'Phone number',
            'Company or organization name',
            'Login credentials',
            'Account preferences',
            'Subscription and billing information',
          ]}
        />

        <SubHeading>1.2 Business and AI agent information</SubHeading>
        <p>When you create or configure an AI voice agent, you may provide information such as:</p>
        <Bullets
          items={[
            'Company information',
            'Business descriptions',
            'Products and services',
            'Frequently asked questions',
            'Agent instructions',
            'Responsibilities and workflows',
            'Contact information',
            'Business hours',
            'Call-routing instructions',
            'Diversion or fallback phone numbers',
            'Information used to customize the AI agent',
          ]}
        />
        <p>
          You are responsible for ensuring that you have the necessary rights and permissions to
          provide this information to Vorizon.
        </p>

        <SubHeading>1.3 Call and voice data</SubHeading>
        <p>When Vorizon handles calls, we may process:</p>
        <Bullets
          items={[
            'Phone numbers',
            'Call timestamps',
            'Call duration',
            'Call direction (inbound or outbound)',
            'Call recordings, where recording is enabled',
            'Voice data',
            'Call transcripts',
            'AI-generated summaries',
            'Messages exchanged during calls',
            'Call outcomes and metadata',
          ]}
        />
        <p>
          Call recording may be subject to applicable laws and consent requirements. You are
          responsible for providing any legally required notices or obtaining consent from callers
          where required.
        </p>

        <SubHeading>1.4 Payment information</SubHeading>
        <p>If you purchase paid Services, payment information may be processed by our third-party payment providers.</p>
        <p>
          Vorizon generally does not store complete credit or debit card numbers on its own servers.
          Payment providers may collect and process payment information according to their own
          privacy policies and security practices.
        </p>

        <SubHeading>1.5 Usage and technical information</SubHeading>
        <p>We may automatically collect information about how you interact with the Services, including:</p>
        <Bullets
          items={[
            'IP address',
            'Browser type',
            'Device information',
            'Operating system',
            'Login activity',
            'Pages and features accessed',
            'Usage statistics',
            'Error logs',
            'API activity',
            'Service performance information',
          ]}
        />

        <SubHeading>1.6 Cookies and similar technologies</SubHeading>
        <p>We may use cookies, local storage, pixels, and similar technologies to:</p>
        <Bullets
          items={[
            'Keep you logged in',
            'Remember preferences',
            'Maintain security',
            'Understand product usage',
            'Analyze website traffic',
            'Improve the Services',
            'Measure the effectiveness of marketing activities',
          ]}
        />
        <p>You may be able to control cookies through your browser settings.</p>
      </Section>

      <Section title="2. How we use your information">
        <p>We may use collected information to:</p>
        <Bullets
          items={[
            'Create and manage user accounts',
            'Provide and operate Vorizon',
            'Configure and operate AI voice agents',
            'Process inbound and outbound calls',
            'Provide call routing and fallback functionality',
            'Generate transcripts and summaries',
            'Calculate usage and billing',
            'Process payments',
            'Provide customer support',
            'Communicate with you about your account or Services',
            'Detect fraud, abuse, and security threats',
            'Monitor and improve system performance',
            'Develop and improve our Services',
            'Troubleshoot technical problems',
            'Comply with applicable laws and legal obligations',
          ]}
        />
        <p>
          We may also use aggregated or de-identified information for analytics, research, and
          product improvement where permitted by applicable law.
        </p>
      </Section>

      <Section title="3. AI processing">
        <p>
          Vorizon uses artificial intelligence and third-party technology providers to process
          information necessary to operate AI voice agents.
        </p>
        <p>Information submitted to an AI agent may be processed to:</p>
        <Bullets
          items={[
            'Understand user requests',
            'Generate responses',
            'Perform configured tasks',
            'Follow business instructions',
            'Route calls',
            'Produce transcripts or summaries',
            'Improve the reliability and performance of the Services',
          ]}
        />
        <p>
          You should not provide highly sensitive personal information to an AI agent unless such
          information is necessary for the intended purpose and you have a lawful basis to process
          it.
        </p>
      </Section>

      <Section title="4. How we share information">
        <p>We do not sell your personal information for monetary consideration.</p>
        <p>We may share information with trusted third parties when necessary to operate Vorizon, including:</p>

        <SubHeading>Service providers</SubHeading>
        <p>We may use third-party providers for services such as:</p>
        <Bullets
          items={[
            'Cloud hosting',
            'Database infrastructure',
            'AI and machine-learning processing',
            'Voice and telecommunications services',
            'Payment processing',
            'Analytics',
            'Authentication',
            'Email and communications',
            'Security and monitoring',
          ]}
        />
        <p>These providers may process information on our behalf and are expected to use it only for purposes necessary to provide their services.</p>

        <SubHeading>Legal requirements</SubHeading>
        <p>We may disclose information if reasonably necessary to:</p>
        <Bullets
          items={[
            'Comply with applicable law',
            'Respond to lawful governmental requests',
            'Enforce our agreements',
            'Protect our rights or property',
            'Investigate fraud or abuse',
            'Protect the safety of users or other individuals',
          ]}
        />

        <SubHeading>Business transfers</SubHeading>
        <p>
          If Vorizon is involved in a merger, acquisition, financing, restructuring, sale of assets,
          or similar transaction, information may be transferred as part of that transaction, subject
          to applicable legal requirements.
        </p>
      </Section>

      <Section title="5. Call recording and consent">
        <p>Vorizon may provide functionality for recording, transcribing, or summarizing calls.</p>
        <p>
          Call recording laws vary between jurisdictions. Depending on the location of the parties
          involved in a call, consent or notification may be required before recording.
        </p>
        <p>
          You are responsible for ensuring that your use of Vorizon complies with all applicable
          call-recording, telecommunications, privacy, and consent laws.
        </p>
        <p>
          Vorizon does not guarantee that your configuration or use of call-recording functionality
          will satisfy the legal requirements of every jurisdiction.
        </p>
      </Section>

      <Section title="6. Outbound calling">
        <p>If you use Vorizon to make outbound calls, you are responsible for ensuring that:</p>
        <Bullets
          items={[
            'You have a lawful basis to contact recipients.',
            'You comply with applicable telemarketing and telecommunications regulations.',
            'You honor applicable do-not-call requirements.',
            'You provide required identification or disclosures.',
            'You obtain any required consent.',
            'Your calling lists and contact information are collected and used lawfully.',
          ]}
        />
        <p>Vorizon may restrict or suspend accounts that appear to violate applicable laws or our Terms of Service.</p>
      </Section>

      <Section title="7. Data retention">
        <p>We retain information only for as long as reasonably necessary to:</p>
        <Bullets
          items={[
            'Provide the Services',
            'Maintain your account',
            'Complete legitimate business purposes',
            'Resolve disputes',
            'Prevent fraud and abuse',
            'Comply with legal obligations',
            'Enforce our agreements',
          ]}
        />
        <p>Retention periods may vary depending on the type of information and how it is used.</p>
        <p>You may request deletion of certain information as described below, subject to legal and operational requirements.</p>
      </Section>

      <Section title="8. Data security">
        <p>
          We use reasonable administrative, technical, and organizational safeguards designed to
          protect information against unauthorized access, loss, misuse, alteration, or disclosure.
        </p>
        <p>However, no internet transmission or electronic storage system can be guaranteed to be completely secure.</p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          notifying us if you believe your account has been compromised.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>Depending on your location and applicable law, you may have rights regarding your personal information, including the right to:</p>
        <Bullets
          items={[
            'Request access to personal information we hold about you',
            'Request correction of inaccurate information',
            'Request deletion of personal information',
            'Request restriction of certain processing',
            'Object to certain processing',
            'Request portability of certain information',
            'Withdraw consent where processing is based on consent',
            'Lodge a complaint with an applicable data-protection authority',
          ]}
        />
        <p>To exercise applicable rights, contact us using the details provided below.</p>
        <p>We may need to verify your identity before completing certain requests.</p>
      </Section>

      <Section title="10. Account and data deletion">
        <p>You may request deletion of your Vorizon account and associated personal information by contacting us.</p>
        <p>Certain information may be retained where necessary to:</p>
        <Bullets
          items={[
            'Meet legal requirements',
            'Prevent fraud',
            'Resolve disputes',
            'Maintain security',
            'Complete financial or accounting records',
            'Enforce contractual obligations',
          ]}
        />
        <p>
          Deletion of an account may also result in the removal or loss of configured AI agents, call
          data, settings, and other account information, subject to applicable retention
          requirements.
        </p>
      </Section>

      <Section title="11. Children’s privacy">
        <p>
          Vorizon is intended for businesses and general users and is not directed toward children
          under the applicable minimum age required by law.
        </p>
        <p>We do not knowingly collect personal information from children where such collection is prohibited by applicable law.</p>
        <p>If you believe that a child has provided personal information to us, please contact us so that we can take appropriate action.</p>
      </Section>

      <Section title="12. International data transfers">
        <p>Vorizon and its service providers may process information in countries other than the country where you reside.</p>
        <p>Where required by applicable law, we will use appropriate safeguards for international transfers of personal information.</p>
      </Section>

      <Section title="13. Third-party services">
        <p>
          Vorizon may integrate with or rely on third-party services, including telecommunications
          providers, AI providers, payment processors, analytics services, hosting providers, and
          other infrastructure providers.
        </p>
        <p>Those third parties may have their own privacy policies and terms. Vorizon is not responsible for the privacy practices of independent third-party services.</p>
      </Section>

      <Section title="14. Your responsibilities">
        <p>When using Vorizon, you are responsible for ensuring that information you provide to the platform is collected, processed, and used lawfully.</p>
        <p>You should not use Vorizon to process information unlawfully or to conduct activities that violate applicable privacy, telecommunications, consumer-protection, or other laws.</p>
        <p>If you configure an AI agent to interact with customers or other individuals, you are responsible for providing appropriate disclosures about the use of AI where required by law.</p>
      </Section>

      <Section title="15. Changes to this Privacy Policy">
        <p>We may update this Privacy Policy from time to time.</p>
        <p>
          When we make changes, we may update the “Last updated” date at the top of this Privacy
          Policy. Material changes may also be communicated through the Services or by email where
          appropriate.
        </p>
        <p>
          Your continued use of Vorizon after an updated Privacy Policy becomes effective constitutes
          acceptance of the updated policy to the extent permitted by applicable law.
        </p>
      </Section>

      <Section title="16. Contact us">
        <p>If you have questions about this Privacy Policy, your personal information, or data-deletion requests, please contact:</p>
        <p>
          Vorizon — email:{' '}
          <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
            crowdbuzz.company@gmail.com
          </a>
        </p>
        <p>For privacy-related requests, please include sufficient information for us to identify your account and understand your request.</p>
      </Section>
    </LegalLayout>
  );
}
