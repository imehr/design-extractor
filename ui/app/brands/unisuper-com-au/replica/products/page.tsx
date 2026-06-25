import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UniSuperHeader } from "@/components/brands/unisuper-com-au/unisuper-com-au-header";
import { UniSuperFooter } from "@/components/brands/unisuper-com-au/unisuper-com-au-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT = "Tiempos, Georgia, Times, serif";
const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

const PRODUCTS = [
  {
    title: "Personal account",
    body:
      "If you’re thinking about joining us independently of your employer, you’ll be offered a Personal Account. A superannuation product anyone living in Australia and over the age of 15 can join.",
    image:
      "/brands/unisuper-com-au/us21-0040_julypdsroll_websiteimages_productcard_640x336.png",
    ctaText: "More about Personal Accounts",
    href: "#",
  },
  {
    title: "Accumulation 1",
    body: "You work within the higher education and research sector.",
    image:
      "/brands/unisuper-com-au/us21-0204_pwi_feesandproducts_ac1_640x336px.png",
    ctaText: "More about Accumulation 1",
    href: "#",
  },
  {
    title: "Accumulation 2",
    body: "You transferred from the Defined Benefit Division.",
    image:
      "/brands/unisuper-com-au/us21-0204_pwi_feesandproducts_ac2_640x336px.png",
    ctaText: "More about Accumulation 2",
    href: "#",
  },
  {
    title: "Defined Benefit Division",
    body:
      "A hybrid product that combines the security of a defined benefit with the flexibility of an accumulation component.",
    image:
      "/brands/unisuper-com-au/us21-0204_pwi_feesandproducts_dbd_640x336px.png",
    ctaText: "More about Defined Benefit Division",
    href: "#",
  },
];

export default function UniSuperProducts() {
  return (
    <div
      className="min-h-screen w-full bg-white text-[#112C5C]"
      style={{ fontFamily: BODY_FONT }}
    >
      <UniSuperHeader />

      {/* ================= HERO ================= */}
      <section
        className="relative overflow-hidden bg-[#112C5C]"
        style={{
          backgroundImage: "url(/brands/unisuper-com-au/heading.svg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "auto 120%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#112C5C] via-[#112C5C]/95 to-[#112C5C]/40" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:py-32">
          <nav
            className="mb-6 flex items-center gap-2 text-[13px] text-white/80"
            aria-label="Breadcrumb"
          >
            <Link
              href="/brands/unisuper-com-au/replica"
              className="hover:text-white"
            >
              Home
            </Link>
            <span className="opacity-60">/</span>
            <Link href="#" className="hover:text-white">
              Super
            </Link>
            <span className="opacity-60">/</span>
            <span>Products</span>
          </nav>
          <h1
            className="mb-6 max-w-3xl text-[44px] leading-[52px] font-semibold text-white md:text-[56px] md:leading-[64px]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Our super products
          </h1>
          <p className="max-w-2xl text-[17px] leading-[26px] text-white/90">
            We have a range of super products to suit your needs with
            competitive fees. Learn more about what your fees may look like
            and compare UniSuper products.
          </p>
        </div>
      </section>

      {/* ================= A PRODUCT FOR EVERY MEMBER ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-12 max-w-3xl">
            <h2
              className="mb-5 text-[32px] leading-[40px] font-normal text-[#112C5C]"
              style={{ fontFamily: HEADING_FONT }}
            >
              A product for every member
            </h2>
            <p className="text-[17px] leading-[26px] text-[#515151]">
              The way you join UniSuper will determine which product
              you&rsquo;re in. To find out, you can log in or create an online
              account.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {PRODUCTS.map((p) => (
              <Card
                key={p.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 shadow-none transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${p.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex flex-1 flex-col p-8">
                  <h3
                    className="mb-4 text-[26px] leading-[34px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    {p.title}
                  </h3>
                  <p className="mb-6 flex-1 text-[15px] leading-[24px] text-[#515151]">
                    {p.body}
                  </p>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                  >
                    {p.ctaText}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHAT YOUR FEES MIGHT LOOK LIKE ================= */}
      <section
        className="relative overflow-hidden py-20 text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #0E71F2 0%, #22828F 100%), url(/brands/unisuper-com-au/light-blue-banner.svg)",
          backgroundBlendMode: "normal",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.5fr_1fr]">
            <div>
              <h2
                className="mb-5 text-[32px] leading-[40px] font-normal text-white"
                style={{ fontFamily: HEADING_FONT }}
              >
                What your fees might look like
              </h2>
              <p className="mb-8 text-[16px] leading-[26px] text-white/90">
                Our fees are among the lowest in the industry across a range
                of options and balances. See a breakdown of the administration,
                investment and transaction fees for each UniSuper product.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-white/90"
              >
                Fees and costs
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
              <div className="mb-4 text-[14px] font-semibold uppercase tracking-wider text-white/70">
                Example balance
              </div>
              <div className="mb-6 flex items-baseline gap-2">
                <span
                  className="text-[56px] leading-none font-normal text-white"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  $50,000
                </span>
              </div>
              <div className="space-y-3 border-t border-white/20 pt-4">
                <div className="flex justify-between text-[15px]">
                  <span className="text-white/80">Admin fee (p.a.)</span>
                  <span className="font-semibold">$96</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-white/80">Investment fee (p.a.)</span>
                  <span className="font-semibold">~$235</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-3 text-[15px]">
                  <span className="font-semibold">Estimated total</span>
                  <span className="font-semibold">$331</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WE CAN HELP YOU DECIDE ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <Card
            className="overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm md:grid md:grid-cols-[1fr_1.2fr]"
          >
            <div
              className="aspect-[4/3] w-full md:aspect-auto"
              style={{
                backgroundImage:
                  "url(/brands/unisuper-com-au/promo-card-chat-to-adviser.svg)",
                backgroundColor: "#EAF3FF",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="flex flex-col justify-center p-10 md:p-14">
              <h3
                className="mb-4 text-[28px] leading-[36px] font-normal text-[#112C5C]"
                style={{ fontFamily: HEADING_FONT }}
              >
                We can help you decide
              </h3>
              <p className="mb-6 text-[16px] leading-[24px] text-[#515151]">
                Not sure which UniSuper product is right for you? Chat to one
                of our advisers about your options — at no extra cost if
                you&rsquo;re a UniSuper member.
              </p>
              <div>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0E71F2] px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0a5dc9]"
                >
                  Chat to an adviser
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================= READY TO JOIN CTA ================= */}
      <section className="bg-gradient-to-r from-[#0E71F2] to-[#22828F] py-16 text-white">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <h2
                className="text-[28px] leading-[36px] font-normal text-white md:text-[32px] md:leading-[40px]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Ready to join UniSuper?
              </h2>
            </div>
            <div className="flex justify-start md:justify-end">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-white/90"
              >
                Join now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <UniSuperFooter />
    </div>
  );
}
