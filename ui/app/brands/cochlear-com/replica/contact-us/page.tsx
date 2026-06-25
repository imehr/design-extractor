import Image from "next/image";
import { ChevronRight, Phone, Globe, Mail } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HEADING_FONT = '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const ASIA_PACIFIC_OFFICES = [
  {
    name: "Australia and New Zealand",
    tel: "+61 2 9428 6555",
    href: "https://www.cochlear.com",
    additional: ["1800 620 929", "0800 444 819"],
    additionalHref: "https://www.cochlear.com/au",
  },
  {
    name: "Cochlear (HK) Limited",
    tel: "+852 2530 5773",
    href: "https://www.cochlear.com/hk",
  },
  {
    name: "Cochlear Japan Ltd",
    tel: "+81 3 3817 0241",
    href: "https://www.cochlear.com/jp",
  },
  {
    name: "Cochlear Korea",
    tel: "+02 533 4450",
    href: "https://www.cochlear.com/kr",
  },
  {
    name: "Cochlear Limited (Singapore branch)",
    tel: "+65 6553 3814",
    href: "https://www.cochlear.com/sg",
  },
  {
    name: "Cochlear Medical Device (Beijing) Co., Ltd",
    tel: "+86 10 5909 7800",
    href: "https://www.cochlear.com/cn",
  },
  {
    name: "Cochlear Medical Device Company India Pvt. Ltd.",
    tel: "+ 91 91 36060600",
    href: "https://www.cochlear.com/in",
  },
  {
    name: "Cochlear NZ Limited",
    tel: "0800 444 819",
    href: "https://www.cochlear.com/au",
  },
];

const AMERICAS_OFFICES = [
  {
    name: "Cochlear Americas",
    tel: "+1 800 523 5798",
    additional: ["+1 303 790 9010"],
    href: "https://www.cochlear.com/us",
  },
  {
    name: "Cochlear Canada Inc",
    tel: "1 800 483 3123",
    href: "https://www.cochlear.com/us",
  },
  {
    name: "Cochlear Latinoam\u00e9rica S.A.",
    tel: "0800-100-2266",
    additional: ["000-8111-004-5924", "800-523-5798"],
  },
];

const EMEA_OFFICES = [
  "EMEA Headquarters",
  "Cochlear Europe Ltd",
  "Cochlear Austria GmbH",
  "Cochlear Deutschland GmbH & Co. KG",
  "Cochlear Czech Republic",
  "Cochlear France SAS",
  "Cochlear Benelux NV",
  "Cochlear Italia SRL",
  "Cochlear Morocco",
  "Cochlear Nordic Denmark",
  "Cochlear Nordic AB Finland",
  "Cochlear Norway AS",
  "Cochlear Nordic AB Sweden",
  "Cochlear Middle East FZ-LLC",
  "Cochlear T\u0131bbi Cihazlar ve Sa\u011fl\u0131k Hizmetleri Ltd. \u015eti.",
];

const INFO_CARDS = [
  {
    title: "Device support",
    body: "",
    href: "https://www.cochlear.com/au/en/support",
    image: "/brands/cochlear-com/80a18c2b670b40e3926dd1329fbf3505",
    imageAlt: "Cochlear_Device support_01.jpg",
  },
  {
    title: "Join the Cochlear Family",
    body: "",
    href: "https://www.cochlear.com/au/en/cochlear-family",
    image: "/brands/cochlear-com/60750b87c6b5492fbd7e1afb8b7e4840",
    imageAlt: "ANZ-Introducing-Cochlear-Family.jpg",
  },
  {
    title: "Connect with us",
    body: "",
    href: "https://www.cochlear.com/au/en/connect/contact-us",
    image: "/brands/cochlear-com/79439972f3be47638ef737ab11ed5051",
    imageAlt: "ConnectWithUs.jpg",
  },
];

export default function ContactUsReplica() {
  return (
    <div className="min-h-screen bg-white">
      <CochlearHeader />

      <main>
        {/* Hero */}
        <section
          className="relative flex min-h-[480px] items-center bg-cover bg-center"
          style={{
            backgroundImage: "url('/brands/cochlear-com/9107893a660348d9bb7f101236d2041c')",
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
                Contact us
              </h1>
              <p
                className="text-xl font-normal leading-7 text-white"
                style={{ fontFamily: BODY_FONT }}
              >
                Cochlear offers support through our offices around the world. Find the office that services your region and get in touch with us today.
              </p>
            </div>
          </div>
        </section>

        {/* Get in touch with Cochlear */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2
                  className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Get in touch with Cochlear
                </h2>
                <p
                  className="mb-6 text-lg leading-7 text-[#56565a]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  Are you exploring a Cochlear implant for yourself or a loved one? Select a contact option.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[#3f1482] px-6 py-3 text-base font-medium text-white hover:bg-[#2f0f63]">
                    Yes
                  </Button>
                  <Button variant="outline" className="border-[#56565a] text-[#56565a]">
                    No, I need help with something else
                  </Button>
                </div>
              </div>
              <Card className="overflow-hidden border-gray-200 shadow-sm" data-replica-section>
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/brands/cochlear-com/df53fddd834b4561ba12dd9679041077"
                    alt="anz-info-kit-1600x900.jpg"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <h3
                    className="mb-2 text-xl font-semibold text-[#56565a]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    Request an information kit
                  </h3>
                  <p className="mb-4 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    Is a cochlear implant for you?
                  </p>
                  <a
                    href="https://www.cochlear.com/au/en/connect/contact-us/learn-more-about-cochlear-free-brochure?int_type=Hearing%20Solution%20Inquiry&int_subreason=Hearing%20Loss%20Information"
                    className="inline-flex items-center gap-2 font-medium text-[#3f1482] hover:underline"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Request now
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Global Offices */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-8 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Global Offices
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-gray-200 p-6 shadow-sm" data-replica-section>
                <h3
                  className="mb-4 text-xl font-semibold text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Cochlear Baha Products and Services
                </h3>
                <div className="space-y-1 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  <p className="font-semibold">Cochlear Bone Anchored Solutions AB</p>
                  <p>Konstruktionsvägen 14,</p>
                  <p>435 33 Mölnlycke,</p>
                  <p>Sweden</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    <Phone className="h-4 w-4 text-[#3f1482]" />
                    <a href="tel:+46 31 792 44 00" className="text-[#3f1482] hover:underline">
                      +46 31 792 44 00
                    </a>
                  </p>
                  <p className="text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    Fax: +46 31 792 46 95
                  </p>
                  <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                    <Globe className="h-4 w-4 text-[#3f1482]" />
                    <a href="https://www.cochlear.com/sv" className="text-[#3f1482] hover:underline">
                      https://www.cochlear.com/sv
                    </a>
                  </p>
                </div>
              </Card>
              <Card className="border-gray-200 p-6 shadow-sm" data-replica-section>
                <h3
                  className="mb-4 text-xl font-semibold text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Cochlear Implant Products and Services
                </h3>
                <div className="space-y-1 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                  <p className="font-semibold">Cochlear Headquarters</p>
                  <p>1 University Avenue,</p>
                  <p>Macquarie University,</p>
                  <p>Australia</p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Regional Offices */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-8 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Regional Offices
            </h2>

            {/* Asia Pacific */}
            <div className="mb-12">
              <h3
                className="mb-6 text-[28px] font-semibold leading-[32px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Asia Pacific
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ASIA_PACIFIC_OFFICES.map((office) => (
                  <Card key={office.name} className="border-gray-200 p-5 shadow-sm" data-replica-section>
                    <h4
                      className="mb-3 text-lg font-semibold text-[#56565a]"
                      style={{ fontFamily: HEADING_FONT }}
                    >
                      {office.name}
                    </h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                        <Phone className="h-4 w-4 text-[#3f1482]" />
                        <a href={`tel:${office.tel}`} className="text-[#3f1482] hover:underline">
                          {office.tel}
                        </a>
                      </p>
                      {office.additional?.map((num) => (
                        <p
                          key={num}
                          className="flex items-center gap-2 text-base text-[#56565a]"
                          style={{ fontFamily: BODY_FONT }}
                        >
                          <Phone className="h-4 w-4 text-[#3f1482]" />
                          <a
                            href={`tel:${num}`}
                            className="text-[#3f1482] hover:underline"
                          >
                            {num}
                          </a>
                        </p>
                      ))}
                      {office.href && (
                        <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                          <Globe className="h-4 w-4 text-[#3f1482]" />
                          <a href={office.href} className="text-[#3f1482] hover:underline">
                            {office.additionalHref || office.href}
                          </a>
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Americas */}
            <div className="mb-12">
              <h3
                className="mb-6 text-[28px] font-semibold leading-[32px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Americas
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {AMERICAS_OFFICES.map((office) => (
                  <Card key={office.name} className="border-gray-200 p-5 shadow-sm" data-replica-section>
                    <h4
                      className="mb-3 text-lg font-semibold text-[#56565a]"
                      style={{ fontFamily: HEADING_FONT }}
                    >
                      {office.name}
                    </h4>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                        <Phone className="h-4 w-4 text-[#3f1482]" />
                        <a href={`tel:${office.tel}`} className="text-[#3f1482] hover:underline">
                          {office.tel}
                        </a>
                      </p>
                      {office.additional?.map((num) => (
                        <p
                          key={num}
                          className="flex items-center gap-2 text-base text-[#56565a]"
                          style={{ fontFamily: BODY_FONT }}
                        >
                          <Phone className="h-4 w-4 text-[#3f1482]" />
                          <a href={`tel:${num}`} className="text-[#3f1482] hover:underline">
                            {num}
                          </a>
                        </p>
                      ))}
                      {office.href && (
                        <p className="flex items-center gap-2 text-base text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
                          <Globe className="h-4 w-4 text-[#3f1482]" />
                          <a href={office.href} className="text-[#3f1482] hover:underline">
                            {office.href}
                          </a>
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Europe, Africa and Middle East */}
            <div>
              <h3
                className="mb-6 text-[28px] font-semibold leading-[32px] text-[#56565a]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Europe, Africa and Middle East
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {EMEA_OFFICES.map((office) => (
                  <Card key={office} className="border-gray-200 p-4 shadow-sm" data-replica-section>
                    <h4
                      className="text-base font-semibold text-[#56565a]"
                      style={{ fontFamily: HEADING_FONT }}
                    >
                      {office}
                    </h4>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* European Data Act */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              European Union based users of Cochlear products and services - European Data Act
            </h2>
            <div className="inline-block">
              <Image
                src="/brands/cochlear-com/c9b1f59e06cd45d99a2131237ce0d150"
                alt="emea-eda@cochlear.com"
                width={189}
                height={20}
                className="h-auto w-auto"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="mb-6 text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Security
            </h2>
            <div className="inline-block">
              <Image
                src="/brands/cochlear-com/ed9108f1cc474bde895b6aa667ba8931"
                alt="Security contact"
                width={165}
                height={18}
                className="h-auto w-auto"
                unoptimized
              />
            </div>
          </div>
        </section>

        {/* More information */}
        <section className="bg-gray-50 py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <h2
              className="text-[32px] font-semibold leading-[38px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              More information
            </h2>
          </div>
        </section>

        {/* Device support / Join the Cochlear Family / Connect with us */}
        <section className="bg-white py-12 md:py-16" data-replica-section>
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="grid gap-6 md:grid-cols-3">
              {INFO_CARDS.map((card) => (
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
                    {card.body && (
                      <p
                        className="mb-5 text-base leading-relaxed text-[#56565a]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        {card.body}
                      </p>
                    )}
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
      </main>

      <CochlearFooter />
    </div>
  );
}
