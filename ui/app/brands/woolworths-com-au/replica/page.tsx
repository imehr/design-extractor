"use client";

import { useState } from "react";
import { WWHeader } from "@/components/brands/woolworths-com-au/ww-header";
import { WWFooter } from "@/components/brands/woolworths-com-au/ww-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ---------- Data from DOM extraction ---------- */

const HERO_SLIDES = [
  {
    heading: "Feeling lucky? Here's your chance to win big",
    subtext: "Use code WIN",
    cta: "Find out more",
    image: "/brands/woolworths-com-au/hero-win-15k.png",
    alt: "WIN $15000 of Groceries",
  },
  {
    heading: "Half Price",
    cta: "Shop now",
    image: "/brands/woolworths-com-au/hero-half-price.png",
    alt: "Half price specials",
  },
  {
    heading: "Up to 50% off Drinks",
    cta: "Shop now",
    image: "/brands/woolworths-com-au/hero-drinks.png",
    alt: "Drinks specials",
  },
];

const SIDEBAR_QUICK_LINKS = [
  { text: "New Catalogue", href: "/shop/catalogue" },
  { text: "All Specials & Offers", href: "/shop/browse/specials" },
  { text: "Ways to Shop", href: "/shop/discover/shopping-online" },
  { text: "Healthylife +Pharmacy", href: "/shop/about/healthylife" },
  { text: "Plan with Lists", href: "/shop/mylists" },
  { text: "Fresh Market Update", href: "/shop/ideas/fresh-market-update" },
];

const OFFER_TILES = [
  {
    category: "Fruit & Veg",
    badge: "Fresh Specials",
    image: "/brands/woolworths-com-au/roundel-fresh-specials.png",
  },
  {
    category: "Poultry, Meat & Seafood",
    badge: "Specials",
    image: "/brands/woolworths-com-au/roundel-specials-green.png",
  },
  {
    category: "Drinks",
    badge: "Up to 50% off",
    image: "/brands/woolworths-com-au/roundel-50-percent-off.png",
  },
  {
    category: "Everyday Market",
    badge: null,
    image: "/brands/woolworths-com-au/tile-everyday-market-header.png",
  },
  {
    category: "Supercoat Pet",
    badge: "Half Price",
    image: "/brands/woolworths-com-au/roundel-half-price-yellow.png",
  },
];

/* ---------- Page component ---------- */

export default function WoolworthsHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prevSlide = () =>
    setCurrentSlide((s) => (s === 0 ? HERO_SLIDES.length - 1 : s - 1));
  const nextSlide = () =>
    setCurrentSlide((s) => (s === HERO_SLIDES.length - 1 ? 0 : s + 1));

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div
      className="min-h-screen bg-[#EEEEEE]"
      style={{
        fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif",
        fontSize: 16,
        lineHeight: "26px",
        color: "#25251F",
      }}
    >
      <WWHeader />

      {/* Hero section: carousel left + sidebar right */}
      <section className="w-full bg-white">
        <div className="mx-auto flex max-w-[1280px] gap-0">
          {/* Carousel */}
          <div className="relative flex-1 overflow-hidden">
            <div className="relative aspect-[674/446] w-full">
              <img
                src={slide.image}
                alt={slide.alt}
                className="h-full w-full object-cover"
              />

              {/* Overlay text */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <div className="max-w-[320px]">
                  <h2
                    className="mb-2 text-2xl font-bold leading-tight text-[#25251F]"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {slide.heading}
                  </h2>
                  {slide.subtext && (
                    <p className="mb-3 text-sm text-[#616C71]">{slide.subtext}</p>
                  )}
                  <Button
                    className="h-10 rounded bg-[#178841] px-6 text-sm font-medium text-white hover:bg-[#126b34]"
                  >
                    {slide.cta}
                  </Button>
                </div>
              </div>

              {/* Nav arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5 text-[#25251F]" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                aria-label="Next slide"
              >
                <ChevronRight className="size-5 text-[#25251F]" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      idx === currentSlide ? "bg-[#178841]" : "bg-white/70"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="hidden w-[320px] shrink-0 border-l border-[#E0E0E0] bg-white lg:block">
            <div className="p-6">
              <h3
                className="mb-1 text-lg font-bold text-[#25251F]"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                Welcome to Woolworths
              </h3>
              <p className="mb-4 text-sm text-[#616C71]">
                Get the most out of your shop.
              </p>
              <Button
                variant="outline"
                className="mb-6 h-10 w-full rounded border-[#178841] text-sm font-medium text-[#178841] hover:bg-[#178841] hover:text-white"
              >
                LOG IN / SIGN UP
              </Button>

              <div className="space-y-0">
                {SIDEBAR_QUICK_LINKS.map((link) => (
                  <a
                    key={link.text}
                    href={link.href}
                    className="flex items-center justify-between border-t border-[#E0E0E0] py-3 text-sm font-medium text-[#00723D] hover:underline"
                  >
                    {link.text}
                    <ChevronRight className="size-4 text-[#616C71]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer tiles */}
      <section className="w-full py-8">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {OFFER_TILES.map((tile) => (
              <Card
                key={tile.category}
                className="group cursor-pointer overflow-hidden rounded-xl border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col items-center p-4">
                  <div className="mb-3 flex h-24 w-24 items-center justify-center">
                    <img
                      src={tile.image}
                      alt={tile.badge || tile.category}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {tile.badge && (
                    <span className="mb-1 text-xs font-bold uppercase text-[#178841]">
                      {tile.badge}
                    </span>
                  )}
                  <span className="text-center text-sm font-medium text-[#25251F]">
                    {tile.category}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banners row */}
      <section className="w-full pb-8">
        <div className="mx-auto max-w-[1280px] px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="overflow-hidden rounded-xl border-0">
              <img
                src="/brands/woolworths-com-au/banner-autumn-fruit-veg.jpg"
                alt="Autumn Fruit & Veg"
                className="h-auto w-full object-cover"
              />
            </Card>
            <Card className="overflow-hidden rounded-xl border-0">
              <img
                src="/brands/woolworths-com-au/banner-win-groceries.jpg"
                alt="Win Groceries"
                className="h-auto w-full object-cover"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Quick category icons */}
      <section className="w-full pb-8">
        <div className="mx-auto max-w-[1280px] px-4">
          <h2
            className="mb-4 text-xl font-bold text-[#25251F]"
            style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
          >
            Popular categories
          </h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {[
              { icon: "/brands/woolworths-com-au/icon-half-price.png", label: "Half Price" },
              { icon: "/brands/woolworths-com-au/icon-everyday-low-price.png", label: "Low Prices" },
              { icon: "/brands/woolworths-com-au/icon-online-only.png", label: "Online Only" },
              { icon: "/brands/woolworths-com-au/icon-categories.png", label: "Categories" },
              { icon: "/brands/woolworths-com-au/icon-fresh-ideas.png", label: "Fresh Ideas" },
              { icon: "/brands/woolworths-com-au/icon-budget-recipes.png", label: "Budget Recipes" },
              { icon: "/brands/woolworths-com-au/icon-meal-plan.png", label: "Meal Plan" },
              { icon: "/brands/woolworths-com-au/icon-saved-recipes.png", label: "Saved Recipes" },
            ].map((cat) => (
              <a
                key={cat.label}
                href="#"
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <img src={cat.icon} alt={cat.label} className="h-12 w-12 object-contain" />
                <span className="text-center text-xs font-medium text-[#25251F]">
                  {cat.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <WWFooter />
    </div>
  );
}
