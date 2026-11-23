import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage } from "@/components/unthinked/legal-page";

export const metadata: Metadata = { title: "Support · Unthinked" };

export default function Page() {
  return (
    <LegalPage title="Support">
      <p>
        Need help, found a bug, or want to suggest something? Write to <ContactLine /> and we&apos;ll get back to you.
      </p>

      <h2>Common questions</h2>
      <ul>
        <li>
          <strong>Was I charged for a booking?</strong> No. Bookings and payments in the app are simulated for now.
        </li>
        <li>
          <strong>How do I delete my account?</strong> Open Profile, tap your account, then <em>Delete account</em>.
          This erases everything saved to it. Without an account, tap <em>Reset demo data</em> in Profile twice.
        </li>
        <li>
          <strong>Someone is bothering me in Travel together.</strong> Block them from their profile so they can&apos;t
          see or message you, and write to us so we can review their account.
        </li>
        <li>
          <strong>Is the visa information official?</strong> It&apos;s a guide. Check the official government source
          before you travel.
        </li>
      </ul>

      <p>
        See also our <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms of use</Link>.
      </p>
    </LegalPage>
  );
}
