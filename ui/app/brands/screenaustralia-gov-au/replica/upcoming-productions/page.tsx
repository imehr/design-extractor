"use client";

import { SAHeader } from "@/components/brands/screenaustralia-gov-au/sa-header";
import { SAFooter } from "@/components/brands/screenaustralia-gov-au/sa-footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Film, Tv, Gamepad2, FileVideo, ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Production data — exact titles from DOM extraction                */
/* ------------------------------------------------------------------ */

const GROUP_1 = [
  "The Twelve series 3",
  "2.6 Seconds",
  "Ages of Ice",
  "A-Men",
  "Apex",
  "Arrernte Boxing: A Community's Fight",
  "Austin series 3",
  "Bukal Bukal",
  "Careless",
  "Champion",
  "Crones",
  "Crowded House",
  "Dad's House",
  "Death of a Shaman",
  "Dustfall",
  "Family: A True Crime Story",
  "Fish Boi",
  "Garn: The Series",
  "Ghostbusters: Animated Series",
  "Hazbin Hotel series 3",
  "Hip Hop and the Block",
  "Holmewood",
  "The House of Love",
  "Ken Done - Australian Artist",
  "The Killings: Parrish Station",
  "The Mongoose",
  "Mother Courage",
  "My Brilliant Career",
  "My Brother The Monkey King",
  "The Oarsmen",
  "Play Dead",
  "Revealed: Zyzz & Chestbrah: The Poster Boys",
  "Romantic Information",
  "Sand Roads",
  "Tenzing",
];

const GROUP_2 = [
  "TERRA FUTURA: Whatever Happened to Planet Earth",
  "Treasure & Dirt",
  "Universal Basic Guys series 2",
  "Untitled Tommy Wirkola Project",
  "We Are The Ones",
  "A Year at Yumburra",
  "You May Think I'm Joking",
];

const GROUP_3 = [
  "Bully",
  "Crashout",
  "Dark Moon",
  "The Debt",
  "Empire In Colour",
  "Fortitude Valley",
  "Honey Ant Dreamers",
  "Howzat! The Story of Sherbet",
  "In the Dream",
  "InDesign",
  "The Jewel Wasp",
  "Little J & Big Cuz series 5",
  "Martini Mama",
  "Shakedown",
  "Star of the Show",
  "Tik/Croc",
];

const GROUP_4 = [
  "Allen (working title)",
  "Bluebottle",
  "Breakers",
  "Clash of Clans",
  "Colin from Accounts series 3",
  "Empire City",
  "Fireworks",
  "God Bless You, Mr Kopu",
  "Godzilla vs Kong: Supernova",
  "Greyhound 2",
  "Hard As Puck",
  "Home and Away series 39",
  "Insidious 6",
  "The Laugh of Lakshmi",
  "Light - The Ian Roberts Story",
  "The Mark",
  "The Mosquito Bowl",
  "NCIS: Sydney series 3",
  "Saltwater Cowboys of Shark Bay",
  "Separated at Birth",
  "Shiver",
  "Spaceballs 2",
  "Street Fighter",
  "Subversion",
  "Tampa: The Ship that Turned the Tide",
  "Tell Me No Lies: The Real John Pilger",
];

const GROUPS = [
  { label: "In Development", productions: GROUP_1 },
  { label: "Pre-Production", productions: GROUP_2 },
  { label: "In Production", productions: GROUP_3 },
  { label: "Post-Production", productions: GROUP_4 },
];

/* ------------------------------------------------------------------ */
/*  Gradient palette — cycled per card for visual variety             */
/* ------------------------------------------------------------------ */

const GRADIENTS = [
  "from-[#1a1a2e] to-[#16213e]",
  "from-[#0f3460] to-[#1a1a2e]",
  "from-[#1a1a1a] to-[#2d2d3a]",
  "from-[#16213e] to-[#0f3460]",
  "from-[#2d2d3a] to-[#1a1a2e]",
  "from-[#0a0a1a] to-[#16213e]",
  "from-[#1a1a2e] to-[#0a0a1a]",
  "from-[#16213e] to-[#2d2d3a]",
];

const TYPE_ICONS = [Film, Tv, FileVideo, Gamepad2];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function UpcomingProductionsPage() {
  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Header — transparent over hero */}
      <SAHeader variant="transparent" />

      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[420px] items-center justify-center overflow-hidden bg-[#1a1a1a]">
        {/* Parallax-style gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1a1a]/80 to-[#1a1a1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(247,156,31,0.08)_0%,_transparent_70%)]" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          <h1
            className="text-[40px] font-bold leading-tight tracking-tight text-white sm:text-[54px]"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            Upcoming Productions
          </h1>
          <p
            className="max-w-[640px] text-base leading-relaxed text-white/60"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            A snapshot of Australian film, television, documentary and digital
            productions currently in development and production.
          </p>
        </div>

        {/* Scroll-down chevron */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="size-8 text-white/40" />
        </div>
      </section>

      {/* Productions list */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1200px] px-4">
          {GROUPS.map((group, gi) => {
            const Icon = TYPE_ICONS[gi % TYPE_ICONS.length];
            let runningIndex = 0;

            return (
              <div key={group.label} className={gi > 0 ? "mt-16" : ""}>
                {/* Group heading */}
                <div className="mb-8 flex items-center gap-3">
                  <Icon className="size-6 text-[#f79c1f]" />
                  <h2
                    className="text-[28px] font-bold text-[#333]"
                    style={{
                      fontFamily: "'Open Sans Condensed', sans-serif",
                    }}
                  >
                    {group.label}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-[#f79c1f]/10 text-[#f79c1f] hover:bg-[#f79c1f]/20"
                  >
                    {group.productions.length}
                  </Badge>
                </div>

                <Separator className="mb-8 bg-[#eee]" />

                {/* Card grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.productions.map((title) => {
                    const gradientIdx = runningIndex % GRADIENTS.length;
                    runningIndex++;

                    return (
                      <Card
                        key={title}
                        className="group overflow-hidden border border-[#e5e5e5] bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Gradient placeholder image */}
                        <div
                          className={`relative aspect-video bg-gradient-to-br ${GRADIENTS[gradientIdx]}`}
                        >
                          {/* Subtle film-grain overlay */}
                          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />
                          {/* Icon watermark */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Film className="size-10 text-white/10" />
                          </div>
                        </div>

                        {/* Card content */}
                        <div className="p-4">
                          <h3
                            className="text-[18px] font-bold leading-snug text-[#333] transition-colors group-hover:text-[#f79c1f] sm:text-[20px] lg:text-[24px]"
                            style={{
                              fontFamily:
                                "'Open Sans Condensed', sans-serif",
                            }}
                          >
                            {title}
                          </h3>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <SAFooter />
    </div>
  );
}
