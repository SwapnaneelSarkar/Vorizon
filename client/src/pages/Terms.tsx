import { Link } from 'react-router-dom';
import { Bullets, LegalLayout, Section } from '../components/LegalLayout';

export function TermsPage() {
  return (
    <LegalLayout title="Terms and Conditions" updated="August 18, 2026">
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">
        <p>
          These Terms and Conditions (“Terms”) govern your access to and use of Vorizon, including
          its website, applications, dashboards, APIs, AI voice agents, inbound and outbound calling
          features, and related services (collectively, the “Services”).
        </p>
        <p>
          By creating an account, purchasing credits, adding a payment method, configuring an AI
          agent, initiating or receiving calls through Vorizon, or otherwise using the Services, you
          agree to these Terms.
        </p>
        <p>If you do not agree to these Terms, you must not use the Services.</p>
      </div>

      <Section title="1. About Vorizon">
        <p>
          Vorizon is an AI-powered voice communication platform that enables businesses and other
          authorized users to configure artificial intelligence agents to perform functions
          including:
        </p>
        <Bullets
          items={[
            'Receiving inbound telephone calls;',
            'Making outbound telephone calls;',
            'Responding to callers using information supplied by the customer;',
            'Handling customer inquiries;',
            'Conducting authorized surveys, interviews, lead qualification, appointment-related conversations, and other configured workflows;',
            'Transferring or diverting calls to designated human representatives;',
            'Processing call lists uploaded by customers;',
            'Generating call-related records, transcripts, summaries, analytics, and other AI-generated information where such functionality is available.',
          ]}
        />
        <p>
          Vorizon provides the technological infrastructure for these activities. Customers remain
          responsible for determining whether and how the Services may lawfully be used for their
          particular business, industry, jurisdiction, and intended recipients.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be legally capable of entering into a binding agreement to use Vorizon.</p>
        <p>
          If you use Vorizon on behalf of a company, organization, partnership, or other legal
          entity, you represent that:
        </p>
        <Bullets
          items={[
            'You have authority to bind that entity to these Terms;',
            'The information you provide is accurate;',
            'Your organization is legally permitted to use the Services; and',
            'Your use of Vorizon complies with applicable laws and regulations.',
          ]}
        />
        <p>
          “User,” “Customer,” “you,” and “your” may refer to both the individual operating the
          account and the organization on whose behalf the account is operated.
        </p>
      </Section>

      <Section title="3. Account registration">
        <p>Certain Vorizon features require an account.</p>
        <p>You agree to provide accurate, complete, and current registration information.</p>
        <p>You are responsible for:</p>
        <Bullets
          items={[
            'Maintaining the confidentiality of your login credentials;',
            'Restricting unauthorized access to your account;',
            'Activities performed through your account;',
            'Configurations made to your AI agents;',
            'Telephone numbers and contact lists submitted through your account;',
            'Payment methods connected to your account; and',
            'Promptly informing Vorizon if you become aware of unauthorized access.',
          ]}
        />
        <p>You must not share credentials in a manner that compromises account security.</p>
        <p>
          Vorizon may require identity, business, telephone-number, payment, or other verification
          before providing certain functionality.
        </p>
      </Section>

      <Section title="4. AI voice agents">
        <p>
          Vorizon allows customers to configure AI voice agents by supplying information,
          instructions, scripts, prompts, knowledge, workflows, business information, and other
          materials.
        </p>
        <p>You are responsible for the instructions and information supplied to your AI agent.</p>
        <p>You acknowledge that artificial intelligence is probabilistic and may:</p>
        <Bullets
          items={[
            'Misinterpret a caller;',
            'Produce incorrect information;',
            'Generate an inappropriate or unexpected response;',
            'Fail to understand an instruction;',
            'Incorrectly classify a conversation;',
            'Fail to transfer a call;',
            'Experience delays;',
            'Produce inaccurate transcripts or summaries; or',
            'Otherwise behave differently from what you expected.',
          ]}
        />
        <p>
          Vorizon does not guarantee that an AI agent will provide factually correct, complete,
          uninterrupted, or error-free responses.
        </p>
        <p>
          Customers should independently determine whether human review or supervision is necessary
          for their particular use case.
        </p>
      </Section>

      <Section title="5. AI disclosure">
        <p>
          Depending on applicable law and the nature of the interaction, users may be required to
          disclose that a caller is communicating with an artificial intelligence system.
        </p>
        <p>You are responsible for implementing any disclosure required by applicable law.</p>
        <p>
          You must not intentionally configure Vorizon to impersonate a real person, government
          authority, financial institution, law-enforcement authority, or other individual or
          organization in a deceptive or fraudulent manner.
        </p>
      </Section>

      <Section title="6. Inbound calling">
        <p>
          Vorizon may allow customers to configure an AI agent to receive calls made to a business or
          Vorizon-supported telephone number.
        </p>
        <p>Customers may provide information about their organization so that the AI agent can respond to callers.</p>
        <p>
          Where supported, customers may configure a diversion or transfer number so that calls can
          be routed to a human representative.
        </p>
        <p>Call transfer functionality is provided on a reasonable-efforts basis.</p>
        <p>
          Vorizon does not guarantee that every transfer will successfully connect. Transfers may
          fail because of telecommunications networks, destination availability, carrier
          restrictions, internet connectivity, configuration errors, third-party outages, or other
          technical circumstances.
        </p>
      </Section>

      <Section title="7. Outbound calling">
        <p>
          Vorizon may allow customers to provide or upload telephone numbers and instruct an AI agent
          to initiate outbound calls.
        </p>
        <p>By using outbound calling, you represent and warrant that:</p>
        <Bullets
          items={[
            'You have a lawful basis for contacting every recipient;',
            'You have obtained any consent required by applicable law;',
            'Your contact lists were obtained lawfully;',
            'You will respect applicable opt-out and do-not-call requirements;',
            'Your calls do not constitute unlawful spam, harassment, fraud, or deceptive marketing; and',
            'Your use complies with telecommunications, privacy, advertising, consumer-protection, and AI-related laws applicable to you and the recipients.',
          ]}
        />
        <p>
          Vorizon does not independently verify that every number uploaded by a customer may legally
          be contacted.
        </p>
        <p>The responsibility for determining whether a call is legally permitted remains with the customer initiating the campaign.</p>
      </Section>

      <Section title="8. Consent and telecommunications compliance">
        <p>Telephone and automated calling laws vary significantly by jurisdiction.</p>
        <p>Depending on the location of the customer and recipient, laws may regulate:</p>
        <Bullets
          items={[
            'Automated calls;',
            'Artificial or prerecorded voices;',
            'AI-generated voices;',
            'Telemarketing;',
            'Marketing consent;',
            'Do-not-call registries;',
            'Calling hours;',
            'Caller identification;',
            'Recording;',
            'Data processing;',
            'Political communications;',
            'Healthcare communications;',
            'Financial communications; and',
            'Consumer disclosures.',
          ]}
        />
        <p>You are solely responsible for identifying and complying with requirements applicable to your use of Vorizon.</p>
        <p>
          Vorizon may impose additional technical or operational restrictions where reasonably
          necessary for legal, security, carrier, or platform-compliance reasons.
        </p>
      </Section>

      <Section title="9. Call recording and transcription">
        <p>Certain Vorizon functionality may support recording, transcription, analysis, or summarization of calls.</p>
        <p>
          Recording and interception laws vary by jurisdiction. Some jurisdictions require consent
          from one party, while others may require consent from all participants.
        </p>
        <p>Before enabling recording or transcription, you are responsible for:</p>
        <Bullets
          items={[
            'Determining whether recording is lawful;',
            'Providing required notices;',
            'Obtaining required consent; and',
            'Maintaining evidence of consent where necessary.',
          ]}
        />
        <p>Vorizon does not guarantee that enabling a recording feature automatically satisfies your legal obligations.</p>
      </Section>

      <Section title="10. Customer data">
        <p>Customers may provide Vorizon with information including:</p>
        <Bullets
          items={[
            'Business information;',
            'Knowledge-base information;',
            'Prompts and instructions;',
            'Customer telephone numbers;',
            'Contact lists;',
            'Call scripts;',
            'Names;',
            'Call recordings;',
            'Transcripts;',
            'Conversation information; and',
            'Other content required to operate AI agents.',
          ]}
        />
        <p>You retain ownership of your underlying Customer Data.</p>
        <p>
          You grant Vorizon a limited right to host, process, transmit, reproduce, and otherwise use
          Customer Data as reasonably necessary to provide, maintain, secure, troubleshoot, and
          improve the Services, subject to applicable privacy requirements.
        </p>
        <p>You represent that you have the rights and permissions necessary to provide such information to Vorizon.</p>
      </Section>

      <Section title="11. Personal data">
        <p>
          When you submit personal information concerning another individual, you represent that you
          have an appropriate legal basis or authorization to process that information using Vorizon.
        </p>
        <p>You must not use Vorizon to unlawfully collect, process, disclose, sell, distribute, or otherwise misuse personal information.</p>
        <p>
          Additional details concerning personal information are governed by Vorizon’s separate{' '}
          <Link className="text-brand-blue hover:underline" to="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section title="12. Sensitive information">
        <p>
          Unless Vorizon expressly supports a particular regulated use case, you should not configure
          an AI agent to collect unnecessary highly sensitive information.
        </p>
        <p>
          Customers operating in regulated industries are responsible for determining whether Vorizon
          satisfies the technical, contractual, security, and regulatory requirements applicable to
          their organization.
        </p>
        <p>Use of Vorizon does not itself make a customer compliant with any particular regulatory framework.</p>
      </Section>

      <Section title="13. Pricing">
        <p>Vorizon may charge customers based on usage, including call duration.</p>
        <p>
          Under the current pricing model, calling may be charged at approximately{' '}
          <strong>USD $0.10 per minute</strong>, unless another price is displayed in the customer
          dashboard, pricing page, order, contract, promotional offer, or other applicable
          commercial agreement.
        </p>
        <p>Pricing may vary depending on factors such as:</p>
        <Bullets
          items={[
            'Country;',
            'Destination;',
            'Telephone provider;',
            'Type of number;',
            'AI infrastructure usage;',
            'Additional features;',
            'Taxes;',
            'Third-party charges; or',
            'Enterprise arrangements.',
          ]}
        />
        <p>The price displayed or contractually agreed at the relevant time will control.</p>
        <p>Vorizon may change its pricing prospectively. Material pricing changes will apply in accordance with applicable notice requirements.</p>
      </Section>

      <Section title="14. Usage calculation">
        <p>Call duration may be calculated according to Vorizon or its telecommunications providers’ usage records.</p>
        <p>
          Depending on the service configuration, billable usage may include the period during which
          a call is connected to Vorizon infrastructure.
        </p>
        <p>Minor differences may occur between the duration displayed on a telephone device and Vorizon’s billing records.</p>
        <p>Vorizon’s system records will ordinarily determine billable usage unless there is a demonstrable billing error.</p>
      </Section>

      <Section title="15. Payment methods">
        <p>Customers may be required to add a valid credit card, debit card, wallet, prepaid balance, or other supported payment method.</p>
        <p>
          By adding a payment method, you authorize Vorizon and its payment-processing partners to
          charge applicable fees associated with your use of the Services.
        </p>
        <p>You represent that you are authorized to use the payment method provided.</p>
        <p>You are responsible for keeping billing information current.</p>
      </Section>

      <Section title="16. Credits and prepaid balances">
        <p>Vorizon may operate using prepaid credits or account balances.</p>
        <p>Where applicable:</p>
        <Bullets
          items={[
            'Credits may be deducted according to usage;',
            'Calling may stop when the available balance is insufficient;',
            'Minimum balance requirements may apply;',
            'Promotional credits may have separate conditions or expiry dates; and',
            'Credits have no cash value except where required by law.',
          ]}
        />
        <p>Vorizon may offer automatic balance recharge functionality.</p>
        <p>
          If enabled by the customer, the customer authorizes Vorizon to charge the selected payment
          method when the account reaches the configured threshold.
        </p>
      </Section>

      <Section title="17. Taxes">
        <p>Prices may exclude applicable taxes unless expressly stated otherwise.</p>
        <p>
          Customers are responsible for taxes, duties, levies, or governmental charges associated
          with their purchase or use of Vorizon, except taxes imposed directly on Vorizon’s income.
        </p>
      </Section>

      <Section title="18. Refunds">
        <p>Except where required by applicable law or expressly stated otherwise, fees for completed usage are non-refundable.</p>
        <p>This includes charges for successfully connected calls and consumed AI or telecommunications resources.</p>
        <p>If you believe you were charged because of a technical or billing error attributable to Vorizon, you may submit a billing dispute.</p>
        <p>Vorizon may investigate system and telecommunications records before determining whether an adjustment or refund is appropriate.</p>
      </Section>

      <Section title="19. Free services and promotions">
        <p>Vorizon may provide free trials, promotional credits, free plans, beta features, or other promotional access.</p>
        <p>Such access may:</p>
        <Bullets
          items={[
            'Have usage limits;',
            'Include advertising;',
            'Have reduced functionality;',
            'Have limited telephone availability;',
            'Expire;',
            'Be changed or discontinued; or',
            'Be subject to additional conditions.',
          ]}
        />
        <p>Free or promotional access does not guarantee continued free availability of the relevant functionality.</p>
      </Section>

      <Section title="20. Prohibited uses">
        <p>You must not use Vorizon to:</p>
        <Bullets
          items={[
            'Commit or facilitate fraud;',
            'Scam or deceive individuals;',
            'Conduct unlawful robocalling;',
            'Make calls without legally required consent;',
            'Harass, threaten, intimidate, or abuse individuals;',
            'Circumvent do-not-call requirements;',
            'Impersonate another person deceptively;',
            'Spread malicious software;',
            'Conduct phishing;',
            'Obtain passwords, OTPs, authentication codes, or financial credentials through deception;',
            'Make false emergency communications;',
            'Interfere with telecommunications networks;',
            'Conduct illegal debt collection;',
            'Promote illegal goods or services;',
            'Violate intellectual-property rights;',
            'Violate privacy or data-protection laws;',
            'Upload unlawfully acquired databases;',
            'Manipulate caller identification unlawfully;',
            'Circumvent Vorizon security, usage limits, or safeguards; or',
            'Use Vorizon for any activity prohibited by applicable law.',
          ]}
        />
        <p>Vorizon may investigate suspected abuse and restrict or suspend accounts where reasonably necessary.</p>
      </Section>

      <Section title="21. Emergency services">
        <p>Vorizon is not an emergency communications service.</p>
        <p>You must not rely on an AI agent for emergency calls or life-critical communication.</p>
        <p>Vorizon does not guarantee access to police, ambulance, fire, emergency medical, or other emergency services.</p>
      </Section>

      <Section title="22. High-risk decisions">
        <p>
          Unless expressly authorized by Vorizon under a separate agreement, Vorizon should not be
          used as the sole decision-maker for decisions that may have significant legal or similarly
          serious effects on individuals.
        </p>
        <p>AI-generated responses and analyses should not be treated as professional legal, medical, financial, or other regulated professional advice.</p>
        <p>Appropriate human review should be implemented where required.</p>
      </Section>

      <Section title="23. Third-party services">
        <p>Vorizon may depend on third-party infrastructure and services, including:</p>
        <Bullets
          items={[
            'Telecommunications carriers;',
            'Cloud infrastructure;',
            'Artificial intelligence providers;',
            'Speech recognition services;',
            'Text-to-speech providers;',
            'Payment processors;',
            'Analytics providers; and',
            'Other technology vendors.',
          ]}
        />
        <p>Failures or changes affecting third-party providers may affect Vorizon.</p>
        <p>Vorizon is not responsible for third-party services beyond the extent required by applicable law.</p>
      </Section>

      <Section title="24. Telephone numbers">
        <p>Where Vorizon provides telephone numbers, availability is not guaranteed.</p>
        <p>Numbers may be subject to carrier and regulatory requirements.</p>
        <p>Vorizon may replace, suspend, reclaim, or discontinue a number where required because of:</p>
        <Bullets
          items={[
            'Regulatory requirements;',
            'Carrier requirements;',
            'Non-payment;',
            'Abuse;',
            'Extended inactivity;',
            'Account termination; or',
            'Technical limitations.',
          ]}
        />
        <p>Customers should not assume permanent ownership of telephone numbers supplied through Vorizon unless explicitly stated otherwise.</p>
      </Section>

      <Section title="25. Service availability">
        <p>Vorizon aims to provide reliable Services but does not guarantee continuous availability.</p>
        <p>Services may become unavailable because of:</p>
        <Bullets
          items={[
            'Maintenance;',
            'Software updates;',
            'Telecommunications failures;',
            'Internet outages;',
            'Cloud-provider failures;',
            'AI-provider failures;',
            'Cybersecurity incidents;',
            'Government restrictions;',
            'Force majeure events; or',
            'Other circumstances outside Vorizon’s reasonable control.',
          ]}
        />
        <p>Vorizon may perform planned or emergency maintenance when necessary.</p>
      </Section>

      <Section title="26. Beta features">
        <p>Vorizon may release experimental, preview, early-access, or beta functionality.</p>
        <p>Beta features may contain defects, change without notice, or be discontinued.</p>
        <p>They are provided for testing and evaluation unless otherwise specified.</p>
      </Section>

      <Section title="27. Intellectual property">
        <p>Vorizon and its licensors retain all rights, title, and interest in the Vorizon platform, including its:</p>
        <Bullets
          items={[
            'Software;',
            'Source code;',
            'Interface;',
            'Brand;',
            'Logos;',
            'Platform architecture;',
            'Documentation;',
            'Models or orchestration technology owned by Vorizon; and',
            'Other proprietary technology.',
          ]}
        />
        <p>These Terms do not transfer ownership of Vorizon intellectual property to customers.</p>
        <p>You receive a limited, revocable, non-exclusive, non-transferable right to use the Services in accordance with these Terms.</p>
      </Section>

      <Section title="28. Customer content">
        <p>You retain ownership of content that you lawfully submit to Vorizon.</p>
        <p>You represent and warrant that your content does not infringe another person’s:</p>
        <Bullets
          items={[
            'Copyright;',
            'Trademark;',
            'Privacy rights;',
            'Publicity rights;',
            'Confidentiality obligations; or',
            'Other legal rights.',
          ]}
        />
        <p>You are responsible for claims arising from content you provide without sufficient rights or authorization.</p>
      </Section>

      <Section title="29. AI-generated content">
        <p>Information generated by an AI agent may contain errors.</p>
        <p>You are responsible for evaluating AI-generated content before relying on it for material business or legal decisions.</p>
        <p>Vorizon makes no representation that AI-generated responses are unique, accurate, complete, or suitable for a particular purpose.</p>
        <p>Similar responses may be generated for different customers.</p>
      </Section>

      <Section title="30. Security">
        <p>Vorizon may implement reasonable administrative, technical, and organizational measures designed to protect its systems and customer information.</p>
        <p>However, no online service or telecommunications system can guarantee absolute security.</p>
        <p>Customers are responsible for securing:</p>
        <Bullets
          items={[
            'Their devices;',
            'Login credentials;',
            'API credentials;',
            'Employee access;',
            'Integrations; and',
            'Data exported from Vorizon.',
          ]}
        />
      </Section>

      <Section title="31. Account suspension">
        <p>Vorizon may temporarily restrict or suspend an account where reasonably necessary because of:</p>
        <Bullets
          items={[
            'Non-payment;',
            'Fraud;',
            'Suspected illegal activity;',
            'Telecommunications abuse;',
            'Excessive complaints;',
            'Security risks;',
            'Violations of these Terms;',
            'Carrier requirements;',
            'Government or court orders; or',
            'Material risks to Vorizon, its infrastructure, users, or third parties.',
          ]}
        />
        <p>Where reasonably practicable and legally permitted, Vorizon may provide notice or an opportunity to resolve the issue.</p>
        <p>Serious abuse may result in immediate suspension.</p>
      </Section>

      <Section title="32. Termination by customer">
        <p>You may stop using Vorizon and close your account according to the account-closure process provided by Vorizon.</p>
        <p>Closing an account does not eliminate payment obligations already incurred.</p>
        <p>Amounts owed for prior usage remain payable.</p>
      </Section>

      <Section title="33. Termination by Vorizon">
        <p>Vorizon may terminate access where:</p>
        <Bullets
          items={[
            'You materially violate these Terms;',
            'Your activity is unlawful;',
            'You repeatedly violate telecommunications rules;',
            'Your account creates a material security or legal risk;',
            'Required third-party infrastructure becomes unavailable; or',
            'Continued service is prohibited by law.',
          ]}
        />
        <p>Where appropriate, Vorizon may provide advance notice.</p>
      </Section>

      <Section title="34. Effect of termination">
        <p>After termination:</p>
        <Bullets
          items={[
            'Your right to use the Services ends;',
            'Active AI agents may stop operating;',
            'Assigned telephone numbers may be released;',
            'Outstanding amounts remain payable; and',
            'Customer Data may be deleted according to Vorizon’s applicable retention policies.',
          ]}
        />
        <p>Customers should export information they are legally entitled to retain before closing an account where export functionality is available.</p>
      </Section>

      <Section title="35. Disclaimer of warranties">
        <p>To the maximum extent permitted by applicable law, Vorizon is provided on an “as is” and “as available” basis.</p>
        <p>Vorizon does not warrant that:</p>
        <Bullets
          items={[
            'AI responses will always be correct;',
            'Calls will always connect;',
            'Speech recognition will always be accurate;',
            'Every caller will be understood;',
            'Every transfer will succeed;',
            'The Services will operate without interruption;',
            'Every feature will remain available permanently; or',
            'The Services will satisfy every customer’s particular regulatory requirements.',
          ]}
        />
        <p>Nothing in this section excludes warranties that cannot legally be excluded.</p>
      </Section>

      <Section title="36. Limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, Vorizon and its owners, directors,
          employees, contractors, affiliates, and service providers will not be liable for indirect,
          incidental, special, exemplary, punitive, or consequential losses arising from the use or
          inability to use Vorizon.
        </p>
        <p>This may include loss of:</p>
        <Bullets
          items={[
            'Profits;',
            'Revenue;',
            'Business opportunities;',
            'Customers;',
            'Data;',
            'Reputation; or',
            'Expected savings.',
          ]}
        />
        <p>
          Where liability cannot legally be excluded, Vorizon’s aggregate liability relating to the
          Services will, to the extent legally permitted, be limited to the amount paid by the
          customer to Vorizon during the applicable period preceding the event giving rise to the
          claim.
        </p>
        <p>Nothing in these Terms limits liability where limitation is prohibited by applicable law.</p>
      </Section>

      <Section title="37. Customer indemnification">
        <p>
          To the extent permitted by applicable law, you agree to defend, indemnify, and hold
          harmless Vorizon and its affiliates, officers, employees, and service providers from
          third-party claims arising from:
        </p>
        <Bullets
          items={[
            'Your unlawful calling activities;',
            'Calls made without required consent;',
            'Your Customer Data;',
            'Your violation of privacy or recording laws;',
            'Your violation of telecommunications laws;',
            'Your infringement of third-party rights;',
            'Fraudulent or deceptive use of an AI agent; or',
            'Your material violation of these Terms.',
          ]}
        />
      </Section>

      <Section title="38. Changes to the Services">
        <p>Vorizon may modify, improve, replace, add, or discontinue features.</p>
        <p>This may include changes to:</p>
        <Bullets
          items={[
            'AI models;',
            'Voice providers;',
            'Calling infrastructure;',
            'Pricing;',
            'Dashboard functionality;',
            'Telephone-number availability;',
            'Integrations; and',
            'Usage limits.',
          ]}
        />
        <p>Where a change materially affects paid Services, Vorizon will provide notice where required by applicable law.</p>
      </Section>

      <Section title="39. Changes to these Terms">
        <p>Vorizon may update these Terms periodically.</p>
        <p>The updated version will state its effective or “Last Updated” date.</p>
        <p>Where legally required, Vorizon will provide additional notice of material changes.</p>
        <p>Continued use of the Services after updated Terms become effective constitutes acceptance of those Terms to the extent permitted by applicable law.</p>
      </Section>

      <Section title="40. Governing law">
        <p>These Terms are governed by the laws of India, without regard to conflict-of-laws principles.</p>
        <Bullets
          items={[
            'Operating company: Crowdbuzz Technologies Pvt. Ltd.',
            'Registered address: Hyderabad, Telangana, 500097, India',
            'Governing law: India',
            'Jurisdiction: courts located in Hyderabad, Telangana, India',
          ]}
        />
      </Section>

      <Section title="41. Dispute resolution">
        <p>
          Before commencing formal proceedings, users are encouraged to contact Vorizon at{' '}
          <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
            crowdbuzz.company@gmail.com
          </a>{' '}
          and attempt to resolve disputes directly.
        </p>
        <p>
          Any mandatory arbitration, mediation, court jurisdiction, class-action waiver, or other
          dispute-resolution mechanism applicable to a specific customer relationship will be set out
          in a separately executed order form or enterprise agreement, consistent with the governing
          law identified above.
        </p>
      </Section>

      <Section title="42. Severability">
        <p>
          If a provision of these Terms is found unenforceable, invalid, or unlawful, the remaining
          provisions will continue in effect to the maximum extent permitted by law.
        </p>
      </Section>

      <Section title="43. No waiver">
        <p>Failure by Vorizon to enforce a provision of these Terms does not constitute a permanent waiver of that provision or any other right.</p>
      </Section>

      <Section title="44. Assignment">
        <p>
          Customers may not transfer their rights or obligations under these Terms without Vorizon’s
          prior written consent where such consent is legally permissible.
        </p>
        <p>
          Vorizon may transfer these Terms as part of a merger, acquisition, corporate restructuring,
          financing, or sale of substantially all relevant assets, subject to applicable law.
        </p>
      </Section>

      <Section title="45. Entire agreement">
        <p>
          These Terms, together with the{' '}
          <Link className="text-brand-blue hover:underline" to="/privacy">
            Privacy Policy
          </Link>{' '}
          and any additional terms, order forms, enterprise agreements, or policies expressly
          incorporated into them, constitute the agreement between the customer and Vorizon regarding
          use of the Services.
        </p>
        <p>Where an individually executed agreement conflicts with these Terms, the executed agreement will control to the extent stated in that agreement.</p>
      </Section>

      <Section title="46. Contact">
        <p>Questions, complaints, billing disputes, or legal notices concerning these Terms may be sent to:</p>
        <Bullets
          items={[
            'Vorizon legal entity: Crowdbuzz Technologies Pvt. Ltd.',
            <>
              Email:{' '}
              <a className="text-brand-blue hover:underline" href="mailto:crowdbuzz.company@gmail.com">
                crowdbuzz.company@gmail.com
              </a>
            </>,
            'Address: Hyderabad, Telangana, 500097, India',
          ]}
        />
      </Section>

      <Section title="47. Important customer acknowledgement">
        <p>By creating a Vorizon account or using its calling functionality, you acknowledge that:</p>
        <Bullets
          items={[
            'Vorizon uses artificial intelligence to conduct voice interactions.',
            'AI-generated responses can contain mistakes.',
            'You are responsible for providing accurate instructions and business information to your AI agents.',
            'You are responsible for obtaining legally required consent before making automated or AI-powered outbound calls.',
            'You are responsible for complying with applicable call-recording and privacy laws.',
            'You must not use Vorizon for spam, fraud, harassment, deception, or other unlawful communications.',
            'Usage charges may be incurred based on call duration and other applicable Services.',
            'Vorizon is not an emergency communications service.',
            'Vorizon may suspend abusive, fraudulent, unlawful, or non-compliant accounts.',
          ]}
        />
        <p>By continuing to use Vorizon, you agree to these Terms and any policies incorporated into them.</p>
      </Section>
    </LegalLayout>
  );
}
