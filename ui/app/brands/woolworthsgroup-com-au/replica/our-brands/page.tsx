import Image from "next/image";
import Link from "next/link";
import { WWGHeader } from "@/components/brands/woolworths-group/wwg-header";
import { WWGFooter } from "@/components/brands/woolworths-group/wwg-footer";
import { Card, CardContent } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

const brandSections = [
  {
    name: "Woolworths Retail",
    description:
      "Our B2C retail food business, with fresh at the heart of how we deliver consistently good food, good prices, good acts and convenience.",
    brands: [
      { name: "Woolworths Supermarkets", logo: "woolworths-supermarkets.png" },
      { name: "Woolworths New Zealand", logo: "woolworths-nz.png" },
      { name: "Milkrun", logo: "milkrun.png" },
      { name: "Woolworths at Work", logo: "woolworths-at-work.png" },
    ],
  },
  {
    name: "Everyday",
    description:
      "We are helping our customers enjoy a little more choice, more value and more good through everyday categories and services.",
    brands: [
      { name: "Everyday Rewards", logo: "everyday-rewards.png" },
      { name: "Everyday Insurance", logo: "everyday-insurance.png" },
      { name: "Everyday Mobile", logo: "everyday-mobile.png" },
    ],
  },
  {
    name: "W Living",
    description:
      "Technology, digital and analytics enabled platforms delivering value for Woolworths Group and partners.",
    brands: [
      { name: "Big W", logo: "bigw.png" },
      { name: "healthylife", logo: "healthylife.png" },
      { name: "MyDeal", logo: "mydeal.png" },
      { name: "Petstock", logo: "petstock.png" },
    ],
  },
  {
    name: "Woolworths Food Company",
    description:
      "Supporting businesses, food service channels and wholesale markets with good food, good service and good value.",
    brands: [
      { name: "Australian Grocery Wholesalers", logo: "agw.png" },
      { name: "PFD Food Services", logo: "pfd-food-services.png" },
      { name: "NZ Grocery Wholesalers", logo: "nz-grocery-wholesalers.png" },
    ],
  },
  {
    name: "Retail Platforms",
    description:
      "Technology, digital and analytics enabled platforms delivering value for Woolworths Group and partners.",
    brands: [
      { name: "Primary Connect", logo: "primary-connect.png" },
      { name: "Cartology", logo: "cartology.png" },
      { name: "Quantium", logo: "quantium.png" },
      { name: "Wpay", logo: "wpay.png" },
    ],
  },
];

export default function OurBrandsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, color: "#202020" }}
    >
      <WWGHeader activePage="Who we are" />

      {/* Hero Banner */}
      <div className="relative w-full" style={{ height: 529 }}>
        <img src="/brands/woolworths-group/hero-brands.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-[1200px] px-10 pb-10">
            <p className="mb-2 text-sm font-medium text-white/80">About Us</p>
            <h2 className="text-white" style={{ fontFamily: 'TomatoGrotesk, sans-serif', fontSize: 64, fontWeight: 600, lineHeight: '80px' }}>
              Our Brands and Businesses
            </h2>
            <p className="mt-2 max-w-[600px] text-lg text-white/90">
              Meet some of Australia and New Zealand&apos;s most celebrated and
              trusted brands
            </p>
          </div>
        </div>
      </div>

      {/* Brand Sections */}
      {brandSections.map((section, sectionIndex) => (
        <div key={section.name}>
          <section className="py-20">
            <div className="mx-auto max-w-[1200px] px-10">
              <h1
                className="mb-4"
                style={{
                  fontFamily: "TomatoGrotesk, sans-serif",
                  fontSize: 48,
                  lineHeight: "56px",
                  fontWeight: 600,
                  color: "#1971ED",
                }}
              >
                {section.name}
              </h1>
              <p className="mb-12 max-w-2xl text-base leading-relaxed text-[#202020]">
                {section.description}
              </p>

              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {section.brands.map((brand) => (
                  <Card
                    key={brand.name}
                    className="group overflow-hidden border border-gray-100 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="relative mb-4 h-[120px] w-[120px]">
                        <Image
                          src={`/brands/woolworths-group/${brand.logo}`}
                          alt={`${brand.name} logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h4 className="mb-3 text-sm font-semibold text-[#202020]">
                        {brand.name}
                      </h4>
                      <Link
                        href="#"
                        className="text-sm font-semibold text-[#1971ED] hover:underline"
                      >
                        Learn more
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {sectionIndex < brandSections.length - 1 && (
            <Separator className="mx-auto max-w-[1200px]" />
          )}
        </div>
      ))}

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
            Join us to create a better tomorrow
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
