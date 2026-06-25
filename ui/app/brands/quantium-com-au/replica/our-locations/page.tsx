"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";

const LOCATIONS = [
  {
    city: "Sydney",
    lines: [
      "Bay 12",
      "2 Locomotive Street, Eveleigh",
      "New South Wales 2015",
      "Australia",
      "",
      "Phone: +61 2 9292 6400",
    ],
  },
  {
    city: "Melbourne",
    lines: [
      "Level 10",
      "271 Collins Street, Melbourne",
      "Victoria 3000",
      "Australia",
      "",
      "Phone: +61 3 8602 0100",
      "Fax: +61 3 8602 0101",
    ],
  },
  {
    city: "Brisbane",
    lines: [
      "Level 17",
      "144 Edward Street, Brisbane",
      "Queensland 4000",
      "Australia",
      "",
      "Phone: +61 7 3020 2400",
    ],
  },
  {
    city: "Canberra",
    lines: [
      "Suite 519, Level 5",
      "15 Moore Street, Canberra",
      "Australian Capital Territory 2601",
      "Australia",
    ],
  },
  {
    city: "Auckland",
    lines: [
      "Level 10",
      "11 Britomart Place",
      "Auckland 1010",
      "New Zealand",
    ],
  },
  {
    city: "New York",
    lines: [
      "241 Centre St",
      "Suite 7",
      "New York, NY 10013",
      "United States",
    ],
  },
  {
    city: "Nashville",
    lines: [
      "159 4th Ave N",
      "Suite 206",
      "Nashville, TN 37219",
      "United States",
    ],
  },
  {
    city: "Hyderabad",
    lines: [
      "Centaurus by Phoenix",
      "Phase – II, North Block, 2nd Floor",
      "Survey No. 203 P, Manikonda Jagir Village",
      "Rajendranagar Mandal, Ranga Reddy",
      "Hyderabad, Telangana, 500032",
      "India",
      "",
      "Phone: +91 7331135111",
    ],
  },
  {
    city: "Johannesburg",
    lines: [
      "8th Floor, Rosebank Link",
      "173 Oxford Road",
      "Rosebank, Johannesburg 2196",
      "South Africa",
      "",
      "Phone: +27 10 592 1810",
    ],
  },
  {
    city: "Cape Town",
    lines: [
      "1st Floor, WeWork",
      "80 Strand Street",
      "Cape Town City Centre",
      "Cape Town",
      "8001",
      "South Africa",
    ],
  },
  {
    city: "London",
    lines: [
      "Office GRW102, WeWork Office",
      "1 Waterhouse Square",
      "London EC1N 2ST",
      "United Kingdom",
    ],
  },
  {
    city: "Manchester",
    lines: [
      "Suite 5.09, 5th Floor",
      "18 Lower Byrom St",
      "Manchester, M3 4AP",
      "United Kingdom",
    ],
  },
];

export default function OurLocationsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QuantiumHeader />

      {/* ── Hero banner ── */}
      <section className="relative w-full">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden"
          style={{ height: 410 }}
        >
          <img
            src="/brands/quantium-com-au/property-3-a.jpg"
            alt="Our locations"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 text-center">
            <h1
              className="text-[80px] font-normal leading-[80px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Our locations
            </h1>
          </div>
        </div>
      </section>

      {/* ── Global locations ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-12 text-[42px] font-normal leading-[42px] tracking-normal"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Global locations
          </h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {LOCATIONS.map((loc) => (
              <div key={loc.city}>
                <h3
                  className="mb-3 text-[18px] font-medium leading-snug"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  {loc.city}
                </h3>
                <div className="space-y-0.5 text-[14px] font-normal leading-[20px] text-[#333]">
                  {loc.lines.map((line, idx) =>
                    line === "" ? (
                      <br key={idx} />
                    ) : (
                      <p key={idx}>{line}</p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Media Contact ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-4 text-[28px] font-normal leading-[28px] tracking-normal"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Media Contact
          </h2>
          <div className="text-[14px] font-normal leading-[20px] text-[#333]">
            <p className="font-medium">Gloria Lee</p>
            <p>Head of Brand and Communications</p>
            <p>Quantium</p>
            <p>E: glee@quantium.com</p>
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}
