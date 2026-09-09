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
    default: "Threadline — the operating system behind founder-led content",
    template: "%s · Threadline",
  },
  description:
    "Threadline installs the operating system behind founder-led content: research, ideas, scripts, production, distribution and learning in one place.",
  applicationName: "Threadline OS",
  openGraph: {
    title: "Threadline",
    description:
      "Your content operation, without the content chaos. Threadline installs the operating system behind founder-led content.",
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
