import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const NINE_FONT = "'Proxima Nova', Arial, sans-serif";

const FOOTER_LINKS = [
  {
    text: "Careers at Nine",
    href: "https://ninecareers.com.au/",
  },
  {
    text: "Help",
    href: "https://ninehelp.zendesk.com/hc/en-au",
  },
  {
    text: "Terms of Use",
    href: "https://login.nine.com.au/terms?client_id=9nowweb",
  },
  {
    text: "Privacy Policy",
    href: "https://login.nine.com.au/privacy?client_id=9nowweb",
  },
  {
    text: "Advertise with Nine",
    href: "https://www.nineplus.com.au/",
  },
];

export function NineConnectBar() {
  return (
    <section
      className="w-full bg-white"
      style={{ fontFamily: NINE_FONT }}
      data-component="connect-bar"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-10">
        <h1
          className="text-[24px] font-bold"
          style={{ color: "#333" }}
        >
          Connect with us
        </h1>
        <div className="flex items-center gap-4">
          <a
            href="mailto:?subject=Subscribe%20to%20Nine%20Insights"
            className="inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0493DE" }}
          >
            <Mail className="size-4" />
            Subscribe to Nine Insights
          </a>
          <a
            href="https://www.linkedin.com/company/nine-entertainment-co/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0493DE" }}
          >
            <LinkedinIcon className="size-4" />
            Follow us on Linkedin
          </a>
        </div>
      </div>
    </section>
  );
}

export function NineFooter() {
  return (
    <footer
      className="w-full"
      style={{ fontFamily: NINE_FONT, backgroundColor: "rgb(7, 7, 32)" }}
      data-component="footer"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Top section: Logo + nav links */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <Image
            src="/brands/nineforbrands-com-au/site-logo-footer.png"
            alt="Nine"
            width={93}
            height={24}
            className="h-[24px] w-auto"
          />
          <nav className="flex items-center gap-1">
            {FOOTER_LINKS.map((link, idx) => (
              <span key={link.text} className="flex items-center gap-1">
                {idx > 0 && (
                  <span
                    className="text-[13px]"
                    style={{ color: "#F5F5F5" }}
                  >
                    |
                  </span>
                )}
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] transition-colors hover:text-white"
                  style={{ color: "#F5F5F5" }}
                >
                  {link.text}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        {/* Middle section: Acknowledgement + Newsletter */}
        <div className="grid grid-cols-[1fr_auto] gap-12 py-8">
          {/* Acknowledgement */}
          <p
            className="max-w-[720px] text-[12px] leading-[1.6]"
            style={{ color: "#ABABAB" }}
          >
            Acknowledgement: Nine acknowledges the traditional custodians of
            Country, and the connections of First Nations people to the lands and
            waterways on which we work and live. We pay our respects to elders
            past and present, and we commit to listening, learning and acting on
            our journey towards reconciliation.
          </p>

          {/* Newsletter */}
          <div className="flex flex-col items-end gap-3">
            <h5 className="text-[16px] font-semibold text-white">
              Nine Insights, straight to your inbox
            </h5>
            <p
              className="text-[13px]"
              style={{ color: "#ABABAB" }}
            >
              News, Perspective &amp; Opportunity
            </p>
            <a
              href="mailto:?subject=Subscribe%20to%20Nine%20Insights"
              className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0493DE" }}
            >
              <Mail className="size-4" />
              Subscribe Now
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6">
          <p
            className="text-[12px]"
            style={{ color: "#ABABAB" }}
          >
            &copy; 2026 Nine Entertainment Company
          </p>
        </div>
      </div>
    </footer>
  );
}
