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

      <h2>Without an account</h2>
      <p>
        You can use the app without signing up. Your profile name, travel preferences, trips, bookings and visa
        application details (including passport details you enter) are then stored only in your device&apos;s app
        storage, and we don&apos;t receive a copy. Deleting the app, or using <em>Reset demo data</em> in Profile,
        erases them.
      </p>

      <h2>With an account</h2>
      <p>If you create an account, we store the following on our servers so it follows you across devices:</p>
      <ul>
        <li>Your name, email address and a scrambled (hashed) version of your password. We never see your password.</li>
        <li>Your travel preferences, bookings and visa applications, including passport details you enter.</li>
        <li>
          Your Travel together profile (age, gender, home city, bio, interests, travel style, budget and travel plans),
          who you liked, passed on or blocked, your matches, and the messages, plans, votes and expenses you share with
          other travellers.
        </li>
        <li>A sign-in token so you stay signed in.</li>
      </ul>
      <p>
        <strong>Other travellers can see</strong> your Travel together profile and your trip dates and destination
        when you appear in their matches, and the messages you send them. We don&apos;t show them your email address.
      </p>

      <h2>Messages to the assistant</h2>
      <p>
        When you chat with the assistant, your messages and the conversation so far are sent to our server and passed to
        an AI model provider (through Vercel&apos;s AI Gateway) to write a reply. They are used only to answer you and we
        don&apos;t store them after the reply is sent. The providers may keep them briefly under their own terms for
        abuse monitoring.
      </p>

      <h2>Service providers</h2>
      <p>
        Our hosting and database providers store and process the data above on our behalf, and receive your IP address
        and basic device information with each request, as any website does. They may keep short-lived logs for
        security.
      </p>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your information or share it for advertising.</li>
        <li>We don&apos;t track you across other apps or websites.</li>
        <li>We don&apos;t use analytics or advertising SDKs.</li>
        <li>We don&apos;t take payments yet. Prices, bookings and visa applications in the app are simulated.</li>
        <li>We don&apos;t show you ads.</li>
      </ul>

      <h2>Children</h2>
      <p>The app is for adults. You must be 18 or older to use Travel together, and we don&apos;t knowingly collect information from children under 13.</p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep account data until you delete your account. You can do that at any time in the app: Profile → your
        account → <em>Delete account</em>. That immediately and permanently erases everything listed above from our
        database, including your messages to other travellers.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can view and change your details in the app at any time. If you have a
        question about your data, or want to exercise a right under India&apos;s Digital Personal Data Protection Act,
        GDPR or another law that applies to you, contact us at <ContactLine />.
      </p>

      <h2>Changes</h2>
      <p>
        When we add real bookings, payments or notifications, we will update this policy before those features go
        live and change the date at the top.
      </p>
    </LegalPage>
  );
}
