import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "FloorForge | Autonomous Hardwood Floor Refinishing OS",
  description: "Sand and finish hardwood floors with unmatched consistency and speed. The operating system for autonomous floor refinishing — field sanding, edging assistance, and perfect finish application. Powered by InteriorFinish OS. Book months out with data-driven operations.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FloorForge | The Operating System for Autonomous Floor Refinishing",
    description: "Turn every hardwood refinish into a high-margin, data-driven operation. Trusted by crews who refuse to lose bids to inconsistency.",
    images: [{ url: "/og-image.jpg" }],
  },
  keywords: [
    "autonomous floor sanding",
    "hardwood floor refinishing robots",
    "floor finishing automation",
    "commercial floor sanding",
    "robotic floor refinisher",
    "InteriorFinish OS",
    "floor sander robot",
    "hardwood refinishing software",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-white text-slate-900">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-center" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
