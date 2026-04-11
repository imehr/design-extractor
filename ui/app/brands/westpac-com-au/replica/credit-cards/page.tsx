import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import {
  ChevronRight,
  AlertTriangle,
  Wallet,
  Split,
  Star,
  Smartphone,
  ChevronDown,
  CreditCard,
} from "lucide-react";

// All content extracted from actual DOM
const PRODUCT_CARDS = [
  {
    title: "Rewards cards",
    image: "/brands/westpac/card-rewards.jpg",
    bullets: [
      "Earn reward points on purchases",
      "Access airport lounges",
      "Complimentary insurances",
    ],
    ctaText: "Explore rewards cards",
    ctaPrimary: true,
  },
  {
    title: "Low rate cards",
    image: "/brands/westpac/card-lowrate.jpg",
    bullets: [
      "A lower rate on purchases",
      "Up to 55 days interest free",
      "Balance transfer available",
    ],
    ctaText: "Find a low rate card",
    ctaPrimary: false,
  },
  {
    title: "Low fee card",
    image: "/brands/westpac/card-lowfee.jpg",
    bullets: [
      "Low or no annual fee",
      "Up to 55 days interest free",
      "Balance transfer available",
    ],
    ctaText: "Discover low fee",
    ctaPrimary: false,
  },
];

const FEATURES = [
  { icon: Wallet, title: "Earn bonus Cashback", desc: "Get bonus Cashback when you activate and use your eligible Cashback card." },
  { icon: Split, title: "Split your purchases", desc: "Buy now, pay later with SplitPay on your Westpac Platinum or Altitude card." },
  { icon: Star, title: "Pay with points", desc: "Use your reward points for purchases at millions of online and in-store retailers." },
  { icon: Smartphone, title: "Award winning App", desc: "Manage your card, set limits, lock and unlock, and pay on the go." },
];

const FAQ_ITEMS = [
  "What do I need to apply for a credit card?",
  "How do I apply for a Westpac credit card?",
  "How do I get a credit card?",
  "What is a credit card?",
];

export default function CreditCardsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', fontSize: 16, color: "#181B25" }}>
      <WestpacHeader activePage="Personal" />

      {/* Hero: red bg full-width, photo positioned right */}
      <div className="relative w-full bg-[#DA1710]" style={{ height: 403 }}>
        <img
          src="/brands/westpac/credit-cards-hero.jpg"
          alt="Credit cards"
          className="absolute right-0 top-0 hidden h-full w-[45%] object-cover md:block"
        />
        <div className="relative mx-auto max-w-[1280px] px-[60px] pt-[90px]">
          <div className="max-w-[500px]">
            <div className="mb-2 flex items-center gap-1 text-sm text-white/80">
              <Link href="#" className="text-white/80 hover:text-white">Personal</Link>
              <ChevronRight className="size-3 text-white/60" />
              <span className="text-white">Credit cards</span>
            </div>
            <h1
              className="mb-3 text-white"
              style={{ fontFamily: '"Westpac-bold", "Times New Roman", Times, serif', fontSize: 54, fontWeight: 400, lineHeight: "44px" }}
            >
              CREDIT CARDS
            </h1>
            <p className="mb-5 max-w-[400px] text-sm leading-6 text-white/90">
              Whichever credit card you&apos;re after, you&apos;ll find it with a little Westpac.
            </p>
            <div className="flex gap-3">
              <Button className="inline-flex items-center gap-1.5 rounded-[3px] bg-white text-sm font-bold text-[#181B25] hover:bg-white/90">
                Apply now
                <ChevronDown className="size-3" />
              </Button>
              <Button className="rounded-[3px] border border-white bg-transparent text-sm font-bold text-white hover:bg-white/10">
                Continue application
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mx-auto max-w-[1280px] px-[60px] py-6">
        <div className="border-l border-t border-[#C40000] p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-6 shrink-0 text-[#575F65]" />
            <div>
              <h3 className="text-base font-bold text-[#181B25]">Important Notice</h3>
              <p className="mt-1 text-sm text-[#575F65]">
                From 30 April 2026, we are making changes to some Westpac Credit Card fees including updates to Cash Advance Fee, Missed Payment Fee and the way we charge the Westpac Credit Card Comprehensive Insurance premium. <Link href="#" className="font-bold text-[#DA1710] underline">Find out more</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* I want to: section */}
      <div className="mx-auto max-w-[1280px] px-[60px] py-8">
        <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">I want to:</h2>
        <div className="flex flex-wrap gap-4 md:flex-nowrap">
          {[
            "Earn reward points",
            "Have a low purchase rate",
            "Pay a low annual card fee",
            "Get help choosing a credit card",
            "Compare credit card options",
            "Transfer credit card balances",
          ].map((text) => (
            <Link
              key={text}
              href="#"
              className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-[#DEDEE1] p-4 text-center hover:border-[#DA1710]"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-[#F3F4F6]">
                <CreditCard className="size-5 text-[#575F65]" />
              </div>
              <span className="text-xs text-[#181B25]">{text}</span>
            </Link>
          ))}
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* Why choose section */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#1F1C4F]">
          Why choose a Westpac credit card?
        </h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F3F4F6]">
                <f.icon className="size-6 text-[#DA1710]" />
              </div>
              <h3 className="mb-2 text-base font-bold text-[#1F1C4F]">{f.title}</h3>
              <p className="text-sm text-[#575F65]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* Product cards */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <h2 className="mb-8 text-2xl font-bold text-[#1F1C4F]">
          Find a Westpac credit card that&apos;s right for you
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRODUCT_CARDS.map((card) => (
            <Card key={card.title} className="overflow-hidden border-[#DEDEE1]" style={{ borderRadius: 16 }}>
              <img src={card.image} alt={card.title} className="h-[200px] w-full object-cover" />
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-[#1F1C4F]">{card.title}</h3>
                <ul className="mb-6 space-y-2">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[#575F65]">
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#DA1710]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-[3px] text-sm font-bold ${
                    card.ctaPrimary
                      ? "bg-[#DA1710] text-white hover:bg-[#C21410]"
                      : "border border-[#DA1710] bg-white text-[#DA1710] hover:bg-[#FEF2F2]"
                  }`}
                >
                  {card.ctaText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* FAQ */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">Frequently asked questions</h2>
        <div className="space-y-0">
          {FAQ_ITEMS.map((q) => (
            <details key={q} className="group border-b border-[#DEDEE1]">
              <summary className="flex cursor-pointer items-center justify-between py-4 text-base text-[#181B25]">
                {q}
                <ChevronDown className="size-5 text-[#DA1710] transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm text-[#575F65]">
                Information about this topic is available on our website or by contacting us.
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Things you should know */}
      <div className="bg-[#F9F9FB] py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <h3 className="mb-4 text-lg font-bold text-[#1F1C4F]">Things you should know</h3>
          <p className="text-xs leading-5 text-[#808080]">
            Credit card applications are subject to the bank&apos;s normal lending criteria. Conditions, fees and charges apply. Westpac Banking Corporation ABN 33 007 457 141 AFSL and Australian credit licence 233714.
          </p>
        </div>
      </div>

      <WestpacFooter />
    </div>
  );
}
