import fs from "fs";
import os from "os";
import path from "path";
import Link from "next/link";
import { QuantiumHeader } from "./quantium-com-au-header";
import { QuantiumFooter } from "./quantium-com-au-footer";

type DomHeading = {
  level?: string;
  text?: string;
};

type DomImage = {
  src?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
};

type DomLink = {
  text?: string;
  href?: string;
};

type DomSection = {
  role?: string;
  tag?: string;
  className?: string;
  headings?: DomHeading[];
  text?: string[];
  links?: DomLink[];
  images?: DomImage[];
  backgroundImages?: string[];
};

type DomPage = {
  sections?: DomSection[];
  allImages?: DomImage[];
  allBackgroundImages?: DomImage[];
};

const BRAND = "quantium-com-au";
const CACHE_ROOT = path.join(os.homedir(), ".claude", "design-library", "cache", BRAND, "dom-extraction");

export function QuantiumGenericPage({ pageSlug }: { pageSlug: string }) {
  const page = readPage(pageSlug);
  const sections = (page.sections ?? []).filter((section) => !isChromeSection(section));
  const hero = sections[0] ?? {};
  const heroTitle = firstHeading(sections, "h1") || firstHeading(sections) || titleFromSlug(pageSlug);
  const heroText = firstText(hero) || firstMeaningfulText(sections) || "";
  const heroImage = firstBackground(hero) || localAsset(page.allBackgroundImages?.[0]?.url) || localAsset(page.allImages?.[1]?.src);
  const contentCandidates = sections.slice(1).filter(hasMeaningfulContent);
  const contentSections = contentCandidates.length > 0 ? contentCandidates : sections.filter(hasMeaningfulContent);

  return (
    <div className="min-h-screen bg-white text-[#000006]" style={{ fontFamily: "var(--font-roboto), Roboto, sans-serif" }}>
      <QuantiumHeader />

      <section className="relative flex min-h-[360px] items-center overflow-hidden bg-[#000006]">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 py-20 md:px-[100px]">
          <p className="mb-4 text-sm font-medium uppercase text-[#00B2A9]">
            Quantium
          </p>
          <h1 className="max-w-4xl text-[44px] font-normal leading-[1.08] text-white md:text-[64px]">
            {heroTitle}
          </h1>
          {heroText && (
            <p className="mt-6 max-w-2xl text-lg font-light leading-8 text-white/85">
              {heroText}
            </p>
          )}
        </div>
      </section>

      <div>
        {contentSections.map((section, index) => (
          <GenericSection key={`${pageSlug}-${index}`} section={section} index={index} />
        ))}
      </div>

      <QuantiumFooter />
    </div>
  );
}

function GenericSection({ section, index }: { section: DomSection; index: number }) {
  const heading = firstHeading([section], "h2") || firstHeading([section]) || `Section ${index + 1}`;
  const paragraphs = textBlocks(section).filter((item) => item !== heading).slice(0, 8);
  const images = uniqueImages(section).slice(0, 4);
  const links = uniqueLinks(section).slice(0, 4);
  const alternate = index % 2 === 1;

  return (
    <section className={`w-full border-t border-[#E5E5E5] ${alternate ? "bg-[#F7F8F8]" : "bg-white"}`}>
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_420px] md:px-[100px]">
        <div>
          <h2 className="mb-6 text-[30px] font-normal leading-[1.16] text-[#000006] md:text-[38px]">
            {heading}
          </h2>
          <div className="space-y-4 text-[16px] font-light leading-7 text-[#252529]">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {links.map((link) => (
                <Link
                  key={`${link.href}-${link.text}`}
                  href={link.href ?? "#"}
                  className="inline-flex min-h-10 items-center rounded bg-[#000006] px-5 text-sm font-medium text-white transition-colors hover:bg-[#00B2A9]"
                >
                  {link.text || "Learn more"}
                </Link>
              ))}
            </div>
          )}
        </div>
        {images.length > 0 && (
          <div className="grid gap-4">
            {images.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt || heading}
                className="max-h-[320px] w-full rounded object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function readPage(pageSlug: string): DomPage {
  const fileName = pageSlug === "homepage" ? "homepage.json" : `${pageSlug}.json`;
  const filePath = path.join(CACHE_ROOT, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as DomPage;
  } catch {
    return { sections: [] };
  }
}

function firstHeading(sections: DomSection[], level?: string): string {
  for (const section of sections) {
    for (const heading of section.headings ?? []) {
      if (level && heading.level !== level) continue;
      const text = cleanText(heading.text ?? "");
      if (text && !isNoiseText(text)) return text;
    }
  }
  return "";
}

function firstText(section: DomSection): string {
  return textBlocks(section)[0] ?? "";
}

function firstMeaningfulText(sections: DomSection[]): string {
  for (const section of sections) {
    const text = firstText(section);
    if (text) return text;
  }
  return "";
}

function textBlocks(section: DomSection): string[] {
  return uniqueStrings(section.text ?? [])
    .map(cleanText)
    .filter((text) => text.length > 0)
    .filter((text) => text.length < 420)
    .filter((text) => !isNoiseText(text));
}

function hasMeaningfulContent(section: DomSection): boolean {
  return Boolean(firstHeading([section]) || textBlocks(section).length > 0 || uniqueImages(section).length > 0);
}

function isChromeSection(section: DomSection): boolean {
  const role = (section.role ?? "").toLowerCase();
  const tag = (section.tag ?? "").toLowerCase();
  const className = (section.className ?? "").toLowerCase();
  return (
    role === "banner" ||
    role === "contentinfo" ||
    role === "navigation" ||
    role === "search" ||
    tag === "header" ||
    tag === "footer" ||
    tag === "nav" ||
    /\b(header|footer|navbar|navigation|mega-menu|mobile-menu|site-menu|skip-link)\b/.test(className)
  );
}

function isNoiseText(text: string): boolean {
  const value = text.toLowerCase();
  if (/^sign in \| search$/i.test(text)) return true;
  if (value.includes("jquery(") || value.includes(".slick(") || value.includes("wp-content/plugins")) return true;
  if (value.includes("industries solutions genai") || value.includes("about us about quantium")) return true;
  if (value.includes("careers at quantium see open roles")) return true;
  if (value.includes("privacy policy terms of use")) return true;
  if (value.split(" ").length > 28 && value.includes("quantium") && value.includes("contact us")) return true;
  return false;
}

function uniqueImages(section: DomSection): Array<{ src: string; alt: string }> {
  const images = [...(section.images ?? [])];
  for (const url of section.backgroundImages ?? []) {
    images.push({ src: url, alt: "" });
  }
  const out: Array<{ src: string; alt: string }> = [];
  const seen = new Set<string>();
  for (const image of images) {
    const src = localAsset(image.src || image.url);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push({ src, alt: image.alt ?? "" });
  }
  return out;
}

function uniqueLinks(section: DomSection): DomLink[] {
  const out: DomLink[] = [];
  const seen = new Set<string>();
  for (const link of section.links ?? []) {
    const text = cleanText(link.text ?? "");
    const href = link.href ?? "#";
    if (!text || text.length > 80 || href.endsWith("#")) continue;
    const key = `${text}-${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text, href });
  }
  return out;
}

function firstBackground(section: DomSection): string {
  for (const url of section.backgroundImages ?? []) {
    const asset = localAsset(url);
    if (asset) return asset;
  }
  return "";
}

function localAsset(url?: string): string {
  if (!url) return "";
  if (url.startsWith("/brands/")) return url;
  try {
    const parsed = new URL(url);
    const name = decodeURIComponent(path.basename(parsed.pathname));
    return name ? `/brands/${BRAND}/${name}` : "";
  } catch {
    return "";
  }
}

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items));
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function titleFromSlug(slug: string): string {
  if (slug === "homepage") return "Quantium";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
