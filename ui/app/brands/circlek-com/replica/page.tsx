import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { CircleKHeader } from "@/components/brands/circlek-com/circlek-com-header";
import { CircleKFooter } from "@/components/brands/circlek-com/circlek-com-footer";

const IMG = "/brands/circlek-com";
const BASE = "/brands/circlek-com/replica";

/* ── Tile data ────────────────────────────────────────────── */

const TOP_TILES = [
  {
    title: "Save with Inner Circle!",
    image: `${IMG}/inner-circle-tile-500x500px.jpg`,
    cta: "Save now!",
    href: `${BASE}`,
  },
  {
    title: "Circle K PRO Business Fleet Card",
    image: `${IMG}/dc0133_web_ck_pro_500x500.jpg`,
    cta: "Learn more!",
    href: `${BASE}`,
  },
  {
    title: "Premium Fuel",
    image: `${IMG}/premium_fuel_homepage_tile_500x500.jpg`,
    cta: "More info",
    href: `${BASE}`,
  },
];

const BOTTOM_TILES = [
  {
    title: "Meal Deal",
    subtitle: "Starting at $3",
    image: `${IMG}/website_tile.png`,
    cta: "Meal Deals",
    href: `${BASE}`,
  },
  {
    title: "New Circle K Award-winning wines",
    image: `${IMG}/sunshine-bliss-wine-homepage-tile-3.jpg`,
    cta: "",
    href: `${BASE}`,
  },
  {
    title: "Circle K Fuel",
    image: `${IMG}/fule-tile_1.jpg`,
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "Fast and Easy EV Charging",
    image: `${IMG}/photo_385x385.jpg`,
    alt: "A man charges his electric vehicle at Circle K.",
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "Easy pay",
    image: `${IMG}/dc0133_web_easypay_500x500_v2_1.jpg`,
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "QUALITY GUARANTEED",
    image: `${IMG}/500x500px_fuel_quality_guaranteed_landing_page_1_1_1.jpg`,
    cta: "READ OUR GUARANTEE",
    href: `${BASE}`,
  },
];

/* ── Shared tile component ────────────────────────────────── */

function ProductTile({
  title,
  subtitle,
  image,
  alt,
  cta,
  href,
}: {
  title: string;
  subtitle?: string;
  image: string;
  alt?: string;
  cta: string;
  href: string;
}) {
  return (
    <Link href={href} className="group relative block aspect-square overflow-hidden rounded-sm">
      <Image
        src={image}
        alt={alt ?? title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {/* Text content */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3
          className="text-lg font-bold leading-tight text-white"
          style={{ fontFamily: "'ACT Easy', sans-serif" }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-white/90">{subtitle}</p>
        )}
        {cta && (
          <span className="mt-2 inline-block border-b border-white pb-0.5 text-sm font-semibold text-white transition-colors group-hover:text-white/80">
            {cta}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function CircleKHomePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "'ACT Easy', sans-serif",
        fontSize: 15,
        lineHeight: "24px",
        color: "#141414",
      }}
    >
      <CircleKHeader />

      {/* ─── Hero Banner (Inner Circle) ─────────────────────── */}
      <section className="relative w-full">
        <div className="relative aspect-[920/575] w-full md:aspect-[16/6]">
          <Image
            src={`${IMG}/inner_circle_header.jpg`}
            alt="Sign up and save with Inner Circle"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
              <h1
                className="max-w-lg font-extrabold uppercase text-white"
                style={{ fontSize: "clamp(28px, 4vw, 43.6px)", lineHeight: 1.1 }}
              >
                SIGN UP AND SAVE WITH INNER CIRCLE
              </h1>
              <p
                className="mt-4 max-w-md text-white/90"
                style={{ fontSize: 15, lineHeight: "24px" }}
              >
                Join Inner Circle for free and earn fuel rewards, food rewards
                and so much more.
              </p>
              <Link
                href={BASE}
                className="mt-6 inline-block rounded border-2 border-white px-8 py-2.5 text-sm font-bold uppercase text-white transition-colors hover:bg-white hover:text-[#141414]"
              >
                Learn more!
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Store Locator Search ───────────────────────────── */}
      <section className="w-full bg-[#101820] py-8">
        <div className="mx-auto max-w-[1200px] px-4">
          <h2
            className="mb-4 text-center font-extrabold text-white"
            style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
          >
            Find your nearest store
          </h2>
          <div className="mx-auto flex max-w-xl overflow-hidden rounded-sm">
            <input
              type="text"
              placeholder="Enter City, State or Zip Code"
              className="flex-1 bg-white px-4 py-3 text-sm text-[#141414] outline-none placeholder:text-gray-400"
              aria-label="Search for nearest store"
            />
            <button
              className="flex items-center gap-2 bg-[#DA291C] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b82217]"
              aria-label="Search"
            >
              <Search className="size-4" />
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ─── Top Product Tiles (3) ──────────────────────────── */}
      <section className="w-full py-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3">
          {TOP_TILES.map((tile) => (
            <ProductTile key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      {/* ─── "Circle K Everyday" Heading ────────────────────── */}
      <section className="w-full bg-[#101820] py-10">
        <div className="mx-auto max-w-[1200px] px-4 text-center">
          <h2
            className="font-extrabold text-white"
            style={{ fontSize: "clamp(28px, 4vw, 43.6px)", lineHeight: 1.15 }}
          >
            Circle K {"\u275D"}Everyday{"\u275E"}
          </h2>
          <p
            className="mt-3 text-white/80"
            style={{ fontSize: 15, lineHeight: "24px" }}
          >
            Check out all the great reasons today!
          </p>
        </div>
      </section>

      {/* ─── Bottom Product Tiles (3x2) ─────────────────────── */}
      <section className="w-full py-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3">
          {BOTTOM_TILES.map((tile) => (
            <ProductTile key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      {/* ─── "Who are we?" Tile ─────────────────────────────── */}
      <section className="w-full pb-10">
        <div className="mx-auto max-w-[1200px] px-4">
          <Link
            href={`${BASE}/history-and-timeline`}
            className="group relative block aspect-[3/1] w-full overflow-hidden rounded-sm"
          >
            <Image
              src={`${IMG}/circlek_tile_0.png`}
              alt="Who are we? Circle K history and timeline"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3
                className="text-2xl font-bold text-white md:text-3xl"
                style={{ fontFamily: "'ACT Easy', sans-serif" }}
              >
                Who are we?
              </h3>
              <span className="mt-2 inline-block border-b border-white pb-0.5 text-sm font-semibold text-white group-hover:text-white/80">
                more info
              </span>
            </div>
          </Link>
        </div>
      </section>

      <CircleKFooter />
    </div>
  );
}
