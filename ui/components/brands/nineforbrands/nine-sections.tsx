import Link from "next/link";
import Image from "next/image";

/* ── Advertise With Us — 3-column card grid ─────────────────────────── */

const ADVERTISE_CARDS = [
  {
    title: "Brands",
    description:
      "We are a leading multi-platform media network, engaging audiences across news, business & finance, lifestyle, entertainment & sport.",
    href: "#",
    imgAlt: "Brands menu",
  },
  {
    title: "Our Audience",
    description:
      "Our audience segmentation product '9Tribes', comprises of 68 audience segments across nine verticals.",
    href: "#",
    imgAlt: "Our Audience menu",
  },
  {
    title: "Ad Specs",
    description:
      "Our best-in-class advertising products offer the perfect canvas for your brand across print, digital or performance.",
    href: "#",
    imgAlt: "Ad Specs menu",
  },
];

export function AdvertiseWithUs() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <h2 className="mb-8 text-[24px] font-[800] tracking-[0.25px] text-[#333333]">
          Advertise with us
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3" data-component="card">
          {ADVERTISE_CARDS.map((card) => (
            <div key={card.title} className="group">
              {/* Placeholder card image area */}
              <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-[#f5f5f5]">
                <div className="flex h-full items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-12 w-12 text-[#ababab]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              </div>
              <Link
                href={card.href}
                className="text-[20px] font-[800] tracking-[0.25px] text-[#0493de] transition-colors duration-300 hover:text-[#037ab8]"
              >
                {card.title}
              </Link>
              <p className="mt-2 text-[16px] leading-[1.6] text-[#333333]">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Featured Banner (Headliners / Growth Project) ──────────────────── */

interface FeaturedBannerProps {
  description: string;
  ctaText: string;
  ctaHref: string;
}

export function FeaturedBanner({
  description,
  ctaText,
  ctaHref,
}: FeaturedBannerProps) {
  return (
    <section
      className="w-full bg-[#f5f5f5] py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <p className="text-[16px] leading-[1.6] text-[#333333]">
          {description}
        </p>
        <Link
          href={ctaHref}
          className="mt-4 inline-flex text-[14px] font-[800] tracking-[0.25px] text-[#0493de] transition-colors duration-300 hover:text-[#037ab8]"
        >
          {ctaText} &rarr;
        </Link>
      </div>
    </section>
  );
}

/* ── Latest News / Case Studies / Media Releases — 3-column ────────── */

const CONTENT_COLUMNS = [
  {
    title: "Latest News",
    articleTitle: "Automating the Admin to Reclaim the Art",
    seeAllText: "See all Latest News",
    href: "#",
  },
  {
    title: "Case Studies",
    articleTitle: "AFR Magazine x Range Rover",
    seeAllText: "See all Case Studies",
    href: "#",
  },
  {
    title: "Media Releases",
    articleTitle: "Andrew: The Downfall of a Prince",
    seeAllText: "See all Media Releases",
    href: "#",
  },
];

export function ContentColumns() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {CONTENT_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 text-[20px] font-[800] tracking-[0.25px] text-[#333333]">
                {col.title}
              </h2>
              {/* Article card */}
              <div className="mb-4 aspect-[16/9] w-full overflow-hidden rounded-[2px] bg-[#f5f5f5]">
                <div className="flex h-full items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-10 w-10 text-[#ababab]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                  </svg>
                </div>
              </div>
              <Link
                href={col.href}
                className="text-[16px] font-[800] text-[#333333] transition-colors duration-300 hover:text-[#0493de]"
              >
                {col.articleTitle}
              </Link>
              <div className="mt-4">
                <Link
                  href={col.href}
                  className="text-[14px] font-[800] tracking-[0.25px] text-[#0493de] transition-colors duration-300 hover:text-[#037ab8]"
                >
                  {col.seeAllText} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Our Brands — Logo strip ────────────────────────────────────────── */

export function OurBrands() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <h2 className="mb-8 text-[24px] font-[800] tracking-[0.25px] text-[#333333]">
          Our Brands
        </h2>
        {/* Brand logo placeholders */}
        <div className="flex flex-wrap items-center gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[60px] w-[120px] items-center justify-center rounded-[2px] bg-[#f5f5f5]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-[#ababab]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="#"
            className="text-[14px] font-[800] tracking-[0.25px] text-[#0493de] transition-colors duration-300 hover:text-[#037ab8]"
          >
            See all Brands &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Advertising Types (for Solutions page) ───────────────────────── */

const ADVERTISING_TYPES = [
  {
    type: "TV advertising",
    link: "/brands/nineforbrands-com-au/replica/brands#television",
  },
  {
    type: "Digital advertising",
    link: "/brands/nineforbrands-com-au/replica/brands#digital",
  },
  {
    type: "Radio advertising",
    link: "/brands/nineforbrands-com-au/replica/brands#radio",
  },
  {
    type: "Print advertising",
    link: "/brands/nineforbrands-com-au/replica/brands#print",
  },
];

export function AdvertisingTypes() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <p className="text-[16px] leading-[1.6] text-[#333333]">
          When it comes to connecting brands with the passions of Australians,
          there&apos;s no other media company like Nine. Providing you with a
          one-stop shop to book a range of advertising campaigns across a diverse
          range of platforms, all in one transaction.
        </p>
        <p className="mt-6 text-[16px] leading-[1.6] text-[#333333]">
          Our best-in-class advertising products offer the perfect canvas for
          your brand across print, digital or performance.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {ADVERTISING_TYPES.map((item) => (
            <Link
              key={item.type}
              href={item.link}
              className="text-[16px] font-[800] tracking-[0.25px] text-[#0493de] transition-colors duration-300 hover:text-[#037ab8]"
            >
              {item.type} &rarr;
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Solution Cards (for Solutions page) ────────────────────────────── */

const SOLUTION_CARDS = [
  { title: "Content", href: "#", img: "/brands/nineforbrands-com-au/content-card.png" },
  { title: "Data", href: "#", img: "/brands/nineforbrands-com-au/data-card.png" },
  { title: "Technology", href: "#", img: "/brands/nineforbrands-com-au/tech-card.png" },
];

export function SolutionCards() {
  return (
    <section
      className="w-full bg-white py-[80px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3" data-component="card">
          {SOLUTION_CARDS.map((card) => (
            <Link key={card.title} href={card.href} className="group">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-[2px] transition-shadow duration-300 group-hover:shadow-[0_0_5px_0_rgb(128,128,128)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.img}
                  alt={card.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-6 text-center text-[18px] font-[800] tracking-[0.25px] text-[#333333]">
                {card.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Board of Directors (for About page) ────────────────────────────── */

const DIRECTORS = [
  { name: "Peter Tonagh", title: "Chairman", img: "/brands/nineforbrands-com-au/directors/director-1.png" },
  { name: "Chris Halios-Lewis", title: "Independent Non-Executive Director", img: "/brands/nineforbrands-com-au/directors/director-2.png" },
  { name: "Andrew Lancaster", title: "Independent Non-Executive Director", img: "/brands/nineforbrands-com-au/directors/director-3.jpg" },
  { name: "Timothy Longstaff", title: "Independent Non-Executive Director", img: "/brands/nineforbrands-com-au/directors/director-4.png" },
  { name: "Mandy Pattinson", title: "Independent Non-Executive Director", img: "/brands/nineforbrands-com-au/directors/director-5.png" },
  { name: "Mickie Rosen", title: "Independent Non-Executive Director", img: "/brands/nineforbrands-com-au/directors/director-6.jpg" },
];

const MANAGEMENT = [
  { name: "Matt Stanton", title: "Chief Executive Officer" },
  { name: "Amanda Laing", title: "Chief Operating Officer" },
  { name: "Tory Maguire", title: "Managing Director, Publishing" },
  { name: "Matt James", title: "Chief Sales Officer" },
  { name: "Rachel Launders", title: "General Counsel" },
  { name: "Martyn Roberts", title: "Chief People Officer" },
  { name: "Vanessa Morley", title: "Chief Marketing Officer" },
  { name: "Alex Parsons", title: "Chief Financial Officer" },
  { name: "James Boyce", title: "Chief Technology Officer" },
];

export function BoardOfDirectors() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <h2 className="mb-8 text-[24px] font-[800] tracking-[0.25px] text-[#333333]">
          Board of Directors
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {DIRECTORS.map((person) => (
            <div key={person.name} className="text-center">
              <div className="mx-auto mb-4 h-[160px] w-[160px] overflow-hidden rounded-full bg-[#d0d8e0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={person.img}
                  alt={person.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-[16px] font-[800] text-[#333333]">
                {person.name}
              </p>
              <p className="mt-1 text-[14px] text-[#737373]">{person.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ManagementTeam() {
  return (
    <section
      className="w-full bg-white py-[48px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4">
        <h2 className="mb-8 text-[24px] font-[800] tracking-[0.25px] text-[#333333]">
          Management Team
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {MANAGEMENT.map((person) => (
            <div key={person.name}>
              <p className="text-[16px] font-[800] text-[#333333]">
                {person.name}
              </p>
              <p className="mt-1 text-[14px] text-[#737373]">{person.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
