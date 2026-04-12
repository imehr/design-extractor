import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1d1d1f]" style={{ fontFamily: '-apple-system, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-[#d2d2d7]/40 bg-white/80 px-6 backdrop-blur-xl backdrop-saturate-[180%]">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs font-semibold tracking-tight text-[#1d1d1f]">
              design.library
            </Link>
            <nav className="flex items-center gap-4 text-xs text-[#6e6e73]">
              <Link href="/" className="hover:text-[#1d1d1f]">Library</Link>
              <Link href="/monitoring" className="flex items-center gap-1 font-medium text-[#0071e3] hover:text-[#0077ED]">
                <span className="size-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                Monitoring
              </Link>
              <Link href="/docs" className="hover:text-[#1d1d1f]">Docs</Link>
            </nav>
          </div>
          <span className="text-[10px] tracking-wide text-[#86868b]">v0.3.0</span>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
