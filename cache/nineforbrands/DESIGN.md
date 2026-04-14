# Nine for Brands — Design System

> Extracted from [nineforbrands.com.au](https://www.nineforbrands.com.au/) on 2026-04-14
> Pages analysed: Homepage, About Us, Brands, Solutions, Research, Our Audience (6 pages)

---

## 1. Brand Identity

**Nine for Brands** is the B2B advertising platform for Nine Entertainment Company, Australia's largest locally-owned media company. The site targets media buyers, agencies, and brand managers.

| Property | Value |
|----------|-------|
| Platform | WordPress + Beaver Builder |
| Theme | `ninetrade` (custom) |
| Grid System | Foundation 6 Flex Grid |
| Icon System | Font Awesome 5 |
| Language | Australian English |

### Logo System

The Nine logo consists of a 9-dot grid icon (3x3 with top-right dot offset) plus "Nine" wordmark. The icon and wordmark use a vertical gradient from dark blue to cyan.

| Variant | File | Dimensions | Use |
|---------|------|-----------|-----|
| Primary (white) | `site-logo-white.png` | 155x40 | Header on dark backgrounds |
| Primary (dark) | `site-logo.png` | 155x40 | Header on light backgrounds |
| Footer | `site-logo-footer.png` | 93x24 | Footer (smaller) |
| Mobile (white) | `site-logo-mobile-white.png` | 78x20 | Mobile header on dark |
| Mobile (dark) | `site-logo-mobile.png` | 78x20 | Mobile header on light |
| Brand Mark (colour) | `Nine_FullColour_RGB.png` | 875x227 | Hero sections, about page |
| Brand Mark (white) | `Nine_White_RGB.png` | 2115x547 | Dark hero overlays |

---

## 2. Colour Palette

### Brand Colours

| Token | Hex | RGB | Usage | Confidence |
|-------|-----|-----|-------|------------|
| `nine-blue` | `#0493de` | `rgb(4, 147, 222)` | Primary brand, CTAs, links, active states | HIGH (90 occurrences) |
| `dark-navy` | `#070720` | `rgb(7, 7, 32)` | Hero backgrounds, footer, nav background | MEDIUM |
| `logo-gradient-start` | `#2855a0` | — | Logo gradient dark end | MEDIUM |
| `logo-gradient-end` | `#00d4ff` | — | Logo gradient light end | MEDIUM |

### Neutral Palette

| Token | Hex | RGB | Usage | Confidence |
|-------|-----|-----|-------|------------|
| `near-black` | `#0a0a0a` | `rgb(10, 10, 10)` | Dark text, dark backgrounds | HIGH (12) |
| `body-text` | `#333333` | `rgb(51, 51, 51)` | Default body text | HIGH (667) |
| `muted-text` | `#737373` | `rgb(115, 115, 115)` | Secondary text, captions | HIGH (6) |
| `border-gray` | `#ababab` | `rgb(171, 171, 171)` | Borders, dividers | HIGH (8) |
| `light-gray-bg` | `#f5f5f5` | `rgb(245, 245, 245)` | Alternate section backgrounds | HIGH (13) |
| `white` | `#ffffff` | `rgb(255, 255, 255)` | Primary background, text on dark | HIGH (68) |

### Gradients

| Name | Value | Usage |
|------|-------|-------|
| Hero gradient | `linear-gradient(to bottom, #070720, #0493de)` | Internal page hero banners |
| Logo gradient | `linear-gradient(to bottom, #2855a0, #00d4ff)` | Nine logo, brand identity |
| Research warm | `linear-gradient(135deg, #e84393, #fdcb6e)` | Research tile cards (on black bg) |

### Colour Roles (CSS Custom Properties)

```css
:root {
  --color-brand: #0493de;
  --color-brand-dark: #070720;
  --color-text: #333333;
  --color-text-muted: #737373;
  --color-text-inverse: #ffffff;
  --color-bg: #ffffff;
  --color-bg-alt: #f5f5f5;
  --color-bg-dark: #070720;
  --color-border: #ababab;
  --color-border-subtle: rgba(229, 229, 229, 0.2);
}
```

---

## 3. Typography

### Font Family

**Proxima Nova** is the sole typeface, used across all text — body, headings, navigation, buttons. Fallback: Arial, sans-serif.

```css
font-family: "Proxima Nova", Arial, sans-serif;
```

### Type Scale

| Token | Size | Rem | Usage | Occurrences |
|-------|------|-----|-------|-------------|
| `xs` | 12px | 0.75rem | Legal text, fine print | 6 |
| `sm` | 14px | 0.875rem | Captions, small text | 9 |
| `base` | 16px | 1rem | Body text (default) | 388 |
| `md` | 18px | 1.125rem | Lead paragraphs | 7 |
| `lg` | 20px | 1.25rem | Sub-headings, card titles | 3 |
| `xl` | 24px | 1.5rem | Section headings (h3-h4) | 9 |
| `2xl` | 36px | 2.25rem | Page headings (h1-h2) | 5 |

### Font Weights

| Token | Weight | Usage | Occurrences |
|-------|--------|-------|-------------|
| `regular` | 400 | Body text | 340 |
| `bold` | 700 | Emphasis, strong text | 4 |
| `extra-bold` | 800 | Headings, navigation items | 77 |
| `black` | 900 | Hero display text | 6 |

**Key pattern**: Nine uses `800` (extra-bold) as its heading weight rather than `700` (bold). This gives headings a heavier, more authoritative feel typical of media/broadcast brands.

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.0 | Navigation, buttons |
| `snug` | 1.2 | Card titles |
| `normal` | 1.5 | Body text (secondary) |
| `relaxed` | 1.6 | Body text (primary, dominant) |

### Letter Spacing

| Token | Value | Usage | Occurrences |
|-------|-------|-------|-------------|
| `normal` | 0px | Body text | — |
| `wide` | 0.25px | Navigation, headings, uppercase labels | 76 |
| `wider` | 0.5px | Buttons, CTAs | 8 |

**Key pattern**: Wide letter-spacing (0.25px) is applied broadly to headings and navigation, giving the site a spacious, editorial feel.

---

## 4. Spacing

### Base Unit

**4px** base unit, confirmed by GCD analysis of all padding/margin values.

### Scale

| Token | Value | Common Usage |
|-------|-------|-------------|
| `0.5` | 2px | Hairline gaps |
| `1` | 4px | Tight spacing |
| `2` | 8px | Icon gaps |
| `3` | 12px | Compact padding, nav item padding |
| `4` | 16px | Default component padding |
| `5` | 20px | Card internal spacing |
| `6` | 24px | Section sub-spacing |
| `9` | 36px | Section padding |
| `10` | 40px | Large section padding |
| `12` | 48px | Section vertical gap |
| `20` | 80px | Hero vertical padding |
| `21` | 84px | Hero vertical padding (alt) |

### Section Rhythm

- **Hero section**: 80-84px vertical padding
- **Content sections**: 36-48px vertical padding
- **Card internal**: 16px padding
- **Navigation horizontal**: 12px between items
- **Footer**: 40px vertical padding

---

## 5. Borders & Shadows

### Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 2px | Subtle rounding on inputs |
| `lg` | 20px | Card corners |
| `pill` | 100px | CTA buttons, pill badges |

**Key pattern**: Minimal border radius usage. Most elements are sharp-cornered. Only CTAs get the distinctive pill shape (100px), and select cards get 20px rounding.

### Border Widths

| Token | Value | Usage |
|-------|-------|-------|
| `default` | 2px | Card borders, dividers |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `card` | `0 0 5px 0 rgb(128, 128, 128)` | Card hover state |

**Key pattern**: Very minimal shadow usage. The design relies on colour contrast and spacing rather than elevation/shadow depth.

---

## 6. Motion & Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `default` | `all 0.3s ease` | General hover transitions |
| `hero-entrance` | `transform 1.2s ease-in-out 0.1s` | Hero content entrance animation |
| `fade` | `visibility, opacity 0.5s linear` | Fade in/out effects |
| `slide` | `right 0.3s` | Mobile menu slide |

---

## 7. Breakpoints

| Token | Value | Context |
|-------|-------|---------|
| `xs` | 480px | Small mobile |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet portrait |
| `lg` | 960px | Tablet landscape |
| `xl` | 1024px | Small desktop |
| `2xl` | 1200px | Desktop (max content width) |

Grid framework: **Foundation 6 Flex Grid**

---

## 8. Component Inventory

### 8.1 Navigation

- **Position**: Fixed top, full-width
- **Background**: Dark navy (`#070720`) with slight transparency
- **Items**: 9 horizontal links (About Us, Brands, Advertise, Research, News, Investors, Careers at Nine, Olympics and Paralympics, Nine in 2026)
- **Typography**: 14px, weight 800, letter-spacing 0.25px, white text
- **Logo**: Left-aligned, white variant
- **Right utilities**: Subscribe link + LinkedIn icon + hamburger menu
- **Mobile**: Hamburger triggers slide-in panel from right

### 8.2 Hero Section

- **Homepage**: Full-viewport video background with dark overlay, centered text
- **Internal pages**: Dark navy to Nine Blue gradient background
- **Content**: Centered white text, h1 at 36px weight 800-900
- **Vertical padding**: 80-84px
- **Some pages include**: Nine brand mark logo below heading

### 8.3 Cards

Three card variants observed:

**Image Card** (Homepage — Latest News, Case Studies, Media Releases):
- White background
- Image top, text bottom
- Title in bold/extra-bold
- "See all" link below
- Minimal border, no visible shadow in default state

**Service Card** (Homepage — Brands, Our Audience, Ad Specs):
- Image/icon top
- Title link in Nine Blue
- Description paragraph
- Arrow/chevron link affordance

**Photo Card** (Solutions page):
- Full-bleed photo
- Single-word label below (Content, Data, Technology)
- 3-column grid

### 8.4 CTA Buttons

- **Primary**: Nine Blue (`#0493de`) background, white text, pill shape (`border-radius: 100px`)
- **Text**: Weight 800, letter-spacing 0.5px
- **Padding**: ~12px 24px
- **Hover**: Slight darkening transition (0.3s)
- **Always used in pairs**: "Subscribe to Nine Insights" + "Follow us on LinkedIn" in the Connect bar

### 8.5 "Connect with us" Bar

- Present on every page, positioned above the footer
- Left: "Connect with us" heading
- Right: Two pill CTA buttons (Subscribe + LinkedIn)
- Background: White
- Full content width

### 8.6 Footer

- **Background**: Dark navy (`#070720`)
- **Logo**: Small footer variant (93x24)
- **Navigation**: Single row of links (Careers, Help, Terms, Privacy, Advertise)
- **Acknowledgement of Country**: Full paragraph, always present
- **Newsletter CTA**: "Nine Insights, straight to your inbox" with Subscribe button
- **Copyright**: "2026 Nine Entertainment Company"

### 8.7 Brand Logo Carousel

- Horizontal scrolling strip of partner/sub-brand logos
- Appears on homepage under "Our Brands" heading
- Logos are lazy-loaded images in a Slick.js carousel

### 8.8 Director/Team Grid

- **Board of Directors**: Circular cropped portrait photos, 4-column grid, name + title below
- **Management Team**: Text-only, 4-column grid, name + title + department

### 8.9 Research Tiles (anomaly)

- **Black background** (breaks from site-wide white/blue)
- **Gradient tile cards**: Warm pink-to-orange/amber diagonal gradients
- **Masonry-like grid** layout
- **White text** on gradient backgrounds
- Distinct visual identity for "Nine's Insight Playground" sub-brand

---

## 9. Layout Patterns

### Content Width
- **Max width**: ~1200px (aligned with Foundation 6 `xlarge` breakpoint)
- **Horizontal padding**: 16px on mobile, expanding on desktop

### Grid Patterns
- **3-column**: Service cards, solution cards, news/case-study/media-release row
- **4-column**: Board of Directors, Management Team
- **Single column**: Article content, hero sections
- **Responsive**: Collapses to 1-2 columns on tablet/mobile

### Page Structure (consistent across all pages)
1. Fixed navigation bar
2. Hero section (gradient or video)
3. Content sections (alternating white / light-gray backgrounds)
4. "Connect with us" CTA bar
5. Footer with Acknowledgement of Country

---

## 10. Brand Voice

### Tone Dimensions

| Dimension | Position | Evidence |
|-----------|----------|----------|
| Formality | Formal-professional | Corporate B2B language, full sentences |
| Energy | Confident-ambitious | "Fuelled by Ambition, Ignited by Partnership" |
| Warmth | Warm-collaborative | "Weaving your stories into ours" |
| Authority | Expert-established | "Australia's most trusted and loved brands" |
| Exclusivity | Premium-inclusive | Open platform but premium positioning |

### Voice Characteristics
- **Professional but not cold**: Uses first-person plural ("we"), addresses reader as "you"
- **Outcome-focused**: "delivering proven business outcomes for you"
- **Australian identity**: Strong cultural framing ("right at the heart of Australian culture")
- **Data-forward**: References ecosystem, data, technology, AI alongside creative content
- **Partnership language**: "partnership", "embed brands", "weaving stories"

### Vocabulary Patterns
- **Key terms**: ecosystem, audience, brands, content, data, technology, partnership, insights, outcomes
- **Industry terms**: Total TV, BVOD, 9Tribes, media kit, ad specs
- **Sub-brand language**: Nine's Insight Playground, The Growth Project, Headliners

### CTA Style
- Short, direct: "Sign up", "Learn more", "Subscribe Now", "See all"
- Paired CTAs in the Connect bar: subscription + social following
- Newsletter framing: "Nine Insights, straight to your inbox"

### Language Variant
Australian English (colour, analyse, organisation). "Acknowledgement of Country" follows standard Australian corporate protocol.

---

## 11. Accessibility Notes

- Acknowledgement of Country present on every page footer
- Alt text provided for all logo images
- Navigation uses semantic `<nav>` element
- Footer uses `<footer>` / `contentinfo` landmark
- Font Awesome icons used for social media and UI elements
- Colour contrast: white text on dark navy backgrounds passes WCAG AA
- Newsletter popup fires on page load (potential accessibility concern — blocks interaction until dismissed)

---

## 12. Technical Notes

### WordPress Stack
- **Theme**: `ninetrade` (custom theme at `/wp-content/themes/ninetrade/`)
- **Page builder**: Beaver Builder (BB) with PowerPack addons
- **CSS framework**: Foundation 6 Flex Grid (CDN)
- **Carousel**: Slick.js
- **Forms**: Gravity Forms
- **Popups**: Popup Maker
- **Icons**: Font Awesome 5 (CDN)
- **Analytics**: Various tracking scripts

### Asset Paths
- Theme assets: `/wp-content/themes/ninetrade/src/images/`
- Logos: `/wp-content/themes/ninetrade/src/images/logos/`
- Icons: `/wp-content/themes/ninetrade/src/images/icons/`
- Uploads: `/wp-content/uploads/`
- BB cache: `/wp-content/uploads/bb-plugin/cache/`

### Lazy Loading
Site uses native lazy loading with SVG placeholders. Images require JavaScript execution to resolve actual `src` URLs. Direct `urllib` downloads return 403; browser User-Agent headers required.

---

## 13. Design Token File

Structured token data: [`design-tokens.json`](./design-tokens.json)

## 14. Screenshots

| Page | File |
|------|------|
| Homepage (desktop) | `screenshots/homepage-desktop.png` |
| Homepage (recon desktop) | `screenshots/desktop-full.png` |
| Homepage (recon tablet) | `screenshots/tablet-full.png` |
| Homepage (recon mobile) | `screenshots/mobile-full.png` |
| About Us | `screenshots/about-desktop.png` |
| Brands | `screenshots/brands-desktop.png` |
| Solutions | `screenshots/solutions-desktop.png` |
| Research | `screenshots/research-desktop.png` |
| Our Audience | `screenshots/audience-desktop.png` |
