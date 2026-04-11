import Image from "next/image";
import Link from "next/link";
import { WWGHeader } from "@/components/brands/woolworths-group/wwg-header";
import { WWGFooter } from "@/components/brands/woolworths-group/wwg-footer";
import { Card, CardContent } from "@/components/ui/card";


import { Separator } from "@/components/ui/separator";

const subNavItems = [
  { text: "Overview", href: "#", active: true },
  { text: "Climate and Nature", href: "#", active: false },
  { text: "Health and Nutrition", href: "#", active: false },
  { text: "Social Impact", href: "#", active: false },
  { text: "Human Rights", href: "#", active: false },
  { text: "Waste and Circularity", href: "#", active: false },
  { text: "Reports & Data", href: "#", active: false },
  { text: "Stories", href: "#", active: false },
];

const impactAreas = [
  {
    title: "Climate and Nature",
    image: "climate-and-nature.jpg",
    href: "#",
  },
  {
    title: "Waste & Circularity",
    image: "waste---circularity.jpg",
    href: "#",
  },
  {
    title: "Human Rights",
    image: "human-rights.jpg",
    href: "#",
  },
  {
    title: "Social Impact",
    image: "social-impact.jpg",
    href: "#",
  },
  {
    title: "Health and Nutrition",
    image: "health-and-nutrition.jpg",
    href: "#",
  },
];

const stats = [
  {
    value: "22.9%",
    description:
      "reduction in operational emissions relative to our F23 base year",
  },
  {
    value: ">20,000t",
    description:
      "of virgin plastic removed from our own brand packaging since 2018",
  },
  {
    value: ">165M",
    description: "meals provided to people in need",
  },
];

export default function OurImpactPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, color: "#202020" }}
    >
      <WWGHeader activePage="Our impact" />

      {/* Hero Banner */}
      <div className="relative w-full" style={{ height: 529 }}>
        <img src="/brands/woolworths-group/hero-staff.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-[1200px] px-10 pb-10">
            <h2 className="text-white" style={{ fontFamily: 'TomatoGrotesk, sans-serif', fontSize: 64, fontWeight: 600, lineHeight: '80px' }}>
              Sustainability
            </h2>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] gap-0 overflow-x-auto px-10">
          {subNavItems.map((item) => (
            <Link
              key={item.text}
              href={item.href}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                item.active
                  ? "border-[#1971ED] text-[#1971ED]"
                  : "border-transparent text-[#202020] hover:text-[#1971ED]"
              }`}
            >
              {item.text}
            </Link>
          ))}
        </div>
      </div>

      {/* Blue Intro Section */}
      <section className="bg-[#1971ED] py-16">
        <div className="mx-auto max-w-[1200px] px-10 text-center">
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white">
            At Woolworths Group, sustainability isn&apos;t an aspiration - it&apos;s
            how we do business.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-white/90">
            It&apos;s the foundation of our purpose: creating better experiences
            together for a better tomorrow.
          </p>
        </div>
      </section>

      {/* Sustainability Plan Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-6"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 48,
              lineHeight: "56px",
              fontWeight: 600,
              color: "#1971ED",
            }}
          >
            Our Sustainability Plan - Impact that matters for a better tomorrow
          </h1>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-[#202020]">
                Our 2030 Sustainability Plan - Impact that matters for a better
                tomorrow - is designed to balance ambition with pragmatism and is
                centred around impact and value. This Plan sets out clear
                ambitions for the next phase of our journey &ndash; one that
                responds to a rapidly changing world while reinforcing our
                commitment to long-term value for our customers, team,
                shareholders, suppliers, and the broader community.
              </p>
              <p className="text-base leading-relaxed text-[#202020]">
                Our focus is to strengthen business growth and value chain
                resilience by prioritising areas where we can have the biggest
                impact. To identify these areas, we conducted a double materiality
                assessment &ndash; evaluating both how sustainability issues
                affect our business and our effect on people and the planet. This
                process was further validated by peer benchmarking, stakeholder
                insights, and lessons learned over the past five years.
              </p>
              <p className="text-base leading-relaxed text-[#202020]">
                We have identified five material areas, with goals and actions
                defined to guide our ambition.
              </p>
              <Link
                href="#"
                className="inline-flex items-center justify-center rounded-lg bg-[#1971ED] px-6 py-2 text-sm font-medium text-white hover:bg-[#1560c7] transition-colors"
              >
                Read our Sustainability Plan
              </Link>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/brands/woolworths-group/our-purpose-and-key-priorities.jpg"
                alt="Sustainability wheel diagram"
                fill
                className="rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-[1200px]" />

      {/* Five Impact Areas */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {impactAreas.map((area) => (
              <Card
                key={area.title}
                className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="relative h-[180px]">
                  <Image
                    src={`/brands/woolworths-group/${area.image}`}
                    alt={area.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h4
                    className="mb-2 text-sm"
                    style={{
                      fontFamily: "TomatoGrotesk, sans-serif",
                      fontWeight: 600,
                      color: "#1971ED",
                    }}
                  >
                    {area.title}
                  </h4>
                  <Link
                    href={area.href}
                    className="text-xs font-semibold text-[#1971ED] hover:underline"
                  >
                    Learn more
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative brand divider */}
      <div className="flex w-full">
        <Image
          src="/brands/woolworths-group/divider-berry-land.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
        <Image
          src="/brands/woolworths-group/divider-land-sun.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
        <Image
          src="/brands/woolworths-group/divider-ocean-sky.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
      </div>

      {/* Journey to Date / Stats Section */}
      <section className="bg-[#F6F9FC] py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-6 text-center"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 48,
              lineHeight: "56px",
              fontWeight: 600,
              color: "#1971ED",
            }}
          >
            Our journey to date
          </h1>
          <p className="mx-auto mb-6 max-w-3xl text-center text-base leading-relaxed text-[#202020]">
            We&apos;ve been on our sustainability journey for many years now. We
            reflect on the lessons learned, recognise the impact we&apos;ve made
            and the work still ahead. We are proud that this translated into over
            $2.6 billion in net societal benefit over the five years to 2025. It
            also taught us that progress is not always linear, and collective
            action is crucial to solving increasingly interconnected challenges.
          </p>
          <p className="mx-auto mb-12 max-w-3xl text-center text-base leading-relaxed text-[#202020]">
            With the completion of our five year Woolworths Group Sustainability
            Plan 2025 we reflect on the meaningful progress we&apos;ve delivered,
            including:
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.value} className="text-center">
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 48,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  {stat.value}
                </h3>
                <p className="text-sm leading-relaxed text-[#202020]">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Cards */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[200px]">
                <Image
                  src="/brands/woolworths-group/story-sustainability-plan.jpg"
                  alt="Sustainability Plan"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-3"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Our Purpose & Key Priorities
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#202020]">
                  For progress against our goals, see our annual Reporting Suite.
                </p>
                <Link
                  href="#"
                  className="text-sm font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[200px]">
                <Image
                  src="/brands/woolworths-group/f25-reporting-suite.jpg"
                  alt="Reporting Suite"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-3"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Reports & Data
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#202020]">
                  Read our 2025 Sustainability Report and other publications.
                </p>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-lg bg-[#1971ED] px-6 py-2 text-sm font-medium text-white hover:bg-[#1560c7] transition-colors"
                >
                  Read our 2025 Sustainability Report
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[200px]">
                <Image
                  src="/brands/woolworths-group/our-reports.jpg"
                  alt="Our Stories"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-3"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Stories
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#202020]">
                  Read the latest stories about our sustainability journey.
                </p>
                <Link
                  href="#"
                  className="text-sm font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <WWGFooter />
    </div>
  );
}
