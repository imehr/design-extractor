"use client";

import { Search, SlidersHorizontal, Navigation, ChevronDown } from "lucide-react";
import { CochlearHeader } from "@/components/brands/cochlear-com/cochlear-com-header";
import { CochlearFooter } from "@/components/brands/cochlear-com/cochlear-com-footer";

const HEADING_FONT =
  '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';
const BODY_FONT =
  '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif';

const MEGA_NAV = [
  "Diagnosis and treatment",
  "Products and accessories",
  "Ongoing care and support",
  "Your Cochlear stories",
];

const CLINICS = [
  {
    name: "Broadway Audiology",
    types: "Bone conduction | Adults & Children",
    distance: "1.7 km",
    addressLine1: "Suite 401, 22-36 Mountain Street",
    addressLine2: "ULTIMO, NSW 2007, Australia",
  },
  {
    name: "Precision Hearing - Darlinghurst",
    types: "Cochlear implants, Bone conduction, Vistafix & Hybrid | Adults & Children",
    distance: "2.1 km",
    addressLine1: "3/65A Burton Street",
    addressLine2: "Darlinghurst, NSW 2010, Australia",
  },
  {
    name: "Neurosensory - Darlinghurst",
    types: "Cochlear implants & Bone conduction | Adults & Children",
    distance: "2.1 km",
    addressLine1: "Ground Floor, 67 Burton Street",
    addressLine2: "Darlinghurst, NSW 2010, Australia",
  },
];

export default function FindAClinicReplica() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: BODY_FONT }}>
      <CochlearHeader />

      {/* White spacer to match header height in original */}
      <div className="w-full bg-white" style={{ height: "45px" }} />

      {/* Dark mega-nav bar — matches the original site secondary navigation (~170px tall) */}
      <nav
        className="w-full"
        style={{ background: "#292929", minHeight: "170px" }}
        data-replica-section
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-4 py-6">
          {MEGA_NAV.map((item) => (
            <a
              key={item}
              href="#"
              className="flex items-center gap-1 text-sm text-white/90 hover:text-white"
              style={{ fontFamily: BODY_FONT }}
            >
              {item}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </a>
          ))}
        </div>
      </nav>

      <main>
        {/* Page heading */}
        <section
          className="pt-4 pb-3"
          style={{ background: "#f1f0ef" }}
          data-replica-section
        >
          <div className="mx-auto w-full max-w-[1280px] px-6">
            <h1
              className="mb-1 text-[28px] font-semibold leading-[36px] text-[#56565a]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Find a hearing specialist near you
            </h1>
            <p className="mb-3 text-sm text-[#56565a]" style={{ fontFamily: BODY_FONT }}>
              Quickly access hearing specialists near your location
            </p>

            {/* Search bar */}
            <div className="flex items-center border border-gray-300 bg-white">
              <input
                type="text"
                placeholder="Enter a city, suburb or address to find hearing implant specialists near you"
                className="flex-1 px-4 py-2 text-sm text-[#56565a] outline-none placeholder:text-gray-400"
                style={{ fontFamily: BODY_FONT }}
                readOnly
              />
              <button className="flex items-center px-4 py-2 text-[#56565a]">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Map + Clinic List split — map shows Sydney Harbour (mostly water) */}
        <section
          className="w-full"
          style={{ background: "#f1f0ef" }}
          data-replica-section
        >
          <div className="mx-auto w-full max-w-[1280px] px-6 pb-20">
            <div className="flex overflow-hidden" style={{ height: "575px" }}>
              {/* Map panel — dominated by Sydney Harbour water #8ad8ec */}
              <div className="relative flex-1 overflow-hidden">
                <svg
                  className="h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 940 575"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Base land color */}
                  <rect width="940" height="575" fill="#e8e0cf" />

                  {/* Sydney Harbour - dominant water mass */}
                  {/* Port Jackson / Sydney Harbour water body */}
                  <path
                    d="M0 220 Q120 195 250 210 Q350 220 400 240 Q450 258 500 250 Q580 235 660 245 Q750 255 800 240 Q860 228 940 235 L940 575 L0 575 Z"
                    fill="#8ad8ec"
                  />
                  {/* Extra water north */}
                  <path
                    d="M0 180 Q80 168 160 180 Q220 188 280 178 Q340 168 400 180 L400 575 L0 575 Z"
                    fill="#8ad8ec"
                    opacity="0.7"
                  />

                  {/* Land masses */}
                  {/* Sydney CBD peninsula */}
                  <path
                    d="M480 0 Q510 20 530 60 Q545 100 540 150 Q535 185 520 200 Q500 215 480 210 Q455 205 440 185 Q425 160 430 120 Q435 70 455 30 Z"
                    fill="#e8e0cf"
                  />
                  {/* North Sydney area */}
                  <path
                    d="M500 0 L700 0 L700 120 Q680 140 650 135 Q620 130 600 145 Q580 155 560 145 Q535 132 510 140 Q490 148 480 135 Q465 118 470 90 Q475 50 500 0 Z"
                    fill="#e2d8c6"
                  />
                  {/* Eastern suburbs land */}
                  <path
                    d="M700 0 L940 0 L940 280 Q900 260 850 270 Q800 278 760 265 Q720 252 700 240 L680 180 Q690 90 700 0 Z"
                    fill="#e2d8c6"
                  />

                  {/* Parks/green */}
                  <rect x="350" y="30" width="80" height="60" rx="3" fill="#c9dcb8" />
                  <rect x="680" y="50" width="70" height="55" rx="3" fill="#c9dcb8" />
                  <rect x="180" y="80" width="60" height="45" rx="3" fill="#c5d8b0" />

                  {/* Roads */}
                  <line x1="0" y1="120" x2="940" y2="115" stroke="white" strokeWidth="3.5" />
                  <line x1="0" y1="165" x2="940" y2="160" stroke="white" strokeWidth="2.5" />
                  <line x1="240" y1="0" x2="245" y2="260" stroke="white" strokeWidth="3" />
                  <line x1="430" y1="0" x2="425" y2="210" stroke="white" strokeWidth="2.5" />
                  <line x1="650" y1="0" x2="645" y2="240" stroke="white" strokeWidth="2.5" />
                  <line x1="100" y1="0" x2="102" y2="200" stroke="#f5f0e8" strokeWidth="2" />
                  <line x1="320" y1="0" x2="318" y2="215" stroke="#f5f0e8" strokeWidth="1.5" />

                  {/* Suburb labels */}
                  <text x="260" y="100" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Newtown</text>
                  <text x="120" y="145" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Surry Hills</text>
                  <text x="360" y="142" fontSize="11" fill="#777" fontFamily="Arial,sans-serif" fontWeight="bold">Darlinghurst</text>
                  <text x="340" y="105" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Paddington</text>
                  <text x="160" y="186" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Ultimo</text>
                  <text x="480" y="92" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Woollahra</text>
                  <text x="580" y="195" fontSize="10" fill="#888" fontFamily="Arial,sans-serif">Double Bay</text>
                  <text x="80" y="320" fontSize="9" fill="#aaa" fontFamily="Arial,sans-serif">Glebe</text>
                  <text x="700" y="175" fontSize="9" fill="#aaa" fontFamily="Arial,sans-serif">Rose Bay</text>

                  {/* Water label */}
                  <text x="200" y="390" fontSize="13" fill="#7ab8c8" fontFamily="Arial,sans-serif" fontStyle="italic">Port Jackson</text>
                  <text x="500" y="450" fontSize="12" fill="#7ab8c8" fontFamily="Arial,sans-serif" fontStyle="italic">Sydney Harbour</text>

                  {/* Map pins */}
                  <circle cx="215" cy="172" r="11" fill="#3f1482" stroke="white" strokeWidth="2.5" />
                  <text x="215" y="177" fontSize="9" fill="white" fontFamily="Arial" textAnchor="middle" fontWeight="bold">1</text>
                  <circle cx="375" cy="155" r="10" fill="#fdc82f" stroke="white" strokeWidth="2" />
                  <text x="375" y="159" fontSize="9" fill="#56565a" fontFamily="Arial" textAnchor="middle" fontWeight="bold">2</text>
                  <circle cx="388" cy="170" r="10" fill="#fdc82f" stroke="white" strokeWidth="2" />
                  <text x="388" y="174" fontSize="9" fill="#56565a" fontFamily="Arial" textAnchor="middle" fontWeight="bold">3</text>
                  <circle cx="440" cy="145" r="9" fill="#fdc82f" stroke="white" strokeWidth="2" />
                  <circle cx="305" cy="178" r="9" fill="#fdc82f" stroke="white" strokeWidth="2" />
                  <circle cx="460" cy="120" r="8" fill="#fdc82f" stroke="white" strokeWidth="2" />
                  <circle cx="250" cy="195" r="8" fill="#fdc82f" stroke="white" strokeWidth="2" />

                  {/* Zoom controls */}
                  <rect x="898" y="8" width="30" height="56" rx="2" fill="white" stroke="#ccc" strokeWidth="1" />
                  <line x1="898" y1="36" x2="928" y2="36" stroke="#ccc" strokeWidth="1" />
                  <text x="913" y="28" fontSize="15" fill="#555" fontFamily="Arial" textAnchor="middle">+</text>
                  <text x="913" y="52" fontSize="15" fill="#555" fontFamily="Arial" textAnchor="middle">−</text>

                  {/* Google attribution */}
                  <text x="6" y="566" fontSize="10" fill="#555" fontFamily="Arial,sans-serif">Google</text>
                  <text x="550" y="566" fontSize="9" fill="#666" fontFamily="Arial,sans-serif">Map data ©2026 Google</text>
                  <text x="700" y="566" fontSize="9" fill="#666" fontFamily="Arial,sans-serif">Terms</text>
                  <text x="738" y="566" fontSize="9" fill="#666" fontFamily="Arial,sans-serif">Report a map error</text>
                  <text x="8" y="548" fontSize="9" fill="#888" fontFamily="Arial,sans-serif">Keyboard shortcuts</text>
                </svg>
              </div>

              {/* Clinic results panel */}
              <div
                className="flex flex-col overflow-hidden border-l border-gray-200 bg-white"
                style={{ width: "340px", minWidth: "340px" }}
              >
                {/* Results header */}
                <div className="flex items-center justify-between bg-[#3f1482] px-4 py-3">
                  <span
                    className="text-sm font-medium text-white"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    We&apos;ve found 30 clinics
                  </span>
                  <button
                    className="flex items-center gap-1 rounded border border-white/60 px-3 py-1 text-xs text-white"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Filter
                  </button>
                </div>

                {/* Clinic list */}
                <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
                  {CLINICS.map((clinic, i) => (
                    <div
                      key={i}
                      className="cursor-pointer px-4 py-4 hover:bg-gray-50"
                      data-replica-section
                    >
                      <h3
                        className="mb-1 text-sm font-semibold text-[#3f1482]"
                        style={{ fontFamily: HEADING_FONT }}
                      >
                        {clinic.name}
                      </h3>
                      <p
                        className="mb-2 text-xs leading-snug text-[#56565a]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        {clinic.types}
                      </p>
                      <div className="flex items-start gap-1.5 text-xs text-[#56565a]">
                        <Navigation className="mt-0.5 h-3 w-3 shrink-0 text-[#3f1482]" />
                        <span style={{ fontFamily: BODY_FONT }}>
                          {clinic.distance}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                          {clinic.addressLine1}
                          <br />
                          {clinic.addressLine2}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CochlearFooter />
    </div>
  );
}
