import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

// Characterful serif for headlines.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

// Clean sans for body + UI.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Driveway Advocate — Is your car deal fair?",
  description:
    "Tap through a few questions or snap your dealer quote and get a clear, buyer-side Deal Score before you sign — with every red flag explained. The KBB for car deals and extended warranties.",
  applicationName: "Driveway Advocate",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Advocate",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#14253D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
