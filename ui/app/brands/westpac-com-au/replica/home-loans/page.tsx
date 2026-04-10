import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import { ChevronRight, Users, MapPin, Gift, Smartphone } from "lucide-react";

// All content extracted from DOM
const PRODUCT_CARDS = [
  { title: "Basic variable rate", image: "/brands/westpac/hl-basic.jpg" },
  { title: "1-5 year fixed rate", image: "/brands/westpac/hl-fixed.jpg" },
  { title: "Variable rate with offset", image: "/brands/westpac/hl-offset.jpg" },
  { title: "Sustainable upgrades", image: "/brands/westpac/hl-sustainable.jpg" },
  { title: "Bridging loan", image: "/brands/westpac/hl-bridging.jpg" },
];

const FEATURES = [
  { icon: Users, title: "Simple to get started", desc: "Apply online or book a home lending specialist to help you through the process." },
  { icon: MapPin, title: "A local lender", desc: "Our home lending specialists are based in your community, ready to meet when and where it suits you." },
  { icon: Gift, title: "Rewards & discounts", desc: "Get rewarded for your home loan with exclusive Westpac benefits." },
  { icon: Smartphone, title: "Australia's Best Banking App", desc: "Manage your home loan on the go with the Westpac App." },
];

export default function HomeLoansPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', fontSize: 16, color: "#181B25" }}>
      <WestpacHeader activePage="Personal" />

      {/* Hero */}
      <div className="w-full">
        <div className="mx-auto flex max-w-[1280px]">
          <div className="flex-1 bg-[#DA1710] px-6 py-10">
            <div className="mb-2 flex items-center gap-1 text-sm text-white/80">
              <Link href="#" className="text-white/80 hover:text-white">Personal</Link>
              <ChevronRight className="size-3 text-white/60" />
              <span className="text-white">Home loans</span>
            </div>
            <h1 className="mb-3 text-white" style={{ fontFamily: '"Westpac-bold", "Times New Roman", Times, serif', fontSize: 54, fontWeight: 400, lineHeight: "48px" }}>
              HOME LOANS
            </h1>
            <p className="mb-5 max-w-[400px] text-sm leading-6 text-white/90">
              Compare home loans and rates, use our calculators, and find guides to help you on your property journey.
            </p>
            <div className="flex gap-3">
              <Button className="rounded-[3px] bg-white text-sm font-bold text-[#181B25] hover:bg-white/90">Apply now</Button>
              <Button className="rounded-[3px] border border-white bg-transparent text-sm font-bold text-white hover:bg-white/10">Book a lender</Button>
            </div>
          </div>
          <div className="hidden w-[50%] shrink-0 md:block">
            <img src="/brands/westpac/home-loans-hero.jpg" alt="Home loans" className="size-full object-cover" style={{ minHeight: 280 }} />
          </div>
        </div>
      </div>

      {/* Why choose section */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#1F1C4F]">Why choose a Westpac home loan?</h2>
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
        <h2 className="mb-8 text-2xl font-bold text-[#1F1C4F]">What kind of home loan are you looking for?</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {PRODUCT_CARDS.map((card) => (
            <Card key={card.title} className="overflow-hidden border-[#DEDEE1]" style={{ borderRadius: 16 }}>
              <img src={card.image} alt={card.title} className="h-[160px] w-full object-cover" />
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-[#1F1C4F]">{card.title}</h3>
                <Link href="#" className="mt-2 flex items-center gap-1 text-xs text-[#DA1710]">
                  Learn more <ChevronRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Things you should know */}
      <div className="bg-[#F9F9FB] py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <h3 className="mb-4 text-lg font-bold text-[#1F1C4F]">Things you should know</h3>
          <p className="text-xs leading-5 text-[#808080]">
            Applications for finance are subject to the bank&apos;s normal credit approval. Conditions, fees and charges apply.
            Westpac Banking Corporation ABN 33 007 457 141 AFSL and Australian credit licence 233714.
          </p>
        </div>
      </div>

      <WestpacFooter />
    </div>
  );
}
