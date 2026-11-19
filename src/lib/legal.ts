/**
 * Who runs the app, shown on the privacy, terms and support pages.
 * Fill these in before submitting to the App Store or Google Play:
 * both stores link to these pages and reviewers check them.
 *
 * Set them as environment variables on the deployment, e.g. in Vercel:
 *   NEXT_PUBLIC_LEGAL_NAME="Your Name or Company"
 *   NEXT_PUBLIC_SUPPORT_EMAIL="support@yourdomain.com"
 */
export const LEGAL = {
  appName: "Unthinked",
  operator: process.env.NEXT_PUBLIC_LEGAL_NAME || "the Unthinked team",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  country: "India",
  updated: "19 November 2026",
};
