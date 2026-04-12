import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WWHeader } from "@/components/brands/woolworths-com-au/ww-header";
import { WWFooter } from "@/components/brands/woolworths-com-au/ww-footer";
import {
  Search,
  ChevronRight,
  Package,
  Truck,
  RotateCcw,
  Gift,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  User,
  Sparkles,
  Phone,
  MessageCircle,
  Smartphone,
  LogIn,
} from "lucide-react";

/* ── Extracted from help.json ── */

const PAGE_HEADING = "How can we help?";

const SEARCH_PLACEHOLDER = "Ask anything";

const SUGGESTED_QUESTIONS = [
  "What do I do if I have an item missing from my order?",
  "What happens if I receive a wrong item?",
  "Can I change my Pick up or Delivery time?",
  "How do I get a refund?",
  "How do I track my order?",
  "How do I change my order?",
];

const LOGIN_CTA = {
  heading: "Get help with your orders",
  text: "Log in to track deliveries, view your order history, request refunds and get personalised support.",
  cta: "Log in",
};

const BROWSE_TOPICS = [
  { title: "Manage your order", description: "Help placing, tracking, changing or cancelling your order", href: "/shop/help/order", icon: Package },
  { title: "Delivery, pick up & stores", description: "Delivery windows, pick up, direct to boot & store information", href: "/shop/help/delivery-pickup-stores", icon: Truck },
  { title: "Returns, refunds & missing items", description: "Missing items, damaged goods & refund requests", href: "/shop/help/returns-refunds-missing-items", icon: RotateCcw },
  { title: "Everyday Rewards & offers", description: "Link your card, check points, boost offers & member prices", href: "/shop/help/rewards-offers", icon: Gift },
  { title: "Feedback", description: "Share your feedback about your shopping experience", href: "/shop/help/feedback", icon: MessageSquare },
  { title: "Subscriptions", description: "Everyday Extra benefits & subscription management", href: "/shop/help/subscriptions", icon: Sparkles },
  { title: "Products, Brands & Woolworths Partners", description: "Everyday Market, The Bunch, business ordering & product safety", href: "/shop/help/product-brands-partners", icon: Package },
  { title: "Safety & important information", description: "Product recalls, scam protection, Terms & Conditions, user manuals and more", href: "/shop/help/safety", icon: AlertTriangle },
  { title: "Account, security & privacy", description: "Personal details, password resets, data privacy & two-factor authentication (2FA)", href: "/shop/help/account-security-privacy", icon: ShieldCheck },
  { title: "Payments & gift cards", description: "Payment methods, saved cards & gift card redemption", href: "/shop/help/payments-gift-cards", icon: CreditCard },
];

const CONTACT_SECTION = {
  chatWithOlive: {
    responseTime: "Instant response",
    availability: "24/7 AI support for orders, refunds, tracking, and more",
    cta: "Chat now",
  },
  messageOnApp: {
    responseTime: "Response within 24 hours (from 9am - 5pm)",
    description: "Skip the call queue, leave a message anytime, even when we're offline",
  },
  phone: {
    waitTime: "Typically 20-30 minutes wait time",
    onlineQueries: {
      number: "1800 000 610",
      hours: {
        monFri: "5am - 5pm (AEDT)",
        saturday: "5am - 10:30pm (AEDT)",
        sunday: "5am - 10pm (AEDT)",
      },
    },
    instoreQueries: {
      number: "1300 767 969",
      hours: {
        monFri: "9am - 7pm (AEDT)",
        satSun: "10am - 4pm (AEDT)",
      },
    },
  },
};

export default function HelpPage() {
  return (
    <div
      className="min-h-screen bg-[#EEEEEE]"
      style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif", fontSize: 16, color: "#25251F" }}
    >
      <WWHeader activePage="Help" />

      <div className="w-full">
        {/* Hero section with search */}
        <div className="bg-white px-6 pb-8 pt-10">
          <div className="mx-auto max-w-[720px] text-center">
            <h1
              className="mb-6 text-[32px] font-bold"
              style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
            >
              {PAGE_HEADING}
            </h1>

            {/* AI search bar */}
            <div className="relative mx-auto max-w-[600px]">
              <div className="relative flex items-center">
                <Search className="absolute left-4 size-5 text-[#616C71]" />
                <Input
                  placeholder={SEARCH_PLACEHOLDER}
                  className="h-12 rounded-full border-[#D1D5D8] pl-12 pr-20 text-base shadow-sm focus-visible:border-[#178841] focus-visible:ring-[#178841]"
                  readOnly
                />
                <Badge
                  className="absolute right-3 bg-[#178841] text-[10px] font-medium text-white hover:bg-[#178841]"
                  style={{ borderRadius: 4 }}
                >
                  AI Beta
                </Badge>
              </div>
              <p className="mt-2 text-xs text-[#616C71]">Try asking</p>
            </div>

            {/* Suggested questions */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <Link
                  key={q}
                  href="#"
                  className="rounded-full border border-[#D1D5D8] px-4 py-2 text-sm text-[#25251F] transition-colors hover:border-[#178841] hover:text-[#178841]"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Login CTA section */}
        <div className="px-6 py-6">
          <div className="mx-auto max-w-[1280px]">
            <Card className="border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
              <CardContent className="flex items-center gap-6 p-6">
                <div className="hidden shrink-0 md:block">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#F5F6F6]">
                    <LogIn className="size-6 text-[#178841]" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {LOGIN_CTA.heading}
                  </h2>
                  <p className="mt-1 text-sm text-[#616C71]">{LOGIN_CTA.text}</p>
                </div>
                <Button className="shrink-0 rounded-[4px] bg-[#178841] font-bold text-white hover:bg-[#00723D]">
                  {LOGIN_CTA.cta}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Browse topics grid */}
        <div className="px-6 pb-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {BROWSE_TOPICS.map((topic) => (
                <Link key={topic.title} href={topic.href}>
                  <Card className="h-full border border-[#E0E0E0] transition-shadow hover:shadow-md" style={{ borderRadius: 12 }}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F6]">
                        <topic.icon className="size-5 text-[#178841]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-1 text-sm font-bold text-[#25251F]">{topic.title}</h3>
                        <p className="text-xs leading-relaxed text-[#616C71]">{topic.description}</p>
                      </div>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-[#D1D5D8]" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-[#E0E0E0]" />

        {/* Contact section */}
        <div className="px-6 py-8">
          <div className="mx-auto max-w-[1280px]">
            <h2
              className="mb-6 text-center text-xl font-bold"
              style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
            >
              Still need help? Get in touch
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Chat with Olive */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <MessageCircle className="size-8 text-[#178841]" />
                  </div>
                  <h3 className="mb-1 text-base font-bold">Chat with Olive</h3>
                  <p className="mb-1 text-xs font-medium text-[#178841]">{CONTACT_SECTION.chatWithOlive.responseTime}</p>
                  <p className="mb-4 text-sm text-[#616C71]">{CONTACT_SECTION.chatWithOlive.availability}</p>
                  <Button className="w-full rounded-[4px] bg-[#178841] font-bold text-white hover:bg-[#00723D]">
                    {CONTACT_SECTION.chatWithOlive.cta}
                  </Button>
                </CardContent>
              </Card>

              {/* Message on App */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Smartphone className="size-8 text-[#178841]" />
                  </div>
                  <h3 className="mb-1 text-base font-bold">Message on the App</h3>
                  <p className="mb-1 text-xs font-medium text-[#178841]">{CONTACT_SECTION.messageOnApp.responseTime}</p>
                  <p className="text-sm text-[#616C71]">{CONTACT_SECTION.messageOnApp.description}</p>
                </CardContent>
              </Card>

              {/* Call us */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Phone className="size-8 text-[#178841]" />
                  </div>
                  <h3 className="mb-1 text-base font-bold">Call us</h3>
                  <p className="mb-3 text-xs text-[#616C71]">{CONTACT_SECTION.phone.waitTime}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-bold text-[#25251F]">Online queries</p>
                      <p className="text-sm font-medium text-[#178841]">{CONTACT_SECTION.phone.onlineQueries.number}</p>
                      <p className="text-xs text-[#616C71]">Mon-Fri: {CONTACT_SECTION.phone.onlineQueries.hours.monFri}</p>
                      <p className="text-xs text-[#616C71]">Saturday: {CONTACT_SECTION.phone.onlineQueries.hours.saturday}</p>
                      <p className="text-xs text-[#616C71]">Sunday: {CONTACT_SECTION.phone.onlineQueries.hours.sunday}</p>
                    </div>
                    <Separator className="bg-[#E0E0E0]" />
                    <div>
                      <p className="text-sm font-bold text-[#25251F]">In-store queries</p>
                      <p className="text-sm font-medium text-[#178841]">{CONTACT_SECTION.phone.instoreQueries.number}</p>
                      <p className="text-xs text-[#616C71]">Mon-Fri: {CONTACT_SECTION.phone.instoreQueries.hours.monFri}</p>
                      <p className="text-xs text-[#616C71]">Sat-Sun: {CONTACT_SECTION.phone.instoreQueries.hours.satSun}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <WWFooter />
    </div>
  );
}
