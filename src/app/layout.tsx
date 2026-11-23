import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { PhoneFrame } from "@/components/unthinked/phone-frame";
import { BookingProvider } from "@/lib/booking-store";
import { MotionProvider } from "@/components/unthinked/motion-provider";
import { NativeBridge } from "@/components/unthinked/native-bridge";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Unthinked — flights, stays & visas",
  description:
    "Plan trips, book flights and hotels, and apply for visas by talking to one assistant.",
  appleWebApp: { capable: true, title: "Unthinked", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <BookingProvider>
          <MotionProvider>
            <PhoneFrame>{children}</PhoneFrame>
            <NativeBridge />
          </MotionProvider>
        </BookingProvider>
      </body>
    </html>
  );
}
