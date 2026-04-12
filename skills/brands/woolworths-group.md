---
name: woolworths-group-design
description: "Woolworths Group (woolworthsgroup.com.au) corporate design system knowledge. Use when replicating, referencing, or designing in the Woolworths Group corporate brand style. NOT for Woolworths Supermarket retail, Woolworths grocery products, or Everyday Rewards."
triggers:
  - "Woolworths Group design"
  - "woolworthsgroup.com.au style"
  - "Woolworths Group brand colours"
  - "Woolworths Group corporate design"
  - "design like Woolworths Group"
negative_triggers:
  - "Woolworths Supermarket"
  - "Woolworths groceries"
  - "Everyday Rewards"
  - "woolworths.com.au"
---

# Woolworths Group Corporate Design System

## Key Design Tokens

- **Brand Blue**: `#1971ED` (headings, nav active state, links, accent throughout)
- **Brand Blue Light**: `#66C5FF` (share price investor link)
- **Footer Dark**: `#0E0D26` (footer bg, share price ticker bg)
- **Tri-colour divider**: `#8B2346` (maroon) + `#C4A23A` (gold) + `#1971ED` (blue)
- **Text Primary**: `#202020` (body text, nav text)
- **Text Secondary**: `#333333` (body copy)
- **Footer Text**: `gray-300` (footer body), `gray-400` (acknowledgement), `gray-500` (copyright)
- **Footer Link**: `gray-300` / hover white
- **Surface Light**: `#F6F9FC` (our stories section bg)
- **Display Font**: `TomatoGrotesk` (3 weights: Regular 400, SemiBold 600, Bold 700 — all woff2)
- **Body Font**: `Montserrat` (3 weights: Regular 400, SemiBold 600, Bold 700 — all woff2)
- **Hero Heading**: 64px / line-height 80px / weight 600 / TomatoGrotesk
- **Section Heading**: 48px / line-height 56px / weight 600 / TomatoGrotesk / blue
- **Body**: 16px / Montserrat
- **Small**: 14px
- **Tiny**: 12px
- **Max Width**: 1200px (narrower than Westpac/WW retail)
- **Header**: 94px main nav (white, logo left + nav links + search) + share price ticker (dark navy bar)
- **Footer**: tri-colour divider strip + 4-col grid on dark bg + acknowledgement with indigenous art + copyright
- **Cards**: `rounded-none` (no border radius), `shadow-none` (no shadow on news cards), `border-0`

## Layout Patterns

- Navigation: single white bar with logo + inline nav links + search button, followed by dark share price ticker bar
- Share price ticker: dark navy (`#0E0D26`) bar showing price, high, low, change values with pipe-separated layout
- Hero: full-width image (529px) with gradient overlay and centered white heading
- Homepage: hero + latest news (2-col: featured large card left + 3 stacked small cards right) + our stories (3-col card grid) on light blue bg
- Footer: tri-colour decorative strip (maroon/gold/blue, 8px height) + 4-col layout (brand column with CTA button + addresses + 2 link columns) + acknowledgement with indigenous art SVG + copyright
- News cards: featured uses aspect-4/3 image + title + excerpt; small cards use horizontal layout (200x120 image + title)
- Section headings: centered, large, blue, TomatoGrotesk font
- All news/story card titles are blue links with group-hover underline

## Extraction Notes

- 6 custom font files total: TomatoGrotesk-Regular.woff2, TomatoGrotesk-SemiBold.woff2, TomatoGrotesk-Bold.woff2, Montserrat-Regular.woff2, Montserrat-SemiBold.woff2, Montserrat-Bold.woff2
- All fonts served from `/brands/woolworths-group/fonts/` as woff2
- Logo has two variants: `logo-100years.svg` (color, for header) and `logo-white.svg` (white, for footer)
- Tri-colour footer divider uses 3 flex-1 divs with different bg colors and h-2 height
- Share price ticker values are hardcoded (not dynamic) — price, high, low, change
- Cards deliberately use `rounded-none` and `shadow-none` — flat card design is intentional
- Footer acknowledgement uses `care-deeply.svg` indigenous art image (80x80)
- Footer CTA button: white bg with dark text, rounded-lg
- Footer "Learn more" link in brand column uses white bg button style
- Active nav state: blue text + underline with `underline-offset-4`
- Hero height: 529px
- Max width is 1200px (not 1280px like other brands) — narrower corporate layout
- Padding uses `px-10` (40px) instead of `px-6` (24px) like Westpac
- WWG header is client component (`"use client"`) due to search toggle state

## Replica Files

- Components: `ui/components/brands/woolworths-group/` (3 files: header, footer, logo)
- Font declarations: `ui/app/globals.css` (lines 14-49 for TomatoGrotesk and Montserrat)
- Pages: `ui/app/brands/woolworthsgroup-com-au/replica/` (5 pages: homepage, who-we-are, our-impact, our-brands, contact-us)
