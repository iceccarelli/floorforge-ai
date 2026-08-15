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
    "Free job estimator, client proposal and completion-report tools for hardwood refinishing contractors — no account needed. Plus an early-stage operating system for autonomous refinishing, in development. Join the pilot waitlist.",
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
    // Points every crawler at /llms.txt instead of making it guess the URL.
    // The file existed and nothing referenced it — not robots.txt, not the
    // head, not a header — so it was discoverable only by convention.
    types: { "text/plain": "/llms.txt" },
  },
  openGraph: {
    type: "website",
    siteName: "FloorForge",
    locale: "en_US",
    url: "/",
    title: "FloorForge | Autonomous Hardwood Floor Refinishing — Early Access",
    description:
      "An operating system for autonomous floor refinishing, in active development. Join the pilot waitlist and help shape it.",
  },
  // `summary_large_image`, not the default `summary`: the card carries a real
  // 1200x630 image now (app/opengraph-image.tsx), and a small card wastes it.
  twitter: {
    card: "summary_large_image",
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
      <head>
        {/*
          Marks the document as JavaScript-capable BEFORE first paint, so the
          scroll-reveal in globals.css can hide its content without that hidden
          state ever reaching a reader who has no JS. Deliberately render-
          blocking and deliberately tiny: if this does not run, every .reveal
          block stays visible, which is the correct failure mode.
          See components/Reveal.tsx and audit/FINDINGS.md P0-2.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
