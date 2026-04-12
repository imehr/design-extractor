---
name: woolworths-design
description: "Woolworths Supermarket (woolworths.com.au) design system knowledge. Use when replicating, referencing, or designing in the Woolworths retail brand style. NOT for Woolworths Group corporate, Woolworths careers, or Woolworths grocery shopping assistance."
triggers:
  - "Woolworths design"
  - "woolworths.com.au style"
  - "Woolworths brand colours"
  - "Woolworths Supermarket design"
  - "design like Woolworths"
negative_triggers:
  - "Woolworths Group"
  - "Woolworths careers"
  - "Woolworths jobs"
  - "woolworthsgroup"
---

# Woolworths Supermarket Design System

## Key Design Tokens

- **Brand Green**: `#178841` (header bg, search button, delivery icons, active nav, CTAs)
- **Brand Green Hover**: `#126B34`
- **Link Green**: `#00723D` (inline links, "Shop for business")
- **Text Primary**: `#25251F` (body text, nav text)
- **Text Secondary**: `#616C71` (delivery bar labels, placeholder text, secondary nav)
- **Text Muted Footer**: `#A0A4A8` (footer links, copyright, legal)
- **Surface BG**: `#EEEEEE` (not directly used — variants include `#F5F6F6` for search input and hover states)
- **Search Input BG**: `#F5F6F6`
- **Footer Dark**: `#25251F` (ways to shop section), `#171C1F` (main footer)
- **Footer Divider**: `#3A3F42`
- **Border**: `#E0E0E0` (nav borders, delivery bar dividers)
- **Display Font**: `Glider` (local font, falls back to `Inter, sans-serif`) — used for headings
- **Body Font**: `Roboto` via CSS variable `var(--font-roboto)`, falls back to `-apple-system, system-ui, sans-serif`
- **Hero Heading**: varies by page (Glider font)
- **Body**: 16px base
- **Nav Links**: 14px / medium weight
- **Footer Links**: 14px (columns), 12px (legal)
- **Border Radius**: 12px (search input), 8px (search button), 50% (social icons), 8px (app download buttons)
- **Card Radius**: 12px (product cards)
- **Max Width**: 1280px
- **Header**: 56px green bar (logo + search + account actions) + 48px white nav bar + 40px delivery bar
- **Footer**: Dark 2-section footer (ways to shop + links + social + partners + app + acknowledgement + badges + legal)

## Layout Patterns

- Navigation: 3-tier header — green bar (logo + services dropdown + search + account/cart) + white nav bar (7 links with dropdowns) + white delivery bar (address + time selectors)
- Search: prominent center-aligned in header, green search button inside input
- Footer: dark multi-section — "Ways to shop" (dark `#25251F`) + main links (4-col grid on `#171C1F`) + social circles + partner logos (inverted) + app download badges (App Store + Google Play) + indigenous acknowledgement + accessibility/drinkwise badges + legal links with pipe separators
- Homepage: hero carousel + sidebar layout, multi-section product display
- Specials: category tabs with product grid
- Recipes: card grid with image + title layout

## Extraction Notes

- **CRITICAL**: Site uses Akamai bot detection. Requires `--headed` flag for agent-browser, or assisted capture mode. Headless mode will be blocked.
- Display font `Glider` is declared as `local('Glider')` — it relies on the font being installed on the system, not served as a web font
- Body font `Roboto` uses CSS variable `var(--font-roboto)` — ensure Next.js font variable is configured in layout
- Logo uses SVG image (`woolworths-wapple-green.svg`) not inline SVG — green W-apple icon
- Footer social icons are styled as circles with first letter (not actual SVG icons)
- Partner logos use `brightness-0 invert` CSS filter to convert to white
- App download buttons use inline SVG paths for Apple and Google Play icons
- Footer acknowledgement uses "We care deeply" image alongside text
- Cart shows `$0.00` in header — stateful element
- Search placeholder: "Search products, recipes & ideas"
- Nav has "More" dropdown item with `hasDropdown` flag

## Replica Files

- Components: `ui/components/brands/woolworths-com-au/` (3 files: header, footer, logo)
- Font declarations: `ui/app/globals.css` (lines 51-65 for Glider)
- Pages: `ui/app/brands/woolworths-com-au/replica/` (5 pages: homepage, specials, recipes, help, contact-us)
