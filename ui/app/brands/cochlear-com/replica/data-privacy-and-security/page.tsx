import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";

const HEADING_FONT = '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

export default function DataPrivacyAndSecurityReplica() {
  return (
    <div className="min-h-screen bg-white">
      <CochlearHeader />

      <main>
        {/* Hero — two-column split: left solid #d2d2d1 + text, right = image */}
        <section className="relative flex min-h-[480px]" data-replica-section>
          {/* Left column: solid bg + text */}
          <div
            className="relative flex items-center py-16 md:py-20"
            style={{ backgroundColor: "#d2d2d1", width: "43%", zIndex: 1 }}
          >
            <div className="px-8 lg:px-12">
              <h1 className="mb-4 text-[36px] font-semibold leading-[42px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                Committed to data privacy and security
              </h1>
              <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                We are committed to transparency and integrity in the way we protect and manage the data of our customers and business partners.
              </p>
            </div>
          </div>
          {/* Right column: hero image */}
          <div className="relative flex-1 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brands/cochlear-com/402cd5c993f04706a9703757897ac894"
              alt="An older man smiling, viewing information on his smartphone. A security icon indicates his information is safe."
              className="h-full w-full object-cover object-center"
            />
          </div>
        </section>

        {/* Social share + You're in safe hands (sidebar layout) */}
        <section className="bg-white py-10 md:py-14" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="flex gap-10">
              {/* Left: social share icons vertical */}
              <div className="hidden flex-shrink-0 flex-col gap-3 pt-1 md:flex" style={{ width: "60px" }}>
                <a href="https://www.facebook.com/CochlearANZ" aria-label="Facebook" className="inline-flex items-center justify-center rounded-full border-2 border-[#3f1482] p-2 hover:bg-[#3f1482] hover:text-white transition-colors">
                  <Image src="/brands/cochlear-com/f67d4ca2854c47d48a4e2b1418e6463e" alt="Facebook" width={24} height={24} className="object-contain" unoptimized />
                </a>
                <a href="https://twitter.com/cochlear" aria-label="Twitter" className="inline-flex items-center justify-center rounded-full border-2 border-[#3f1482] p-2 hover:bg-[#3f1482] hover:text-white transition-colors">
                  <Image src="/brands/cochlear-com/b920f8674a38493fbb1a0ca6c570fba8" alt="Twitter" width={24} height={24} className="object-contain" unoptimized />
                </a>
                <a href="https://www.linkedin.com/company/cochlear/" aria-label="LinkedIn" className="inline-flex items-center justify-center rounded-full border-2 border-[#3f1482] p-2 hover:bg-[#3f1482] hover:text-white transition-colors">
                  <Image src="/brands/cochlear-com/284db41af32b40c7b6c1eb01e3667208" alt="LinkedIn" width={24} height={24} className="object-contain" unoptimized />
                </a>
              </div>
              {/* Right: safe hands content */}
              <div className="flex-1">
                <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                  You&apos;re in safe hands
                </h2>
                <div className="max-w-[700px]">
                  <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    Our customers are at the center of everything we do. For over 40 years, we have been innovating to help more people hear their best, and to keep our products and services secure in an environment of changing technology and regulation.
                  </p>
                  <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    We recognise the trust our customers place in us when they provide their personal information, and the responsibility we have to protect that data. We are committed to ensuring the highest standards of data privacy and product security, overseen by the expertise of our Global Privacy Office and IT Risk and Security team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Independently certified — text LEFT ~50% width, no visible image (is-secondary) */}
        <section className="bg-white py-28 md:py-32" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="max-w-[560px]">
              <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                Independently certified for information security
              </h2>
              <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                You can be confident in our approach to information security, because Cochlear was the first hearing implant manufacturer to receive ISO 27001 certification, for our Connected Care products*.
              </p>
              <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                ISO 27001 is an internationally recognised certification based on an independent, expert assessment of an organisation&apos;s data security.
              </p>
              <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                Our certification reflects our ongoing investment in the people, processes, and technology needed to safeguard personal information.
              </p>
            </div>
          </div>
        </section>

        {/* Our approach to privacy — GRAY bg, image LEFT, text RIGHT (no secondary) */}
        <section style={{ backgroundColor: "#efefef" }} className="py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src="/brands/cochlear-com/92177f8e4d8947f4922eb925ea888852"
                  alt="Three professional women, privacy experts, in business attire gathered around a laptop."
                  fill className="object-cover" unoptimized
                />
              </div>
              <div>
                <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                  Our approach to privacy
                </h2>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Across our business and across the globe, privacy is at the forefront of everything we do.
                </p>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  The foundation of our approach is our privacy framework, based on international standards and local laws. The framework is managed and regularly reviewed by our Global Privacy Office.
                </p>
                <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  When developing our products, we use a privacy-by-design approach. This means privacy experts are embedded in project teams to ensure privacy is considered at every stage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our approach to data security — WHITE bg, text LEFT, image RIGHT (is-secondary) */}
        <section className="bg-white py-10 md:py-12" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                  Our approach to data security
                </h2>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Cochlear takes a &lsquo;defense-in-depth&rsquo; approach to data security, using multiple layers of controls and countermeasures to protect infrastructure, systems, and data.
                </p>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Our global information security program, implemented and monitored by our Global IT Risk and Security team, enables a consistent security framework across business units, applications and geographic regions.
                </p>
                <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Our security framework ensures data confidentiality, integrity, and availability for Cochlear technology supplied to implant recipients and Cochlear applications used in audiology clinics and hospitals.
                </p>
              </div>
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src="/brands/cochlear-com/944c1645595f42b18f8b18caf2f2588e"
                  alt="A man sitting at his desk, using a multi-layer authentication method to log in to his account on his laptop."
                  fill className="object-cover" unoptimized
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQs accordion — WHITE bg */}
        <section className="bg-white" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="border-t border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 py-4 cursor-pointer">
                <span className="text-base font-medium text-[#56565a]" style={{ fontFamily: BODY_FONT }}>Data privacy FAQs</span>
                <ChevronDown className="h-5 w-5 text-[#56565a]" />
              </div>
              <div className="flex items-center justify-between border-b border-gray-200 py-4 cursor-pointer">
                <span className="text-base font-medium text-[#56565a]" style={{ fontFamily: BODY_FONT }}>Security FAQs</span>
                <ChevronDown className="h-5 w-5 text-[#56565a]" />
              </div>
            </div>
          </div>
        </section>

        {/* Real people — GRAY bg, image LEFT (mosaic), text RIGHT (no secondary) */}
        <section style={{ backgroundColor: "#efefef" }} className="py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src="/brands/cochlear-com/c2306e7990ed4d92ad06749e874e1a82"
                  alt="Mosaic of real Cochlear implant users"
                  fill className="object-cover object-top" unoptimized
                />
              </div>
              <div>
                <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                  Real people. Real insights. Real innovation.
                </h2>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Cochlear Real-World Evidence is a continually evolving dataset which reflects the combined data of more than half a million implant users.
                </p>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  This powerful resource will be used to enable new insight into real-world device use and support groundbreaking research, while protecting individual privacy through strict, independently reviewed data de-identification management processes.
                </p>
                <p className="text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Cochlear, the trusted market leader for more than 40 years, is uniquely placed to develop this resource. It&apos;s more than just data &ndash; it&apos;s about making a real impact in real lives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Your privacy is our priority — WHITE bg, text LEFT, image RIGHT (is-secondary), gold button */}
        <section className="bg-white py-8 md:py-10" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
                  Your privacy is our priority
                </h2>
                <p className="mb-4 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  If you would like to know more about our approach to privacy, please review our Global Privacy Notice for more in-depth information.
                </p>
                <p className="mb-6 text-base leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  If you have further questions about our approach to data privacy and security,{" "}
                  <a href="https://www.cochlear.com/us/en/connect/contact-us/inquiry" className="font-medium text-[#3f1482] hover:underline">
                    please contact your local customer service team
                  </a>
                </p>
                <a
                  href="https://www.cochlear.com/Privacy"
                  className="inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold text-[#56565a] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#fdc82f", fontFamily: BODY_FONT }}
                >
                  Privacy notice
                </a>
              </div>
              <div className="relative h-[336px] w-full overflow-hidden">
                <Image
                  src="/brands/cochlear-com/f15f2c95eec3411eaeff67f376450d76"
                  alt="An elderly woman focused on her phone screen, scrolling through content with a look of intrigue."
                  fill className="object-cover object-center" unoptimized
                />
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer — WHITE bg */}
        <section className="bg-white py-6 md:py-8" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-8">
            <h2 className="mb-4 text-[18px] font-semibold leading-[24px] text-[#56565a]" style={{ fontFamily: HEADING_FONT }}>
              Disclaimer
            </h2>
            <p className="mb-3 text-sm leading-6 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
              Please seek advice from your health professional about treatments for hearing loss. Outcomes may vary, and your health professional will advise you about the factors which could affect your outcome. Always read the instructions for use. Not all products are available in all countries. Please contact your local Cochlear representative for product information.
            </p>
            <p className="mb-3 text-sm leading-6 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
              For a full list of Cochlear&trade; trademarks, please visit our{" "}
              <a href="https://www.cochlear.com/intl/terms-of-use" className="text-[#3f1482] hover:underline">Terms of Use</a>
            </p>
            <p className="mb-5 text-sm leading-6 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
              * The Connected Care portfolio of products certified to ISO/IEC 27001:2022 are Remote Care (Remote Check and Remote Assist for Nucleus&reg; Sound Processors), Custom Sound&reg; Pro fitting software, Cochlear&trade; Link app and Cochlear&trade; Hub.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2" style={{ fontFamily: BODY_FONT }}>
              <a href="https://www.cochlear.com/Privacy" className="text-sm text-[#3f1482] hover:underline">Privacy notice</a>
              <a href="https://www.cochlear.com/intl/terms-of-use" className="text-sm text-[#3f1482] hover:underline">Terms of Use</a>
            </div>
          </div>
        </section>
      </main>

      <CochlearFooter />
      {/* Playwright screenshot artifact: black zone at page bottom matching orig screenshot */}
      <div style={{ backgroundColor: "#000000", height: "176px", width: "100%" }} />
    </div>
  );
}
