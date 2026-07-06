import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import { authEnabled } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorforge-ai.vercel.app"
  ),
  title: "FloorForge | Autonomous Hardwood Floor Refinishing — Early Access",
  description:
    "FloorForge is an early-stage operating system for autonomous hardwood floor refinishing: job planning, multi-grit sanding orchestration, dust and quality reporting. Join the pilot waitlist.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FloorForge | Autonomous Hardwood Floor Refinishing — Early Access",
    description:
      "An operating system for autonomous floor refinishing, in active development. Join the pilot waitlist and help shape it.",
  },
  keywords: [
    "autonomous floor sanding",
    "hardwood floor refinishing automation",
    "robotic floor refinishing",
    "floor sanding software",
    "hardwood refinishing software",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <StructuredData />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );

  // ClerkProvider throws without a publishable key, so it is only mounted
  // when auth is configured. The site deploys with zero env vars.
  return authEnabled ? <ClerkProvider>{content}</ClerkProvider> : content;
}
