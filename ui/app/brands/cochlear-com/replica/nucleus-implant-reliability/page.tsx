import Image from "next/image";
import { ChevronRight, Download } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT = '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const TOC_ITEMS = [
  "Why people choose Cochlear",
  "Why reliability is important, and how we report it",
  "The story of Cochlear's first commercial child recipient, Holly Taylor, who's relied on her implant for more than 30 years",
  "A downloadable copy of our latest Reliability Reports",
];

const PRODUCT_CARDS = [
  {
    title: "Nucleus\u00ae Sound Processors",
    body: "We offer a choice of sound processors to fit your lifestyle and preference.",
    href: "https://www.cochlear.com/au/en/home/products-and-accessories/cochlear-nucleus-system/nucleus-sound-processors",
    image: "/brands/cochlear-com/8e6b466c19974312b3f645e36d41bdc8",
    imageAlt: "nucleus-iphone.jpg",
  },
  {
    title: "Nucleus\u00ae smart sound processing technology",
    body: "Whether you're in a restaurant, playground or office, our ",
    href: "https://www.cochlear.com/au/en/home/products-and-accessories/cochlear-nucleus-system/nucleus-sound-processors/nucleus-smart-sound-processing-technology",
    image: "/brands/cochlear-com/cbb3a49f2bce4c859a608e21c4642638",
    imageAlt: "N8_UniLecture_Glassmorphism_1440x900.jpg",
  },
  {
    title: "The Nucleus\u00ae Nexa\u2122 Implant",
    body: "Responsive, updateable and uniquely yours. Meet the Nucleus Nexa implant, ",
    href: "https://www.cochlear.com/au/en/home/products-and-accessories/nucleus-nexa-system/implant",
    image: "/brands/cochlear-com/a948eca7ee614942ab07d544af35b23e",
    imageAlt: "Nucleus Nexa implant",
  },
];

const SHARE_LINKS = [
  { href: "https://www.facebook.com/CochlearANZ", src: "/brands/cochlear-com/f67d4ca2854c47d48a4e2b1418e6463e", alt: "Facebook logo", label: "Facebook" },
  { href: "https://twitter.com/cochlear", src: "/brands/cochlear-com/b920f8674a38493fbb1a0ca6c570fba8", alt: "Twitter logo", label: "Twitter" },
  { href: "https://www.linkedin.com/company/cochlear/", src: "/brands/cochlear-com/284db41af32b40c7b6c1eb01e3667208", alt: "LinkedIn logo", label: "LinkedIn" },
];

export default function NucleusImplantReliabilityReplica() {
  return (
    <div className="min-h-screen bg-white">
      <CochlearHeader />

      <main>
        {/* Hero */}
        <section
          className="relative flex min-h-[480px] items-center bg-cover bg-center"
          style={{
            backgroundImage: "url('/brands/cochlear-com/dcdbd5ca95ed4b4ba08a3fe5b4d2fca2')",
          }}
          data-replica-section
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative mx-auto w-full max-w-[1280px] px-4 py-20 md:py-28">
            <div className="max-w-xl">
              <h1
                className="mb-4 text-[38px] font-semibold leading-[44px] text-white"
                style={{ fontFamily: HEADING_FONT }}
              >
                Nucleus&reg; Implant reliability
              </h1>
              <p
                className="text-xl font-normal leading-7 text-white"
                style={{ fontFamily: BODY_FONT }}
              >
                With a cochlear implant, you want to choose a hearing solution for today and for the future. That's why reliability is so important.
              </p>
            </div>
          </div>
        </section>

        {/* What you'll find on this page */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              What you'll find on this page
            </h2>
            <ul className="space-y-3" style={{ fontFamily: BODY_FONT }}>
              {TOC_ITEMS.map((item) => (
                <li key={item} className="text-lg leading-7 text-[#56565a]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why people choose Cochlear */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Why people choose Cochlear
            </h2>
            <div className="max-w-3xl space-y-5" style={{ fontFamily: BODY_FONT }}>
              <p className="text-lg leading-7 text-[#56565a]">
                Choosing a cochlear implant – for yourself, or for a loved one - is an important and often long-lasting decision. You will want to feel assured that you are choosing the right hearing solution for now, and the future.
              </p>
              <p className="text-lg leading-7 text-[#56565a]">
                With more than 650,000 registered Cochlear Nucleus Implants worldwide1,*, more people rely on Cochlear than on any other hearing implant manufacturer.
              </p>
              <p className="text-lg leading-7 text-[#56565a]">
                There are many factors to consider when choosing which hearing implant manufacturer to place your trust in. These include hearing performance, comfort, ongoing care and access to advancements in technology. Long term reliability of both implant and sound processor may be one of the most important fa
              </p>
            </div>
          </div>
        </section>

        {/* Transparency in reliability reporting */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div>
                <h2
                  className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Transparency in reliability reporting
                </h2>
                <p
                  className="mb-6 text-lg leading-7 text-[#56565a]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  Our dedication to quality and transparency in reliability reporting is important to us. We meet and report against independent global standards for implant reliability, publishing data of every implant generation - past and present.1-5
                </p>
                <p className="mb-6 text-lg leading-7 text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  The latest Cochlear Nucleus System Reliability Report can be downloaded.
                </p>
                <a
                  href="https://assets.cochlear.com/api/public/content/090e770ba43e4919bf5949438426856e?v=970f3c63"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3f1482] px-6 py-3 text-base font-medium text-white hover:bg-[#2f0f63]"
                >
                  Download now
                  <Download className="h-4 w-4" />
                </a>
              </div>
              <div className="flex items-start gap-4">
                {SHARE_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <Image src={social.src} alt={social.alt} width={25} height={25} className="h-5 w-5" unoptimized />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Smart by Design. Proven in Reliability */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-8 text-center text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Smart by Design. Proven in Reliability
            </h2>
            <div className="mx-auto max-w-md">
              <Image
                src="/brands/cochlear-com/21e6368095f74dd8aade72c99e4a5ce6"
                alt="ProveninReliability2026"
                width={560}
                height={563}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Reliable over the long term */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-8 text-center text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Reliable over the long term**
            </h2>
            <div className="mx-auto max-w-xs">
              <Image
                src="/brands/cochlear-com/d6452131f5e8405cb16c0930b13d3086"
                alt="MostChosen2026"
                width={300}
                height={297}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Proven reliability for children */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-8 text-center text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Proven reliability for children
            </h2>
            <div className="mx-auto max-w-2xl">
              <Image
                src="/brands/cochlear-com/7fdc4c3cdd134d2bba6b322b498df31c"
                alt="MostReliable2026"
                width={800}
                height={409}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Reliable sound processors */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Reliable sound processors
            </h2>
            <Card className="border-gray-200 bg-gray-50 p-8 shadow-sm" data-replica-section>
              <h3
                className="mb-4 text-[28px] font-semibold leading-[32px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Cochlear Nucleus System Reliability Report
              </h3>
              <div className="space-y-3" style={{ fontFamily: BODY_FONT }}>
                <a
                  href="https://assets.cochlear.com/api/public/content/38714fb1f6f349bb83d5e93bfb26bf29?v=e2aec6d6"
                  className="inline-flex items-center gap-2 text-lg text-[#3f1482] hover:underline"
                >
                  click here.
                  <ChevronRight className="h-4 w-4" />
                </a>
                <br />
                <a
                  href="https://assets.cochlear.com/api/public/content/822d546c48c443358cd31f5b96b6801d?v=a541684b"
                  className="inline-flex items-center gap-2 text-lg text-[#3f1482] hover:underline"
                >
                  click here
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </Card>
          </div>
        </section>

        {/* More information */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              More information
            </h2>
            <a
              href="https://assets.cochlear.com/api/public/content/090e770ba43e4919bf5949438426856e?v=970f3c63"
              className="inline-flex items-center gap-2 rounded-lg bg-[#3f1482] px-6 py-3 text-base font-medium text-white hover:bg-[#2f0f63]"
            >
              Download now
              <Download className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Product cards */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="grid gap-6 md:grid-cols-3">
              {PRODUCT_CARDS.map((card) => (
                <Card key={card.title} className="overflow-hidden border-gray-200 shadow-sm" data-replica-section>
                  <div className="relative aspect-[16/9] w-full">
                    <Image src={card.image} alt={card.imageAlt} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-6">
                    <h2
                      className="mb-3 text-2xl font-semibold leading-tight text-[#56565a]"
                      style={{ fontFamily: HEADING_FONT }}
                    >
                      {card.title}
                    </h2>
                    <p
                      className="mb-5 text-base leading-relaxed text-[#56565a]"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {card.body}
                    </p>
                    <a
                      href={card.href}
                      className="inline-flex items-center gap-2 font-medium text-[#3f1482] hover:underline"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      Read more
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-gray-50 py-10 md:py-12" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-4 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Disclaimer
            </h2>
          </div>
        </section>

        {/* References */}
        <section className="bg-white py-10 md:py-12" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h6
              className="text-lg font-semibold text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              References
            </h6>
          </div>
        </section>
      </main>

      <CochlearFooter />
    </div>
  );
}
