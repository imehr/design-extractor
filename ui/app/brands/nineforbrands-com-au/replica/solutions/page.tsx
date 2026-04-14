import Image from "next/image";
import Link from "next/link";
import { NineHeader } from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-header";
import {
  NineConnectBar,
  NineFooter,
} from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-footer";

const FONT_STACK = '"Proxima Nova", Arial, sans-serif';
const REPLICA_PREFIX = "/brands/nineforbrands-com-au/replica";

const SOLUTION_CARDS = [
  {
    title: "Content",
    image: "/brands/nineforbrands-com-au/content-card.png",
    href: "/content/",
  },
  {
    title: "Data",
    image: "/brands/nineforbrands-com-au/data-card.png",
    href: "/dataatnine/",
  },
  {
    title: "Technology",
    image: "/brands/nineforbrands-com-au/tech-card.png",
    href: "/technology/",
  },
];

const ADVERTISING_TYPES = [
  {
    title: "Television",
    description:
      "As Australia's most-watched commercial broadcast network, Nine is the home of the biggest and best locally made content. Our premium content helps brands achieve their marketing goals; whether it's building awareness and mental availability or directly driving purchase intent. Learn more about advertising on Nine's television network ",
    linkText: "here.",
    href: "#",
  },
  {
    title: "9Now (BVOD)",
    description:
      "9Now is the 9Network's free, world-class Broadcast Video on Demand (BVOD) platform. Audiences can live stream Nine's broadcast channels, and catch up on their favourite shows, anywhere, anytime on their connected device. 9Now offers advertisers a premium, brand safe and data led video environment. Learn more about advertising on 9Now ",
    linkText: "here.",
    href: "#",
  },
  {
    title: "Digital publishing",
    description:
      "Nine Publishing is Australia's leading premium publisher. Nine's mastheads include The Sydney Morning Herald, The Age, The Australian Financial Review, Brisbane Times and WAtoday. Nine Digital is able to meet advertising objectives across the full marketing funnel, including awareness, consideration, engagement and conversion. Learn more about advertising with Nine Publishing ",
    linkText: "here.",
    href: "#",
  },
  {
    title: "Radio",
    description:
      "Nine's total audio solution gives you reach across Australia's most loved radio stations, streaming and podcasts. With 2GB, 3AW, 4BC, 6PR, 2CC, 96FM, 2UE and a network of podcast shows, we provide brands with innovative advertising solutions to reach consumers in an immersive audio environment. Learn more about advertising on Nine Radio ",
    linkText: "here.",
    href: "#",
  },
  {
    title: "Print",
    description:
      "Nine Publishing is Australia's leading premium publisher. Our print mastheads include The Sydney Morning Herald, The Age and The Australian Financial Review. With premium editorial environments and highly engaged, affluent readers, Nine's print titles offer brands unmatched credibility and impact. Learn more about advertising in Nine's print titles ",
    linkText: "here.",
    href: "#",
  },
];

export default function NineSolutionsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: FONT_STACK, fontSize: 16, color: "#333333" }}
    >
      {/* Header - light variant */}
      <NineHeader variant="light" />

      {/* Hero banner */}
      <section
        className="w-full"
        style={{ backgroundColor: "#070720" }}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <h2
            className="mb-4"
            style={{
              fontFamily: FONT_STACK,
              fontSize: 48,
              fontWeight: 500,
              color: "#0493DE",
            }}
          >
            Solutions
          </h2>
          <p
            className="max-w-[900px]"
            style={{
              fontFamily: FONT_STACK,
              fontSize: 18,
              lineHeight: "27px",
              color: "#ffffff",
            }}
          >
            We&apos;re ready to help you hit your marketing goals harnessing a
            range of solutions spanning content, data and technology, right
            across our television, digital, radio and print assets. We know it
            isn&apos;t one size fits all, so we can help you pick and choose what
            services work best for your business and campaign.
          </p>
        </div>
      </section>

      {/* Solution cards */}
      <section className="w-full bg-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-16 md:grid-cols-3">
          {SOLUTION_CARDS.map((card) => (
            <Link
              key={card.title}
              href={`${REPLICA_PREFIX}${card.href}`}
              className="group block overflow-hidden"
            >
              <div className="relative aspect-[736/408] w-full overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <h3
                className="mt-4 text-center"
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#333",
                }}
              >
                {card.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Advertising types */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-[1200px] px-6 pb-16">
          {ADVERTISING_TYPES.map((type) => (
            <div key={type.title} className="mb-10 last:mb-0">
              <h3
                className="mb-3"
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#333",
                }}
              >
                {type.title}
              </h3>
              <p
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 16,
                  lineHeight: "26px",
                  color: "#333",
                }}
              >
                {type.description}
                <Link
                  href={type.href}
                  className="font-medium transition-colors hover:underline"
                  style={{ color: "#0493DE" }}
                >
                  {type.linkText}
                </Link>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Connect bar + Footer */}
      <NineConnectBar />
      <NineFooter />
    </div>
  );
}
