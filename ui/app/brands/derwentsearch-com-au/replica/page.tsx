"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DerwentHeader } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-header";
import { DerwentFooter } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-footer";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SLIDES = [
  {
    word: "IMPACT",
    subtitle: "We are about transformative and focused change",
    image: "/brands/derwentsearch-com-au/2zcVvH44-1920w-1680x1120-1920w.jpeg",
  },
  {
    word: "EXPERIENCED",
    subtitle: "We have insight across sectors and industries",
    image: "/brands/derwentsearch-com-au/QANoVwGE-1920w-1680x1120-1920w.jpeg",
  },
  {
    word: "PARTNERS",
    subtitle: "We build trusted and lasting relationships",
    image: "/brands/derwentsearch-com-au/ISe11VkQ-1920w-1680x1120-1920w.jpeg",
  },
  {
    word: "LEADERS",
    subtitle: "We are proud of the mark we leave",
    image: "/brands/derwentsearch-com-au/wWlt7iqE-2304w-1680x1120-1920w.jpeg",
  },
  {
    word: "CONNECTORS",
    subtitle: "We are the link between personal and business possibility",
    image: "/brands/derwentsearch-com-au/19W1VNk8-2304w-1680x1120-1920w.jpeg",
  },
];

const EXPERTISE_CARDS = [
  {
    title: "Board",
    image: "/brands/derwentsearch-com-au/Two_Buildings_-477aa9c2-677ff620-1920w.jpg",
    link: "#",
  },
  {
    title: "Digital and Technology",
    image: "/brands/derwentsearch-com-au/Digital-header-20d70572-1920w.jpg",
    link: "#",
  },
  {
    title: "Executive Search",
    image: "/brands/derwentsearch-com-au/samuel-zeller-4138-unsplash-61d529a1-1920w.jpg",
    link: "#",
  },
  {
    title: "Interim Solutions",
    image: "/brands/derwentsearch-com-au/Discussion-17eeeff0-1920w-1920w.jpg",
    link: "/brands/derwentsearch-com-au/replica/interim-solutions",
  },
  {
    title: "Private Equity",
    image: "/brands/derwentsearch-com-au/Private_Equity_small_6-1920w.jpg",
    link: "#",
  },
];

const INDUSTRY_CARDS = [
  {
    title: "Consumer and Retail",
    image: "/brands/derwentsearch-com-au/QANoVwGE-1920w-1680x1120-1920w.jpeg",
  },
  {
    title: "Digital and Technology",
    image: "/brands/derwentsearch-com-au/Digital-header-20d70572-1920w.jpg",
  },
  {
    title: "Education",
    image: "/brands/derwentsearch-com-au/pexels-photo-12969411-10a10043-1920w.jpeg",
  },
  {
    title: "Financial Services",
    image: "/brands/derwentsearch-com-au/samuel-zeller-4138-unsplash-61d529a1-1920w.jpg",
  },
  {
    title: "Healthcare",
    image: "/brands/derwentsearch-com-au/AdobeStock_228126125-2c901f28-1920w.jpeg",
  },
  {
    title: "Industrial",
    image: "/brands/derwentsearch-com-au/Two_Buildings_-477aa9c2-677ff620-1920w.jpg",
  },
];

const NEWS_ARTICLES = [
  {
    title: "Pathway to the Boardroom Recap: Key Insights from Our Recent Event in Brisbane",
    image: "/brands/derwentsearch-com-au/Website_Article_Image_-_PTTB_Brisbane-73262e00.svg",
  },
  {
    title: "The Evolving Australian Boardroom Landscape: Navigating Complexity in 2025",
    image: "/brands/derwentsearch-com-au/Derwent_Website_Newspost_Image_-_Board_Insights.svg",
  },
  {
    title: "AI & The People Recap: Key Insights from Our Recent Event in Sydney",
    image: "/brands/derwentsearch-com-au/AI_-_The_People-1920w.png",
  },
  {
    title: "Building Resilience for Organisational Excellence Recap: Key Insights from Our Recent Event in Perth",
    image: "/brands/derwentsearch-com-au/Man_and_Women_talking_-55e353a6-1920w.jpg",
  },
  {
    title: "PE Portfolio Talent Strategy: What's Driving Executive Moves in 2025",
    image: "/brands/derwentsearch-com-au/Private_Equity_small_6-1920w.jpg",
  },
  {
    title: "Women in Tech Recap: Key Insights from Our Recent Event in Sydney",
    image: "/brands/derwentsearch-com-au/Digital-header-20d70572-1920w.jpg",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DerwentHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  /* Auto-advance every 6 seconds */
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <>
      {/* @font-face for apercu_bold_pro */}
      <style>{`
        @font-face {
          font-family: "apercu_bold_pro";
          src: url("/brands/derwentsearch-com-au/fonts/apercu_bold_pro-c0e9_400.otf")
            format("opentype");
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <div className="min-h-screen w-full bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Header */}
        <DerwentHeader />

        {/* -------------------------------------------------------- */}
        {/* Section 1 -- Hero Carousel                                */}
        {/* -------------------------------------------------------- */}
        <section className="relative h-screen w-full overflow-hidden">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.word}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.word}
                fill
                className="object-cover"
                priority={i === 0}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0" style={{ backgroundColor: "rgba(34, 62, 73, 0.7)" }} />

              {/* Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <h1
                  className="uppercase tracking-wide text-[#AD2E33]"
                  style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "90px", lineHeight: 1.1 }}
                >
                  {slide.word}
                </h1>
                <p
                  className="mt-4 max-w-[700px] text-white"
                  style={{ fontSize: "24px", fontWeight: 300 }}
                >
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}

          {/* Navigation arrows */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-6 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-6 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            aria-label="Next slide"
          >
            <ChevronRight className="size-7" />
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide ? "w-8 bg-[#AD2E33]" : "w-2 bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Section 2 -- Our Expertise                                */}
        {/* -------------------------------------------------------- */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2
              className="mb-12 text-center text-[#1A1B1F]"
              style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "36px" }}
            >
              Our Expertise
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {EXPERTISE_CARDS.map((card) => (
                <Link key={card.title} href={card.link} className="group block">
                  <Card className="overflow-hidden border-0 shadow-none">
                    <div className="relative aspect-[3/2] w-full overflow-hidden">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="pt-4">
                      <h3
                        className="text-[#1A1B1F]"
                        style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "24px" }}
                      >
                        {card.title}
                      </h3>
                      <span
                        className="mt-2 inline-flex items-center gap-1 text-[#AD2E33] transition-colors group-hover:text-[#922629]"
                        style={{ fontSize: "14px", fontWeight: 600 }}
                      >
                        Read More <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Section 3 -- Centered Logo                                */}
        {/* -------------------------------------------------------- */}
        <section className="bg-white py-16">
          <div className="flex flex-col items-center">
            <Image
              src="/brands/derwentsearch-com-au/logo-aff45579-1920w-1920w.png"
              alt="Derwent logo"
              width={120}
              height={120}
              className="h-[120px] w-auto"
            />
            <div className="mt-6 h-1 w-10 bg-[#AD2E33]" />
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Section 4 -- Our Industries                               */}
        {/* -------------------------------------------------------- */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2
              className="mb-12 text-center text-[#1A1B1F]"
              style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "36px" }}
            >
              Our Industries
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRY_CARDS.map((card) => (
                <Card key={card.title} className="group overflow-hidden border-0 shadow-none">
                  <div className="relative aspect-[3/2] w-full overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="pt-4">
                    <h3
                      className="text-[#1A1B1F]"
                      style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "24px" }}
                    >
                      {card.title}
                    </h3>
                    <span
                      className="mt-2 inline-flex items-center gap-1 text-[#AD2E33]"
                      style={{ fontSize: "14px", fontWeight: 600 }}
                    >
                      Read More <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                className="rounded bg-[#AD2E33] px-8 py-3 text-[15px] font-semibold text-white hover:bg-[#922629]"
              >
                View More
              </Button>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Section 5 -- Our News                                     */}
        {/* -------------------------------------------------------- */}
        <section className="bg-[#EFEFEF] py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h3
              className="mb-12 text-center text-[#1A1B1F]"
              style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "36px" }}
            >
              Our news
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {NEWS_ARTICLES.map((article) => (
                <Card key={article.title} className="group overflow-hidden border-0 bg-white shadow-sm">
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3
                      className="line-clamp-3 text-[#1A1B1F]"
                      style={{ fontFamily: "apercu_bold_pro, sans-serif", fontSize: "18px", lineHeight: 1.4 }}
                    >
                      {article.title}
                    </h3>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- */}
        {/* Section 6 -- Footer                                       */}
        {/* -------------------------------------------------------- */}
        <DerwentFooter />
      </div>
    </>
  );
}
