import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";

const HEADING_FONT = '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const PRESS_RELEASES = [
  {
    title: "Cochlear launches its first smart hearing implant system for Koreans at the World Congress of Audiology",
    date: "May 27, 2026",
    href: "https://www.cochlear.com/au/en/corporate/media/media-releases/media-releases/2026/cochlear-launches-its-first-smart-hearing-implant-system-for-koreans-at-the-world-congress-of-audiology",
    image: "/brands/cochlear-com/96c33fa773394417961f3550c9001e98",
    imageAlt: "",
    cta: "Read more",
  },
  {
    title: "Australian Professor Graeme Clark AC awarded the 2026 Queen Elizabeth Prize",
    date: "February 4, 2026",
    href: "https://www.cochlear.com/au/en/corporate/media/media-releases/media-releases/2026/australian-professor-graeme-clark-ac-awarded-the-2026-queen-elizabeth-prize",
    image: "/brands/cochlear-com/2026-queen-elizabeth-prize-for-engineering",
    imageAlt: "Australian Professor Graeme Clark AC awarded the 2026 Queen Elizabeth Prize",
    cta: "Read more",
  },
  {
    title: "Read all press releases",
    date: "",
    href: "https://www.cochlear.com/au/en/corporate/media/media-releases/media-releases",
    image: "/brands/cochlear-com/caa45efe19724d07a3a3c1ac972e45a9",
    imageAlt: "240210_01_GRADUATION_0772.tif",
    cta: "Read more",
  },
];

const FACT_SHEETS = [
  {
    title: "Hearing Loss Screening Fact Sheet",
    date: "March 18, 2026",
    href: "https://assets.cochlear.com/api/public/content/hearing-loss-screening-fact-sheet?v=763e51eb",
    image: "/brands/cochlear-com/da2ff36cd99b4610889c7617ffccb969",
    imageAlt: "Hearing Loss Screening Fact Sheet",
    cta: "Read more",
  },
  {
    title: "AU & NZ Hearing Loss Fact Sheet",
    date: "June 12, 2025",
    href: "https://assets.cochlear.com/api/public/content/9837f40630814554b358578d8f54a215?v=c5778769",
    image: "/brands/cochlear-com/4a20d406f2514f2cb6661c898c7fd265",
    imageAlt: "D2339686 Media Fact Sheet_Hearing Loss Australia and New Zealand Final.png",
    cta: "Read more",
  },
  {
    title: "Asia Pacific Hearing Loss Infographic",
    date: "June 12, 2025",
    href: "https://assets.cochlear.com/api/public/content/cf5aa3b3d0024443886992c0949861af?v=b3ec243e",
    image: "/brands/cochlear-com/386fc775164c4c5a97bfc14d45a9364f",
    imageAlt: "D2367128_Asia Pacific Hearing Loss Fact Infographic [final].pdf",
    cta: "Read more",
  },
  {
    title: "Cochlear Implant Innovation Timeline",
    date: "June 12, 2025",
    href: "https://assets.cochlear.com/api/public/content/cfbb5812664e48af81a05ddeae83aaa3?v=b1204ce5",
    image: "/brands/cochlear-com/b5bca36fd7b44f4ebb8dc77bef6ba0f6",
    imageAlt: "D1811621_6-1_Implant innovation Timeline EN-GB.pdf",
    cta: "Read more",
  },
];

const VIDEOS = [
  {
    title: "Nucleus Nexa Mode of Action Video",
    date: "June 12, 2025",
    href: "https://assets.cochlear.com/api/public/content/Cochlear-Nucleus-Nexa-Mode-of-Action",
    image: "/brands/cochlear-com/e7010ba3872944eba374e41aad09d832",
    imageAlt: "NucleusNexaSystem.png",
    cta: "Download now",
    isVideo: true,
  },
];

const PRODUCT_IMAGES = [
  {
    title: "Product images",
    date: "",
    href: "https://www.cochlear.com/au/en/corporate/media/product-images/product-images",
    image: "/brands/cochlear-com/805699979e67431cb0231df17fa17615",
    imageAlt: "NucleusNexaSystem_nocaption.png",
    cta: "View and download",
  },
];

const DISCLAIMER_TEXT = "Please seek advice from your health professional about treatments for hearing loss. Outcomes may vary, and your health professional will advise you about the factors which could affect your outcome. Always follow the directions for use. Not all products are available in all countries. Please contact your local Cochlear representative for product information. Views expressed are those of the individual. Consult your health professional to determine if you are a candidate for Cochlear technology. For a full list of Cochlear's trademarks, please visit our Terms of Use page. In Australia, Cochlear™ Nucleus® implant systems are intended for the treatment of moderately severe to profound hearing loss. In Australia, Baha® bone conduction implant systems are intended for the treatment of moderate to profound hearing loss. In Australia, the Cochlear™ Osia® System is indicated for patients with conductive, mixed hearing loss and single-sided sensorineural deafness (SSD) aged 5 years and above with up to 55 decibels sensorineural hearing loss. Patients should have sufficient bone quality and quantity to support successful implant placement. Surgery is required to use this product. Any surgical procedure carries risk. For Cochlear™ Nucleus®, Osia® and Baha® systems: This product is not available for purchase by the general public. For information on funding and reimbursement please contact your health care professional. Any testimonial featured on this website is not intended for a New Zealand audience; it is intended for an Australian audience only. Cochlear implants are available to eligible Australians through the public health system and private health insurance companies.* Cochlear implants are available to eligible New Zealanders through the public health system (incl. Northern Cochlear Implant Programme and Southern Cochlear Implant Programme) and some private health insurance companies.* * Conditions and eligibility criteria apply. Please speak to your health insurer and/or healthcare professional to confirm your coverage.";

type ContentCard = {
  title: string;
  date: string;
  href: string;
  image: string;
  imageAlt: string;
  cta: string;
  isVideo?: boolean;
};

function MediaCard({ item }: { item: ContentCard }) {
  return (
    <a
      href={item.href}
      className="flex flex-col bg-white border border-gray-200 overflow-hidden group"
    >
      {/* Image */}
      <div className="relative w-full bg-gray-100" style={{ paddingBottom: "66.67%" }}>
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          className="object-cover"
          unoptimized
        />
        {item.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#fdc82f] flex items-center justify-center">
              <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-white ml-1" />
            </div>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex flex-col flex-1 px-5 pt-5 pb-0">
        <h3
          className="text-[17px] font-semibold leading-snug text-[#56565a] mb-3"
          style={{ fontFamily: HEADING_FONT }}
        >
          {item.title}
        </h3>
        {item.date && (
          <p className="text-sm text-[#56565a]/70 mb-4" style={{ fontFamily: BODY_FONT }}>
            {item.date}
          </p>
        )}
      </div>
      {/* CTA with gold left border */}
      <div
        className="flex items-center justify-between px-5 py-4 mt-auto border-t border-gray-200"
        style={{ borderLeft: "4px solid #fdc82f" }}
      >
        <span
          className="text-sm font-medium text-[#3f1482]"
          style={{ fontFamily: BODY_FONT }}
        >
          {item.cta}
        </span>
        <ChevronRight className="h-4 w-4 text-[#3f1482]" />
      </div>
    </a>
  );
}

export default function MediaReplica() {
  return (
    <div className="min-h-screen bg-white">
      <CochlearHeader />

      <main>
        {/* Hero — white/light gray matching original landing-banner no-image */}
        <header className="bg-[#efefef] py-14" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-20">
            <div className="max-w-[700px] border-l-[2px] border-gray-300 pl-6">
              <h1
                className="mb-5 text-[28px] font-semibold leading-[34px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Media Center
              </h1>
              <p
                className="mb-5 text-base leading-6 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                Cochlear is the global leader in implantable hearing solutions with products including cochlear implants, bone conduction implants and active osseointergrated steady state implants.
              </p>
              <p
                className="mb-5 text-base leading-6 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                Asia Pacific is the home of Cochlear implant technology. Four of Cochlear&apos;s six global manufacturing sites are located in the Asia Pacific region and the multi-channel cochlear implant was invented by Laureate Professor Graeme Clark AC in Melbourne, Australia in 1978. Cochlear has offices in markets across the Asia Pacific region, including operations in Australia, China, Hong Kong, India, Japan, Korea, Malaysia, New Zealand, and Singapore.
              </p>
              <p
                className="text-sm italic text-[#56565a]/80"
                style={{ fontFamily: BODY_FONT }}
              >
                Use of Media Center image(s) permitted with the following statement of attribution: Image courtesy of Cochlear Limited.
              </p>
            </div>
          </div>
        </header>

        {/* Content wrapper */}
        <div className="mx-auto max-w-[1280px] px-8">
          {/* Breadcrumb */}
          <nav className="py-3 border-b border-gray-200" aria-label="Breadcrumb" data-replica-section>
            <ol className="flex items-center gap-2 text-sm" style={{ fontFamily: BODY_FONT }}>
              <li>
                <a href="https://www.cochlear.com/au/en/corporate" className="text-[#3f1482] hover:underline">
                  Corporate
                </a>
              </li>
              <li className="text-[#56565a]/50">/</li>
              <li className="text-[#56565a]">Media</li>
            </ol>
          </nav>

          {/* Filter */}
          <div className="py-4 border-b border-gray-200" data-replica-section>
            <div className="flex items-center gap-3">
              <label
                htmlFor="filter-select"
                className="text-sm text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                Select
              </label>
              <select
                id="filter-select"
                className="border border-gray-300 rounded text-sm text-[#56565a] px-3 py-1.5 bg-white"
                style={{ fontFamily: BODY_FONT }}
                defaultValue="all"
              >
                <option value="all">All</option>
                <option value="media-releases">Media releases</option>
                <option value="fact-sheets">Fact sheets</option>
                <option value="videos">Videos and media footage</option>
                <option value="product-images">Product images</option>
              </select>
            </div>
          </div>

          {/* Media releases */}
          <section className="py-10" data-replica-section>
            <h2
              className="mb-6 text-[22px] font-semibold leading-tight text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Media releases
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRESS_RELEASES.map((item) => (
                <MediaCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Fact sheets */}
          <section className="py-10" data-replica-section>
            <h2
              className="mb-6 text-[22px] font-semibold leading-tight text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Fact sheets
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FACT_SHEETS.map((item) => (
                <MediaCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Videos and media footage */}
          <section className="py-10" data-replica-section>
            <h2
              className="mb-6 text-[22px] font-semibold leading-tight text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Videos and media footage
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VIDEOS.map((item) => (
                <MediaCard key={item.title} item={item} />
              ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Product images */}
          <section className="py-10" data-replica-section>
            <h2
              className="mb-6 text-[22px] font-semibold leading-tight text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Product images
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_IMAGES.map((item) => (
                <MediaCard key={item.title} item={item} />
              ))}
            </div>
          </section>
        </div>

        {/* Media Contact + Non-media — full-width with divider, outside max-width */}
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-[1280px] px-8 py-10" data-replica-section>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Media Contact */}
              <div>
                <h2
                  className="mb-4 text-[22px] font-semibold leading-tight text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Media Contact
                </h2>
                <div
                  className="text-sm text-[#56565a] leading-6 space-y-0"
                  style={{ fontFamily: BODY_FONT }}
                >
                  <p>For all media enquiries, please contact:</p>
                  <p>Hayley Pentermann</p>
                  <p>Senior PR Manager, Cochlear Asia Pacific</p>
                  <p>+61 498 021 795</p>
                  <p>
                    <a href="mailto:hpentermann@cochlear.com" className="text-[#3f1482] hover:underline">
                      hpentermann@cochlear.com
                    </a>
                  </p>
                </div>
              </div>
              {/* Non-media Inquiries */}
              <div>
                <h2
                  className="mb-4 text-[22px] font-semibold leading-tight text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Non-media Inquiries
                </h2>
                <p className="text-sm text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  Visit{" "}
                  <a
                    href="https://www.cochlear.com/au/en/connect/contact-us"
                    className="text-[#3f1482] hover:underline"
                  >
                    www.cochlear.com/au/contact
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-gray-200">
          <div className="mx-auto max-w-[1280px] px-8 py-10" data-replica-section>
            <h2
              className="mb-4 text-[22px] font-semibold leading-tight text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Disclaimer
            </h2>
            <p
              className="text-sm leading-6 text-[#56565a]"
              style={{ fontFamily: BODY_FONT }}
            >
              {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>
      </main>

      <CochlearFooter />
    </div>
  );
}
