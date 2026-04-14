"use client";

import Link from "next/link";
import { DerwentHeader } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-header";
import { DerwentFooter } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-footer";

const POLICY_SECTIONS = [
  {
    heading: "WHAT INFORMATION WE COLLECT",
    body: "Details about the types of personal and sensitive information collected by Derwent are available on the original site.",
  },
  {
    heading: "USE AND DISCLOSURE OF YOUR PERSONAL INFORMATION",
    body: "Information about how Derwent uses and discloses personal information is available on the original site.",
  },
  {
    heading: "MANAGEMENT OF PERSONAL INFORMATION",
    body: "Details about how Derwent manages and secures personal information are available on the original site.",
  },
  {
    heading: "REQUESTING ACCESS TO THE PERSONAL INFORMATION WE HOLD",
    body: "Information about how to request access to your personal information held by Derwent is available on the original site.",
  },
  {
    heading: "DATA RENTENTION AND DELETION",
    body: "Details about Derwent's data retention and deletion policies are available on the original site.",
  },
] as const;

export default function PrivacyPolicyPage() {
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

      <DerwentHeader activePage="about" />

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
            <span>About Us</span>
            <span className="mx-2">/</span>
            <span>Privacy Policy</span>
          </p>
          <h1
            className="text-[40px] leading-tight text-white"
            style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
          >
            Privacy Policy
          </h1>
        </div>
      </section>

      {/* Policy Content */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="max-w-[800px]">
            {/* Main heading */}
            <h3
              className="mb-3 uppercase text-[#1A1B1F]"
              style={{
                fontFamily: "apercu_bold_pro, Arial, sans-serif",
                fontSize: "24px",
                marginTop: "0",
                marginBottom: "12px",
              }}
            >
              Privacy Policy
            </h3>

            <p
              className="mb-4 text-[#1A1B1F]"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: "22.5px",
                marginBottom: "16px",
              }}
            >
              Derwent Search Pty Ltd, ABN 17 115 355 112, Derwent Interim
              Solutions Pty Ltd, ABN 27 681 706 892 and all Derwent owned
              businesses (further called &quot;Derwent&quot; or &quot;we&quot;,
              &quot;our&quot; or &quot;us&quot;) are committed to protecting your
              privacy and complying with the Australian Privacy Act 1988 (Cth)
              (Privacy Act) and other applicable privacy laws and regulations.
            </p>

            <p
              className="mb-4 text-[#1A1B1F]"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: "22.5px",
                marginBottom: "16px",
              }}
            >
              This Privacy Policy (Policy) describes how we collect, hold, use
              and disclose your personal information, and how we maintain the
              quality and security of your personal information. It applies to
              all Derwent businesses in Australia, including visitors to our
              website.
            </p>

            <p
              className="mb-2 text-[#1A1B1F]"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: "22.5px",
              }}
            >
              Our Privacy Policy covers:
            </p>

            <ul
              className="mb-6 list-disc pl-8 text-[#1A1B1F]"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: "22.5px",
              }}
            >
              <li className="mb-1">
                What types of personal &amp; sensitive information we collect
              </li>
              <li className="mb-1">
                Purpose and use for the information we collect
              </li>
            </ul>

            {/* Policy section headings with placeholder content */}
            {POLICY_SECTIONS.map((section) => (
              <div key={section.heading}>
                <h3
                  className="uppercase text-[#1A1B1F]"
                  style={{
                    fontFamily: "apercu_bold_pro, Arial, sans-serif",
                    fontSize: "24px",
                    marginTop: "32px",
                    marginBottom: "12px",
                  }}
                >
                  {section.heading}
                </h3>
                <p
                  className="text-[#1A1B1F]"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "15px",
                    fontWeight: 300,
                    lineHeight: "22.5px",
                    marginBottom: "16px",
                  }}
                >
                  {section.body}
                </p>
              </div>
            ))}

            {/* Contacting Derwent */}
            <h3
              className="uppercase text-[#1A1B1F]"
              style={{
                fontFamily: "apercu_bold_pro, Arial, sans-serif",
                fontSize: "24px",
                marginTop: "32px",
                marginBottom: "12px",
              }}
            >
              Contacting Derwent
            </h3>
            <p
              className="text-[#1A1B1F]"
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                lineHeight: "22.5px",
                marginBottom: "16px",
              }}
            >
              For privacy inquiries, contact:{" "}
              <a
                href="mailto:privacy@derwentsearch.com.au"
                className="text-[#AD2E33] underline underline-offset-2 transition-colors hover:text-[#922629]"
              >
                privacy@derwentsearch.com.au
              </a>
            </p>
          </div>
        </div>
      </section>

      <DerwentFooter />
    </>
  );
}
