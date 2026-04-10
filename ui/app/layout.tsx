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
      <body className="min-h-full flex flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span className="text-sm font-semibold tracking-tight">
            Design Library
          </span>
          <Badge variant="secondary">design-extractor v0.1.0</Badge>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
