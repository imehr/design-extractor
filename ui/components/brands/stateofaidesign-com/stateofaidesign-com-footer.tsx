import Link from "next/link";

const PARTNER_LINKS = [
  { text: "Designer Fund", href: "https://designerfund.com/privacy" },
  { text: "Foundation Capital", href: "https://foundationcapital.com/privacy-policy" },
  { text: "Anthropic", href: "https://anthropic.com/" },
  { text: "Framer", href: "https://www.framer.com/" },
  { text: "Stripe", href: "https://stripe.com/" },
  { text: "Sierra", href: "https://sierra.ai/" },
  { text: "Notion", href: "https://www.notion.com/" },
  { text: "Shopify", href: "https://www.shopify.com/" },
  { text: "Linear", href: "https://linear.app/" },
];

export function StateofaidesignFooter() {
  return (
    <footer
      data-component="footer"
      className="bg-black px-4 pb-8 pt-16 text-white"
    >
      {/* Giant logo text */}
      <div className="mb-12">
        <img
          src="/brands/stateofaidesign-com/ai-in-design.svg"
          alt="AI in Design"
          className="w-full max-w-4xl"
        />
      </div>

      {/* Footer links grid */}
      <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-wider text-white/60">
            Report Partners
          </h4>
          <ul className="space-y-2 text-sm">
            {PARTNER_LINKS.slice(0, 3).map((link) => (
              <li key={link.text}>
                <a
                  href={link.href}
                  className="text-white/80 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-wider text-white/60">
            &nbsp;
          </h4>
          <ul className="space-y-2 text-sm">
            {PARTNER_LINKS.slice(3, 6).map((link) => (
              <li key={link.text}>
                <a
                  href={link.href}
                  className="text-white/80 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-wider text-white/60">
            &nbsp;
          </h4>
          <ul className="space-y-2 text-sm">
            {PARTNER_LINKS.slice(6).map((link) => (
              <li key={link.text}>
                <a
                  href={link.href}
                  className="text-white/80 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-wider text-white/60">
            Report
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#" className="text-white/80 hover:text-white">
                Read the Report
              </Link>
            </li>
            <li>
              <Link href="#" className="text-white/80 hover:text-white">
                Case Studies
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
        <p>&copy;2026 Designer Fund, Foundation Capital. All rights reserved</p>
        <p>Made in Framer by ++hellohello</p>
      </div>
    </footer>
  );
}
