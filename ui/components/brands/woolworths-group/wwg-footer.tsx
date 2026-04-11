import Link from "next/link";
import Image from "next/image";

const footerLinksCol1 = [
  { text: "Home", href: "#" },
  { text: "Careers", href: "#" },
  { text: "Community", href: "#" },
  { text: "Sustainability", href: "#" },
  { text: "Reconciliation at Woolworths Group", href: "#" },
  { text: "Stories", href: "#" },
];

const footerLinksCol2 = [
  { text: "Terms and Conditions", href: "#" },
  { text: "Privacy Centre", href: "#" },
  { text: "Privacy policy", href: "#" },
  { text: "Cookies statement", href: "#" },
];

export function WWGFooter() {
  return (
    <footer className="bg-[#0E0D26] text-white">
      {/* Decorative divider */}
      <div className="flex w-full">
        <div className="h-2 flex-1 bg-[#8B2346]" />
        <div className="h-2 flex-1 bg-[#C4A23A]" />
        <div className="h-2 flex-1 bg-[#1971ED]" />
      </div>

      <div className="mx-auto max-w-[1200px] px-10 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-6">
            <Image
              src="/brands/woolworths-group/logo-white.svg"
              alt="Woolworths Group"
              width={120}
              height={48}
            />
            <div>
              <p className="mb-2 text-sm font-semibold">About us</p>
              <p className="text-sm leading-relaxed text-gray-300">
                We are on a mission to deliver the best in convenience, value
                and quality for our customers.
              </p>
            </div>
            <Link
              href="#"
              className="inline-block rounded-lg bg-white px-6 py-2 text-sm font-semibold text-[#0E0D26] transition-opacity hover:opacity-90"
            >
              Learn more
            </Link>
          </div>

          {/* Addresses */}
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold">Postal Address</p>
              <p className="text-sm leading-relaxed text-gray-300">
                PO Box 8000
                <br />
                Baulkham Hills
                <br />
                NSW 2153
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Street Address</p>
              <p className="text-sm leading-relaxed text-gray-300">
                1 Woolworths Way
                <br />
                Bella Vista
                <br />
                NSW 2153
              </p>
            </div>
          </div>

          {/* Links column 1 */}
          <div>
            <ul className="space-y-3">
              {footerLinksCol1.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-white hover:text-gray-300 transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links column 2 */}
          <div>
            <ul className="space-y-3">
              {footerLinksCol2.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Acknowledgement of Country */}
        <div className="mt-16 border-t border-white/10 pt-10">
          <div className="flex gap-8">
            <Image
              src="/brands/woolworths-group/care-deeply.svg"
              alt="Decorative indigenous art"
              width={80}
              height={80}
              className="flex-shrink-0"
            />
            <div className="space-y-4 text-xs leading-relaxed text-gray-400">
              <p>
                Woolworths Group acknowledges the many Traditional Owners of the
                lands across Australia, and pay our respects to their Elders past
                and present. We recognise their strengths and enduring connection
                to lands, waters and skies as the Custodians of the oldest
                continuing cultures on the planet.
              </p>
              <p>
                We are committed to actively contributing to Australia&apos;s
                reconciliation journey through listening and learning, empowering
                more diverse voices, caring deeply for our communities and
                working together for a better tomorrow.
              </p>
              <Link
                href="#"
                className="inline-block text-[#1971ED] hover:underline"
              >
                Read more about our commitment to reconciliation
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-xs text-gray-500">
          &copy;2021 Woolworths Group Limited. All Rights Reserved. ABN 88 000
          014 675.
        </p>
      </div>
    </footer>
  );
}
