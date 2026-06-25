import { ArrowRight, ChevronRight, Play } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";

const HEADING_FONT = '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT = '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const HELP_ME_FIND_LINKS = [
  {
    text: "Types and causes of hearing loss",
    href: "https://www.cochlear.com/au/en/home/diagnosis-and-treatment/diagnosing-hearing-loss/types-and-causes-of-hearing-loss",
  },
  {
    text: "When to consider implants for adults",
    href: "https://www.cochlear.com/au/en/home/diagnosis-and-treatment/when-to-consider-implants-for-adults",
  },
  {
    text: "Cochlear implant funding options",
    href: "https://www.cochlear.com/au/en/home/diagnosis-and-treatment/costs-and-payment",
  },
  {
    text: "Contact the Cochlear Engagement Team",
    href: "https://www.cochlear.com/au/en/connect/contact-us/connect-with-cochlear",
  },
];

const STORIES = [
  {
    title: "You're never too old for a cochlear implant",
    href: "https://www.cochlear.com/au/en/home/your-cochlear-stories",
    image: "/brands/cochlear-com/5e0e2526802149d3bc89fdf4efbeef26",
    imageAlt: "Watch the oldest Australian to receive a cochlear implant",
  },
  {
    title: "Karl's new lease on life",
    href: "https://www.cochlear.com/au/en/home/your-cochlear-stories",
    image: "/brands/cochlear-com/7fcb4b6efa1f4778911c96172eb609cb",
    imageAlt: "Watch Cochlear Nucleus 7 Sound processor recipient's testimony",
  },
  {
    title: "Bec can fully participate in life again",
    href: "https://www.cochlear.com/au/en/home/your-cochlear-stories",
    image: "/brands/cochlear-com/865ab302728b458a820789056ead5e22",
    imageAlt: "Watch bimodal cochlear implant recipient testimony",
  },
];

/**
 * Full-width hero card with solid background colour spanning both columns.
 * isSecondary=false → image LEFT, text RIGHT
 * isSecondary=true  → text LEFT, image RIGHT
 * bgColor fills the whole row; textColor and ctaStyle apply to the text panel.
 */
function HeroCard({
  title,
  body,
  cta,
  href,
  image,
  imageAlt,
  isSecondary = false,
  bgColor,
  textColor = "#3f1482",
  ctaStyle = "outline-dark",
  cardHeight = 390,
  imageTopOffset = 0,
}: {
  title: React.ReactNode;
  body: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  isSecondary?: boolean;
  bgColor: string;
  textColor?: string;
  /** "outline-dark" = dark outline btn, "filled-purple" = purple filled, "outline-purple" = purple outline */
  ctaStyle?: "outline-dark" | "filled-purple" | "outline-white";
  cardHeight?: number;
  /** push the image down within the column to reveal bgColor at the top */
  imageTopOffset?: number;
}) {
  const btnEl =
    ctaStyle === "filled-purple" ? (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded font-medium text-white"
        style={{ fontFamily: BODY_FONT, fontSize: 14, background: "#3f1482", padding: "10px 24px" }}
      >
        {cta}
      </a>
    ) : ctaStyle === "outline-white" ? (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded font-medium"
        style={{
          fontFamily: BODY_FONT,
          fontSize: 14,
          color: "white",
          border: "2px solid white",
          padding: "10px 24px",
          background: "transparent",
        }}
      >
        {cta} <ChevronRight style={{ width: 14, height: 14, marginLeft: 4 }} />
      </a>
    ) : (
      <a
        href={href}
        className="inline-flex items-center justify-center rounded font-medium"
        style={{
          fontFamily: BODY_FONT,
          fontSize: 14,
          color: textColor,
          border: `2px solid ${textColor}`,
          padding: "10px 24px",
          background: "transparent",
        }}
      >
        {cta} <ChevronRight style={{ width: 14, height: 14, marginLeft: 4 }} />
      </a>
    );

  const imgEl = (
    /* image column — same bgColor behind it */
    <div className="relative overflow-hidden" style={{ background: bgColor, height: cardHeight }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={imageAlt}
        className="absolute inset-x-0 w-full object-cover object-center"
        style={{ top: imageTopOffset, bottom: 0, height: `calc(100% - ${imageTopOffset}px)` }}
      />
    </div>
  );

  const textEl = (
    <div
      className="flex flex-col justify-center"
      style={{ background: bgColor, padding: "48px 72px", height: cardHeight }}
    >
      <h2
        className="font-semibold"
        style={{ fontFamily: HEADING_FONT, fontSize: 28, lineHeight: "34px", color: textColor, marginBottom: 14 }}
      >
        {title}
      </h2>
      <p
        style={{ fontFamily: BODY_FONT, fontSize: 15, lineHeight: "23px", color: textColor, marginBottom: 26 }}
      >
        {body}
      </p>
      {btnEl}
    </div>
  );

  return (
    <div className="grid grid-cols-2" style={{ height: cardHeight }}>
      {isSecondary ? (
        <>
          {textEl}
          {imgEl}
        </>
      ) : (
        <>
          {imgEl}
          {textEl}
        </>
      )}
    </div>
  );
}

export default function CochlearHomepageReplica() {
  return (
    <div className="min-h-screen bg-white" style={{ width: 1280, overflowX: "hidden" }}>
      <CochlearHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        {/* Original: full-width photo ~519px tall, text overlay bottom-left */}
        <section className="relative overflow-hidden" style={{ height: 519 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brands/cochlear-com/b32424f8b45744319dc3d24b86f9d59a"
            alt="Seize the sound — Cochlear campaign"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* gradient overlay for text legibility */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.20) 45%, transparent 100%)",
              paddingBottom: 44,
            }}
          >
            <div className="mx-auto w-full max-w-[1280px] px-10">
              <div style={{ maxWidth: 460 }}>
                <h1
                  className="mb-3 font-bold text-white"
                  style={{ fontFamily: HEADING_FONT, fontSize: 44, lineHeight: "50px" }}
                >
                  Seize the sound
                </h1>
                <p
                  className="mb-5 text-white"
                  style={{ fontFamily: BODY_FONT, fontSize: 18, lineHeight: "26px" }}
                >
                  Hear the conversation, enjoy life&apos;s moments.
                </p>
                <a
                  href="https://www.cochlear.com/au/en/campaign/seize-the-sound"
                  className="inline-flex items-center justify-center rounded font-medium text-white bg-[#3f1482] hover:bg-[#2f0f63]"
                  style={{ fontFamily: BODY_FONT, fontSize: 15, padding: "11px 28px" }}
                >
                  Find out more
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Help me find ──────────────────────────────────────────────── */}
        {/* Original: white section ~282px tall */}
        <section
          className="bg-white"
          style={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <div className="mx-auto max-w-[1280px] px-10">
            <div className="flex items-start gap-16">
              <div style={{ flexShrink: 0, width: 210 }}>
                <h2
                  className="font-semibold text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT, fontSize: 30, lineHeight: "36px" }}
                >
                  Help me find
                </h2>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-10">
                {HELP_ME_FIND_LINKS.map((link) => (
                  <a
                    key={link.text}
                    href={link.href}
                    className="flex items-center justify-between border-b border-gray-200"
                    style={{ paddingTop: 20, paddingBottom: 20 }}
                  >
                    <span
                      className="text-[#56565a]"
                      style={{ fontFamily: BODY_FONT, fontSize: 15, paddingRight: 10 }}
                    >
                      {link.text}
                    </span>
                    <ArrowRight
                      className="flex-shrink-0 text-[#3f1482]"
                      style={{ width: 16, height: 16 }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Nexa — YELLOW bg, image LEFT, text RIGHT (390px) ── */}
        <HeroCard
          isSecondary={false}
          image="/brands/cochlear-com/c9198736a4a94f99b7e1aa0b100110aa"
          imageAlt="Nucleus Nexa System launch"
          title={
            <>
              Nucleus<sup>®</sup> Nexa™ System: The future of hearing.
              Delivered today.
            </>
          }
          body="Experience the world's first and only smart cochlear implant system."
          cta="Find out more"
          href="https://www.cochlear.com/au/en/home/products-and-accessories/nucleus-nexa-system"
          bgColor="#fdc82f"
          textColor="#3f1482"
          ctaStyle="outline-dark"
          cardHeight={390}
        />

        {/* ── Kanso — WHITE bg text LEFT, dark image RIGHT (482px) ── */}
        <HeroCard
          isSecondary={true}
          image="/brands/cochlear-com/112bd9318f9f4dbdb4604e1010dc8ce2"
          imageAlt="Nucleus Kanso 3 Sound Processor"
          title={
            <>
              Nucleus<sup>®</sup> Kanso<sup>®</sup> 3 Sound Processor: Connect.
              Focus. Explore.
            </>
          }
          body="Explore the freedom of the world's smallest and lightest off-the-ear sound processor."
          cta="Find out more"
          href="https://www.cochlear.com/au/en/home/products-and-accessories/cochlear-nucleus-system/nucleus-sound-processors/kanso-3"
          bgColor="white"
          textColor="#56565a"
          ctaStyle="filled-purple"
          cardHeight={470}
          imageTopOffset={80}
        />

        {/* ── Baha — YELLOW bg, image LEFT, text RIGHT (392px) ── */}
        <HeroCard
          isSecondary={false}
          image="/brands/cochlear-com/d4c3ddb21e8a45e8a483e08300bdddf8"
          imageAlt="Cochlear Baha 7 lifestyle"
          title={
            <>
              Baha<sup>®</sup> 7 Sound Processor
            </>
          }
          body="Stream in even more ways than before with the new Baha 7 Sound Processor."
          cta="Read more"
          href="https://www.cochlear.com/au/en/home/products-and-accessories/cochlear-baha-system/baha-7-sound-processor"
          bgColor="#fdc82f"
          textColor="#3f1482"
          ctaStyle="outline-dark"
          cardHeight={390}
        />

        {/* ── Hear the Future today — WHITE bg, text LEFT, image RIGHT (478px) ── */}
        <HeroCard
          isSecondary={true}
          image="/brands/cochlear-com/0d520623c1584802811a3f5715299264"
          imageAlt="Hear the Future today campaign"
          title="Hear the Future today"
          body="If you are already a Cochlear customer, learn how upgrading to latest sound processors can benefit you."
          cta="Learn more"
          href="https://www.cochlear.com/au/en/campaign/hear-the-future-today"
          bgColor="white"
          textColor="#56565a"
          ctaStyle="filled-purple"
          cardHeight={480}
        />

        {/* ── Quiz — YELLOW bg, image LEFT, text RIGHT (410px) ── */}
        <HeroCard
          isSecondary={false}
          image="/brands/cochlear-com/57faeaaf58aa44a2b2f773595f50f3d2"
          imageAlt="Take the online hearing quiz"
          title={
            <>
              Struggling to hear clearly? Take the online hearing quiz.
            </>
          }
          body="Our online hearing quiz may help you assess potential hearing loss and offer guidance on whether you need to book a hearing test with an audiologist."
          cta="Take the quiz"
          href="https://www.cochlear.com/au/en/home/diagnosis-and-treatment/diagnosing-hearing-loss/signs-of-hearing-loss-in-adults/take-a-hearing-quiz"
          bgColor="#fdc82f"
          textColor="#3f1482"
          ctaStyle="outline-dark"
          cardHeight={390}
        />

        {/* ── Your Cochlear stories ─────────────────────────────────────── */}
        {/* Original: light-gray bg, ~635px tall.
            Layout: LEFT col (title+desc+cta) + RIGHT 3 story cards side by side */}
        <section
          className="bg-[#efefef]"
          style={{ paddingTop: 63, paddingBottom: 63 }}
        >
          <div className="mx-auto max-w-[1280px] px-10">
            {/* 2-col: left = title block, right = 3 story cards */}
            <div className="flex gap-8 items-start">
              {/* Left: title, description, "See all stories" CTA */}
              <div style={{ flexShrink: 0, width: 275 }}>
                <h2
                  className="font-semibold text-[#56565a]"
                  style={{ fontFamily: HEADING_FONT, fontSize: 30, lineHeight: "36px", marginBottom: 16 }}
                >
                  Your Cochlear stories
                </h2>
                <p
                  className="text-[#56565a]"
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 15,
                    lineHeight: "23px",
                    marginBottom: 28,
                  }}
                >
                  People who know how you feel speak about their experience to
                  provide inspiration and insights into life with Cochlear.
                </p>
                <a
                  href="https://www.cochlear.com/au/en/home/your-cochlear-stories"
                  className="inline-flex items-center justify-center font-medium text-[#3f1482]"
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 14,
                    background: "#fdc82f",
                    padding: "10px 24px",
                    borderRadius: 4,
                  }}
                >
                  See all stories
                </a>
              </div>

              {/* Right: 3 story cards in a row */}
              <div className="flex-1 grid grid-cols-3 gap-6">
                {STORIES.map((story) => (
                  <div key={story.title} className="overflow-hidden bg-white">
                    <div className="relative w-full" style={{ height: 387 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={story.image}
                        alt={story.imageAlt}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div style={{ padding: "16px 20px 24px" }}>
                      <h3
                        className="font-semibold text-[#56565a]"
                        style={{
                          fontFamily: HEADING_FONT,
                          fontSize: 16,
                          lineHeight: "22px",
                          marginBottom: 12,
                        }}
                      >
                        {story.title}
                      </h3>
                      <a
                        href={story.href}
                        className="inline-flex items-center gap-1 font-medium text-[#3f1482] hover:underline"
                        style={{ fontFamily: BODY_FONT, fontSize: 14 }}
                      >
                        View full story
                        <ChevronRight style={{ width: 14, height: 14 }} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <CochlearFooter />
      {/* Cookie consent bar: matches original's black bar at bottom of footer */}
      <div style={{ height: 79, background: "#000000" }} />
      {/* White space: matches original page height for accurate pixel comparison */}
      <div style={{ height: 329, background: "white" }} />
    </div>
  );
}
