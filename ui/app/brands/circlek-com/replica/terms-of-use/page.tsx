import Link from "next/link";
import { CircleKHeader } from "@/components/brands/circlek-com/circlek-com-header";
import { CircleKFooter } from "@/components/brands/circlek-com/circlek-com-footer";

const linkClass = "text-[#DA291C] underline hover:text-[#a01e15]";

export default function TermsOfUsePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'ACT Easy', sans-serif" }}
    >
      <CircleKHeader />

      {/* ── Page Content ── */}
      <main className="py-16">
        <div className="mx-auto max-w-[800px] px-4">
          {/* Title */}
          <h1
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: "#313131",
              lineHeight: "1.2",
            }}
            className="mb-6"
          >
            Terms of Use
          </h1>

          {/* Effective date */}
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-6">
            Effective Date: July 1, 2023 Version 1
          </p>

          {/* Important notice */}
          <p
            style={{ fontSize: 15, fontWeight: 700, color: "#141414", lineHeight: "24px" }}
            className="mb-10"
          >
            IMPORTANT: THESE TERMS OF USE INCLUDE A CLASS ACTION WAIVER AND
            RESOLUTION OF DISPUTES BY ARBITRATION, INSTEAD OF COURT. SEE SECTION
            15 BELOW FOR MORE INFORMATION.
          </p>

          {/* ── Section 1 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            1. USE OF THE SITE
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            The Site is not intended for download, access or use outside of the
            United States. You are responsible for ensuring that your access to or
            use of the Site and the information, content, and other material
            available on or through it (&ldquo;Content&rdquo;) are legal in each
            jurisdiction in or through which you access or use the Site.
          </p>

          {/* ── Section 2 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            2. AMENDMENTS TO THE TERMS; ADDITIONAL TERMS
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            It is your responsibility to review the posted Terms and any
            applicable Additional Terms each time you use the Site. Each time you
            access or use the Site you are entering into a new agreement with us
            on the then-applicable Terms and you agree that we may notify you of
            new Terms by posting them on the Site.
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            In some instances, additional or different terms, posted on the Site,
            apply to your use of certain parts of the Site (individually and
            collectively &ldquo;Additional Terms&rdquo;). To the extent there is a
            conflict between these Terms and any Additional Terms, the Additional
            Terms will control unless the Additional Terms expressly state
            otherwise.
          </p>

          {/* ── Section 3 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            3. LICENSE
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            You agree not to:
          </p>
          <ul
            className="mb-4 list-disc space-y-2 pl-6"
            style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }}
          >
            <li>
              upload, download, post, email, transmit, store or otherwise make
              available any content that is unlawful, harassing, threatening,
              harmful;
            </li>
            <li>
              frame or utilize framing techniques to enclose any Content
              (including any images, text, or page layout);
            </li>
            <li>
              make any modifications to the Content (other than to the extent of
              your specifically permitted use of the Service, if applicable);
            </li>
            <li>
              upload or transmit any computer viruses, Trojan horses, worms or
              anything else designed to interfere with, interrupt or disrupt the
              normal operating procedures of a computer;
            </li>
            <li>
              insert any code or product to manipulate Content in a way that
              adversely affects any user experience to the Site;
            </li>
            <li>
              use Content in a manner that suggests an unauthorized association
              with any of our or our licensors&apos; products, services, or
              brands;
            </li>
            <li>stalk, harass, threaten or harm another;</li>
            <li>
              request personal or other information from anyone, including other
              users of the Site;
            </li>
            <li>
              pretend to be anyone, or any entity, you are not;
            </li>
            <li>plan or engage in any illegal activity.</li>
          </ul>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            Other than set forth explicitly in this Section 3, no other licenses
            or rights are granted to you.
          </p>

          {/* ── Section 4 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            4. CHANGES TO THE SITE
          </h2>

          {/* ── Section 5 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            5. MOBILE, MESSAGING, AND LOCATION-BASED FEATURES
          </h2>
          <h3
            style={{ fontSize: 24, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-6"
          >
            A. LOCATION-BASED FEATURES
          </h3>

          {/* ── Section 6 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            6. COUPONS, OFFERS AND REWARDS
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            Coupons are subject to the terms and conditions on the coupons, in
            addition to these Terms. Only coupons downloaded and reproduced from
            the Site and authentic paper coupons shall be accepted in stores.
            Coupons cannot be used with online orders.
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            Reward program points and rewards are subject to the Additional Terms
            applicable to the program.
          </p>

          {/* ── Section 7 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            7. EXCLUSION AND DISCLAIMER OF WARRANTIES
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            BECAUSE CERTAIN FEDERAL OR STATE LAWS DO NOT PERMIT THE EXCLUSION OF
            CERTAIN WARRANTIES, THESE EXCLUSIONS MAY NOT APPLY TO YOU.
          </p>

          {/* ── Section 8 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            8. USE OF INFORMATION AND ERRORS
          </h2>
          <p style={{ fontSize: 15, fontWeight: 400, color: "#141414", lineHeight: "24px" }} className="mb-4">
            The Content displayed on the Site is provided for informational
            purposes only, unless otherwise stated. Price errors or
            product/service description errors or inaccuracies, including color,
            origin, category or other characteristics may occur. The Company
            reserves the right to correct any such errors.
          </p>

          {/* ── Section 9 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            9. INDEMNIFICATION
          </h2>

          {/* ── Section 10 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            10. LIMITATION OF LIABILITY
          </h2>

          {/* ── Section 11 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            11. INTELLECTUAL PROPERTY RIGHTS
          </h2>

          {/* ── Section 12 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            12. YOUR MATERIAL
          </h2>

          {/* ── Section 13 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            13. SURVEILLANCE
          </h2>

          {/* ── Section 14 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            14. SECURITY OF THE SITE
          </h2>

          {/* ── Section 15 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            15. GOVERNING LAW AND JURISDICTION
          </h2>

          {/* ── Section 16 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            16. SEVERABILITY; INTERPRETATION
          </h2>

          {/* ── Section 17 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            17. INVESTIGATIONS; COOPERATION WITH LAW ENFORCEMENT
          </h2>

          {/* ── Section 18 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            18. ASSIGNMENT
          </h2>

          {/* ── Section 19 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            19. COMPLETE AGREEMENT; NO WAIVER
          </h2>

          {/* ── Section 20 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            20. HEADINGS
          </h2>

          {/* ── Section 21 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            21. NOTICES; QUESTIONS; CUSTOMER SERVICE
          </h2>

          {/* ── Section 22 ── */}
          <h2
            style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}
            className="mb-4 mt-10"
          >
            22. CONTACTING US
          </h2>
        </div>
      </main>

      <CircleKFooter />
    </div>
  );
}
