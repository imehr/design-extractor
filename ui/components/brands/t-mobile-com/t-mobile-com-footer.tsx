"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { TMobileComLogo } from "./t-mobile-com-logo";

const footerColumns = [
  {
    title: "Even more plans",
    links: [
      { text: "International phone plans", href: "https://www.t-mobile.com/cell-phone-plans/international-roaming-plans?INTNAV=fNav%3AEvenMorePlans%3AInternationalPhonePlans" },
      { text: "International passes", href: "https://www.t-mobile.com/cell-phone-plans/international-roaming-plans/unlimited-calling-data-pass?INTNAV=fNav%3AEvenMorePlans%3AInternationalPasses" },
      { text: "Home Internet plans", href: "https://www.t-mobile.com/home-internet/plans?INTNAV=fNav%3AEvenMorePlans%3AHomeInternetPlans" },
      { text: "Phone and internet bundle package", href: "https://www.t-mobile.com/cell-phone-plans/phone-home-internet-bundle?INTNAV=fNav%3AEvenMorePlans%3APhoneInternetBundlePackage" },
      { text: "Hotspot data plans", href: "https://www.t-mobile.com/cell-phone-plans/affordable-data-plans/hotspots?INTNAV=fNav%3AEvenMorePlans%3AHotspotDataPlans" },
      { text: "Smartwatch data plans", href: "https://www.t-mobile.com/cell-phone-plans/affordable-data-plans/smartwatches?INTNAV=fNav%3AEvenMorePlans%3ASmartwatchDataPlans" },
      { text: "Wireless business plans", href: "https://www.t-mobile.com/business/wireless-business-plans?INTNAV=fNav%3AEvenMorePlans%3AWirelessBusinessPlans" },
    ],
  },
  {
    title: "Shop cell phones by brand",
    links: [
      { text: "Apple iPhones", href: "https://www.t-mobile.com/cell-phones/brand/apple?INTNAV=fNav%3AShopCellPhonesByBrand%3AAppleiPhone" },
      { text: "Samsung Galaxy phones", href: "https://www.t-mobile.com/cell-phones/brand/samsung?INTNAV=fNav%3AShopCellPhonesByBrand%3ASamsungGalaxyPhones" },
      { text: "Google Pixel phones", href: "https://www.t-mobile.com/cell-phones/brand/google?INTNAV=fNav%3AShopCellPhonesByBrand%3AGooglePixelPhones" },
      { text: "T-Mobile Revvl phones", href: "https://www.t-mobile.com/cell-phones/brand/t-mobile?INTNAV=fNav%3AShopCellPhonesByBrand%3AT-MobileREVVLPhones" },
      { text: "Motorola Moto phones", href: "https://www.t-mobile.com/cell-phones/brand/motorola?INTNAV=fNav%3AShopCellPhonesByBrand%3AMotorolaMotoPhones" },
    ],
  },
  {
    title: "New featured cell phones",
    links: [
      { text: "New Apple iPhone Air", href: "https://www.t-mobile.com/cell-phone/apple-iphone-air?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewAppleiPhoneAir" },
      { text: "New Apple iPhone 17", href: "https://www.t-mobile.com/cell-phone/apple-iphone-17?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewAppleiPhone17" },
      { text: "New Apple iPhone 17 Pro", href: "https://www.t-mobile.com/cell-phone/apple-iphone-17-pro?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewAppleiPhone17Pro" },
      { text: "New Apple iPhone 17 Pro Max", href: "https://www.t-mobile.com/cell-phone/apple-iphone-17-pro-max?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewAppleiPhone17ProMax" },
      { text: "New Samsung Galaxy Z Fold7", href: "https://www.t-mobile.com/cell-phone/samsung-galaxy-z-fold7?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewSamsungGalaxyZFold7" },
      { text: "New Google Pixel 10", href: "https://www.t-mobile.com/cell-phone/google-pixel-10?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ANewGooglePixel10" },
    ],
  },
  {
    title: "New featured tablets, smartwatches & more",
    links: [
      { text: "Apple Watch Series 11 42mm", href: "https://www.t-mobile.com/smart-watch/apple-watch-series-11-42mm?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3AAppleWatchSeries1142mm" },
      { text: "Apple Watch Series 11 46mm", href: "https://www.t-mobile.com/smart-watch/apple-watch-series-11-46mm?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3AAppleWatchSeries1146mm" },
      { text: "Apple Watch SE 3 40mm", href: "https://www.t-mobile.com/smart-watch/apple-watch-se-3-40mm?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3AAppleWatchSe340mm" },
      { text: "Apple Watch SE 3 44mm", href: "https://www.t-mobile.com/smart-watch/apple-watch-se-3-44mm?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3AAppleWatchSe344mm" },
      { text: "Apple Watch Ultra 3", href: "https://www.t-mobile.com/smart-watch/apple-watch-ultra-3?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3AAppleWatchUltra3" },
      { text: "Samsung Galaxy Watch8 Classic 46MM", href: "https://www.t-mobile.com/smart-watch/samsung-galaxy-watch8-classic-46mm?INTNAV=fNav%3ANewFeaturedTabletsSmartwatchesAndMore%3ASamsungGalaxyWatch846MM" },
    ],
  },
  {
    title: "Helpful consumer guides",
    links: [
      { text: "Dialed In", href: "https://www.t-mobile.com/dialed-in?INTNAV=fNav%3AHelpfulConsumerGuides%3ADialedIn" },
      { text: "Cell Phone BYOD Guide", href: "https://www.t-mobile.com/dialed-in/devices/what-is-byod-bring-your-own-device?INTNAV=fNav%3AHelpfulConsumerGuides%3ACellPhoneBYODGuide" },
      { text: "The 6 Best Samsung Phones of 2026", href: "https://www.t-mobile.com/dialed-in/devices/best-samsung-phones?INTNAV=fNav%3AHelpfulConsumerGuides%3Abestsamsungphones" },
      { text: "iPhone 17 Series: Everything You Need to Know", href: "https://www.t-mobile.com/dialed-in/devices/iphone-17-series?INTNAV=fNav%3AHelpfulConsumerGuides%3AAiphone17series" },
      { text: "How Does Satellite Phone Service Work?", href: "https://www.t-mobile.com/dialed-in/wireless/how-satellite-phone-service-works?INTNAV=fNav%3AHelpfulConsumerGuides%3Ahowsatellitephoneserviceworks" },
    ],
  },
  {
    title: "T-Mobile customer benefits",
    links: [
      { text: "TV streaming deals", href: "https://www.t-mobile.com/tv-streaming?INTNAV=fNav%3AT-MobileCustomerBenefits%3ATvStreamingDeals" },
    ],
  },
  {
    title: "Switch to T-Mobile",
    links: [],
  },
  {
    title: "Additional support",
    links: [],
  },
  {
    title: "About T-Mobile",
    links: [],
  },
];

const legalLinks = [
  { text: "About", href: "https://www.t-mobile.com/our-story?INTNAV=fNav%3AAbout" },
  { text: "Investor relations", href: "https://investor.t-mobile.com/default.aspx?INTNAV=fNav%3AInvestorRelations" },
  { text: "Press", href: "https://www.t-mobile.com/news?INTNAV=fNav%3APress" },
  { text: "Careers", href: "https://careers.t-mobile.com/?INTNAV=fNav%3ACareers" },
  { text: "Deutsche Telekom", href: "https://www.telekom.com/en?INTNAV=fNav%3ADeutscheTelekom" },
  { text: "Puerto Rico", href: "https://www.t-mobilepr.com/?INTNAV=fNav%3APuertoRico" },
  { text: "Privacy Notice", href: "https://www.t-mobile.com/privacy-center/privacy-notices/t-mobile-privacy-notice?INTNAV=fNav%3APrivacyNotice" },
  { text: "Trust Center", href: "https://security.t-mobile.com/?INTNAV=fNav%3ATrustCenter" },
  { text: "Privacy Center", href: "https://www.t-mobile.com/privacy-center?INTNAV=fNav%3APrivacyCenter" },
  { text: "Consumer information", href: "https://www.t-mobile.com/responsibility/consumer-info?INTNAV=fNav%3AConsumerInformation" },
  { text: "Public safety/911", href: "https://www.t-mobile.com/responsibility/consumer-info/safety/9-1-1?INTNAV=fNav%3APublicSafety911" },
  { text: "Terms & conditions", href: "https://www.t-mobile.com/responsibility/legal/terms-and-conditions?INTNAV=fNav%3ATermsAndConditions" },
  { text: "Terms of use", href: "https://www.t-mobile.com/responsibility/consumer-info/policies/terms-of-use?INTNAV=fNav%3ATermsOfUse" },
  { text: "Accessibility", href: "https://www.t-mobile.com/responsibility/consumer-info/accessibility-policy?INTNAV=fNav%3AAccessibility" },
  { text: "Open Internet", href: "https://www.t-mobile.com/responsibility/consumer-info/policies/internet-service?INTNAV=fNav%3AOpenInternet" },
  { text: "Licenses & Patents", href: "https://www.t-mobile.com/responsibility/legal/licenses-and-patents?INTNAV=fNav%3ALicenses-and-Patents" },
  { text: "Consumer Health Data Privacy Notice", href: "https://www.t-mobile.com/privacy-center/privacy-notices/t-mobile-privacy-notice.html?INTNAV=fNav%3AConsumerHealthDataPrivacyNotice#health-data-privacy-notice" },
];

const socialLinks = [
  { text: "Instagram", href: "https://www.instagram.com/tmobile/" },
  { text: "Facebook", href: "https://www.facebook.com/TMobile" },
  { text: "X", href: "https://twitter.com/TMobile" },
  { text: "You Tube", href: "https://www.youtube.com/user/TMobile/custom" },
];

export function TMobileComFooter() {
  return (
    <footer className="bg-[#141414] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        {/* Social + language */}
        <div className="flex flex-col items-start justify-between gap-6 pb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <h2 className="sr-only">Follow T-Mobile</h2>
            <TMobileComLogo variant="white" />
            <div className="flex items-center gap-3 text-sm font-medium">
              {socialLinks.map((link) => (
                <Link
                  key={link.text}
                  href={link.href}
                  className="rounded-full border border-white/30 px-3 py-1 hover:border-[#E20074] hover:text-[#E20074]"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/70">English</span>
            <span className="text-white/40">|</span>
            <Link href="#" className="text-white/70 hover:text-white">Español</Link>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Link columns */}
        <div className="grid gap-8 py-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-sm font-bold">{column.title}</h3>
              {column.links.length > 0 && (
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 hover:text-white hover:underline"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        {/* Legal */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-6 text-xs text-white/60">
          {legalLinks.map((link, idx) => (
            <span key={link.text} className="flex items-center gap-4">
              <Link href={link.href} className="hover:text-white hover:underline">
                {link.text}
              </Link>
              {idx < legalLinks.length - 1 && (
                <span className="hidden text-white/30 md:inline">|</span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/50">
          T-Mobile, the T logo, Magenta and the magenta color are registered trademarks of Deutsche Telekom AG.
        </p>
      </div>
    </footer>
  );
}
