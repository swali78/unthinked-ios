import type { Metadata } from "next";
import { ContactLine, LegalPage } from "@/components/unthinked/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of use · Unthinked" };

export default function Page() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms cover your use of {LEGAL.appName}, run by {LEGAL.operator}. By using the app you agree to them.
      </p>

      <h2>Travel information is a guide</h2>
      <p>
        Flight, hotel and visa information in the app, including anything the AI assistant says, can be incomplete or
        out of date. Always confirm visa and entry requirements with the official government source before you travel.
      </p>

      <h2>Bookings and payments</h2>
      <p>
        The app does not yet make real bookings or take payments. Prices, bookings and visa applications are simulated
        and nothing you do in the app is charged.
      </p>

      <h2>Travel companions</h2>
      <p>
        You must be 18 or older to use Travel together. Be respectful to the people you meet. Don&apos;t post
        anything illegal, hateful, sexual, threatening or misleading, don&apos;t harass anyone, and don&apos;t
        pretend to be someone else. We have zero tolerance for abusive content or users: we may remove content and
        suspend or delete accounts that break these rules. Block anyone who bothers you and report them to us. Use your
        own judgement before meeting or travelling with anyone.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your password private; you&apos;re responsible for what happens on your account. You can delete your
        account at any time from the app.
      </p>

      <h2>The service</h2>
      <p>
        The app is provided as it is. We may change or stop features at any time. To the extent the law allows, we
        are not liable for losses from relying on information in the app. These terms are governed by the laws of{" "}
        {LEGAL.country}.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <ContactLine />.
      </p>
    </LegalPage>
  );
}
