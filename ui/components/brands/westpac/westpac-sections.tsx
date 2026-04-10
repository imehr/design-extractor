import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CreditCard,
  BarChart3,
  Home,
  Briefcase,
  DollarSign,
  Phone,
  MapPin,
  FileText,
  ChevronRight,
  Lock,
} from "lucide-react";

/* ── Best Banking App banner ── */
export function BestBankingApp() {
  return (
    <div className="w-full border-t border-[#DEDEE1] bg-white py-8">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex items-center gap-6 rounded-2xl bg-[#F3F4F6] px-8 py-6">
          <div className="flex h-20 shrink-0 items-end gap-1">
            <div className="w-5 rounded-t bg-[#DA1710]" style={{ height: 30 }} />
            <div className="w-5 rounded-t bg-[#DA1710]" style={{ height: 50 }} />
            <div className="w-5 rounded-t bg-[#DA1710]" style={{ height: 70 }} />
            <div className="w-5 rounded-t bg-[#1F1C4F]" style={{ height: 80 }} />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F1C4F]">
              Best Banking App*, three years running
            </p>
            <p className="mt-1 text-sm text-[#575F65]">
              *Awarded by Money magazine 2023, 2024, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Security section ── */
export function SecuritySection() {
  return (
    <div className="w-full bg-white py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <h2 className="mb-8 text-2xl font-bold text-[#1F1C4F]">
          From sketchy to secure with layers and layers of defence
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]">
              <Shield className="size-6 text-[#1F1C4F]" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-[#1F1C4F]">
                Westpac Verify
              </h3>
              <p className="text-sm leading-[22px] text-[#575F65]">
                Westpac Verify with Confirmation of Payee checks the BSB and
                account details of new payees and alerts you to potential scams
                or incorrect information.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]">
              <CreditCard className="size-6 text-[#DA1710]" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-[#1F1C4F]">
                Digital card
              </h3>
              <p className="text-sm leading-[22px] text-[#575F65]">
                Access a digital version of your card through the Westpac App.
                The dynamic CVC changes every 24 hours — making your card
                details even more secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Property investment section ── */
export function PropertyInvestment() {
  const cards = [
    { title: "Investment property", image: "/brands/westpac/invest-property.jpg" },
    { title: "Calculating rental yield", image: "/brands/westpac/invest-rental.jpg" },
    { title: "Home equity for investment", image: "/brands/westpac/invest-equity.jpg" },
    { title: "Investment property costs", image: "/brands/westpac/invest-costs.jpg" },
  ];

  return (
    <div className="w-full bg-[#F3F4F6] py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="max-w-[500px] text-2xl font-bold text-[#1F1C4F]">
            Start the property investment conversation with confidence
          </h2>
          <Link
            href="#"
            className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#DA1710]"
          >
            Start your investment journey
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title}>
              <div className="mb-3 h-40 overflow-hidden rounded-xl">
                <img
                  src={card.image}
                  alt={card.title}
                  className="size-full object-cover"
                />
              </div>
              <Link
                href="#"
                className="text-base font-bold text-[#DA1710] hover:underline"
              >
                {card.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Online Banking Help + Contact App (2-col) ── */
export function HelpAndContact() {
  const helpLinks = [
    "How to set up your digital card",
    "How to use PayTo",
    "How to use Westpac Verify",
  ];

  return (
    <div className="w-full bg-white py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Online Banking Help */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">
              Online Banking Help
            </h2>
            <ul>
              {helpLinks.map((text) => (
                <li key={text} className="border-b border-[#DEDEE1]">
                  <Link
                    href="#"
                    className="flex items-center justify-between py-4 text-base text-[#181B25] hover:text-[#DA1710]"
                  >
                    {text}
                    <ChevronRight className="size-5 text-[#DA1710]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact through the Mention App */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1F1C4F] to-[#DA1710]">
            <CardContent className="flex items-center gap-6 p-8 text-white">
              <div className="flex-1">
                <h2 className="mb-3 text-2xl font-bold text-white">
                  Contact us through the Mention App
                </h2>
                <p className="mb-4 text-sm leading-[22px] text-white/90">
                  Get in touch with us quickly and easily through the Westpac
                  App.
                </p>
                <Button className="rounded-[3px] bg-white text-sm font-bold text-[#1F1C4F] hover:bg-white/90">
                  Learn more
                </Button>
              </div>
              <div className="hidden shrink-0 lg:block">
                <img
                  src="/brands/westpac/contact-app.png"
                  alt="Westpac App"
                  className="h-[200px] w-auto rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Quick help links (3-col) ── */
export function QuickHelpLinks() {
  const items = [
    { icon: Phone, title: "Talk to us", subtitle: "13 20 32" },
    { icon: MapPin, title: "Find your local branch", subtitle: "Locate a branch near you" },
    { icon: FileText, title: "Financial hardship support", subtitle: "We're here to help" },
  ];

  return (
    <div className="w-full bg-[#F3F4F6] py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.title}>
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white">
                <item.icon className="size-6 text-[#DA1710]" />
              </div>
              <h3 className="mb-1 text-base font-bold text-[#1F1C4F]">
                {item.title}
              </h3>
              <p className="text-sm text-[#575F65]">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Things you should know ── */
export function LegalDisclosure() {
  return (
    <div className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1280px] px-6">
        <h3 className="mb-4 text-lg font-bold text-[#1F1C4F]">
          Things you should know
        </h3>
        <p className="text-xs leading-5 text-[#808080]">
          The information on this website is general in nature and has been
          prepared without taking your objectives, needs and overall financial
          situation into account. For this reason, you should consider the
          appropriateness of the information to your own circumstances and, if
          necessary, seek appropriate professional advice. Conditions, fees and
          charges apply.
        </p>
      </div>
    </div>
  );
}

/* ── Security banner (navy) ── */
export function SecurityBanner() {
  return (
    <div className="w-full bg-[#1F1C4F]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Lock className="size-[18px] text-white" />
          <span className="text-sm text-white">
            Stay safe online with our Security Hub — protect your accounts and
            personal information.
          </span>
        </div>
        <Link
          href="#"
          className="whitespace-nowrap text-sm font-bold text-white hover:underline"
        >
          Stay safe online with Security Hub
        </Link>
      </div>
    </div>
  );
}
