import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import {
  ChevronRight,
  ChevronDown,
  Wallet,
  PiggyBank,
  Clock,
  UserPlus,
  Baby,
  Home,
} from "lucide-react";
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

      {/* Hero: full-width background image with text overlay */}
      <div className="relative w-full" style={{ minHeight: 320 }}>
        <img src="/brands/westpac/ba-everyday.png" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#DA1710]/90 via-[#DA1710]/60 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-10">
          <div className="max-w-[500px]">
            <div className="mb-2 flex items-center gap-1 text-sm text-white/80">
              <Link href="#" className="text-white/80 hover:text-white">Personal</Link>
              <ChevronRight className="size-3 text-white/60" />
              <span className="text-white">Bank accounts</span>
            </div>
            <h1
              className="mb-3 text-white"
              style={{ fontFamily: '"Westpac-bold", "Times New Roman", Times, serif', fontSize: 54, fontWeight: 400, lineHeight: "48px" }}
            >
              BANK ACCOUNTS
            </h1>
            <p className="mb-5 max-w-[400px] text-sm leading-6 text-white/90">
              From managing to reaching your money goals, it takes a little Westpac. Get started — browse our range of bank accounts.
            </p>
            <Button className="inline-flex items-center gap-1.5 rounded-[3px] bg-white text-sm font-bold text-[#181B25] hover:bg-white/90">
              Find your fit <ChevronDown className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* I'm looking for: icon tabs */}
      <div className="border-b border-[#DEDEE1] bg-white py-6">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="mb-4 text-lg font-bold text-[#1F1C4F]">I&apos;m looking for</h2>
          <div className="flex gap-6">
            {([
              { label: "Everyday", icon: Wallet },
              { label: "Savings", icon: PiggyBank },
              { label: "Term Deposit", icon: Clock },
              { label: "New to", icon: UserPlus },
              { label: "Youth accounts", icon: Baby },
              { label: "Home Loan", icon: Home },
            ] as const).map(({ label, icon: Icon }) => (
              <button key={label} className="flex flex-col items-center gap-2 rounded-lg px-4 py-2 text-xs text-[#575F65] hover:bg-[#F3F4F6]">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#F3F4F6]">
                  <Icon className="size-5 text-[#DA1710]" />
                </div>
                {label}
              </button>
            ))}
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
