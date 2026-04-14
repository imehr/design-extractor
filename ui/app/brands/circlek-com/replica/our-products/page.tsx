import Image from "next/image";
import Link from "next/link";
import { CircleKHeader } from "@/components/brands/circlek-com/circlek-com-header";
import { CircleKFooter } from "@/components/brands/circlek-com/circlek-com-footer";

const IMG = "/brands/circlek-com";
const BASE = "/brands/circlek-com/replica";

/* ── Product section data ─────────────────────────────────── */

const PRODUCT_SECTIONS = [
  {
    title: "America's Thirst Stop",
    image: `${IMG}/ats-website-image-_500x500_1.jpg`,
    alt: "America's Thirst Stop",
    description: "",
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "FRESH FOOD, FAST.",
    image: `${IMG}/fresh-food_fast_1ju.jpg`,
    alt: "Fresh Food Fast",
    description:
      "We're the hot spot for tasty snacks and meals on the move. From hot dogs and hand-held foods, to sandwiches and other healthy options, we've got your hunger covered.",
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "Easy Pay",
    image: `${IMG}/easypay_tile.jpg`,
    alt: "EasyPay",
    description:
      "Easy to Save, Easy to Pay, Every Day, on Every Gallon! Link your Circle K Easy Pay debit card to your checking account for the most secure, convenient way to get-in, gas-up & get on with your day. That's easy-service!",
    cta: "Read more",
    href: `${BASE}`,
  },
  {
    title: "Fleet Card",
    image: `${IMG}/fleet-card-tile.png`,
    alt: "fleet card",
    description:
      "The Circle K Fleet Card program offers competitive fuel pricing, detailed reporting and flexible controls to help manage your fleet expenses efficiently.",
    cta: "More info",
    href: `${BASE}`,
  },
  {
    title: "QUALITY GUARANTEED",
    image: `${IMG}/385_x_385px_fuel_quality_guaranteed_landing_page_1_1.jpg`,
    alt: "QUALITY GUARANTEED",
    description:
      "We stand behind the quality of our fuel. Circle K fuel meets or exceeds the highest industry standards, so you can fill up with confidence every time.",
    cta: "More info",
    href: `${BASE}`,
  },
];

/* ── Page ──────────────────────────────────────────────────── */

export default function OurProductsPage() {
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
      <CircleKHeader activePage="Our products" />

      {/* ─── Hero Banner ──────────────────────────────────────── */}
      <section className="relative w-full">
        <div className="relative w-full" style={{ aspectRatio: "1440 / 565" }}>
          <Image
            src={`${IMG}/optimized_ourproducts-header-image.jpg`}
            alt="Interior of a store location"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="font-extrabold text-white"
              style={{ fontSize: "clamp(28px, 4vw, 43.6px)", lineHeight: 1.1 }}
            >
              Our Products
            </h1>
          </div>
        </div>
      </section>

      {/* ─── Intro Text ───────────────────────────────────────── */}
      <section className="w-full py-12">
        <div className="mx-auto max-w-[800px] px-4 text-center">
          <p className="mb-6" style={{ fontSize: 15, lineHeight: "24px", color: "#141414" }}>
            We carry beverages fit for energizing, satisfying, warming up, cooling down or just
            plain quenching your thirst.
          </p>
          <p style={{ fontSize: 15, lineHeight: "24px", color: "#141414" }}>
            We&apos;ve got your food solutions, too - whether it&apos;s for on-the-go, at work or
            anywhere in-between... treat time, lunch time, anytime! We&apos;ll supply the everyday
            necessities for your fridge, your family, your first aid kit or your traveling tool box.
            Fuel up, oil up and tidy up your car. One stop at Circle K and you&apos;re ready to take
            on your day. No matter why you&apos;re stopping or who you&apos;re with, just come as
            you are... we&apos;ll be here ready and waiting for you!
          </p>
        </div>
      </section>

      {/* ─── Product Sections ─────────────────────────────────── */}
      <section className="w-full pb-16">
        <div className="mx-auto max-w-[1200px] px-4">
          {PRODUCT_SECTIONS.map((product, index) => {
            const isEven = index % 2 === 1;
            return (
              <div
                key={product.title}
                className={`flex flex-col overflow-hidden md:flex-row ${
                  isEven ? "md:flex-row-reverse" : ""
                } ${index > 0 ? "mt-8" : ""}`}
              >
                {/* Image */}
                <div className="relative aspect-square w-full md:w-1/2">
                  <Image
                    src={product.image}
                    alt={product.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Text content */}
                <div className="flex w-full flex-col justify-center bg-[#101820] p-8 md:w-1/2 md:p-12">
                  <h3
                    className="font-bold text-white"
                    style={{
                      fontSize: "clamp(24px, 3vw, 36px)",
                      lineHeight: 1.2,
                      fontWeight: 700,
                    }}
                  >
                    {product.title}
                  </h3>
                  {product.description && (
                    <p
                      className="mt-4 text-white/80"
                      style={{ fontSize: 15, lineHeight: "24px" }}
                    >
                      {product.description}
                    </p>
                  )}
                  <div className="mt-6">
                    <Link
                      href={product.href}
                      className="text-sm font-semibold text-[#DA291C] hover:underline"
                    >
                      {product.cta}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CircleKFooter />
    </div>
  );
}
