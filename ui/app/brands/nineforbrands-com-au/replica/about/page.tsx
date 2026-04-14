import Image from "next/image";
import { NineHeader } from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-header";
import {
  NineConnectBar,
  NineFooter,
} from "@/components/brands/nineforbrands-com-au/nineforbrands-com-au-footer";

const DIRECTORS = [
  {
    name: "Peter Tonagh",
    title: "Independent Non-Executive Chair",
    photo: "/brands/nineforbrands-com-au/directors/director-1.png",
  },
  {
    name: "Chris Halios-Lewis",
    title: "Non-Independent, Non-Executive Director",
    photo: "/brands/nineforbrands-com-au/directors/director-2.png",
  },
  {
    name: "Andrew Lancaster",
    title: "Non-Independent, Non-Executive Director",
    photo: "/brands/nineforbrands-com-au/directors/director-3.jpg",
  },
  {
    name: "Timothy Longstaff",
    title: "Independent Non-Executive Director",
    photo: "/brands/nineforbrands-com-au/directors/director-4.png",
  },
  {
    name: "Mandy Pattinson",
    title: "Independent Non-Executive Director",
    photo: "/brands/nineforbrands-com-au/directors/director-5.png",
  },
  {
    name: "Mickie Rosen",
    title: "Independent Non-Executive Director",
    photo: "/brands/nineforbrands-com-au/directors/director-6.jpg",
  },
];

const MANAGEMENT = [
  {
    name: "Matt Stanton",
    title: "Chief Executive Officer & Managing Director",
    photo: "/brands/nineforbrands-com-au/directors/director-7.jpg",
  },
  {
    name: "Amanda Laing",
    title: "Managing Director, Streaming & Broadcast",
    photo: "/brands/nineforbrands-com-au/directors/director-8.png",
  },
  {
    name: "Tory Maguire",
    title: "Managing Director, Publishing",
    photo: "/brands/nineforbrands-com-au/directors/director-9.png",
  },
  {
    name: "Matt James",
    title: "Chief Sales Officer",
    photo: "/brands/nineforbrands-com-au/directors/director-10.png",
  },
  {
    name: "Rachel Launders",
    title: "General Counsel & Company Secretary",
    photo: "/brands/nineforbrands-com-au/directors/director-11.jpg",
  },
  {
    name: "Martyn Roberts",
    title: "Chief Financial Officer",
    photo: "/brands/nineforbrands-com-au/directors/director-12.jpg",
  },
  {
    name: "Vanessa Morley",
    title: "Chief People Officer",
    photo: "/brands/nineforbrands-com-au/directors/director-13.jpg",
  },
  {
    name: "Alex Parsons",
    title: "Chief Digital Officer",
    photo: "/brands/nineforbrands-com-au/directors/director-14.jpg",
  },
  {
    name: "James Boyce",
    title: "Director Regulatory, Public Affairs & Communications",
    photo: "/brands/nineforbrands-com-au/directors/director-15.jpg",
  },
];

function PersonCard({
  name,
  title,
  photo,
}: {
  name: string;
  title: string;
  photo: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 h-[120px] w-[120px] overflow-hidden rounded-full">
        <Image
          src={photo}
          alt={name}
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
      </div>
      <h4 className="text-[16px] font-bold" style={{ color: "#333" }}>
        {name}
      </h4>
      <p className="mt-1 text-[14px]" style={{ color: "#737373" }}>
        {title}
      </p>
    </div>
  );
}

export default function NineAboutPage() {
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

      {/* Hero - Blue gradient banner */}
      <section
        className="flex h-[500px] flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0493DE 0%, #00B7CD 100%)",
        }}
      >
        <h1 className="mb-8 text-center text-[109px] font-extrabold leading-none text-white">
          About Us
        </h1>
        <Image
          src="/brands/nineforbrands-com-au/Nine_White_RGB.png"
          alt="Nine"
          width={200}
          height={66}
          className="h-auto w-[200px] object-contain"
        />
      </section>

      {/* Board of Directors */}
      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <h1
          className="mb-12 text-[36px] font-[800]"
          style={{ color: "#333" }}
        >
          Board of Directors
        </h1>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
          {DIRECTORS.map((person) => (
            <PersonCard
              key={person.name}
              name={person.name}
              title={person.title}
              photo={person.photo}
            />
          ))}
        </div>
      </section>

      {/* Management Team */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="mb-12 border-t border-[#e5e5e5] pt-12">
          <h1
            className="text-[36px] font-[800]"
            style={{ color: "#333" }}
          >
            Management Team
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {MANAGEMENT.map((person) => (
            <PersonCard
              key={person.name}
              name={person.name}
              title={person.title}
              photo={person.photo}
            />
          ))}
        </div>
      </section>

      {/* Connect with us bar */}
      <NineConnectBar />

      {/* Footer */}
      <NineFooter />
    </div>
  );
}
