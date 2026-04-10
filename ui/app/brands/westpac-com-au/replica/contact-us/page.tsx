import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import {
  ChevronRight,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  CreditCard,
  FileWarning,
  RefreshCw,
  Shield,
  Heart,
  Globe,
} from "lucide-react";

// Extracted from actual DOM
const SIDEBAR_LINKS = [
  "Contact Us in the App or call our team",
  "Your Customer Advocate",
  "Your Service Provider Advocate",
  "Personal banking contacts",
  "Business banking contacts",
  "Westpac Group",
  "Social Media",
  "Complaints and Compliments",
];

const QUICK_ACTIONS = [
  { icon: Phone, text: "Call us now", color: "bg-[#DA1710]" },
  { icon: MessageCircle, text: "Chat with us", color: "bg-[#DA1710]" },
  { icon: MapPin, text: "Find a branch or ATM", color: "bg-white border border-[#DA1710] !text-[#DA1710]" },
  { icon: Calendar, text: "Book an appointment", color: "bg-white border border-[#DA1710] !text-[#DA1710]" },
];

const WANT_TO_ITEMS = [
  { icon: CreditCard, text: "Activate physical card" },
  { icon: FileWarning, text: "Report card lost, stolen or damaged" },
  { icon: RefreshCw, text: "Update contact details" },
  { icon: Shield, text: "Report fraud, scam or dispute" },
  { icon: Heart, text: "Get support with tough times" },
];

const CONTACT_GROUPS = [
  { title: "General enquiries", phone: "13 20 32", hours: "Mon-Fri 8am-8pm, Sat-Sun 9am-5pm" },
  { title: "Credit cards", phone: "1300 651 089", hours: "Mon-Fri 8am-8pm, Sat 9am-5pm" },
  { title: "Home loans", phone: "1300 733 421", hours: "Mon-Fri 8am-7pm, Sat 9am-1pm" },
  { title: "Business banking", phone: "1300 130 613", hours: "Mon-Fri 8am-6pm" },
  { title: "Fraud & security", phone: "1300 655 505", hours: "24/7" },
  { title: "Financial difficulty", phone: "1800 067 027", hours: "Mon-Fri 8am-7pm" },
];

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', fontSize: 16, color: "#181B25" }}>
      <WestpacHeader activePage="" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1280px] px-6 py-3">
        <div className="flex items-center gap-1 text-sm text-[#575F65]">
          <Link href="#" className="text-[#575F65] hover:text-[#DA1710]">Home</Link>
          <ChevronRight className="size-3" />
          <span className="text-[#181B25]">Contact us</span>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="mx-auto flex max-w-[1280px] gap-8 px-6">
        {/* Left sidebar */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <nav className="space-y-0">
            {SIDEBAR_LINKS.map((text, i) => (
              <Link
                key={text}
                href="#"
                className={`flex items-center gap-2 border-l-2 py-2.5 pl-4 text-sm ${
                  i === 0
                    ? "border-[#DA1710] font-bold text-[#DA1710]"
                    : "border-transparent text-[#575F65] hover:text-[#DA1710]"
                }`}
              >
                {i > 0 && <ChevronRight className="size-3 text-[#DA1710]" />}
                {text}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex-1">
          {/* Red hero card */}
          <div className="mb-8 flex gap-6 overflow-hidden rounded-2xl bg-[#DA1710]">
            <div className="flex-1 p-8">
              <h1 style={{ fontFamily: '"Westpac-bold", "Times New Roman", Times, serif', fontSize: 42, fontWeight: 400, color: "white", lineHeight: "40px" }}>
                CONTACT US
              </h1>
              <p className="mt-3 max-w-[400px] text-sm leading-6 text-white/90">
                Life moves fast, support should, too — it takes a little Westpac to connect you straight to the relevant team when you contact us through the app.
              </p>
              <Button className="mt-4 rounded-[3px] bg-white text-sm font-bold text-[#181B25] hover:bg-white/90">
                Sign in to contact us
              </Button>
              <div className="mt-6 space-y-2 text-white">
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span className="text-lg font-bold">13 20 32</span>
                </div>
                <p className="text-xs text-white/70">1800 230 144 (from overseas)</p>
              </div>
            </div>
            {/* Quick actions */}
            <div className="hidden w-[200px] shrink-0 space-y-2 bg-white/10 p-6 md:block">
              <p className="mb-2 text-xs font-bold text-white">Quick actions</p>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.text}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white ${a.color}`}
                >
                  <a.icon className="size-4" />
                  {a.text}
                </button>
              ))}
            </div>
          </div>

          {/* I want to... */}
          <div className="mb-10">
            <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">I want to...</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {WANT_TO_ITEMS.map((item) => (
                <Link key={item.text} href="#" className="flex flex-col items-center gap-2 rounded-xl border border-[#DEDEE1] p-4 text-center hover:border-[#DA1710]">
                  <item.icon className="size-6 text-[#575F65]" />
                  <span className="text-xs text-[#181B25]">{item.text}</span>
                </Link>
              ))}
            </div>
          </div>

          <Separator className="mb-10 bg-[#DEDEE1]" />

          {/* How to Contact us in the App */}
          <div className="mb-10">
            <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">How to Contact us in the App</h2>
            <div className="flex gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-bold text-[#1F1C4F]">In the Westpac App</h3>
                  <ol className="space-y-2 text-sm text-[#575F65]">
                    <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DA1710] text-xs font-bold text-white">1</span>Open your Westpac App and sign in</li>
                    <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DA1710] text-xs font-bold text-white">2</span>Tap &apos;Contact us&apos; at the top of the screen</li>
                    <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DA1710] text-xs font-bold text-white">3</span>Choose how you&apos;d like to connect</li>
                  </ol>
                </div>
                <div>
                  <h3 className="mb-3 text-lg font-bold text-[#1F1C4F]">In Online Banking</h3>
                  <ol className="space-y-2 text-sm text-[#575F65]">
                    <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DA1710] text-xs font-bold text-white">1</span>Sign in to Online Banking</li>
                    <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DA1710] text-xs font-bold text-white">2</span>Click &apos;Contact us&apos; in the menu</li>
                  </ol>
                </div>
              </div>
              <div className="hidden w-[200px] shrink-0 md:block">
                <img src="/brands/westpac/contact-app-steps.jpg" alt="Contact us in the app" className="w-full rounded-xl" />
              </div>
            </div>
          </div>

          <Separator className="mb-10 bg-[#DEDEE1]" />

          {/* Other contacts */}
          <div className="mb-10">
            <h2 className="mb-6 text-2xl font-bold text-[#1F1C4F]">Other contacts and support services</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_GROUPS.map((g) => (
                <Card key={g.title} className="border-t-2 border-t-[#DA1710]" style={{ borderRadius: 8 }}>
                  <CardContent className="p-4">
                    <h3 className="mb-1 text-base font-bold text-[#1F1C4F]">{g.title}</h3>
                    <p className="mb-1 text-sm font-bold text-[#181B25]">{g.phone}</p>
                    <p className="text-xs text-[#575F65]">{g.hours}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="mb-10 bg-[#DEDEE1]" />

          {/* SafeCall */}
          <div className="mb-10 flex gap-6 rounded-2xl bg-[#8B1A1A] p-8">
            <div className="flex-1 text-white">
              <h2 className="mb-3 text-2xl font-bold">Turn on SafeCall</h2>
              <p className="text-sm leading-6 text-white/90">
                SafeCall helps you know it&apos;s really Westpac calling. When SafeCall is on, you&apos;ll see a notification in the Westpac App.
              </p>
              <Button className="mt-4 rounded-[3px] bg-white text-sm font-bold text-[#8B1A1A] hover:bg-white/90">
                Find out more about SafeCall
              </Button>
            </div>
          </div>

          {/* Accessibility sections */}
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Globe className="size-5 text-[#1F1C4F]" />
                <h3 className="text-base font-bold text-[#1F1C4F]">Calling from overseas</h3>
              </div>
              <p className="text-sm text-[#575F65]">+61 2 9155 7700</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="size-5 text-[#1F1C4F]" />
                <h3 className="text-base font-bold text-[#1F1C4F]">Remote Indigenous call centre</h3>
              </div>
              <p className="text-sm text-[#575F65]">1800 230 144 (free call)</p>
            </div>
          </div>

          <Separator className="mb-10 bg-[#DEDEE1]" />

          {/* Download app */}
          <div className="mb-10">
            <h2 className="mb-4 text-2xl font-bold text-[#1F1C4F]">Download the Westpac App</h2>
            <div className="flex gap-3">
              <a href="#"><img src="/brands/westpac/store-apple.png" alt="App Store" className="h-10" /></a>
              <a href="#"><img src="/brands/westpac/store-google.jpg" alt="Google Play" className="h-10" /></a>
            </div>
          </div>

          {/* Things you should know */}
          <div className="mb-10 rounded-lg bg-[#F9F9FB] p-6">
            <h3 className="mb-3 text-lg font-bold text-[#1F1C4F]">Things you should know</h3>
            <p className="text-xs leading-5 text-[#808080]">
              This page provides general information only. It does not take your objectives, financial situation or needs into account.
              Westpac Banking Corporation ABN 33 007 457 141 AFSL and Australian credit licence 233714.
            </p>
          </div>
        </div>
      </div>

      <WestpacFooter />
    </div>
  );
}
