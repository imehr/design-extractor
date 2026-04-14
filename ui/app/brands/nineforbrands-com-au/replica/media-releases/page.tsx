import { NineHeader } from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-header";
import {
  NineConnectBar,
  NineFooter,
} from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-footer";

const ARTICLES = [
  {
    title: "Andrew: The Downfall of a Prince",
    excerpt:
      "THE INSIDE STORY OF THE RECKONING OF ANDREW MOUNTBATTEN-WINDSOR WEDNESDAY, APRIL 15, AT 8.40PM ON CHANNEL 9 & 9NOW The 9Network presents Andrew: The Downfall of a Prince, at 8.40pm Wednesday, April 15, on Channel 9 and 9Now. This hour-long special reviews the life of the once royal favourite Andrew",
    accent: "#0493DE",
  },
  {
    title:
      "9Now Enters its 'Flex' Era: Australia's First Micro-Reality Obsession Has Arrived",
    excerpt:
      "SPECIAL SNEAK PEEK AVAILABLE ON 9NOW FULL ACCESS EPISODES DROP EVERY FRIDAY FROM FRIDAY, APRIL 24 Ditch the oat flat white and cancel your pilates session: 9Now has officially joined the FLEX movement, dropping full access episodes of Australia's first micro-reality series weekly from Friday, April 2",
    accent: "#00B7CD",
  },
  {
    title: "A Nation Defined: Events That Changed Australia",
    excerpt:
      "NEW SERIES CONTINUES WEDNESDAY, APRIL 15, AT 7.30PM ON CHANNEL 9 & 9NOW Witness like never before the defining moments that shaped our nation and rocked its people to their core, when the groundbreaking new series Events That Changed Australia continues, Wednesday, April 15, at 7.30pm on Channel 9 an",
    accent: "#6B3FA0",
  },
  {
    title: "BBC News Channel Launches on 9Now",
    excerpt:
      "The 9Network today announced that 9Now will bolster its live content offering with the addition of the BBC News channel. This expansion of live content, through a long-standing partnership with BBC Studios, provides Australian audiences with 24-hour access on 9Now to one of the world's most trusted ",
    accent: "#D4002A",
  },
  {
    title:
      "The Floor Returns: Australia's Biggest Game Just Went Next Level",
    excerpt:
      "81 CONTESTANTS. ONE GIANT ARENA. $200,000 ON THE LINE After becoming Australia's number one new show of 2025 and delivering the biggest debut in VOZ history*, the hit trivia phenomenon The Floor is returning to the 9Network. Bigger, bolder and more ruthless, the high-stakes showdown premieres Sunda",
    accent: "#F7941D",
  },
  {
    title: "Four Games of Easter Weekend Footy for Free on Nine",
    excerpt:
      "STREAM NRL LIVE AND FREE ON 9NOW THURSDAY NIGHT FOOTY: DOLPHINS v MANLY GOOD FRIDAY FOOTY: RABBITOHS v BULLDOGS FRIDAY NIGHT FOOTY: PANTHERS v STORM EASTER SUNDAY: KNIGHTS v RAIDERS Get ready for a free Easter feast of footy when NRL on Nine unwraps four games, including a Good Friday double-header, li",
    accent: "#0493DE",
  },
  {
    title:
      "Nine Completes Acquisition of QMS Media, Creates Powerful Australian-Owned Media Ecosystem",
    excerpt:
      "Nine Entertainment Co. (Nine) has completed its 100 per cent acquisition of QMS Media (QMS), marking a definitive shift in Nine's portfolio, and positioning the group as Australia and New Zealand's first fully integrated, digital-first media powerhouse. The addition of QMS transforms Nine's offering",
    accent: "#00B7CD",
  },
  {
    title:
      "NRL on Nine Round 4: DCE V Manly, Battle of Brisbane, Raiders V Sharks Grudgematch",
    excerpt:
      "STREAM NRL LIVE AND FREE ON 9NOW THURSDAY NIGHT FOOTY: SEA EAGLES V ROOSTERS FRIDAY NIGHT FOOTY: BRONCOS V DOLPHINS SUNDAY ARVO FOOTY: RAIDERS V SHARKS The 9Network is set to deliver three tasty NRL matchups this week, headlined by Daly Cherry-Evans homecoming to Manly, the Battle of Brisbane and a Su",
    accent: "#6B3FA0",
  },
  {
    title:
      "Nine's Trusted Journalism Recognised at the Melbourne Press Club Quill Awards",
    excerpt:
      "9News reporter Selina Zhang awarded Young Journalist of the Year and The Age's Michael Gleeson named Australian Sports Journalist of the Year The breadth of Nine's journalism was on display tonight as journalists, columnists, camera operators, illustrators and graphic artists from 9News, The Age and",
    accent: "#D4002A",
  },
];

function ArticleCard({
  title,
  excerpt,
  accent,
}: {
  title: string;
  excerpt: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-[#1a1a3e]">
      {/* Placeholder image area */}
      <div
        className="aspect-video w-full"
        style={{
          background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
        }}
      />
      {/* Card content */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className="mb-3 text-[18px] font-bold leading-snug text-white"
          style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
        >
          {title}
        </h3>
        <p
          className="line-clamp-3 text-[16px] leading-relaxed"
          style={{ color: "#919191" }}
        >
          {excerpt}
        </p>
      </div>
    </div>
  );
}

export default function NineMediaReleasesPage() {
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

      {/* Hero / Title section */}
      <section
        className="py-16"
        style={{ backgroundColor: "#E8F4FD" }}
      >
        <div className="mx-auto max-w-[1200px] px-6">
          <h2
            className="text-[48px] font-[500]"
            style={{ color: "#0493DE" }}
          >
            Media Releases
          </h2>
        </div>
      </section>

      {/* Media Releases Grid */}
      <section style={{ backgroundColor: "#070720" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <ArticleCard
                key={article.title}
                title={article.title}
                excerpt={article.excerpt}
                accent={article.accent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Connect with us bar */}
      <NineConnectBar />

      {/* Footer */}
      <NineFooter />
    </div>
  );
}
