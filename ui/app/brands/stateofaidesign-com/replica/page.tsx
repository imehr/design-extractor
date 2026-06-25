import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Plus } from "lucide-react";
import { StateofaidesignHeader } from "@/components/brands/stateofaidesign-com/stateofaidesign-com-header";
import { StateofaidesignFooter } from "@/components/brands/stateofaidesign-com/stateofaidesign-com-footer";

const SERIF = '"Georgia", "Times New Roman", "Palatino", serif';
const MONO = 'var(--font-geist-mono), "Fragment Mono", monospace';

const PARTNERS = [
  { name: "Notion" },
  { name: "Sierra" },
  { name: "Framer" },
  { name: "Linear" },
  { name: "Anthropic" },
  { name: "Shopify" },
  { name: "Stripe" },
];

const TOOLS_TOPICS = [
  "The most-used AI design tools",
  "How the average tool stack has more than doubled",
  "What makes tools stick (and why many still don't)",
  "Designers as builders of their own tools",
  "Tool fatigue and the pressure to always be learning",
];

const CRAFT_TOPICS = [
  "Coding as a core design skill",
  "Prototyping as a default output",
  "The tension between speed and quality",
  "Preserving judgment, taste, and skill development",
  "The confidence that comes from being a builder",
];

const TEAMS_TOPICS = [
  "How companies support AI adoption",
  "Role blur between design, PM, and engineering",
  "The messy nature of collaboration",
  "Changing expectations and company policy",
  "What hiring managers are now looking for",
];

const CASE_STUDIES = [
  {
    company: "Stripe",
    title: "Creating the conditions for adoption",
    portrait: "/brands/stateofaidesign-com/stripe-portrait.jpg",
  },
  {
    company: "Sierra",
    title: "Scaling craft, keeping the bar",
    portrait: "/brands/stateofaidesign-com/sierra-portrait.png",
  },
  {
    company: "Anthropic",
    title: "When code is no longer the constraint",
    portrait: "/brands/stateofaidesign-com/anthropic-portrait.png",
  },
  {
    company: "Framer",
    title: "Growing as a designer",
    portrait: "/brands/stateofaidesign-com/framer-portrait.png",
  },
  {
    company: "Linear",
    title: "Working alongside agents",
    portrait: "/brands/stateofaidesign-com/linear-portrait.png",
  },
  {
    company: "Notion",
    title: "Protecting the space to explore",
    portrait: "/brands/stateofaidesign-com/notion-portrait.jpg",
  },
  {
    company: "Shopify",
    title: "Designing the design tools",
    portrait: "/brands/stateofaidesign-com/shopify-portrait.jpg",
  },
];

export default function StateofaidesignHomePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <StateofaidesignHeader />

      {/* Hero */}
      <section data-component="hero" className="relative">
        {/* Hero video */}
        <div className="relative h-[300px] w-full overflow-hidden sm:h-[400px] md:h-[500px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/brands/stateofaidesign-com/hero-poster.jpg"
            className="h-full w-full object-cover"
          >
            <source
              src="/brands/stateofaidesign-com/brand-kit/11fQjZ8SBLFtf9GDiGqEbzqKI8.webm"
              type="video/webm"
            />
          </video>
        </div>

        {/* Hero text area */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <p
              className="max-w-xs text-lg leading-snug tracking-tight"
              style={{ fontFamily: SERIF }}
            >
              How designers are evolving their tools, craft, and teams with AI
            </p>
            <h1
              className="text-right text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ fontFamily: SERIF }}
            >
              AI in Design
              <br />
              Report 2026
            </h1>
          </div>

          {/* Bottom row */}
          <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-4">
            <p
              className="max-w-[200px] text-[10px] uppercase leading-relaxed tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              By Designer Fund in partnership with Foundation Capital
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Scroll to read</span>
              <ChevronDown className="size-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="border-t border-black/10 px-4 py-8">
        <p
          className="mb-6 text-[10px] uppercase tracking-wider text-black/50"
          style={{ fontFamily: MONO }}
        >
          Our partners
        </p>
        <div className="flex flex-wrap items-center gap-6 md:gap-10">
          {PARTNERS.map((p) => (
            <span
              key={p.name}
              className="text-sm font-medium text-black/70"
              style={{ fontFamily: SERIF }}
            >
              {p.name}
            </span>
          ))}
        </div>
      </section>

      {/* Inflection Point + Stats */}
      <section className="border-t border-black/10 px-4 py-12">
        <p
          className="mb-8 text-xs uppercase tracking-wider text-black/50"
          style={{ fontFamily: MONO }}
        >
          An Inflection Point
        </p>
        <h2
          className="mb-12 max-w-2xl text-2xl leading-snug sm:text-3xl md:text-4xl"
          style={{ fontFamily: SERIF }}
        >
          In 2025, designers were experimenting with AI. In 2026, they&apos;re
          rebuilding around it.
        </h2>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p
              className="mb-2 text-6xl leading-none tracking-tight md:text-7xl"
              style={{ fontFamily: SERIF }}
            >
              900+
            </p>
            <p className="text-lg" style={{ fontFamily: SERIF }}>
              Designers surveyed in 60+ countries.
            </p>
          </div>
          <div>
            <p
              className="mb-2 text-6xl leading-none tracking-tight md:text-7xl"
              style={{ fontFamily: SERIF }}
            >
              25+
            </p>
            <p className="text-lg" style={{ fontFamily: SERIF }}>
              Interviews with practitioners and leaders
            </p>
          </div>
        </div>
      </section>

      {/* About section */}
      <section data-component="content" className="border-t border-black/10 px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-black/80">
              AI in Design 2026 aims to capture how AI is transforming tech
              design across designers&apos; desks and within their teams.
            </p>
            <p className="text-base leading-relaxed text-black/80">
              We ran our first AI in Design survey in early 2025 because we
              consistently heard designers and leaders ask, &quot;How are others
              doing this, and what&apos;s working?&quot; A year later, we&apos;re
              attempting to get a sense for what&apos;s changed and share firsthand
              perspectives. The answers come from over 900 designers at startups,
              enterprises, and agencies who work across disciplines like product
              design, brand design, research, and design engineering. We also
              conducted over 20 interviews with leaders at companies actively
              navigating this shift.
            </p>
            <p className="text-base leading-relaxed text-black/80">
              Given how quickly practices are evolving, we&apos;ll continue to release
              new findings throughout the year, including case studies about
              design at companies like Anthropic, Sierra, Stripe, Notion,
              Shopify, Linear, and Framer.{" "}
              <Link href="#" className="underline underline-offset-2">
                Sign up for new releases
              </Link>
              .
            </p>

            {/* Katie Dill quote */}
            <div className="flex items-start gap-4 pt-4">
              <img
                src="/brands/stateofaidesign-com/ILvJ4Wz4i6yJ8F12oB7DbSiYhI.png"
                alt="Katie Dill"
                className="size-16 rounded-full object-cover"
              />
              <div>
                <p
                  className="mb-1 text-lg leading-snug"
                  style={{ fontFamily: SERIF }}
                >
                  &quot;AI is sparking a creative renaissance in design. With new
                  instruments, it&apos;s our chance to compose wholly new music.&quot;
                </p>
                <p className="text-sm text-black/60">Katie Dill</p>
                <p
                  className="text-[10px] uppercase tracking-wider text-black/50"
                  style={{ fontFamily: MONO }}
                >
                  Head of Design, Stripe
                </p>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg lg:aspect-auto lg:h-full">
            <Image
              src="/brands/stateofaidesign-com/ytblsBi2O0C6jtd1PYCTXAczI.jpg"
              alt="AI in Design"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Large Quote */}
      <section className="border-t border-black/10 px-4 py-16">
        <blockquote
          className="mx-auto max-w-4xl text-2xl leading-snug sm:text-3xl md:text-4xl"
          style={{ fontFamily: SERIF }}
        >
          AI is sparking a creative renaissance in design. With new instruments,
          it&apos;s our chance to compose wholly new music.
        </blockquote>
      </section>

      {/* Chapter: Tools */}
      <section
        data-component="card"
        className="relative overflow-hidden bg-[#FF7A5C] px-4 py-12 text-black"
      >
        <div className="relative z-10 grid gap-8 lg:grid-cols-2">
          <div>
            <p
              className="mb-4 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              01 Tools
            </p>
            <h2
              className="mb-4 text-3xl leading-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: SERIF }}
            >
              The great toolstack shakeup
            </h2>
            <p className="mb-6 text-base leading-relaxed text-black/80">
              AI usage has surged, but the toolstack is still in flux. Designers
              are using double the number of off-the-shelf tools than they did in
              2025, and they&apos;re building custom software with AI that matches
              how they like to work. As everyone rushes to keep up with new
              releases, reliable output quality remains the largest area for
              improvement.
            </p>
            <p
              className="mb-3 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              In this chapter, we&apos;ll cover:
            </p>
            <ul className="mb-8 space-y-2">
              {TOOLS_TOPICS.map((t) => (
                <li
                  key={t}
                  className="border-b border-black/10 pb-2 text-sm"
                  style={{ fontFamily: MONO }}
                >
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/brands/stateofaidesign-com/replica/tools"
              data-component="button-set"
              className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Read the Tools Chapter
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative hidden lg:block">
            <Image
              src="/brands/stateofaidesign-com/JfBfu6oet0RpU7SEBWFp99yBFs.png"
              alt="Tools chapter"
              width={600}
              height={400}
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Chapter: Craft */}
      <section
        data-component="card"
        className="relative overflow-hidden bg-[#C4B5FD] px-4 py-12 text-black"
      >
        <div className="relative z-10 grid gap-8 lg:grid-cols-2">
          <div>
            <p
              className="mb-4 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              02 Craft
            </p>
            <h2
              className="mb-4 text-3xl leading-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: SERIF }}
            >
              Craft in the age of infinite output
            </h2>
            <p className="mb-6 text-base leading-relaxed text-black/80">
              Everyone is shipping faster. But is speed good for craft? AI has
              unlocked a new gear for designers: they&apos;re ideating faster,
              prototyping more, and learning to code. Half of respondents have
              pushed AI-generated code to production. At the same time, we hear
              concerns about craft atrophy and the loneliness of designing
              alongside AI instead of teammates.
            </p>
            <p
              className="mb-3 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              In this chapter, we&apos;ll cover:
            </p>
            <ul className="mb-8 space-y-2">
              {CRAFT_TOPICS.map((t) => (
                <li
                  key={t}
                  className="border-b border-black/10 pb-2 text-sm"
                  style={{ fontFamily: MONO }}
                >
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/brands/stateofaidesign-com/replica/craft"
              data-component="button-set"
              className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Read the Craft Chapter
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative hidden lg:block">
            <Image
              src="/brands/stateofaidesign-com/w5ZsT0QtP3AukEHcUxJ90Zpqvw.png"
              alt="Craft chapter"
              width={600}
              height={400}
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Chapter: Teams */}
      <section
        data-component="card"
        className="relative overflow-hidden bg-[#A3B18A] px-4 py-12 text-black"
      >
        <div className="relative z-10 grid gap-8 lg:grid-cols-2">
          <div>
            <p
              className="mb-4 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              03 Teams
            </p>
            <h2
              className="mb-4 text-3xl leading-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: SERIF }}
            >
              Redesigning the design org
            </h2>
            <p className="mb-6 text-base leading-relaxed text-black/80">
              AI gave designers new powers. Now organizations need to adapt.
              Roles are blurring as designers take on PM and engineering work,
              and vice versa. Hiring managers want AI fluency alongside a high
              bar for craft, vision, and storytelling. But few companies have
              updated performance reviews, team structures, or hiring practices
              to match how the work has changed.
            </p>
            <p
              className="mb-3 text-[10px] uppercase tracking-wider text-black/60"
              style={{ fontFamily: MONO }}
            >
              In this chapter, we&apos;ll cover:
            </p>
            <ul className="mb-8 space-y-2">
              {TEAMS_TOPICS.map((t) => (
                <li
                  key={t}
                  className="border-b border-black/10 pb-2 text-sm"
                  style={{ fontFamily: MONO }}
                >
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/brands/stateofaidesign-com/replica/teams"
              data-component="button-set"
              className="inline-flex items-center gap-2 rounded-sm bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Read the Teams Chapter
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative hidden lg:block">
            {/* No specific teams image found; use a subtle placeholder or omit */}
          </div>
        </div>
      </section>

      {/* Video Case Studies */}
      <section
        data-component="card"
        className="border-t border-black/10 px-4 py-12"
      >
        <p
          className="mb-4 text-[10px] uppercase tracking-wider text-black/50"
          style={{ fontFamily: MONO }}
        >
          Video Case Studies
        </p>
        <h2
          className="mb-2 text-3xl leading-tight sm:text-4xl"
          style={{ fontFamily: SERIF }}
        >
          Seven companies. Seven ways of navigating the same shift.
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.slice(0, 3).map((cs) => (
            <div key={cs.company} className="group">
              <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/5">
                <Image
                  src={cs.portrait}
                  alt={cs.company}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-1 text-lg font-medium" style={{ fontFamily: SERIF }}>
                {cs.company}
              </h3>
              <p className="mb-2 text-sm text-black/60">{cs.title}</p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2"
              >
                Get notified
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CASE_STUDIES.slice(3).map((cs) => (
            <div key={cs.company} className="group">
              <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/5">
                <Image
                  src={cs.portrait}
                  alt={cs.company}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mb-1 text-lg font-medium" style={{ fontFamily: SERIF }}>
                {cs.company}
              </h3>
              <p className="mb-2 text-sm text-black/60">{cs.title}</p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2"
              >
                Get notified
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Inside AI-native design teams */}
      <section className="border-t border-black/10 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/8ysqHlycMpw?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1&autoplay=0&color=white"
              title="Youtube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h3
            className="mb-4 text-2xl leading-tight"
            style={{ fontFamily: SERIF }}
          >
            Inside AI-native design teams
          </h3>
          <p className="mb-6 text-base leading-relaxed text-black/80">
            Seven video case studies with the design teams at Anthropic, Framer,
            Linear, Notion, Shopify, Sierra, and Stripe. Go inside the workflows
            they&apos;ve rebuilt, the tradeoffs they&apos;re navigating, and how they&apos;re
            operating differently as a team.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-2"
          >
            Get notified when they&apos;re released
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* CTA / Form */}
      <section
        data-component="form"
        className="bg-[#1a1a1a] px-4 py-16 text-white"
      >
        <div className="mx-auto max-w-xl text-center">
          <h2
            className="mb-4 text-2xl leading-tight sm:text-3xl"
            style={{ fontFamily: SERIF }}
          >
            Get new case studies &amp; report markdown
          </h2>
          <p className="mb-8 text-base text-white/70">
            Download the markdown version of the report, ready to drop into any
            tool. Get notified as new case studies go live.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-sm bg-[#FF7A5C] px-6 py-3 text-sm font-medium text-black"
            >
              Submit
            </button>
          </form>
          <p className="mt-4 text-[10px] leading-relaxed text-white/40" style={{ fontFamily: MONO }}>
            By subscribing, you agree to receive communications from Designer Fund
            and Foundation Capital in accordance with their privacy policies.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-[#1a1a1a] px-4 py-12 text-white">
        <p
          className="mb-8 text-[10px] uppercase tracking-wider text-white/50"
          style={{ fontFamily: MONO }}
        >
          Methodology
        </p>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p
              className="mb-2 text-5xl leading-none tracking-tight md:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              906
            </p>
            <p
              className="text-xs uppercase tracking-wider text-white/60"
              style={{ fontFamily: MONO }}
            >
              Survey responses
            </p>
          </div>
          <div>
            <p
              className="mb-2 text-5xl leading-none tracking-tight md:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              25+
            </p>
            <p
              className="text-xs uppercase tracking-wider text-white/60"
              style={{ fontFamily: MONO }}
            >
              Interviews
            </p>
          </div>
          <div>
            <p
              className="mb-2 text-5xl leading-none tracking-tight md:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              50+
            </p>
            <p
              className="text-xs uppercase tracking-wider text-white/60"
              style={{ fontFamily: MONO }}
            >
              Public sources
            </p>
          </div>
        </div>
      </section>

      <StateofaidesignFooter />
    </div>
  );
}
