import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, Phone } from "lucide-react";

const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';
const HEADING_FONT = "Tiempos, Georgia, Times, serif";

const QUICK_LINKS = [
  { text: "Why UniSuper", href: "#" },
  { text: "Forms and documents", href: "#" },
  { text: "Investment performance", href: "#" },
  { text: "Careers", href: "#" },
  { text: "Screenshare", href: "#" },
];

const SOCIAL = [
  { alt: "LinkedIn", src: "/brands/unisuper-com-au/linkedin.svg", href: "#" },
  { alt: "Instagram", src: "/brands/unisuper-com-au/instagram.svg", href: "#" },
  { alt: "YouTube", src: "/brands/unisuper-com-au/youtube.svg", href: "#" },
  { alt: "Facebook", src: "/brands/unisuper-com-au/facebook.svg", href: "#" },
];

const LEGAL_LINKS = [
  { text: "Terms and conditions", href: "#" },
  { text: "Important information", href: "#" },
  { text: "Privacy", href: "#" },
  { text: "Protect your account", href: "#" },
  { text: "Disclosures", href: "#" },
  { text: "Accessibility", href: "#" },
  { text: "PDS and TMD", href: "#" },
];

export function UniSuperFooter() {
  return (
    <footer
      className="w-full bg-[#14274F] text-white"
      style={{ fontFamily: BODY_FONT }}
      data-component="footer"
    >
      {/* Scroll to top */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] justify-end px-6 py-3">
          <button
            className="flex items-center gap-2 text-[13px] font-semibold text-white/80 transition-colors hover:text-white"
            aria-label="Scroll to top"
          >
            Scroll to top
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 py-14">
        {/* Top section: Get in touch + Quick links + Social */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Get in touch */}
          <div>
            <h3
              className="mb-5 text-[24px] font-normal text-white"
              style={{ fontFamily: HEADING_FONT }}
            >
              Get in touch
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-[15px] text-white/80 transition-colors hover:text-white"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="tel:1800331685"
                  className="flex items-center gap-2 text-[20px] font-semibold text-white"
                >
                  <Phone className="size-5" />
                  1800 331 685
                </Link>
              </li>
              <li className="text-[14px] text-white/70">
                Monday - Friday
                <br />
                8.30am - 6.00pm (Melbourne time)
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3
              className="mb-5 text-[24px] font-normal text-white"
              style={{ fontFamily: HEADING_FONT }}
            >
              Quick links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-white/80 transition-colors hover:text-white"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + Acknowledgement */}
          <div>
            <h3
              className="mb-5 text-[24px] font-normal text-white"
              style={{ fontFamily: HEADING_FONT }}
            >
              Follow us
            </h3>
            <div className="mb-8 flex items-center gap-4">
              {SOCIAL.map((s) => (
                <a
                  key={s.alt}
                  href={s.href}
                  aria-label={s.alt}
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <img src={s.src} alt={s.alt} className="size-5 invert" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <img
                src="/brands/unisuper-com-au/australian_aboriginal_flag.svg"
                alt="Australian Aboriginal Flag"
                className="h-[22px] w-[37px]"
              />
              <img
                src="/brands/unisuper-com-au/flag_of_the_torres_strait_islanders.svg"
                alt="Flag of the Torres Strait Islanders"
                className="h-[22px] w-[33px]"
              />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-white/60">
              UniSuper acknowledges the Traditional Custodians of the lands on
              which we work and pays respect to Elders past and present.
            </p>
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        {/* Legal */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((link, idx) => (
            <span key={link.text} className="flex items-center gap-5">
              {idx > 0 && <span className="text-white/20">|</span>}
              <Link
                href={link.href}
                className="text-[13px] text-white/70 transition-colors hover:text-white"
              >
                {link.text}
              </Link>
            </span>
          ))}
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-white/60">
          UniSuper Management Pty Ltd ABN 91 006 961 799 AFSL No. 235907 is the
          administrator of the fund and the issuer of this information on
          behalf of the trustee, UniSuper Limited ABN 54 006 027 121 AFSL No.
          492806.{" "}
          <Link
            href="#"
            className="text-white/80 underline transition-colors hover:text-white"
          >
            Read the full disclaimer
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
