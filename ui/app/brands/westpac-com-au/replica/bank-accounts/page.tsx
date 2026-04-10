import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Extracted from DOM
const ACCOUNT_TYPES = [
  { title: "Everyday banking", image: "/brands/westpac/ba-everyday.png", desc: "Transaction accounts for your everyday spending and saving." },
  { title: "Savings accounts", image: "/brands/westpac/ba-transaction.png", desc: "Grow your savings with competitive interest rates." },
];

export default function BankAccountsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', fontSize: 16, color: "#181B25" }}>
      <WestpacHeader activePage="Personal" />

      {/* Hero */}
      <div className="w-full bg-[#DA1710]">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <div className="mb-2 flex items-center gap-1 text-sm text-white/80">
            <Link href="#" className="text-white/80 hover:text-white">Personal</Link>
            <ChevronRight className="size-3 text-white/60" />
            <span className="text-white">Bank accounts</span>
          </div>
          <h1 className="mb-3 text-white" style={{ fontFamily: '"Westpac-bold", "Times New Roman", Times, serif', fontSize: 54, fontWeight: 400, lineHeight: "48px" }}>
            BANK ACCOUNTS
          </h1>
          <p className="mb-5 max-w-[500px] text-base leading-6 text-white/90">
            Everyday transaction accounts and savings accounts to help you manage your money.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-[#DEDEE1] bg-white py-4">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-6">
          <span className="text-sm font-bold text-[#1F1C4F]">I&apos;m looking for:</span>
          <div className="relative flex-1 max-w-md">
            <Input placeholder="Search bank accounts..." className="rounded-[3px] border-[#DEDEE1] pr-10" />
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#575F65]" />
          </div>
        </div>
      </div>

      {/* Account types */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {ACCOUNT_TYPES.map((acct) => (
            <Card key={acct.title} className="overflow-hidden border-[#DEDEE1]" style={{ borderRadius: 16 }}>
              <div className="flex">
                <div className="flex-1 p-6">
                  <h2 className="mb-2 text-xl font-bold text-[#1F1C4F]">{acct.title}</h2>
                  <p className="mb-4 text-sm text-[#575F65]">{acct.desc}</p>
                  <Link href="#" className="flex items-center gap-1 text-sm font-bold text-[#DA1710]">
                    Explore accounts <ChevronRight className="size-4" />
                  </Link>
                </div>
                <div className="hidden w-[200px] shrink-0 md:block">
                  <img src={acct.image} alt={acct.title} className="size-full object-cover" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* Managing accounts section */}
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">Managing your bank account</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Choose a bank account",
            "How to switch banks",
            "Bank account fees",
            "Bank and eldercare",
          ].map((title) => (
            <Link key={title} href="#" className="flex items-center justify-between rounded-lg border border-[#DEDEE1] p-4 hover:border-[#DA1710]">
              <span className="text-sm text-[#181B25]">{title}</span>
              <ChevronRight className="size-4 text-[#DA1710]" />
            </Link>
          ))}
        </div>
      </div>

      {/* Contact section */}
      <div className="bg-[#F3F4F6] py-10">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#1F1C4F]">Need help?</h2>
          <p className="mb-4 text-sm text-[#575F65]">Call us on <strong>1300 658 174</strong></p>
          <Button className="rounded-[3px] bg-[#DA1710] text-sm font-bold text-white hover:bg-[#C21410]">
            Book an appointment
          </Button>
        </div>
      </div>

      {/* Things you should know */}
      <div className="bg-[#F9F9FB] py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <h3 className="mb-4 text-lg font-bold text-[#1F1C4F]">Things you should know</h3>
          <p className="text-xs leading-5 text-[#808080]">
            Conditions, fees and charges apply. Westpac Banking Corporation ABN 33 007 457 141 AFSL and Australian credit licence 233714.
          </p>
        </div>
      </div>

      <WestpacFooter />
    </div>
  );
}
