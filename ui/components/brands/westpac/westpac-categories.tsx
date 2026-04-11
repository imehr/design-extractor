import Link from "next/link";
import {
  Home,
  Landmark,
  CreditCard,
  DollarSign,
  Briefcase,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

// Extracted from actual homepage DOM
const CATEGORIES = [
  {
    icon: Home,
    title: "Home loans",
    links: [
      { text: "Compare loans and rates", href: "#" },
      { text: "Repayment calculator", href: "#" },
      { text: "Book an appointment", href: "#" },
    ],
  },
  {
    icon: Landmark,
    title: "Bank accounts",
    links: [
      { text: "Transaction accounts", href: "#" },
      { text: "Savings accounts", href: "#" },
      { text: "Term deposit", href: "#" },
    ],
  },
  {
    icon: CreditCard,
    title: "Credit cards",
    links: [
      { text: "Rewards credit cards", href: "#" },
      { text: "Low rate credit cards", href: "#" },
      { text: "Low fee credit card", href: "#" },
    ],
  },
  {
    icon: DollarSign,
    title: "Personal loans",
    links: [
      { text: "Debt Consolidation", href: "#" },
      { text: "Car Loan", href: "#" },
      { text: "Repayment Calculator", href: "#" },
    ],
  },
  {
    icon: Briefcase,
    title: "Business",
    links: [
      { text: "Bank accounts", href: "#" },
      { text: "Business loans", href: "#" },
      { text: "EFTPOS & eCommerce", href: "#" },
    ],
  },
  {
    icon: PlusCircle,
    title: "More options",
    links: [
      { text: "Share trading", href: "#" },
      { text: "Insurance", href: "#" },
      { text: "International & Travel", href: "#" },
    ],
  },
];

export function WestpacCategories() {
  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded bg-[#DA1710]">
                  <cat.icon className="size-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-[#1F1C4F]">
                  {cat.title}
                </h3>
              </div>
              <ul className="ml-[52px] space-y-1">
                {cat.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-1 text-[14px] leading-6 text-[#181B25] underline decoration-transparent hover:text-[#DA1710] hover:decoration-[#DA1710]"
                    >
                      <ChevronRight className="size-4 flex-shrink-0 text-[#DA1710]" />
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
