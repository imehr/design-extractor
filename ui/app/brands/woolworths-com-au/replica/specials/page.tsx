import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WWHeader } from "@/components/brands/woolworths-com-au/ww-header";
import { WWFooter } from "@/components/brands/woolworths-com-au/ww-footer";
import { ChevronRight, ShoppingCart, Plus } from "lucide-react";

/* ── Extracted from specials.json ── */

const CATEGORY_TABS = [
  { text: "Online Only Specials", href: "/shop/browse/specials/online-only-specials", icon: "/brands/woolworths-com-au/icon-online-only.png" },
  { text: "Half Price", href: "/shop/browse/specials/half-price", icon: "/brands/woolworths-com-au/icon-half-price.png" },
  { text: "Autumn Price", href: "/shop/browse/specials/autumn-price", icon: "/brands/woolworths-com-au/roundel-fresh-specials.png" },
  { text: "Lower Shelf Price", href: "/shop/browse/specials/lower-shelf-price", icon: "/brands/woolworths-com-au/roundel-specials-green.png" },
  { text: "Everyday Low Price", href: "/shop/browse/specials/everyday-low-price", icon: "/brands/woolworths-com-au/icon-everyday-low-price.png" },
  { text: "Buy More Save More", href: "/shop/browse/specials/buy-more-save-more", icon: "/brands/woolworths-com-au/roundel-50-percent-off.png" },
  { text: "Bundles", href: "/shop/browse/specials/bundles", icon: "/brands/woolworths-com-au/roundel-half-price-green.png" },
  { text: "Everyday Market Specials and Offers", href: "/shop/browse/specials/everyday-market-specials-and-offers", icon: "/brands/woolworths-com-au/tile-everyday-market-header.png" },
];

const DEPARTMENT_TABS = [
  "Fruit & Veg",
  "Poultry, Meat & Seafood",
  "Dinner",
  "Deli",
  "Dairy, Eggs & Fridge",
  "Bakery",
  "Lunch Box",
  "Freezer",
  "Snacks & Confectionery",
  "Pantry",
  "International Foods",
  "Drinks",
  "Beer, Wine & Spirits",
  "Beauty",
  "Personal Care",
  "Health & Wellness",
  "Cleaning & Maintenance",
  "Baby",
  "Pet",
  "Everyday Market",
  "Electronics",
];

const PROMO_BANNER = {
  heading: "Your chance to win $15,000 worth of groceries",
  text: "Use code WIN at checkout. Min. spend $100 online. Ends 28/4/26. T&Cs apply*",
  cta: "Find out more",
  image: "/brands/woolworths-com-au/hero-win-15k.png",
};

/* Placeholder product cards to show grid layout */
const SAMPLE_PRODUCTS = [
  { name: "Woolworths Gold Pitted Kalamata Olives", price: "$3.50", wasPrice: "$7.00", badge: "Half Price", weight: "300g" },
  { name: "Kettle Chips Sea Salt", price: "$2.90", wasPrice: "$5.80", badge: "Half Price", weight: "175g" },
  { name: "John West Tuna Tempters", price: "$1.50", wasPrice: "$3.00", badge: "Half Price", weight: "95g" },
  { name: "Bega Simply Nuts Peanut Butter Smooth", price: "$3.25", wasPrice: "$6.50", badge: "Half Price", weight: "325g" },
];

export default function SpecialsPage() {
  return (
    <div
      className="min-h-screen bg-[#EEEEEE]"
      style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif", fontSize: 16, color: "#25251F" }}
    >
      <WWHeader activePage="Specials" />

      {/* Page content */}
      <div className="w-full">
        {/* Heading */}
        <div className="bg-white px-6 pb-2 pt-6">
          <div className="mx-auto max-w-[1280px]">
            <h2
              className="text-[32px] font-medium"
              style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif" }}
            >
              All Specials and Offers
            </h2>
          </div>
        </div>

        {/* Category icon tabs */}
        <div className="bg-white px-6 py-4">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {CATEGORY_TABS.map((tab) => (
                <Link
                  key={tab.text}
                  href={tab.href}
                  className="flex min-w-[100px] flex-col items-center gap-2 rounded-lg px-3 py-2 text-center transition-colors hover:bg-[#F5F6F6]"
                >
                  <div className="flex size-[64px] items-center justify-center">
                    <img
                      src={tab.icon}
                      alt={tab.text}
                      className="size-[56px] object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium leading-tight text-[#25251F]">{tab.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-[#E0E0E0]" />

        {/* Department filter tabs */}
        <div className="bg-white px-6 py-3">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DEPARTMENT_TABS.map((dept, i) => (
                <button
                  key={dept}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                    i === 0
                      ? "border-[#178841] bg-[#178841] font-medium text-white"
                      : "border-[#D1D5D8] bg-white text-[#25251F] hover:border-[#178841] hover:text-[#178841]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Green promo banner */}
        <div className="px-6 py-6">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex items-center overflow-hidden rounded-xl bg-[#178841]">
              <div className="flex-1 p-8">
                <h3
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                >
                  {PROMO_BANNER.heading}
                </h3>
                <p className="mt-2 text-sm text-white/90">{PROMO_BANNER.text}</p>
                <Button
                  className="mt-4 rounded-[4px] bg-white font-bold text-[#178841] hover:bg-white/90"
                >
                  {PROMO_BANNER.cta}
                </Button>
              </div>
              <div className="hidden shrink-0 md:block">
                <img
                  src={PROMO_BANNER.image}
                  alt="eCom Consumer Giveaway"
                  className="h-[200px] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        <div className="px-6 pb-10">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                Half Price
              </h3>
              <Link href="#" className="flex items-center gap-1 text-sm font-medium text-[#178841] hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {SAMPLE_PRODUCTS.map((product) => (
                <Card key={product.name} className="overflow-hidden border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
                  <CardContent className="p-0">
                    {/* Badge */}
                    <div className="relative">
                      <div className="flex aspect-square items-center justify-center bg-[#F5F6F6] p-4">
                        <img
                          src="/brands/woolworths-com-au/roundel-half-price-yellow.png"
                          alt={product.badge}
                          className="absolute left-2 top-2 size-10"
                        />
                        <ShoppingCart className="size-16 text-[#D1D5D8]" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="mb-1 line-clamp-2 text-sm leading-tight text-[#25251F]">{product.name}</p>
                      <p className="text-xs text-[#616C71]">{product.weight}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#25251F]">{product.price}</span>
                        <span className="text-sm text-[#616C71] line-through">{product.wasPrice}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <button className="flex size-8 items-center justify-center rounded-full bg-[#178841] text-white transition-colors hover:bg-[#00723D]">
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Second section */}
            <Separator className="my-8 bg-[#E0E0E0]" />
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                Everyday Low Price
              </h3>
              <Link href="#" className="flex items-center gap-1 text-sm font-medium text-[#178841] hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {SAMPLE_PRODUCTS.map((product, i) => (
                <Card key={`elp-${i}`} className="overflow-hidden border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="flex aspect-square items-center justify-center bg-[#F5F6F6] p-4">
                        <img
                          src="/brands/woolworths-com-au/icon-everyday-low-price.png"
                          alt="Everyday Low Price"
                          className="absolute left-2 top-2 size-10"
                        />
                        <ShoppingCart className="size-16 text-[#D1D5D8]" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="mb-1 line-clamp-2 text-sm leading-tight text-[#25251F]">{product.name}</p>
                      <p className="text-xs text-[#616C71]">{product.weight}</p>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-[#25251F]">{product.price}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <button className="flex size-8 items-center justify-center rounded-full bg-[#178841] text-white transition-colors hover:bg-[#00723D]">
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WWFooter />
    </div>
  );
}
