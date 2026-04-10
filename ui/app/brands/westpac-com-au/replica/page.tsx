import { WestpacHeader } from "@/components/brands/westpac/westpac-header";
import { WestpacHero } from "@/components/brands/westpac/westpac-hero";
import { WestpacCategories } from "@/components/brands/westpac/westpac-categories";
import { WestpacFooter } from "@/components/brands/westpac/westpac-footer";
import {
  BestBankingApp,
  SecuritySection,
  SecurityBanner,
  PropertyInvestment,
  HelpAndContact,
  QuickHelpLinks,
  LegalDisclosure,
} from "@/components/brands/westpac/westpac-sections";

export default function WestpacHomePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif', fontSize: 16, color: "#181B25" }}>
      <WestpacHeader activePage="Home" />
      <WestpacHero
        heading="BOOK A HOME LENDER IN MINUTES"
        subtitle="Our home loan specialists are here for you, ready to help when and where you need us."
        ctaText="Find out more"
      />
      <WestpacCategories />
      <BestBankingApp />
      <SecurityBanner />
      <SecuritySection />
      <PropertyInvestment />
      <HelpAndContact />
      <QuickHelpLinks />
      <LegalDisclosure />
      <WestpacFooter />
    </div>
  );
}
