import Image from "next/image";
import Link from "next/link";
import { LuminaryHeader } from "@/components/brands/luminary-ai/luminary-ai-header";
import { LuminaryFooter } from "@/components/brands/luminary-ai/luminary-ai-footer";

const CATEGORIES = ["Blog", "Events", "Press", "Research", "Resources"];
const TOPICS = ["Defense", "Deployment", "Shift", "Automotive", "Use Cases"];

const FEATURED_ARTICLE = {
  date: "04.14.2026",
  title: "Luminary Launches SHIFT-Crash, the First Physics AI Model for Full-Vehicle Crash Prediction",
  tags: ["Luminary", "Press", "Shift", "Automotive"],
  image: "https://luminary.ai/_vercel/image?url=_astro%2Fshift-crash-still.D2jghZAQ.png&w=1200&q=100",
  href: "https://luminary.ai/resources/luminary-launches-shift-crash-first-physics-ai-model-for-full-vehicle-crash-prediction",
};

const RESOURCES = [
  {
    date: "05.20.2026",
    title: "Register: SHIFT-Crash - Accelerate Crashworthiness with Physics AI",
    tags: ["Luminary", "Events", "Shift", "Automotive"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2Fshift-crash-still.D2jghZAQ.png&w=1200&q=100",
    href: "https://events.luminary.ai/shift-crash-webinar",
  },
  {
    date: "05.19.2026",
    title: "SHIFT-Crash",
    tags: ["Resources", "Shift", "Automotive", "Use Cases"],
    image: null,
    href: "https://luminary.ai/briefs/shift-crash-one-pager.pdf",
  },
  {
    date: "05.05.2026",
    title: "Physics AI Use Cases for Defense",
    tags: ["Resources", "Defense", "Use Cases"],
    image: null,
    href: "https://luminary.ai/resources/defense-solutions-brief/",
  },
  {
    date: "04.14.2026",
    title: "SHIFT-Crash: Bringing Physics AI to Full-Vehicle Crashworthiness Prediction",
    tags: ["Riddhiman Raut", "Article", "Shift", "Automotive"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2F04-14-26.DgZSbiBU.png&w=1200&q=100",
    href: "https://luminary.ai/resources/shift-crash-bringing-physics-ai-to-full-vehicle-crashworthiness-prediction/",
  },
  {
    date: "04.07.2026",
    title: "SHIFT-Missile: Physics AI for Supersonic Missile Aerodynamics",
    tags: ["Andrew Hong", "Article"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2F04-07-26.t4GJcJTQ.png&w=1200&q=100",
    href: "https://luminary.ai/resources/shift-missile-physics-ai-for-supersonic-missile-aerodynamics/",
  },
  {
    date: "04.07.2026",
    title: "SHIFT-CCA Datasheet",
    tags: ["Resources", "Shift", "Defense"],
    image: null,
    href: "https://luminary.ai/SHIFT-CCA-datasheet_v2.pdf",
  },
  {
    date: "04.07.2026",
    title: "The Accelerating Pace of Physics AI Modeling and What It Means for the Aerospace Industry",
    tags: [],
    image: "https://luminary.ai/_vercel/image?url=_astro%2F04-06-26.HRfRvNHk.png&w=1200&q=100",
    href: "https://aiaa.org/events/aerospace-perspectives-series-the-accelerating-pace-of-physics-ai-modeling-and-what-it-means-for-the-aerospace-industry/",
  },
  {
    date: "04.01.2026",
    title: "SHIFT-Cow: The World's First Physics AI Model for Cow Aerodynamics",
    tags: ["Ben Gao", "Article"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2Fshift-cow-thumbnail.B38OGVGa.png&w=3840&q=100",
    href: "https://luminary.ai/resources/shift-cow-the-worlds-first-physics-ai-model-for-cow-aerodynamics/",
  },
  {
    date: "03.24.2026",
    title: "Jeff Bezos plans to invest $100 billion to bring AI to factories. Here's what it means for jobs",
    tags: [],
    image: null,
    href: "https://www.latimes.com/business/story/2026-03-24/why-is-jeff-bezos-raising-100-billion-to-bring-ai-to-factories-heres-what-to-know",
  },
  {
    date: "03.24.2026",
    title: "Watch On-Demand: AI-Driven Performance Optimization for Centrifugal Pumps",
    tags: ["Luminary", "Events"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2Fresourceimage-webinar-physicsai_pump-6DQgvAnCgPTWIgg12dhLV3.BPl3uTut.png&w=1200&q=100",
    href: "https://events.luminary.ai/ai-driven-performance-optimization-for-centrifugal-pumps",
  },
  {
    date: "03.24.2026",
    title: "SHIFT-Pump Datasheet",
    tags: ["Resources", "Shift"],
    image: null,
    href: "https://assets.ctfassets.net/xjbsmfqm41id/5WjdHvxmbYhkpiMe9SOeO0/dbc7a573da3de82b18e069a02f44dfaa/SHIFT-Pump-datasheet.pdf",
  },
  {
    date: "03.24.2026",
    title: "SHIFT-Pump: Physics AI for Rapid Pump Performance Prediction Across Operating Envelopes",
    tags: [],
    image: "https://luminary.ai/_vercel/image?url=_astro%2F03-23-26.Bn6mA_4M.png&w=1200&q=100",
    href: "https://luminary.ai/resources/shift-pump-physics-ai-for-rapid-pump-performance-prediction-across-operating-envelopes/",
  },
  {
    date: "03.16.2026",
    title: "Luminary Adopts NVIDIA GeoTransolver AI Model Architecture, Unlocking Up to 10x Greater Accuracy in Physics AI",
    tags: [],
    image: null,
    href: "https://luminary.ai/resources/luminary-adopts-nvidia-geotransolver-ai-model-architecture-unlocking-up-to-10x-greater-accuracy-in-physics-ai/",
  },
  {
    date: "02.24.2026",
    title: "Luminary Introduces Luminary Private Cloud to Bring Physics AI Into Secure, Air-Gapped Defense and Aerospace Environments",
    tags: [],
    image: "https://luminary.ai/_vercel/image?url=_astro%2Fresourceimage-purplewhitesphere-5uLLOakSYbxL62mirnSlB7.DYw2fzKd.webp&w=1200&q=100",
    href: "https://luminary.ai/resources/luminary-introduces-luminary-private-cloud-to-bring-physics-ai-into-secure-air-gapped-defense-and-aerospace-environments/",
  },
  {
    date: "02.19.2026",
    title: "Watch On-Demand: AI Model Driven Optimization for Underwater Vehicles",
    tags: ["Luminary", "Events"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2Fresourceimage-webinar-physicsai-1-1qVyh3vycKpA3NtLNGaiWH.3vsjTCYE.png&w=1200&q=100",
    href: "https://events.luminarycloud.com/ai-model-driven-optimization-for-underwater-vehicles",
  },
  {
    date: "02.10.2026",
    title: "SHIFT-Submarine: Physics AI-driven Submarine Design",
    tags: ["Joseph Warner", "Article", "Shift"],
    image: "https://luminary.ai/_vercel/image?url=_astro%2F02-09-26.PwqGV2cS.png&w=1200&q=100",
    href: "https://luminary.ai/resources/shift-submarine-physics-ai-driven-submarine-design/",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfa] text-[#2a2c2f]" style={{ fontFamily: '"Inter", "GT Standard", system-ui, sans-serif' }}>
      <LuminaryHeader />

      {/* Hero */}
      <section className="relative -mx-[calc((100vw-100%)/2)] w-screen overflow-hidden" style={{ height: 282 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da]">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(100, 149, 237, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(138, 43, 226, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(65, 105, 225, 0.3) 0%, transparent 50%)",
            }}
          />
        </div>
      </section>

      {/* Hero Text */}
      <section className="px-4 pt-8 md:px-8 md:pt-12 xl:px-16">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ fontFamily: '"Inter", "GT Standard", system-ui, sans-serif' }}>
            Resources
          </h1>
          <p className="mt-4 max-w-[700px] text-lg font-normal leading-relaxed text-[#2a2c2f] md:text-xl">
            The latest news, press releases, blogs, and demos from Luminary.
          </p>
        </div>
      </section>

      {/* Categories, Topics, Featured Article, Resources Grid */}
      <section className="px-4 pt-12 md:px-8 md:pt-16 xl:px-16">
        <div className="mx-auto max-w-[1440px]">
          {/* Categories */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-normal leading-tight text-[#2a2c2f]">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className="rounded-full border border-[#e0e0e0] bg-white px-4 py-2 text-sm font-medium text-[#2a2c2f] transition-all hover:border-[#be95ff] hover:text-[#be95ff]"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Explore by Topic */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-normal leading-tight text-[#2a2c2f]">Explore by Topic</h2>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  className="rounded-full border border-[#e0e0e0] bg-white px-4 py-2 text-sm font-medium text-[#2a2c2f] transition-all hover:border-[#be95ff] hover:text-[#be95ff]"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Article */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-normal leading-tight text-[#2a2c2f]">Featured Article</h2>
            <Link
              href={FEATURED_ARTICLE.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-6 overflow-hidden rounded-sm border border-[#e0e0e0] bg-white md:flex-row"
            >
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden md:aspect-auto md:w-[55%]" style={{ minHeight: 320 }}>
                <Image
                  src={FEATURED_ARTICLE.image}
                  alt={FEATURED_ARTICLE.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center p-6 md:p-10">
                <span className="mb-3 text-sm font-medium text-[#697077]">{FEATURED_ARTICLE.date}</span>
                <h3 className="text-xl font-medium leading-snug text-[#2a2c2f] md:text-2xl lg:text-3xl">
                  {FEATURED_ARTICLE.title}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {FEATURED_ARTICLE.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-medium text-[#697077]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-[#2a2c2f] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#be95ff]">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-sm border border-[#e0e0e0] bg-white transition-all duration-150 hover:shadow-sm"
              >
                {item.image ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f0f0f0]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da]">
                    <span className="text-4xl font-light text-[#2a2c2f]/20">→</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2 text-sm font-medium text-[#697077]">{item.date}</span>
                  <h3 className="text-base font-medium leading-snug text-[#2a2c2f] md:text-lg">
                    {item.title}
                  </h3>
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#f0f0f0] px-2.5 py-0.5 text-xs text-[#697077]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe to our newsletter */}
      <section className="px-4 pb-16 pt-16 md:px-8 md:pb-16 md:pt-20 lg:pb-24 lg:pt-24 xl:px-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="xl:grid xl:grid-cols-[1fr_5fr] xl:gap-x-16">
            <div className="mb-6 xl:mb-0">
              <h2 className="text-2xl font-normal leading-tight md:text-3xl lg:text-4xl">
                Subscribe to our newsletter.
              </h2>
            </div>
            <div className="xl:col-start-2">
              <p className="mb-6 text-base text-[#697077]">
                Subscribe to our newsletter and stay up to date on the latest news.
              </p>
              <form className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-full border border-[#e0e0e0] bg-white px-5 py-3 text-sm text-[#2a2c2f] placeholder:text-[#697077] focus:border-[#be95ff] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[#2a2c2f] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#be95ff] hover:text-[#2a2c2f] active:scale-[0.97]"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <LuminaryFooter />
    </div>
  );
}
