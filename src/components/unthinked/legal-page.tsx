import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";
import { Screen } from "./screen";

/** A long-form text page (privacy, terms, support) in the app's shell. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen title={title} back="/profile">
      <article className="space-y-4 pt-2 text-[14px] leading-relaxed text-white/70 [&_a]:text-white [&_a]:underline [&_h2]:pt-3 [&_h2]:text-[16px] [&_h2]:font-medium [&_h2]:text-white [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        <p className="text-[12px] text-white/45">Last updated {LEGAL.updated}</p>
        {children}
      </article>
    </Screen>
  );
}

/** The support email as a link, or a pointer to the support page until it's set. */
export function ContactLine() {
  return LEGAL.supportEmail ? (
    <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
  ) : (
    <span>the contact address on our App Store or Google Play listing</span>
  );
}
