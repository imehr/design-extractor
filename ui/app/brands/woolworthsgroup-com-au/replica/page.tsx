import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { WWGHeader } from "@/components/brands/woolworths-group/wwg-header";
import { WWGFooter } from "@/components/brands/woolworths-group/wwg-footer";

export default function WoolworthsGroupHomepage() {
  return (
    <div className="min-h-screen w-full bg-white" style={{ fontFamily: "Montserrat, sans-serif" }}>
      {/* Header */}
      <WWGHeader activePage="Home" />

      {/* Hero Section */}
      <div className="relative w-full" style={{ height: 529 }}>
        <img src="/brands/woolworths-group/hero-staff.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-white" style={{ fontFamily: 'TomatoGrotesk, sans-serif', fontSize: 64, fontWeight: 600, lineHeight: '80px' }}>
            Woolworths Group
          </h2>
        </div>
      </div>

      {/* Latest News Section */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-10 text-center text-[48px] font-semibold leading-[56px] text-[#1971ED]"
            style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
          >
            Latest news
          </h1>

          {/* News Grid: large featured left, 3 small cards stacked right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Featured article (large left) */}
            <Card className="overflow-hidden rounded-none border-0 bg-white shadow-none ring-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src="/brands/woolworths-group/news-pantry-staples.png"
                  alt="New pantry staples"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="px-0 pt-4">
                <Link href="#" className="group">
                  <h3
                    className="text-lg font-bold leading-6 text-[#1971ED] group-hover:underline"
                    style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                  >
                    Woolworths shakes up home cooking with 70 new globally inspired pantry staples
                  </h3>
                </Link>
                <p className="mt-2 text-sm leading-6 text-[#202020]">
                  Woolworths is bringing more of the global flavours Aussies love directly to the
                  dinner table by expanding its exclusive range of pantry staples.
                </p>
              </CardContent>
            </Card>

            {/* Right column: 3 small cards stacked */}
            <div className="flex flex-col gap-6">
              {/* Card 1 */}
              <Card className="flex flex-row overflow-hidden rounded-none border-0 bg-white shadow-none ring-0">
                <div className="relative h-[120px] w-[200px] shrink-0 overflow-hidden">
                  <Image
                    src="/brands/woolworths-group/news-estore.jpg"
                    alt="St Marys eStore"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="flex flex-col justify-center px-4 py-0">
                  <Link href="#" className="group">
                    <h3
                      className="text-sm font-bold leading-5 text-[#1971ED] group-hover:underline"
                      style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                    >
                      Woolworths launches NSW&apos;s largest &apos;eStore&apos; in St Marys - serving up to
                      6,000 weekly orders for Western Sydney
                    </h3>
                  </Link>
                  <Link
                    href="#"
                    className="mt-2 text-xs font-semibold text-[#1971ED] hover:underline"
                  >
                    Learn more
                  </Link>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card className="flex flex-row overflow-hidden rounded-none border-0 bg-white shadow-none ring-0">
                <div className="relative h-[120px] w-[200px] shrink-0 overflow-hidden">
                  <Image
                    src="/brands/woolworths-group/news-baker-year.jpg"
                    alt="Baker of the Year"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="flex flex-col justify-center px-4 py-0">
                  <Link href="#" className="group">
                    <h3
                      className="text-sm font-bold leading-5 text-[#1971ED] group-hover:underline"
                      style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                    >
                      Top bakers battle for glory at Woolworths Baker of the Year 2026
                    </h3>
                  </Link>
                  <Link
                    href="#"
                    className="mt-2 text-xs font-semibold text-[#1971ED] hover:underline"
                  >
                    Learn more
                  </Link>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card className="flex flex-row overflow-hidden rounded-none border-0 bg-white shadow-none ring-0">
                <div className="relative h-[120px] w-[200px] shrink-0 overflow-hidden">
                  <Image
                    src="/brands/woolworths-group/news-mini-woolies.jpg"
                    alt="Mini Woolies TAFE Casino"
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="flex flex-col justify-center px-4 py-0">
                  <Link href="#" className="group">
                    <h3
                      className="text-sm font-bold leading-5 text-[#1971ED] group-hover:underline"
                      style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                    >
                      New Mini Woolies set to help Northern Rivers&apos; students get equipped with
                      job-ready skills
                    </h3>
                  </Link>
                  <Link
                    href="#"
                    className="mt-2 text-xs font-semibold text-[#1971ED] hover:underline"
                  >
                    Learn more
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Stories Section */}
      <section className="w-full bg-[#F6F9FC] py-16">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-10 text-center text-[48px] font-semibold leading-[56px] text-[#1971ED]"
            style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
          >
            Our stories
          </h1>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Story 1 */}
            <Card className="overflow-hidden rounded-none border-0 bg-white shadow-sm ring-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/brands/woolworths-group/story-food-forum.jpg"
                  alt="The Australians Global Food Forum 2026"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <Link href="#" className="group">
                  <h3
                    className="text-base font-bold leading-6 text-[#1971ED] group-hover:underline"
                    style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                  >
                    Fresh food depends on innovation and resilient supply
                  </h3>
                </Link>
                <Link
                  href="#"
                  className="mt-3 inline-block text-xs font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>

            {/* Story 2 */}
            <Card className="overflow-hidden rounded-none border-0 bg-white shadow-sm ring-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/brands/woolworths-group/story-sustainability-plan.jpg"
                  alt="Woolworths Group Sustainability Plan"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <Link href="#" className="group">
                  <h3
                    className="text-base font-bold leading-6 text-[#1971ED] group-hover:underline"
                    style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                  >
                    Woolworths Group&apos;s New Sustainability Plan
                  </h3>
                </Link>
                <Link
                  href="#"
                  className="mt-3 inline-block text-xs font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>

            {/* Story 3 */}
            <Card className="overflow-hidden rounded-none border-0 bg-white shadow-sm ring-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src="/brands/woolworths-group/story-renewable-electricity.jpg"
                  alt="Woolworths Renewable Electricity"
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <Link href="#" className="group">
                  <h3
                    className="text-base font-bold leading-6 text-[#1971ED] group-hover:underline"
                    style={{ fontFamily: "TomatoGrotesk, sans-serif" }}
                  >
                    How Woolworths Group reached 100% renewable electricity
                  </h3>
                </Link>
                <Link
                  href="#"
                  className="mt-3 inline-block text-xs font-semibold text-[#1971ED] hover:underline"
                >
                  Learn more
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <WWGFooter />
    </div>
  );
}
