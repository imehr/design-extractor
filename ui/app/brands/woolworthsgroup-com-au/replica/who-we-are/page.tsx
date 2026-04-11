import Image from "next/image";
import Link from "next/link";
import { WWGHeader } from "@/components/brands/woolworths-group/wwg-header";
import { WWGFooter } from "@/components/brands/woolworths-group/wwg-footer";
import { Card, CardContent } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

export default function WhoWeArePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, color: "#202020" }}
    >
      <WWGHeader activePage="Who we are" />

      {/* Hero Banner */}
      <div className="relative w-full" style={{ height: 529 }}>
        <img src="/brands/woolworths-group/hero-store.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-[1200px] px-10 pb-10">
            <h2 className="text-white" style={{ fontFamily: 'TomatoGrotesk, sans-serif', fontSize: 64, fontWeight: 600, lineHeight: '80px' }}>
              Who we are
            </h2>
          </div>
        </div>
      </div>

      {/* Stats / Welcome Banner */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-10 text-center">
          <h3
            className="mb-6"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 36,
              lineHeight: "44px",
              fontWeight: 600,
              color: "#1971ED",
            }}
          >
            190,000+ team members across Australia and New Zealand
          </h3>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-[#202020]">
            As Australia&apos;s largest retailer, we depend on our teams across our
            stores, distribution centres and support offices to provide our
            customers with exceptional service, products and price. Our people are
            at the heart of our business and together, we are committed to
            ensuring Woolworths Group is a great place to work.
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-[1200px]" />

      {/* Our Approach Section */}
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
            Our Approach
          </h1>
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-[#202020]">
            Since 1924, Woolworths Group has worked hard to offer the best
            possible convenience, value, range and quality to the 24 million
            customers we serve each week across our growing network of
            businesses.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[280px]">
                <Image
                  src="/brands/woolworths-group/ocean-view.jpg"
                  alt="Ocean view"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-2"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Corporate Governance
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#202020]">
                  Good governance provides the framework to deliver on our
                  purpose and strategy for a better tomorrow.
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
              <div className="relative h-[280px]">
                <Image
                  src="/brands/woolworths-group/group-lady.jpg"
                  alt="Team member"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-2"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Our partners
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#202020]">
                  Working together with our partners to deliver great outcomes
                  for customers and communities.
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

      {/* Our Leadership Team Section */}
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
            Our Leadership Team
          </h1>
          <p className="mb-12 max-w-2xl text-base leading-relaxed text-[#202020]">
            Our Leadership Team brings together a wealth of experience across
            retail, technology, finance and sustainability to guide Woolworths
            Group into the future.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[240px]">
                <Image
                  src="/brands/woolworths-group/ocean-shot.jpg"
                  alt="Board of Directors"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-2"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Board of Directors
                </h4>
                <Link
                  href="#"
                  className="text-sm font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[240px]">
                <Image
                  src="/brands/woolworths-group/grass-sunrise.jpg"
                  alt="Board Committees"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-2"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Board Committees
                </h4>
                <Link
                  href="#"
                  className="text-sm font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-md">
              <div className="relative h-[240px]">
                <Image
                  src="/brands/woolworths-group/fitzroy-island.jpg"
                  alt="Group Executive Committee"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h4
                  className="mb-2"
                  style={{
                    fontFamily: "TomatoGrotesk, sans-serif",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#1971ED",
                  }}
                >
                  Group Executive Committee
                </h4>
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

      {/* Careers CTA */}
      <section className="bg-[#1971ED] py-20">
        <div className="mx-auto max-w-[1200px] px-10 text-center">
          <h2
            className="mb-6 text-white"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 36,
              lineHeight: "44px",
              fontWeight: 600,
            }}
          >
            Careers
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/90">
            We are Woolworths Group. 200,000+ bright minds, passionate hearts,
            and unique perspectives across Australia and New Zealand. Connected by
            a shared Purpose - &apos;to create better experiences together for a
            better tomorrow&apos;.
          </p>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-lg border border-[#1971ED] bg-white px-6 py-2 text-sm font-semibold text-[#1971ED] hover:bg-white/90 transition-colors"
          >
            Explore opportunities
          </Link>
        </div>
      </section>

      <WWGFooter />
    </div>
  );
}
