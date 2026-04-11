import Image from "next/image";
import Link from "next/link";
import { WWGHeader } from "@/components/brands/woolworths-group/wwg-header";
import { WWGFooter } from "@/components/brands/woolworths-group/wwg-footer";
import { Card, CardContent } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Phone, Car, Train, CircleDot } from "lucide-react";

export default function ContactUsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, color: "#202020" }}
    >
      <WWGHeader activePage="Contact Us" />

      {/* Hero Banner */}
      <div className="relative w-full" style={{ height: 529 }}>
        <img src="/brands/woolworths-group/contact-us-banner.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-[1200px] px-10 pb-10">
            <h2 className="text-white" style={{ fontFamily: 'TomatoGrotesk, sans-serif', fontSize: 64, fontWeight: 600, lineHeight: '80px' }}>
              Contact Us
            </h2>
          </div>
        </div>
      </div>

      {/* General Enquiry Section */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-12"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 48,
              lineHeight: "56px",
              fontWeight: 600,
              color: "#1971ED",
            }}
          >
            General Enquiry
          </h1>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Street Address Card */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center">
                  <MapPin className="h-8 w-8 text-[#4994FF]" />
                </div>
                <h4 className="mb-3 text-base font-bold text-[#202020]">
                  Woolworths Group
                </h4>
                <p className="text-sm leading-relaxed text-[#202020]">
                  1 Woolworths Way
                  <br />
                  Bella Vista NSW 2153
                </p>
              </CardContent>
            </Card>

            {/* Postal Address Card */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center">
                  <Mail className="h-8 w-8 text-[#4994FF]" />
                </div>
                <h4 className="mb-3 text-base font-bold text-[#202020]">
                  Postal address:
                </h4>
                <p className="text-sm leading-relaxed text-[#202020]">
                  PO Box 8000
                  <br />
                  Baulkham Hills NSW 2153
                </p>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center">
                  <Phone className="h-8 w-8 text-[#4994FF]" />
                </div>
                <h4 className="mb-3 text-base font-bold text-[#202020]">
                  Phone contact
                </h4>
                <Link
                  href="tel:0288850000"
                  className="text-base font-medium text-[#1971ED] hover:underline"
                >
                  02 8885 0000
                </Link>
                <p className="mt-2 text-sm text-[#6b7280]">
                  Mon-Fri: 8am - 5:30pm
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Contact Sections */}
          <div className="mt-16 space-y-10">
            <div>
              <h3
                className="mb-3"
                style={{
                  fontFamily: "TomatoGrotesk, sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#202020",
                }}
              >
                Contact Us Salaried Team Pay Review
              </h3>
              <p className="text-sm leading-relaxed text-[#202020]">
                If you are a current or former team member and would like more
                information about the recently conducted Salaried Team Pay
                Review, go to{" "}
                <Link
                  href="https://team.woolworths.com.au/"
                  className="font-medium text-[#1971ED] hover:underline"
                >
                  team.woolworths.com.au
                </Link>
              </p>
            </div>

            <div>
              <h3
                className="mb-3"
                style={{
                  fontFamily: "TomatoGrotesk, sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#202020",
                }}
              >
                Vulnerability Disclosure
              </h3>
              <p className="text-sm leading-relaxed text-[#202020]">
                To report a potential security vulnerability associated with
                Woolworths Supermarkets, Countdown Supermarkets. Big W, or our
                Rewards brand, email{" "}
                <Link
                  href="mailto:vulnerabilitydisclosure@woolworths.com.au"
                  className="font-medium text-[#1971ED] hover:underline"
                >
                  vulnerabilitydisclosure.com.au
                </Link>
              </p>
            </div>

            <div>
              <h3
                className="mb-3"
                style={{
                  fontFamily: "TomatoGrotesk, sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#202020",
                }}
              >
                Speak Up
              </h3>
              <p className="text-sm leading-relaxed text-[#202020]">
                Speak Up is Woolworths Group&apos;s independently-hosted mechanism
                where team members (current and former), suppliers, workers and
                their families can report serious issues confidentially and, if
                preferred, anonymously. Issues are then referred to Woolworths for
                investigation. Go to{" "}
                <Link
                  href="https://woolworthsgroup.relyplatform.com/report"
                  className="font-medium text-[#1971ED] hover:underline"
                >
                  woolworthsgroup.com.au/Speak Up
                </Link>{" "}
                to log a report.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-[1200px]" />

      {/* Norwest Support Office Section */}
      <section className="bg-[#EBF4FF] py-20">
        <div className="mx-auto max-w-[1200px] px-10">
          <h1
            className="mb-4"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 48,
              lineHeight: "56px",
              fontWeight: 600,
              color: "#1971ED",
            }}
          >
            Norwest support office
          </h1>
          <p className="mb-10 text-base leading-relaxed text-[#202020]">
            Our head office is located at 1 Woolworths Way, Bella Vista NSW 2153.
          </p>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <div className="relative h-[320px] overflow-hidden rounded-lg">
                <Image
                  src="/brands/woolworths-group/norwest-office-aerial.jpg"
                  alt="Aerial drone photo of Norwest support office"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Car className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#1971ED]" />
                <div>
                  <h4
                    className="mb-1"
                    style={{
                      fontFamily: "TomatoGrotesk, sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#202020",
                    }}
                  >
                    Parking
                  </h4>
                  <p className="text-sm text-[#202020]">
                    Visitor parking is available on-site.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Train className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#1971ED]" />
                <div>
                  <h4
                    className="mb-1"
                    style={{
                      fontFamily: "TomatoGrotesk, sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#202020",
                    }}
                  >
                    Metro
                  </h4>
                  <p className="text-sm text-[#202020]">
                    The Metro station is 1.1km from our office.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CircleDot className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#1971ED]" />
                <div>
                  <h4
                    className="mb-1"
                    style={{
                      fontFamily: "TomatoGrotesk, sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#202020",
                    }}
                  >
                    Taxi
                  </h4>
                  <p className="text-sm text-[#202020]">
                    Taxi rank is located nearby on Woolworths Way.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CCTV Notice */}
          <div className="mt-12 rounded-lg bg-white p-8">
            <h4
              className="mb-4"
              style={{
                fontFamily: "TomatoGrotesk, sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: "#202020",
              }}
            >
              Video Surveillance in Use
            </h4>
            <div className="space-y-3 text-sm leading-relaxed text-[#202020]">
              <p>
                Please be aware that this site uses Closed Circuit Television
                (CCTV) video surveillance equipment. This equipment is used to
                protect team members and customers and to aid in their safety and
                security as well as the security of the site.
              </p>
              <p>
                The video cameras are clearly visible and signs have been posted
                notifying both staff and visitors that the site may be under
                surveillance. The cameras will be in operation 24 hours a day.
                Images from the CCTV equipment will be kept for a reasonable
                time, after which time they will be destroyed.
              </p>
              <p>
                CCTV recordings may be used to identify persons and may be used
                in disciplinary and other investigations and matters.
                Surveillance is not installed in bathroom areas, change rooms or
                locker rooms located within the workplace.
              </p>
            </div>
          </div>

          {/* Explore the neighbourhood */}
          <div className="mt-12">
            <h4
              className="mb-3"
              style={{
                fontFamily: "TomatoGrotesk, sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: "#202020",
              }}
            >
              Explore the neighbourhood
            </h4>
            <p className="mb-4 text-sm text-[#202020]">
              Looking for places to stay or eat nearby? Here are some available
              options:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-[#202020]">
              <li>
                Nearby places to eat: Please ask reception for dining out options
              </li>
              <li>
                Closest Woolworths Supermarket: 1 Circa Boulevarde, Bella Vista.
                There is also a Woolworths Metro on-site at 1 Woolworths Way,
                Bella Vista NSW 2153
              </li>
              <li>
                Closest BIG W: 190 Caroline Chisholm Dr, Winston Hills NSW 2153
              </li>
              <li>
                Accommodation: Quest Bella Vista, Adina Apartments, Rydges
                Norwest and Hills Lodge
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Decorative brand divider */}
      <div className="flex w-full">
        <Image
          src="/brands/woolworths-group/divider-berry-land.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
        <Image
          src="/brands/woolworths-group/divider-land-sun.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
        <Image
          src="/brands/woolworths-group/divider-ocean-sky.png"
          alt="brand divider"
          width={1563}
          height={267}
          className="w-1/3 object-cover"
        />
      </div>

      {/* Careers CTA */}
      <section className="bg-[#1971ED] py-20">
        <div className="mx-auto max-w-[1200px] px-10 text-center">
          <h2
            className="mb-6 text-white"
            style={{
              fontFamily: "TomatoGrotesk, sans-serif",
              fontSize: 36,
              lineHeight: "44px",
              fontWeight: 600,
            }}
          >
            Careers
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/90">
            We are Woolworths Group. 200,000+ bright minds, passionate hearts,
            and unique perspectives across Australia and New Zealand. Connected by
            a shared Purpose - &apos;to create better experiences together for a
            better tomorrow&apos;.
          </p>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-lg border border-[#1971ED] bg-white px-6 py-2 text-sm font-semibold text-[#1971ED] hover:bg-white/90 transition-colors"
          >
            Explore opportunities
          </Link>
        </div>
      </section>

      <WWGFooter />
    </div>
  );
}
