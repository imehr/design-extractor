"use client";

import Link from "next/link";
import Image from "next/image";
import { DerwentHeader } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-header";
import { DerwentFooter } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-footer";

export default function InterimSolutionsPage() {
  return (
    <>
      <style>{`
        @font-face {
          font-family: 'apercu_bold_pro';
          src: url('/brands/derwentsearch-com-au/fonts/apercu_bold_pro-c0e9_400.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <DerwentHeader activePage="expertise" />

      {/* Hero Banner */}
      <section
        className="relative flex h-[200px] w-full items-center"
        style={{
          background:
            "linear-gradient(135deg, #2E3A48 0%, #3A4A5C 40%, #2E3A48 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[rgba(47,58,72,0.6)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-8">
          <p className="mb-2 text-[13px] tracking-wide text-white/60">
            <Link
              href="/brands/derwentsearch-com-au/replica"
              className="hover:text-white/80"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Expertise</span>
            <span className="mx-2">/</span>
            <span>Interim Solutions</span>
          </p>
          <h1
            className="text-[40px] leading-tight text-white"
            style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
          >
            Interim Solutions
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-8 lg:flex-row">
          {/* Left column - text */}
          <div className="lg:w-1/2">
            <div
              className="space-y-5 text-[#1A1B1F]"
              style={{ fontFamily: "Arial, sans-serif", fontWeight: 300 }}
            >
              <p
                className="text-[16px] leading-[24px] font-semibold"
                style={{ fontWeight: 600 }}
              >
                Derwent Interim Solutions appoints executives on interim
                assignments across industries, functions, and locations,
                providing immediate impact.
              </p>
              <p className="text-[15px] leading-[22.5px]">
                The demand for interim talent is evolving rapidly given changing
                market conditions and the way employers are structuring the
                capability and flexibility of their workforces. Organisations
                have also changed the way they engage with consultants, in
                particular, a shift from partnering with a Big 4 or to
              </p>
              <p className="text-[15px] leading-[22.5px]">
                Transformation, finance, change, and specialist skills have
                become more highly sought out for short term, high-impact
                appointments. This includes functional expertise, projects, and
                the transformation office.
              </p>
              <p className="text-[15px] leading-[22.5px]">
                Derwent&apos;s Interim Solutions offerings include: interim
                executive appointments, project solutions, transformation, and
                office of the CFO and CIO.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="#"
                className="text-[16px] text-[#AD2E33] underline underline-offset-2 transition-colors hover:text-[#922629]"
                style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
              >
                Our People
              </Link>
            </div>
          </div>

          {/* Right column - image */}
          <div className="lg:w-1/2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
              <Image
                src="/brands/derwentsearch-com-au/Discussion-17eeeff0-1920w-1920w.jpg"
                alt="Interim Solutions - Executive discussion"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <DerwentFooter />
    </>
  );
}
