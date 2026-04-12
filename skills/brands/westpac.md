---
name: westpac-design
description: "Westpac (westpac.com.au) design system knowledge. Use when replicating, referencing, or designing in the Westpac brand style. NOT for Westpac API documentation, Westpac banking services, or Westpac job listings."
triggers:
  - "Westpac design"
  - "westpac.com.au style"
  - "Westpac brand colours"
  - "Westpac design system"
  - "design like Westpac"
negative_triggers:
  - "Westpac API"
  - "Westpac banking"
  - "Westpac account"
  - "Westpac login"
---

# Westpac Design System

## Key Design Tokens

- **Brand Red**: `#DA1710` (primary CTA, utility bar, hero backgrounds, active states, category icons, chevrons)
- **Brand Red Hover**: `#C21410`
- **Navy**: `#1F1C4F` (heading text, security banner, category titles, contact card gradient)
- **Text Primary**: `#181B25` (body text, nav links)
- **Text Secondary**: `#575F65` (supporting text, links, footer links, legal text)
- **Text Muted**: `#808080` (disclaimers, things you should know)
- **Surface Light**: `#F3F4F6` (alternating section backgrounds, category icon bg)
- **Border**: `#DEDEE1` (dividers, card borders, nav underline)
- **Display Font**: `Westpac-bold` (custom OTF/TTF via `@font-face`, weight 400, falls back to `Times New Roman, Times, serif`)
- **Body Font**: System font stack (`-apple-system, system-ui, "Segoe UI", Roboto, sans-serif`)
- **Hero Heading**: 72px / line-height 64.8px / weight 400
- **Page Heading**: 54px / line-height varies (44-56px) / weight 400
- **Contact Heading**: 42px / line-height 40px / weight 400
- **Section Heading**: 24px (2xl) / bold / Navy
- **Body**: 16px base
- **Small**: 14px (category links)
- **Legal**: 12-13px
- **Border Radius**: 3px (buttons, inputs, CTA), 12px (icon containers), 16px (property cards), 24px (rounded-2xl best banking app)
- **Max Width**: 1280px
- **Header**: 48px utility bar (red bg) + 72px main nav (white bg, sticky)
- **Footer**: 360px Aboriginal artwork banner with angled white clip-path panel

## Layout Patterns

- Hero: full-width background image with text overlay (bg-overlay pattern), red bg fallback, 424px height
- Navigation: utility bar (red bg, right-aligned links) + main nav (white bg, logo + links + search/sign-in) with 3px red bottom border on active nav item
- Footer: 5-column link grid with red chevrons + social icons row + legal text with inline red links + Aboriginal artwork banner with angled acknowledgement panel
- Homepage: hero + 3x2 categories grid + best banking app banner + security section (2-col icons) + property investment (4-col cards) + help and contact (2-col: links + gradient card) + quick help links (3-col icons) + legal disclosure + security banner (navy)
- Categories: icon (red bg, white icon) + title (Navy, bold) + chevron links below, 3-col grid
- Cards: no border-radius on WWG-style cards; property investment cards use rounded-xl (12px) on images

## Extraction Notes

- Requires custom font files: `WestpacLH-Bold.otf` and `WestpacLH-Bold.ttf` served from `/brands/westpac/fonts/`
- Font declared at weight 400 (not bold) — `font-weight: 400` in `@font-face` and inline styles
- Homepage hero uses background image overlay with object-right, not split-column
- Credit cards page URL: `/credit-cards` (NOT `/creditcards`)
- Contact Us page hero uses a different approach — full-width bg image with gradient overlay, 42px heading
- Security banner uses Navy (`#1F1C4F`) full-width bar with Lock icon
- Aboriginal artwork footer: uses `clipPath: polygon(0 0, calc(100% - 60px) 0, 100% 100%, 0 100%)` for angled white panel
- Footer links use red ChevronRight icons (`text-[#DA1710]`) with hover state on text
- Sign in button has 2px border matching red bg: `border-2 border-[#DA1710] bg-[#DA1710]`
- Help & Contact card uses gradient: `from-[#1F1C4F] to-[#DA1710]`

## Replica Files

- Components: `ui/components/brands/westpac/` (6 files: header, footer, hero, categories, sections, logo)
- Font declarations: `ui/app/globals.css` (lines 5-12)
- Pages: `ui/app/brands/westpac-com-au/replica/` (5 pages: homepage, home-loans, bank-accounts, credit-cards, contact-us)
