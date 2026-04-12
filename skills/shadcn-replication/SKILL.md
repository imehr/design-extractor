---
name: shadcn-replication
description: "Convert an already-extracted design system into a faithful shadcn/Tailwind HTML replica — map tokens to tailwind.config, wire CSS custom properties, rebuild nav/hero/buttons/cards/footer from components. Trigger on 'build a replica with shadcn'; 'convert these tokens to Tailwind config'; 'rebuild this site in shadcn'; 'map extracted tokens to tailwind'; 'replicate the hero in shadcn'; 'generate a shadcn replica of the extracted brand'; 'port these design tokens into tailwind config'; 'scaffold components from the extracted tokens'; 'produce an HTML replica using shadcn primitives'. Do NOT trigger for: 'build me a shadcn app', 'bootstrap a new Next.js shadcn project', greenfield app scaffolding, 'install shadcn', or generic shadcn component questions unrelated to a prior extraction."
---

# shadcn Replication

## When this skill is active

- An extraction run has produced tokens + patterns and a visual replica is now required
- User asks to convert extracted tokens into `tailwind.config.ts` and CSS variables
- The replica-builder subagent needs to rebuild nav/hero/buttons/cards/footer from shadcn primitives
- Iterative refinement loop is patching the HTML replica and needs token-to-component mapping
- A brand is being ported into an existing shadcn-based codebase

## Core principles

- Every CSS value in the replica must reference a design token — zero hard-coded colours, zero magic numbers
- shadcn primitives are the substrate; the brand comes from token overrides, not custom components
- One replica, many viewports: desktop 1440, tablet 768, mobile 390 at minimum
- The replica is a falsifiable claim about the tokens — if it doesn't look right, the tokens are wrong
- Fidelity beats creativity: the job is to reproduce, not to improve the source

## Out of scope

- Bootstrapping a greenfield shadcn/Next.js project from nothing
- Installing shadcn components into a user's codebase
- Extracting tokens from a URL (that is the design-extraction skill's job)
- Scoring the replica against the reference (that is the visual-diff skill's job)

## How it works

The replication process maps extracted DOM data to shadcn/Tailwind components. The output lives in `ui/components/brands/<slug>/` as TSX files that import from `@/components/ui/` (shadcn primitives).

### Component mapping table

| Site element | shadcn component | Key props overridden |
|---|---|---|
| Header / navigation bar | Custom TSX using `Button`, `Separator` | Brand colours, logo, nav links, sticky behaviour |
| Hero section | `Card` with `CardContent` + background image | Bg colour, heading font, CTA button |
| Footer | Custom TSX using `Separator`, `Link` | Multi-column layout, social icons, legal text |
| Cards / product tiles | `Card`, `CardHeader`, `CardContent` | Border radius, shadow, padding |
| Buttons / CTAs | `Button` variant overrides | bg-[brand-colour], rounded-[brand-radius], font-weight |
| Category grids | Grid layout + `Link` + Lucide icons | Icon background colour, text colours |
| Banners / promo sections | Full-width `div` with brand bg | Gradient or solid background |

### Token mapping

CSS values from extraction become Tailwind classes:

| CSS property | Tailwind mapping | Example |
|---|---|---|
| font-size: 14px | `text-sm` | Standard Tailwind mapping |
| font-size: 16px | `text-base` | Standard Tailwind mapping |
| font-size: 18px | `text-lg` | Standard Tailwind mapping |
| font-size: 20px | `text-xl` | Standard Tailwind mapping |
| border-radius: 3px | `rounded-[3px]` | Arbitrary value |
| border-radius: 8px | `rounded-lg` | Standard Tailwind |
| border-radius: 12px | `rounded-xl` | Standard Tailwind |
| border-radius: 50% | `rounded-full` | Standard Tailwind |
| colour: #DA1710 | `bg-[#DA1710]` / `text-[#DA1710]` | Arbitrary value |
| padding: 60px | `px-[60px]` | Arbitrary value |
| max-width: 1280px | `max-w-[1280px]` | Arbitrary value |
| font-family custom | `style={{ fontFamily: '...' }}` | Inline style for non-Tailwind fonts |

## Procedure

### Step 1: Read extraction artefacts

Load from `~/.claude/design-library/cache/<slug>/`:
- `tokens-output.json` — all extracted tokens
- `patterns.json` — the 9 pattern signals
- `screenshot-desktop.png` — visual reference

### Step 2: Map brand tokens to Tailwind values

Create a mapping of brand tokens to Tailwind arbitrary values. Every colour, radius, and spacing value should use the exact extracted number, not a "close" Tailwind default.

```
Brand primary: #DA1710 -> bg-[#DA1710], text-[#DA1710], border-[#DA1710]
Brand secondary: #1F1C4F -> bg-[#1F1C4F], text-[#1F1C4F]
Body text: #181B25 -> text-[#181B25]
Muted text: #575F65 -> text-[#575F65]
Border: #DEDEE1 -> border-[#DEDEE1]
Light bg: #F3F4F6 -> bg-[#F3F4F6]
Border radius: 3px -> rounded-[3px]
Container: 1280px -> max-w-[1280px]
```

### Step 3: Build the header component

File: `ui/components/brands/<slug>/<slug>-header.tsx`

Structure from Westpac pattern:
1. Utility bar — full-width brand-colour strip with small utility links
2. Main nav — sticky, white bg, logo left, nav links center, CTA button right
3. Use `Button` from `@/components/ui/button` for sign-in CTA
4. Use `Link` from `next/link` for all navigation

Structure from Woolworths pattern:
1. Top brand-colour bar with logo, search input, account actions
2. White nav bar with category links
3. Optional delivery/location bar below nav

### Step 4: Build the hero component

File: `ui/components/brands/<slug>/<slug>-hero.tsx`

Layout patterns:

**bg-overlay hero** (Westpac style):
- Full-width container with `position: relative`, brand bg colour
- `next/image` with `fill` and `object-cover` as background
- Text overlay with `position: relative`, max-width constraint
- CTA button: white bg, brand-coloured border, brand text colour

**split-column hero** (common corporate pattern):
- Two-column grid: image left, text right (or vice versa)
- Image in one column, heading + subtitle + CTA in the other
- Responsive: stack vertically on mobile

### Step 5: Build content sections

Map each visual section to a component:

- Category grids -> `grid grid-cols-2 lg:grid-cols-3` with icon containers
- Feature cards -> `Card` with `CardContent`, brand-specific styling
- Promo banners -> full-width `div` with gradient or solid bg
- Help/contact sections -> 2-column or 3-column grid with Lucide icons

### Step 6: Build the footer component

File: `ui/components/brands/<slug>/<slug>-footer.tsx`

Structure:
1. Link columns section: `grid grid-cols-2 lg:grid-cols-5` with `Link` items
2. Social icons row: inline images or icon components
3. Legal text section: small text with inline links
4. Optional artwork/banner section at bottom (Westpac pattern)

Use `Separator` from `@/components/ui/separator` for divider lines.

### Step 7: Wire fonts

For custom web fonts (e.g., Woolworths uses Roboto):
- Use `style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif" }}`
- For system font stacks (e.g., Westpac): no special font wiring needed

For brand-specific display fonts:
- Declare in Next.js `layout.tsx` via `next/font/local` or `next/font/google`
- Pass as CSS variable and reference in component styles

### Step 8: Verify responsive breakpoints

Test the replica at three viewport widths:
- Desktop: 1440px — full layout visible
- Tablet: 768px — navigation collapses, grids reduce columns
- Mobile: 390px — single column, hamburger nav if applicable

Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:` for breakpoints.

## Layout patterns

### bg-overlay hero (Westpac)

```tsx
<div className="relative w-full overflow-hidden bg-[brand-primary]" style={{ height: 424 }}>
  <div className="absolute inset-0">
    <Image src="/brands/slug/hero.png" alt="" fill className="object-cover object-right" priority />
  </div>
  <div className="relative mx-auto max-w-[1280px] px-[60px] pt-[90px]">
    <div className="max-w-[765px]">
      <h1 className="mb-4 text-white" style={{ fontFamily: "brand-display", fontSize: "72px" }}>
        {heading}
      </h1>
      <p className="mb-6 max-w-[480px] text-base text-white/95">{subtitle}</p>
      <a className="inline-flex items-center rounded-[3px] border border-[brand-primary] bg-white px-5 text-base text-[body-colour]">
        {ctaText}
      </a>
    </div>
  </div>
</div>
```

### Sidebar + content (for docs/app layouts)

Not yet implemented in existing brands. Pattern: `flex` with fixed sidebar `w-[240px]` and `flex-1` content area.

### Full-width banner (Westpac SecurityBanner pattern)

```tsx
<div className="w-full bg-[brand-navy]">
  <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
    <div className="flex items-center gap-3">
      <Lock className="size-[18px] text-white" />
      <span className="text-sm text-white">{message}</span>
    </div>
    <Link className="text-sm font-bold text-white hover:underline">{ctaText}</Link>
  </div>
</div>
```

## Common patterns from Westpac and Woolworths

### Westpac patterns

- **Two-tier header**: red utility bar (48px) + white main nav (72px) with sticky positioning
- **3px border radius**: signature sharp corners on buttons and inputs (`rounded-[3px]`)
- **Red accent borders**: active nav links use `border-b-[3px] border-[#DA1710]`
- **Chevron-right links**: all sub-navigation uses `<ChevronRight>` icon with red colour
- **Card gradient**: `bg-gradient-to-br from-[#1F1C4F] to-[#DA1710]` for promo cards
- **Navy + red system**: two-colour design system, navy for trust/authority, red for action
- **System font stack**: no web fonts, uses system-ui with Westpac-bold for headings
- **Flat shadow system**: minimal shadows, relies on colour and borders for hierarchy

### Woolworths patterns

- **Green brand bar**: full-width `#178841` header with search bar and account actions
- **White secondary nav**: horizontal category links below the brand bar
- **Delivery/location bar**: third navigation tier with MapPin and Clock icons
- **Dark footer sections**: `#25251F` and `#171C1F` for footer rows
- **Rounded elements**: `rounded-lg`, `rounded-xl`, `rounded-full` for various UI elements
- **Roboto font**: explicit font-family override on components
- **Product-dense layout**: higher component density, smaller padding values (4px base unit)
- **Social icons as circles**: `rounded-full bg-[#3A3F42]` for footer social links

## References

- `references/component-mapping.md` — Table mapping common site elements to shadcn components with code snippets
- `references/token-to-tailwind.md` — Mapping rules from extracted tokens to Tailwind classes (planned)
- `references/css-variables.md` — CSS custom property wiring and dark-mode handling (planned)
