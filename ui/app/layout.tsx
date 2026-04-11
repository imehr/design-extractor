import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Badge } from "@/components/ui/badge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design Library — design-extractor",
  description:
    "Browse design systems extracted from the live web. Tokens, replicas, and brand documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1d1d1f]" style={{ fontFamily: '-apple-system, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-[#d2d2d7]/40 bg-white/80 px-6 backdrop-blur-xl backdrop-saturate-[180%]">
          <a href="/" className="text-xs font-semibold tracking-tight text-[#1d1d1f]">
            design.library
          </a>
          <span className="text-[10px] tracking-wide text-[#86868b]">v0.2.0</span>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
