import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { UniSuperHeader } from "@/components/brands/unisuper-com-au/unisuper-com-au-header";
import { UniSuperFooter } from "@/components/brands/unisuper-com-au/unisuper-com-au-footer";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const HEADING_FONT = "Tiempos, Georgia, Times, serif";
const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

const SELF_SERVE_ACTIONS = [
  { label: "Update your contact details", href: "#" },
  { label: "Check your balance", href: "#" },
  { label: "Make a withdrawal", href: "#" },
  { label: "Consolidate your super", href: "#" },
];

const CONTACT_METHODS = [
  {
    title: "Chat with us online",
    icon: "/brands/unisuper-com-au/icon-chat.png",
    body: "Get quick answers from our virtual assistant or chat with a real person during business hours.",
    cta: { text: "Chat now", href: "#" },
  },
  {
    title: "Call us",
    icon: "/brands/unisuper-com-au/icon-call-us.svg",
    body: "Monday – Friday, 8:30am – 6:00pm (Melbourne time).",
    phones: [
      { label: "Main (Australia)", number: "1800 331 685", href: "tel:1800331685" },
      { label: "From overseas", number: "+61 3 8831 7901", href: "tel:+61388317901" },
      { label: "TTY via National Relay Service", number: "131 450", href: "tel:131450" },
      { label: "Translating and Interpreting Service", number: "1300 555 727", href: "tel:1300555727" },
      { label: "SMS for the deaf or hard of hearing", number: "0423 677 767", href: "sms:0423677767" },
    ],
  },
  {
    title: "Send us a document",
    icon: "/brands/unisuper-com-au/icon-document-upload.svg",
    body: "Securely upload forms, identification and other documents through your online account.",
    cta: { text: "Upload a document", href: "#" },
  },
  {
    title: "Visit us",
    icon: "/brands/unisuper-com-au/icon-head-office.svg",
    body: "We have offices across Australia. Book a time to meet with our team in person.",
    cta: { text: "View our locations", href: "#" },
  },
];

const MEMBER_QUERIES = [
  {
    title: "Change your investment options",
    body: "Review and update the investment mix of your super or pension.",
    href: "#",
  },
  {
    title: "Update your beneficiaries",
    body: "Nominate who you'd like to receive your super if something happens to you.",
    href: "#",
  },
  {
    title: "Make a complaint",
    body: "Tell us what went wrong — we take every complaint seriously.",
    href: "#",
  },
  {
    title: "Find your super",
    body: "Consolidate lost or multiple super accounts into your UniSuper account.",
    href: "#",
  },
  {
    title: "Access your super",
    body: "Check eligibility and start a lump sum or income withdrawal.",
    href: "#",
  },
  {
    title: "Request a statement",
    body: "Order a member statement or access historic statements online.",
    href: "#",
  },
];

const ADVICE_OPTIONS = [
  {
    title: "Contact UniSuper Advice",
    body:
      "Speak with one of our in-house advisers about your UniSuper account — at no extra cost as a member.",
    cta: { text: "Contact UniSuper Advice", href: "#" },
  },
  {
    title: "Book an appointment",
    body:
      "Choose a time that works for you and meet with an adviser by phone, video or in person.",
    cta: { text: "Book an appointment", href: "#" },
  },
];

const SUPPORT_LINKS = [
  { label: "Forms and documents", href: "#" },
  { label: "Product Disclosure Statements", href: "#" },
  { label: "Accessibility", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Protect your account", href: "#" },
  { label: "Complaints", href: "#" },
];

export default function UniSuperContactUs() {
  return (
    <div
      className="min-h-screen w-full bg-white text-[#112C5C]"
      style={{ fontFamily: BODY_FONT }}
    >
      <UniSuperHeader />

      {/* ================= HERO ================= */}
      <section
        className="relative overflow-hidden bg-[#112C5C]"
        style={{
          backgroundImage: "url(/brands/unisuper-com-au/heading.svg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "auto 120%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#112C5C] via-[#112C5C]/95 to-[#112C5C]/40" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:py-32">
          <nav
            className="mb-6 flex items-center gap-2 text-[13px] text-white/80"
            aria-label="Breadcrumb"
          >
            <Link
              href="/brands/unisuper-com-au/replica"
              className="hover:text-white"
            >
              Home
            </Link>
            <span className="opacity-60">/</span>
            <span>Contact us</span>
          </nav>
          <h1
            className="max-w-3xl text-[44px] leading-[52px] font-semibold text-white md:text-[56px] md:leading-[64px]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Contact us
          </h1>
        </div>
      </section>

      {/* ================= SELF-SERVE ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.3fr]">
            <div>
              <h2
                className="mb-4 text-[32px] leading-[40px] font-normal text-[#112C5C]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Self-serve &ndash; It&rsquo;s faster online
              </h2>
              <p className="mb-8 text-[16px] leading-[26px] text-[#515151]">
                You can manage your super and Flexi Pension anytime with 24/7
                access to your online account. Update your details, check
                your balance and transactions, change your investments, and
                more.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0E71F2] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0a5dc9]"
                >
                  Login
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full border border-[#0E71F2] px-6 py-2.5 text-[14px] font-semibold text-[#0E71F2] transition-colors hover:bg-[#EAF3FF]"
                >
                  Set up online account
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SELF_SERVE_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E5E5E5] bg-white px-6 py-5 transition-all hover:border-[#0E71F2] hover:shadow-sm"
                >
                  <span className="text-[15px] font-semibold text-[#112C5C] group-hover:text-[#0E71F2]">
                    {action.label}
                  </span>
                  <ArrowRight className="size-4 text-[#0E71F2]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= WE'RE HERE TO HELP ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-12 text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            We&rsquo;re here to help
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CONTACT_METHODS.map((m) => (
              <Card
                key={m.title}
                className="flex h-full flex-col rounded-2xl border-0 bg-white p-7 shadow-sm"
              >
                <div className="mb-5 flex size-[64px] items-center justify-center rounded-full bg-[#EAF3FF]">
                  <img src={m.icon} alt="" className="h-9 w-9" />
                </div>
                <h4
                  className="mb-3 text-[20px] leading-[28px] font-normal text-[#112C5C]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  {m.title}
                </h4>
                <p className="mb-5 flex-1 text-[14px] leading-[22px] text-[#515151]">
                  {m.body}
                </p>
                {m.phones ? (
                  <ul className="space-y-2.5 border-t border-[#E5E5E5] pt-4">
                    {m.phones.map((p) => (
                      <li key={p.number}>
                        <div className="text-[12px] text-[#696969]">
                          {p.label}
                        </div>
                        <Link
                          href={p.href}
                          className="text-[16px] font-semibold text-[#0E71F2] hover:underline"
                        >
                          {p.number}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : m.cta ? (
                  <Link
                    href={m.cta.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                  >
                    {m.cta.text}
                    <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HELPFUL MEMBER QUERIES ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-12 text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Helpful member queries
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MEMBER_QUERIES.map((q) => (
              <Link
                key={q.title}
                href={q.href}
                className="group flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 transition-all hover:border-[#0E71F2] hover:shadow-md"
              >
                <h3
                  className="mb-3 text-[20px] leading-[28px] font-normal text-[#112C5C] group-hover:text-[#0E71F2]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  {q.title}
                </h3>
                <p className="mb-5 flex-1 text-[14px] leading-[22px] text-[#515151]">
                  {q.body}
                </p>
                <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0E71F2]">
                  Learn more
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GUIDANCE AND ADVICE ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-12 max-w-3xl">
            <h2
              className="mb-4 text-[32px] leading-[40px] font-normal text-[#112C5C]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Guidance and advice
            </h2>
            <p className="text-[16px] leading-[26px] text-[#515151]">
              Whether you have a specific question or want help building a
              long-term plan, our advisers can help guide you at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {ADVICE_OPTIONS.map((o) => (
              <Card
                key={o.title}
                className="flex flex-col rounded-2xl border-0 bg-white p-8 shadow-sm"
              >
                <h4
                  className="mb-4 text-[24px] leading-[32px] font-normal text-[#112C5C]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  {o.title}
                </h4>
                <p className="mb-6 flex-1 text-[15px] leading-[24px] text-[#515151]">
                  {o.body}
                </p>
                <div>
                  <Link
                    href={o.cta.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0E71F2] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0a5dc9]"
                  >
                    {o.cta.text}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SUPPORT ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-8 text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Support
          </h2>
          <Separator className="mb-8 bg-[#E5E5E5]" />
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            {SUPPORT_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="group flex items-center justify-between border-b border-[#E5E5E5] py-4 transition-colors hover:border-[#0E71F2]"
              >
                <span className="text-[15px] font-normal text-[#112C5C] group-hover:text-[#0E71F2]">
                  {l.label}
                </span>
                <ExternalLink className="size-4 text-[#0E71F2] opacity-60 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FUND INFORMATION CTA ================= */}
      <section className="bg-gradient-to-r from-[#0E71F2] to-[#22828F] py-14 text-white">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[2fr_1fr]">
            <div>
              <h2
                className="mb-3 text-[28px] leading-[36px] font-normal text-white"
                style={{ fontFamily: HEADING_FONT }}
              >
                Fund information
              </h2>
              <p className="text-[15px] leading-[22px] text-white/90">
                ABN: 91 385 943 850 &nbsp;|&nbsp; SPIN: UNI0001AU &nbsp;|&nbsp;
                USI: 91 385 943 850 001 &nbsp;|&nbsp; SFN: 130 250 940
              </p>
            </div>
            <div className="flex justify-start md:justify-end">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-white/90"
              >
                More fund information
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <UniSuperFooter />
    </div>
  );
}
