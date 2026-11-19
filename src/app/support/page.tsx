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
          <strong>How do I erase my data?</strong> Open Profile and tap <em>Reset demo data</em> twice, or delete the
          app.
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
