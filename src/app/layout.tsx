import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const editorial = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const label = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-label",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Threadline — a managed authority system for expert-led firms",
    template: "%s · Threadline",
  },
  description:
    "Threadline is a managed authority system for expert-led B2B firms: it makes the expertise that wins the work visible before the sales call, and learns what actually moves buyers.",
  applicationName: "Threadline",
  openGraph: {
    title: "Threadline",
    description:
      "Make the expertise that wins the work visible before the sales call. A managed authority system for expert-led B2B firms.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0D0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${editorial.variable} ${display.variable} ${label.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-base text-ink antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
