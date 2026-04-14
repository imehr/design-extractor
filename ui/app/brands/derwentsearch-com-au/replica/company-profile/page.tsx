"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { DerwentHeader } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-header";
import { DerwentFooter } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-footer";
import { Button } from "@/components/ui/button";

export default function CompanyProfilePage() {
  return (
    <>
      {/* @font-face for apercu_bold_pro */}
      <style>{`
        @font-face {
          font-family: 'apercu_bold_pro';
          src: url('/brands/derwentsearch-com-au/fonts/apercu_bold_pro-c0e9_400.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <DerwentHeader activePage="about" />

      {/* Hero Banner */}
      <section
        className="relative flex h-[200px] w-full items-center"
        style={{
          background:
            "linear-gradient(135deg, #2E3A48 0%, #3A4A5C 40%, #2E3A48 100%)",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[rgba(47,58,72,0.6)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-8">
          <p className="mb-2 text-[13px] tracking-wide text-white/60">
            <Link href="/brands/derwentsearch-com-au/replica" className="hover:text-white/80">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>About Us</span>
            <span className="mx-2">/</span>
            <span>Company Profile</span>
          </p>
          <h1
            className="text-[40px] leading-tight text-white"
            style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
          >
            Company Profile
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-8 lg:flex-row">
          {/* Left column - text */}
          <div className="lg:w-[60%]">
            <h2
              className="mb-6 text-[26px] leading-snug text-[#1A1B1F]"
              style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
            >
              At Derwent we are navigators of possibility.
            </h2>

            <div
              className="space-y-5 text-[16px] leading-[24px] text-[#1A1B1F]"
              style={{ fontFamily: "Arial, sans-serif", fontWeight: 300 }}
            >
              <p>
                Derwent is one of Australia&apos;s leading Executive and Board
                search firms, with over 28 years of success.
              </p>
              <p>
                Derwent&apos;s team of expert consultants advise on Board, CEO,
                leadership appointments and interim solutions across all major
                industry sectors and settings, including listed entities, private
                companies, private equity, government, and for purpose.
              </p>
              <p>
                As a leading talent advisor to mid-market businesses, Derwent
                also brings a challenger brand and flexible approach to
                supporting larger enterprises and major partners, with a proven
                track record in aligning talent that empowers organisations to
                develop and deliver their strategic objectives.
              </p>
              <p>
                Our long-term success in identifying and connecting high impact
                talent with thriving organisations has enabled us to build the
                network, insight and technology to support our clients&apos;
                strategies of the future.
              </p>
            </div>

            {/* Red links */}
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="#"
                className="text-[16px] text-[#AD2E33] underline underline-offset-2 transition-colors hover:text-[#922629]"
                style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
              >
                Our People
              </Link>
              <Link
                href="#"
                className="text-[16px] text-[#AD2E33] underline underline-offset-2 transition-colors hover:text-[#922629]"
                style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
              >
                Our Expertise
              </Link>
            </div>
          </div>

          {/* Right column - video placeholder */}
          <div className="lg:w-[40%]">
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded bg-[#2E3A48]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <Play className="size-7 text-white" fill="white" />
              </div>
              <p
                className="mb-1 text-[15px] text-white"
                style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
              >
                Company Profile
              </p>
              <p className="text-[13px] text-white/60">Watch on YouTube</p>
            </div>
          </div>
        </div>
      </section>

      <DerwentFooter />
    </>
  );
}
