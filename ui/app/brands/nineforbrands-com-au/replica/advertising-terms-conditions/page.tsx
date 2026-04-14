import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { NineHeader } from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-header";
import {
  NineConnectBar,
  NineFooter,
} from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-footer";

const REPLICA_PREFIX = "/brands/nineforbrands-com-au/replica";

const DOCUMENT_LINKS = [
  {
    text: "Nine Digital Advertising Standards Policy 2023",
    href: "https://www.nineforbrands.com.au/wp-content/uploads/2023/08/Nine-Digital-Advertising-Standards-Policy-2023.pdf",
    external: true,
  },
  {
    text: "Consolidated Nine Advertising Terms & Conditions",
    href: "https://www.nineforbrands.com.au/wp-content/uploads/2024/07/Consolidated-Nine-Advertising-Terms-Conditions.pdf",
    external: true,
  },
  {
    text: "Credit Application",
    href: "https://nine.applyeasy.com.au/credit",
    external: true,
  },
  {
    text: "Advertising Brand Safety Policy",
    href: `${REPLICA_PREFIX}/advertising-brand-safety-policy/`,
    external: false,
  },
  {
    text: "Futurewomen.com Advertising Terms & Conditions",
    href: `${REPLICA_PREFIX}/futurewomen-advertising-terms-conditions/`,
    external: false,
  },
  {
    text: "Creative Services Terms & Conditions",
    href: "https://www.nineforbrands.com.au/wp-content/uploads/2023/08/Creative-Services-Terms-Conditions.pdf",
    external: true,
  },
  {
    text: "Digital Creative and Trackers Policy",
    href: `${REPLICA_PREFIX}/digital-creative-trackers-policy/`,
    external: false,
  },
  {
    text: "Warner Bros Discovery - Acceptable Advertising policy",
    href: "https://www.nineforbrands.com.au/wp-content/uploads/2023/11/WBD-Acceptable-Advertising-Policy.pdf",
    external: true,
  },
];

const SIDEBAR_ARTICLES = [
  {
    title: "Andrew: The Downfall of a Prince",
    bg: "#0493DE",
  },
  {
    title:
      "9Now Enters its 'Flex' Era: Australia's First Micro-Reality Obsession Has Arrived",
    bg: "#00B7CD",
  },
  {
    title: "A Nation Defined: Events That Changed Australia",
    bg: "#070720",
  },
];

export default function AdvertisingTermsConditionsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: '"Proxima Nova", Arial, sans-serif',
        fontSize: 16,
        color: "#333333",
      }}
    >
      {/* Header - light variant */}
      <NineHeader variant="light" />

      {/* Main content area */}
      <main className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px]">
          {/* Left column - Document links */}
          <div>
            <h1
              className="mb-10 text-[48px] font-[400] leading-[67.2px]"
              style={{ color: "#333" }}
            >
              Advertising Terms &amp; Conditions
            </h1>

            <ul className="flex flex-col gap-4">
              {DOCUMENT_LINKS.map((doc) =>
                doc.external ? (
                  <li key={doc.text} className="flex items-start gap-3">
                    <FileText
                      className="mt-0.5 size-5 shrink-0"
                      style={{ color: "#0493DE" }}
                    />
                    <a
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[18px] font-[400] leading-[1.6] transition-colors hover:underline"
                      style={{ color: "#0493DE" }}
                    >
                      {doc.text}
                      <ExternalLink className="ml-1.5 mb-0.5 inline size-3.5" />
                    </a>
                  </li>
                ) : (
                  <li key={doc.text} className="flex items-start gap-3">
                    <FileText
                      className="mt-0.5 size-5 shrink-0"
                      style={{ color: "#0493DE" }}
                    />
                    <Link
                      href={doc.href}
                      className="text-[18px] font-[400] leading-[1.6] transition-colors hover:underline"
                      style={{ color: "#0493DE" }}
                    >
                      {doc.text}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Right column - More in Media Releases sidebar */}
          <aside>
            <h2
              className="mb-6 text-[31px] font-[800]"
              style={{ color: "#008FE2" }}
            >
              More in Media Releases
            </h2>

            <div className="flex flex-col gap-6">
              {SIDEBAR_ARTICLES.map((article) => (
                <Link
                  key={article.title}
                  href="#"
                  className="group block overflow-hidden rounded-lg"
                >
                  {/* Placeholder image */}
                  <div
                    className="flex h-[180px] items-center justify-center"
                    style={{ backgroundColor: article.bg }}
                  >
                    <span className="text-[14px] font-medium text-white/60">
                      Article image
                    </span>
                  </div>
                  {/* Title */}
                  <h3
                    className="mt-3 text-[18px] font-[700] leading-[1.4] transition-colors group-hover:text-[#0493DE]"
                    style={{ color: "#333" }}
                  >
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </main>

      {/* Connect with us bar */}
      <NineConnectBar />

      {/* Footer */}
      <NineFooter />
    </div>
  );
}
