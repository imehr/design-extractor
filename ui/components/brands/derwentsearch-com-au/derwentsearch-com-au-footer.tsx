"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const offices = [
  {
    city: "Sydney",
    address: "Level 21, 1 York Street, Sydney NSW 2000",
    phone: "+61 2 8233 1600",
    email: "sydney@derwentsearch.com.au",
  },
  {
    city: "Melbourne",
    address: "Level 28, 385 Bourke Street, Melbourne VIC 3000",
    phone: "+61 3 9601 1533",
    email: "melbourne@derwentsearch.com.au",
  },
  {
    city: "Perth",
    address: "Level 25, 108 St Georges Tce, Perth WA 6000",
    phone: "+61 8 6142 1280",
    email: "perth@derwentsearch.com.au",
  },
  {
    city: "Brisbane",
    address: "Level 18, 10 Eagle Street, Brisbane QLD 4000",
    phone: "+61 7 3023 1005",
    email: "brisbane@derwentsearch.com.au",
  },
  {
    city: "Canberra",
    address: "The Realm, 18 National Circuit, Barton ACT 2600",
    phone: "+61 2 6232 9688",
  },
] as const;

export function DerwentFooter() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: "#2E3A48",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <style>{`
        @font-face {
          font-family: 'apercu_bold_pro';
          src: url('/brands/derwentsearch-com-au/fonts/apercu_bold_pro-c0e9_400.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      {/* Top section: logo + LinkedIn */}
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <span
            className="text-white lowercase"
            style={{
              fontFamily: "'apercu_bold_pro', sans-serif",
              fontSize: "32px",
              letterSpacing: "0.02em",
            }}
          >
            derwent
          </span>
          <a
            href="https://www.linkedin.com/company/derwent-executive-search/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Derwent on LinkedIn"
            className="text-white transition-opacity hover:opacity-80"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>

      <Separator className="bg-white/20" />

      {/* Office locations grid */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <div key={office.city} className="space-y-1.5">
              <h3
                className="text-white mb-2"
                style={{
                  fontFamily: "'apercu_bold_pro', sans-serif",
                  fontSize: "16px",
                }}
              >
                {office.city}
              </h3>
              <p
                className="leading-relaxed"
                style={{
                  color: "#999999",
                  fontSize: "14px",
                  fontWeight: 300,
                }}
              >
                {office.address}
              </p>
              <p
                style={{
                  color: "#999999",
                  fontSize: "14px",
                  fontWeight: 300,
                }}
              >
                {office.phone}
              </p>
              {"email" in office && (
                <a
                  href={`mailto:${office.email}`}
                  className="inline-block transition-opacity hover:opacity-80"
                  style={{
                    color: "#AD2E33",
                    fontSize: "14px",
                    fontWeight: 300,
                  }}
                >
                  {office.email}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-white/20" />

      {/* Bottom bar */}
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ color: "#999999", fontSize: "13px", fontWeight: 300 }}
          >
            <Link
              href="/brands/derwentsearch-com-au/replica/privacy-policy"
              className="transition-opacity hover:opacity-80"
              style={{ color: "#999999" }}
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline" style={{ color: "#555555" }}>
              |
            </span>
            <span>Website Powered by Duda Australia Consulting Services</span>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-[220px]">
            <input
              type="text"
              placeholder="Search"
              aria-label="Search"
              className="w-full rounded-sm border border-white/20 bg-transparent py-1.5 pl-3 pr-9 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
              style={{ fontSize: "13px" }}
            />
            <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/60" />
          </div>
        </div>
      </div>
    </footer>
  );
}
