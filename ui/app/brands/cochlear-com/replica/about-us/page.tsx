import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT =
  '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT =
  '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const STORY_CARDS = [
  {
    title: "Proven over time",
    body: "From Professor Graeme Clark's discovery with a shell and a blade of grass through to today, we remain committed to advancing hearing technology.",
    href: "/au/en/about-us/proven-over-time",
    image: "/brands/cochlear-com/e7335211a02143acacd76af2b541208e",
    imageAlt: "Graeme.jpg",
  },
  {
    title: "Driving progress",
    body: "You inspire our passion for progress. To meet your needs now and into the future, we continue to innovate and pioneer new technology.",
    href: "/au/en/about-us/driving-progress",
    image: "/brands/cochlear-com/e095c7ce6d7a419bbac71164458bb0f1",
    imageAlt: "5643.jpg",
  },
  {
    title: "Connecting the community",
    body: "People choose Cochlear to join the world's largest community with hearing implants, supported by a network of carers and hearing professionals.",
    href: "/au/en/about-us/connecting-the-community",
    image: "/brands/cochlear-com/1e1557011bb649e7ab7eab655ca2cdf0",
    imageAlt: "6368.jpg",
  },
];

export default function AboutUsReplica() {
  return (
    <div className="min-h-screen bg-white">
      <CochlearHeader />

      <main>
        {/* Hero — left text + right photo (landing-banner layout, full bleed) */}
        <section
          className="relative overflow-hidden bg-white"
          data-replica-section
        >
          <div className="flex w-full flex-col md:flex-row" style={{ height: 366 }}>
            {/* Left: heading + intro + CTA — constrained to ~42% */}
            <div
              className="flex flex-col justify-center px-8 py-8 md:pl-12 md:pr-8"
              style={{ width: "42%", flexShrink: 0 }}
            >
              {/* Header highlight bar — brand decorative element */}
              <div
                className="mb-3 h-1 w-16 bg-[#fdc82f]"
                aria-hidden="true"
              />
              <h1
                className="mb-4 text-[42px] font-semibold leading-[50px] text-[#3f1482]"
                style={{ fontFamily: HEADING_FONT }}
              >
                About us
              </h1>
              <p
                className="mb-6 text-lg leading-7 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                At Cochlear we always start with people in mind, thinking about
                their needs. Learn more about our mission and story.
              </p>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#3f1482] px-6 py-2 text-base font-medium text-[#3f1482] hover:bg-[#3f1482] hover:text-white transition-colors"
                  style={{ fontFamily: BODY_FONT }}
                >
                  Watch now
                </button>
              </div>
            </div>

            {/* Right: hero photo — takes remaining 58% to right edge */}
            <div className="relative" style={{ flex: 1 }}>
              <Image
                src="/brands/cochlear-com/4384cb88cf5f4b1e9e20a4b051a1801e"
                alt="AboutCochlear.jpg"
                fill
                className="object-cover object-center"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <nav className="border-t border-gray-200 bg-white py-3" aria-label="Breadcrumb">
          <div className="mx-auto max-w-[1280px] px-4">
            <span
              className="text-sm text-[#56565a]"
              style={{ fontFamily: BODY_FONT }}
            >
              About us
            </span>
          </div>
        </nav>

        {/* Mission text block */}
        <section className="bg-white py-16 md:py-20" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="max-w-3xl">
              <p
                className="mb-8 text-lg leading-8 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                As the global leader in implantable hearing solutions, we have
                helped over 700,000 people to hear with one – or two – of our
                implantable solutions.
              </p>

              <h2
                className="mb-5 text-[28px] font-semibold leading-[34px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Our Mission
              </h2>

              <div
                className="space-y-4 text-lg leading-8 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                <p>We help people hear and be heard.</p>
                <p>
                  We empower people to connect with others and live a full life.
                </p>
                <p>
                  We help transform the way people understand and treat hearing
                  loss.
                </p>
                <p>
                  We innovate and bring to market a range of implantable hearing
                  solutions that deliver a lifetime of hearing outcomes.*
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Acknowledgement of Country — gold/yellow hero card */}
        <section
          className="bg-[#fdc82f]"
          data-replica-section
        >
          <div className="flex w-full flex-col md:flex-row" style={{ height: 347 }}>
            {/* Left: artwork image — ~47% of total width */}
            <div className="relative w-full flex-shrink-0 md:w-[600px]" style={{ height: 347 }}>
              <Image
                src="/brands/cochlear-com/9dcecd4953b640a09a6712ddb061cc67"
                alt="web_Joy-of-Sound.jpg"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Right: text — constrained to section height */}
            <div className="flex flex-1 flex-col justify-center overflow-hidden px-10 py-8">
              <h2
                className="mb-4 text-[28px] font-semibold leading-[34px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Acknowledgement of Country
              </h2>
              <p
                className="mb-6 text-base leading-7 text-[#56565a]"
                style={{ fontFamily: BODY_FONT }}
              >
                Worimi ('hello' in local Darug language). Cochlear&apos;s
                headquarters are located on the unceded lands of the
                Wattamatagal Peoples of the Darug Nation. Cochlear is committed
                to reconciliation. Learn more about our Reconciliation Action
                Plan. Illustration credit: &apos;Joy of Sound&apos; by Balarinji.
              </p>
              <div>
                <a
                  href="https://assets.cochlear.com/api/public/content/c47aa91e955e40f7825fec37829e8866"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#56565a] px-6 py-2 text-base font-medium text-[#56565a] hover:bg-[#56565a] hover:text-white transition-colors"
                  style={{ fontFamily: BODY_FONT }}
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3-column story cards */}
        <section className="bg-white pb-20 pt-0 md:pb-24 md:pt-0" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="grid gap-6 md:grid-cols-3">
              {STORY_CARDS.map((card) => (
                <Card
                  key={card.title}
                  className="overflow-hidden border-gray-200 shadow-sm pt-0"
                  data-replica-section
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={card.image}
                      alt={card.imageAlt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-6 pb-12">
                    <h2
                      className="mb-3 text-xl font-semibold leading-tight text-[#56565a]"
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
                      className="inline-flex items-center gap-1 font-medium text-[#3f1482] hover:underline"
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
        <section className="bg-white py-10 md:py-14" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-4 text-xl font-semibold text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Disclaimer
            </h2>
            <div
              className="space-y-4 text-sm leading-6 text-[#56565a]"
              style={{ fontFamily: BODY_FONT }}
            >
              <p>
                Please seek advice from your health professional about treatments
                for hearing loss. Outcomes may vary, and your health professional
                will advise you about the factors which could affect your
                outcome. Always follow the directions for use. Not all products
                are available in all countries. Please contact your local
                Cochlear representative for product information.
              </p>
              <p>
                For a full list of Cochlear&apos;s trademarks, please visit our{" "}
                <a
                  href="/au/en/corporate/terms-of-use"
                  className="text-[#3f1482] hover:underline"
                >
                  Terms of Use
                </a>{" "}
                page.
              </p>
              <p>
                *&quot;A lifetime of hearing performance&quot; and similar phrases should not
                be understood as claims relating to the expected life,
                reliability, quality or performance of Cochlear&apos;s products.
              </p>
              <p>
                In Australia, Cochlear™ Nucleus® implant systems are intended
                for the treatment of moderately severe to profound hearing loss.
              </p>
              <p>
                In Australia, Baha® bone conduction implant systems are intended
                for the treatment of moderate to profound hearing loss.
              </p>
              <p>
                In Australia, the Cochlear™ Osia® System is indicated for
                patients with conductive, mixed hearing loss and single-sided
                sensorineural deafness (SSD) aged 5 years and above with up to
                55 decibels sensorineural hearing loss. Patients should have
                sufficient bone quality and quantity to support successful
                implant placement. Surgery is required to use this product. Any
                surgical procedure carries risk.
              </p>
              <p>
                For Cochlear™ Nucleus®, Osia® and Baha® systems: This product
                is not available for purchase by the general public. For
                information on funding and reimbursement please contact your
                health care professional.
              </p>
              <p>
                Any testimonial featured on this website is intended for an
                Australian audience only.
              </p>
            </div>
          </div>
        </section>
      </main>

      <CochlearFooter />
      {/* Black subfooter bar — present in original below the main footer */}
      <div className="w-full bg-black py-6">
        <div className="mx-auto max-w-[1280px] px-4">
          <p className="text-sm text-white/60" style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}>
            &nbsp;
          </p>
        </div>
      </div>
    </div>
  );
}
