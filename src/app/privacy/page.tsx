import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/unthinked/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy · Unthinked" };

export default function Page() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        {LEGAL.appName} is a travel assistant for planning trips, finding flights and stays, checking visa rules and
        finding travel companions. It is run by {LEGAL.operator}. This policy explains what information the app handles
        and what happens to it.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Your profile name, travel preferences, saved trips, bookings, visa application details (including passport
        details you enter), travel-companion profile and chats are stored in your device&apos;s app storage. We do not
        receive or keep a copy of them on our servers. Deleting the app, or using <em>Reset demo data</em> in Profile,
        erases them.
      </p>

      <h2>What we send to process your request</h2>
      <ul>
        <li>
          <strong>Messages to the assistant.</strong> When you chat with the assistant, your messages and the
          conversation so far are sent to our server and passed to an AI model provider (through Vercel&apos;s AI
          Gateway) to write a reply. They are used only to answer you, not to advertise to you, and we do not store
          them after the reply is sent. The providers may keep them briefly under their own terms for abuse
          monitoring.
        </li>
        <li>
          <strong>Standard web requests.</strong> Our hosting provider receives your IP address and basic device
          information with each request, as any website does, and may keep short-lived logs for security.
        </li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your information or share it for advertising.</li>
        <li>We don&apos;t track you across other apps or websites.</li>
        <li>We don&apos;t use analytics or advertising SDKs.</li>
        <li>We don&apos;t take payments yet. Prices, bookings and visa applications in the app are simulated.</li>
      </ul>

      <h2>Children</h2>
      <p>The app is not meant for children under 13, and we don&apos;t knowingly collect information from them.</p>

      <h2>Your choices and rights</h2>
      <p>
        Because your data lives on your device, you can view, change or erase it in the app at any time. If you have a
        question about your data, or want to exercise a right under India&apos;s Digital Personal Data Protection Act,
        GDPR or another law that applies to you, contact us at <ContactLine />.
      </p>

      <h2>Changes</h2>
      <p>
        When we add accounts, real bookings or payments, we will update this policy before those features go live and
        change the date at the top.
      </p>
    </LegalPage>
  );
}
