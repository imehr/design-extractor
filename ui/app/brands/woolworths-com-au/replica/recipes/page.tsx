import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WWHeader } from "@/components/brands/woolworths-com-au/ww-header";
import { WWFooter } from "@/components/brands/woolworths-com-au/ww-footer";
import { ChevronRight, Clock, DollarSign } from "lucide-react";

/* ── Extracted from recipes.json ── */

const BREADCRUMB = ["Home", "Recipes"];

const PAGE_HEADING = "Recipes & Ideas";

const INTRO_TEXT =
  "Fresh Ideas for You — browse over 10,000 recipes for fresh ideas to cook this week. Plus, log in to rate recipes, leave reviews and discover personalised recommendations.";

const CATEGORY_TILES = [
  { text: "Saved recipes", href: "/shop/recipes/saved-recipes", icon: "/brands/woolworths-com-au/icon-saved-recipes.png" },
  { text: "Budget recipes", href: "/shop/ideas/budget-meals", icon: "/brands/woolworths-com-au/icon-budget-recipes.png" },
  { text: "Meal planner", href: "/shop/meal-plan", icon: "/brands/woolworths-com-au/icon-meal-plan.png" },
  { text: "Recipe categories", href: "/shop/ideas/categories", icon: "/brands/woolworths-com-au/icon-categories.png" },
  { text: "Fresh Ideas Magazine", href: "/shop/ideas/fresh-ideas-magazine", icon: "/brands/woolworths-com-au/icon-fresh-ideas-magazine.png" },
];

const SECTIONS = [
  "Dinner ideas to try this week",
  "Dinner ideas",
  "Popular Recipes",
  "Popular ingredients",
  "Your essential guide to autumn fruit & veg",
  "Dinner on a budget",
  "More from your pantry",
  "Budget-friendly dinners",
  "Dietary & lifestyle",
];

const SAMPLE_RECIPES = [
  { name: "Healthier Thai-style Larb Tofu", prep: "5m", cook: "10m", costPerServe: "" },
  { name: "Savoury Mince", prep: "10m", cook: "40m", costPerServe: "$4.89" },
  { name: "Chicken katsu curry", prep: "10m", cook: "20m", costPerServe: "$6+" },
  { name: "Easy Slow-cooker Butter Chicken", prep: "5m", cook: "4h 15m", costPerServe: "" },
  { name: "Air-fryer chicken satay bowl with peanut crunch", prep: "15m", cook: "10m", costPerServe: "" },
  { name: "Healthier Lemon Ricotta Pasta", prep: "5m", cook: "15m", costPerServe: "" },
  { name: "Lasagne", prep: "15m", cook: "45m", costPerServe: "$4.68" },
  { name: "One-pan prawn risotto", prep: "5m", cook: "25m", costPerServe: "" },
  { name: "Chilli Con Carne", prep: "10m", cook: "35m", costPerServe: "$4.43" },
];

const BANNER_IMAGE = {
  src: "/brands/woolworths-com-au/banner-autumn-fruit-veg.jpg",
  alt: "Autumn fruit and veg",
};

const RECIPE_SOURCE_ICON = "/brands/woolworths-com-au/icon-fresh-ideas.png";

export default function RecipesPage() {
  return (
    <div
      className="min-h-screen bg-[#EEEEEE]"
      style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif", fontSize: 16, color: "#25251F" }}
    >
      <WWHeader activePage="Recipes" />

      <div className="w-full">
        {/* Breadcrumb + heading */}
        <div className="bg-white px-6 pb-4 pt-4">
          <div className="mx-auto max-w-[1280px]">
            {/* Breadcrumb */}
            <nav className="mb-3 flex items-center gap-1 text-sm text-[#616C71]">
              {BREADCRUMB.map((crumb, i) => (
                <span key={crumb} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3" />}
                  {i < BREADCRUMB.length - 1 ? (
                    <Link href="#" className="hover:text-[#178841]">{crumb}</Link>
                  ) : (
                    <span className="text-[#25251F]">{crumb}</span>
                  )}
                </span>
              ))}
            </nav>

            <h1
              className="text-[32px] font-bold"
              style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
            >
              {PAGE_HEADING}
            </h1>

            <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-[#616C71]">
              {INTRO_TEXT}
            </p>
          </div>
        </div>

        {/* Category tiles row */}
        <div className="bg-white px-6 pb-6 pt-2">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex gap-6 overflow-x-auto">
              {CATEGORY_TILES.map((tile) => (
                <Link
                  key={tile.text}
                  href={tile.href}
                  className="flex min-w-[100px] flex-col items-center gap-2 rounded-lg px-2 py-3 text-center transition-colors hover:bg-[#F5F6F6]"
                >
                  <div className="flex size-[56px] items-center justify-center">
                    <img
                      src={tile.icon}
                      alt={tile.text}
                      className="size-[48px] object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium leading-tight text-[#25251F]">{tile.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Dinner ideas to try this week */}
        <div className="px-6 py-6">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                {SECTIONS[0]}
              </h2>
              <Link href="#" className="flex items-center gap-1 text-sm font-medium text-[#178841] hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {SAMPLE_RECIPES.slice(0, 5).map((recipe) => (
                <Card key={recipe.name} className="overflow-hidden border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-[#F5F6F6]">
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <img src={RECIPE_SOURCE_ICON} alt="Woolies Fresh Ideas" className="size-5 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="mb-2 line-clamp-2 text-sm font-medium leading-tight text-[#25251F]">{recipe.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[#616C71]">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Prep {recipe.prep}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Cook {recipe.cook}
                        </span>
                      </div>
                      {recipe.costPerServe && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#616C71]">
                          <DollarSign className="size-3" />
                          {recipe.costPerServe} per serve
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Popular Recipes */}
        <div className="px-6 pb-6">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                {SECTIONS[2]}
              </h2>
              <Link href="#" className="flex items-center gap-1 text-sm font-medium text-[#178841] hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {SAMPLE_RECIPES.slice(4, 9).map((recipe) => (
                <Card key={recipe.name} className="overflow-hidden border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-[#F5F6F6]">
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <img src={RECIPE_SOURCE_ICON} alt="Woolies Fresh Ideas" className="size-5 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="mb-2 line-clamp-2 text-sm font-medium leading-tight text-[#25251F]">{recipe.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[#616C71]">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Prep {recipe.prep}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Cook {recipe.cook}
                        </span>
                      </div>
                      {recipe.costPerServe && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#616C71]">
                          <DollarSign className="size-3" />
                          {recipe.costPerServe} per serve
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Autumn fruit & veg banner */}
        <div className="px-6 pb-6">
          <div className="mx-auto max-w-[1280px]">
            <div className="overflow-hidden rounded-xl">
              <div className="relative flex items-center bg-[#178841]">
                <div className="flex-1 p-8">
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
                  >
                    {SECTIONS[4]}
                  </h2>
                  <Link
                    href="#"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white underline"
                  >
                    Explore now <ChevronRight className="size-4" />
                  </Link>
                </div>
                <div className="hidden shrink-0 md:block">
                  <img
                    src={BANNER_IMAGE.src}
                    alt={BANNER_IMAGE.alt}
                    className="h-[180px] w-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Budget-friendly dinners */}
        <div className="px-6 pb-6">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
              >
                {SECTIONS[7]}
              </h2>
              <Link href="#" className="flex items-center gap-1 text-sm font-medium text-[#178841] hover:underline">
                View all <ChevronRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {SAMPLE_RECIPES.filter((r) => r.costPerServe).map((recipe) => (
                <Card key={`budget-${recipe.name}`} className="overflow-hidden border-0 bg-white shadow-sm" style={{ borderRadius: 12 }}>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-[#F5F6F6]">
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <img src={RECIPE_SOURCE_ICON} alt="Woolies Fresh Ideas" className="size-5 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="mb-2 line-clamp-2 text-sm font-medium leading-tight text-[#25251F]">{recipe.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[#616C71]">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Prep {recipe.prep}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Cook {recipe.cook}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#616C71]">
                        <DollarSign className="size-3" />
                        {recipe.costPerServe} per serve
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Dietary & lifestyle section */}
        <div className="px-6 pb-10">
          <div className="mx-auto max-w-[1280px]">
            <h2
              className="mb-4 text-xl font-bold"
              style={{ fontFamily: "'Glider', 'Inter', sans-serif" }}
            >
              {SECTIONS[8]}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {["Vegetarian", "Vegan", "Gluten Free", "Dairy Free"].map((diet) => (
                <Link
                  key={diet}
                  href="#"
                  className="flex items-center justify-center rounded-xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderRadius: 12 }}
                >
                  <span className="text-sm font-medium text-[#25251F]">{diet}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WWFooter />
    </div>
  );
}
