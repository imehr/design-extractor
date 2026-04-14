import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NineHeader } from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-header";
import {
  NineConnectBar,
  NineFooter,
} from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-footer";

const FONT_STACK = '"Proxima Nova", Arial, sans-serif';

const ADVERTISE_CARDS = [
  {
    title: "Brand",
    description:
      "Our portfolio of content brands offers the breadth and depth to make powerful connections with your audience at scale.",
    href: "#",
    image: "/brands/nineforbrands-com-au/brands-card.png",
  },
  {
    title: "Our Audience",
    description:
      "As Australia\u2019s largest locally owned media company we can help you connect with who matters most to your business. From broad reach audiences to niche and targeted customer segments.",
    href: "#",
    image: "/brands/nineforbrands-com-au/audience-card.png",
  },
  {
    title: "Ad Specs",
    description:
      "Whether you\u2019re advertising in broadcast, digital, print and magazines or audio, see our ad specs across our brands.",
    href: "#",
    image: "/brands/nineforbrands-com-au/adspecs-card.jpg",
  },
];

const BOTTOM_CARDS = [
  { title: "Latest News", href: "#", image: "/brands/nineforbrands-com-au/latest-news.png" },
  { title: "Case Studies", href: "#", image: "/brands/nineforbrands-com-au/case-study.png" },
  { title: "Media Releases", href: "#", image: "/brands/nineforbrands-com-au/media-release.png" },
];

const BRAND_LOGOS = [
  { src: "/brands/nineforbrands-com-au/content-card.png", alt: "Nine Content Brands" },
  { src: "/brands/nineforbrands-com-au/data-card.png", alt: "Nine Data" },
  { src: "/brands/nineforbrands-com-au/tech-card.png", alt: "Nine Tech & AI" },
];

export default function NineHomePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: FONT_STACK, fontSize: 16, color: "#333333" }}
    >
      {/* Header - dark variant over hero */}
      <div className="absolute inset-x-0 top-0 z-50">
        <NineHeader variant="dark" />
      </div>

      {/* Hero Section - video background */}
      <section
        className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-6 pt-32 pb-20"
      >
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/brands/nineforbrands-com-au/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto max-w-[900px] text-center">
          <h1
            className="mb-8 text-[36px] leading-[1.2] font-[800] text-white md:text-[48px]"
          >
            Fuelled by Ambition, Ignited by Partnership
          </h1>
          <p
            className="text-[18px] leading-[28px] font-[400] text-white/90"
          >
            We are fuelled by ambition and defined by an ecosystem of trusted,
            scaled content, market-leading data, transformative tech and AI
            {"\u00A0\u2013\u00A0"}all focused on delivering proven business
            outcomes for you. Ignited by partnership, we embed brands right at
            the heart of Australian culture. Weaving your stories into ours is
            what we do best, creating moments that truly last.
          </p>
        </div>
      </section>

      {/* Subscribe Banner */}
      <section
        className="w-full px-6 py-5"
        style={{ backgroundColor: "#0493DE" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <span className="text-[18px] font-semibold text-white">
            Subscribe to our regular insights
          </span>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-bold text-[#333] transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#F5A623" }}
          >
            Subscribe
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Advertise with us */}
      <section className="w-full bg-white px-6 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-10 text-[36px] font-[800]"
            style={{ color: "#333" }}
          >
            Advertise with us
          </h2>

          {/* Top 3 cards */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {ADVERTISE_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group block overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-lg"
              >
                {card.image && (
                  <img src={card.image} alt={card.title} className="h-48 w-full object-cover" />
                )}
                <div className="p-6">
                <h3
                  className="mb-3 text-[22px] font-bold"
                  style={{ color: "#0493DE" }}
                >
                  {card.title}
                </h3>
                <p className="text-[16px] leading-[26px] text-[#555]">
                  {card.description}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold"
                  style={{ color: "#0493DE" }}
                >
                  Learn more
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom 3 cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {BOTTOM_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-lg"
              >
                {card.image && (
                  <img src={card.image} alt={card.title} className="h-48 w-full object-cover" />
                )}
                <div className="flex items-center justify-between p-6">
                <h3
                  className="text-[20px] font-bold"
                  style={{ color: "#333" }}
                >
                  {card.title}
                </h3>
                <ArrowRight
                  className="size-5 transition-transform group-hover:translate-x-1"
                  style={{ color: "#0493DE" }}
                />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Banner 1 */}
      <section className="w-full bg-[#F5F5F5] px-6 py-16">
        <div className="mx-auto max-w-[1200px] rounded-lg bg-white p-8 shadow-sm md:p-12">
          <p className="mb-6 text-[18px] leading-[28px] text-[#555]">
            In a world of endless scrolls and shifting algorithms, some stories
            simply refuse to be ignored. They command attention, spark
            conversation and stay with you long after the screen goes dark or
            the page is turned. Now entering an evolved chapter, Nine has
            partnered with B&amp;T to bring you Headliners. Hear from our
            experts and explore the very best in partnering with Nine
            Publishing, starting with T2 Tea.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0493DE" }}
          >
            Learn more
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Featured Banner 2 */}
      <section className="w-full bg-white px-6 py-16">
        <div className="mx-auto max-w-[1200px] rounded-lg bg-[#F5F5F5] p-8 shadow-sm md:p-12">
          <p className="mb-6 text-[18px] leading-[28px] text-[#555]">
            We know growth doesn{"\u2019"}t need to be guesswork{" "}
            {"\u2013"} that{"\u2019"}s why we{"\u2019"}ve decoded the science of
            Total TV outcomes in The Growth Project. The Growth Project is our
            commitment to working with advertisers to unequivocally prove the
            power of Total TV in driving business outcomes. Unlock the top 9
            insights for your brand today.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0493DE" }}
          >
            Learn more
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Our Brands */}
      <section className="w-full bg-white px-6 py-16">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-10 text-[36px] font-[800]"
            style={{ color: "#333" }}
          >
            Our Brands
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {BRAND_LOGOS.map((brand) => (
              <div
                key={brand.alt}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                <Image
                  src={brand.src}
                  alt={brand.alt}
                  width={400}
                  height={250}
                  className="h-auto w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect with us */}
      <NineConnectBar />

      {/* Footer */}
      <NineFooter />
    </div>
  );
}
