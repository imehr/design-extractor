import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WWHeader } from "@/components/brands/woolworths-com-au/ww-header";
import { WWFooter } from "@/components/brands/woolworths-com-au/ww-footer";
import { ChevronRight, MessageCircle, Phone } from "lucide-react";

/* ── Extracted from contact-us.json ── */

const PAGE_HEADING = "Contact us";

const SIDE_NAV = [
  "Growing Greener",
  "Fresh Ideas For Everyday Fun",
  "Pet Hub",
];

const INTRO_TEXT = "Need help? Feel free to contact us using the below details or visit our FAQs.";

const CONTACT_METHODS = [
  {
    heading: "Message us 24/7 on the Woolworths App",
    icon: "woolworths-wapple-green",
    description: "Ask Olive, our virtual assistant, to leave a message anytime, any day. Our team members will notify you when we respond.",
    note: "Just make sure to log in to the app.",
  },
  {
    heading: "Chat to us",
    description: "Ask Olive, our virtual assistant, a question any time. If Olive can't help, ask them to put you in touch with our team members during business hours.",
    note: "",
  },
  {
    heading: "Call us",
    description: "Give us a call during business hours. Public holidays may differ.",
    phone: "1800 000 610",
    hours: "Friday: 5am - 10pm (AEST)",
    note: "",
  },
];

const PARTNERS = [
  { name: "Woolworths at Work", logo: "/brands/woolworths-com-au/waw-logo.webp" },
  { name: "Everyday Market", logo: "/brands/woolworths-com-au/everyday-market-logo.svg" },
  { name: "Everyday Insurance", logo: "/brands/woolworths-com-au/everyday-insurance-logo.svg" },
  { name: "Everyday Rewards", logo: "/brands/woolworths-com-au/everyday-rewards-logo.svg" },
  { name: "Everyday Mobile", logo: "/brands/woolworths-com-au/everyday-mobile-logo.svg" },
  { name: "Gift Cards", logo: "/brands/woolworths-com-au/gift-cards-logo.png" },
];

export default function ContactUsPage() {
  return (
    <div
      className="min-h-screen bg-[#EEEEEE]"
      style={{ fontFamily: "Roboto, -apple-system, system-ui, sans-serif", fontSize: 16, color: "#25251F" }}
    >
      <WWHeader activePage="Help" />

      <div className="w-full bg-white">
        <div className="mx-auto flex max-w-[1280px] gap-8 px-6 py-6">
          {/* Side navigation */}
          <aside className="hidden w-[200px] shrink-0 lg:block">
            <nav className="space-y-0 border-l border-[#E0E0E0]">
              {SIDE_NAV.map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="flex items-center gap-2 border-l-2 border-transparent py-2.5 pl-4 text-sm text-[#616C71] transition-colors hover:text-[#178841]"
                >
                  <ChevronRight className="size-3 text-[#178841]" />
                  {item}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <h1
              className="mb-3 text-[32px] font-bold"
              style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
            >
              {PAGE_HEADING}
            </h1>

            <p className="mb-8 text-sm text-[#616C71]">
              {INTRO_TEXT.split("FAQs").map((part, i) =>
                i === 0 ? (
                  <span key={i}>
                    {part}
                    <Link href="#" className="font-medium text-[#178841] hover:underline">FAQs</Link>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>

            {/* Contact method cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Card 1: App messaging */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <img
                      src="/brands/woolworths-com-au/woolworths-wapple-green.svg"
                      alt="Woolworths"
                      className="size-10"
                    />
                  </div>
                  <h3
                    className="mb-3 text-base font-bold"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {CONTACT_METHODS[0].heading}
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-[#616C71]">
                    {CONTACT_METHODS[0].description}
                  </p>
                  <p className="text-sm font-medium text-[#25251F]">
                    {CONTACT_METHODS[0].note}
                  </p>
                </CardContent>
              </Card>

              {/* Card 2: Chat online */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <MessageCircle className="size-10 text-[#178841]" />
                  </div>
                  <h3
                    className="mb-3 text-base font-bold"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {CONTACT_METHODS[1].heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#616C71]">
                    {CONTACT_METHODS[1].description}
                  </p>
                </CardContent>
              </Card>

              {/* Card 3: Call us */}
              <Card className="border border-[#E0E0E0]" style={{ borderRadius: 12 }}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Phone className="size-10 text-[#178841]" />
                  </div>
                  <h3
                    className="mb-3 text-base font-bold"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {CONTACT_METHODS[2].heading}
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-[#616C71]">
                    {CONTACT_METHODS[2].description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-[#616C71]">
                      Online queries:{" "}
                      <Link href="tel:1800000610" className="font-bold text-[#178841] hover:underline">
                        {CONTACT_METHODS[2].phone}
                      </Link>
                    </p>
                    <p className="text-xs text-[#616C71]">
                      {CONTACT_METHODS[2].hours}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-8 bg-[#E0E0E0]" />

            {/* Partners section */}
            <div>
              <h2
                className="mb-6 text-lg font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                Our partners
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                {PARTNERS.map((partner) => (
                  <Link
                    key={partner.name}
                    href="#"
                    className="flex flex-col items-center gap-3 rounded-lg border border-[#E0E0E0] p-4 transition-shadow hover:shadow-md"
                    style={{ borderRadius: 8 }}
                  >
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="h-10 w-auto object-contain"
                    />
                    <span className="text-center text-xs text-[#616C71]">{partner.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WWFooter />
    </div>
  );
}
