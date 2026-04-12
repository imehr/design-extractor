# Component Mapping — Site Elements to shadcn Components

Reference table mapping common website elements to shadcn/Tailwind components, with real code snippets from the Westpac and Woolworths replicas in `ui/components/brands/`.

---

## Header / Navigation Bar

### Westpac pattern (two-tier header)

Map: site header -> utility bar div + sticky nav div using `Button`, `Link`, Lucide icons

```tsx
// westpac-header.tsx pattern
// Tier 1: Brand-coloured utility bar
<div className="w-full bg-[#DA1710]">
  <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-end gap-6 px-6">
    {UTILITY_LINKS.map((link) => (
      <Link className="text-sm text-white hover:underline">{link.text}</Link>
    ))}
  </div>
</div>

// Tier 2: White sticky main nav
<div className="sticky top-0 z-50 w-full border-b border-[#DEDEE1] bg-white">
  <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6">
    <div className="flex items-center gap-8">
      <BrandLogo />
      <nav className="hidden h-[72px] items-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <Link className="flex h-[72px] items-center border-b-[3px] text-lg
            {active ? 'border-[#DA1710]' : 'border-transparent'}">
            {link.text}
          </Link>
        ))}
      </nav>
    </div>
    <div className="flex items-center gap-3">
      <Button className="h-9 rounded-[3px] border-2 border-[#DA1710] bg-[#DA1710]
        px-4 text-base font-bold text-white hover:bg-[#C21410]">
        Sign in
      </Button>
    </div>
  </div>
</div>
```

### Woolworths pattern (green bar + white nav + delivery bar)

Map: site header -> green brand bar with search + white nav + delivery context bar

```tsx
// ww-header.tsx pattern
// Tier 1: Green brand bar with search
<div className="w-full bg-[#178841]">
  <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4">
    <BrandLogo />
    <div className="flex flex-1 max-w-[600px]">
      <input className="h-12 w-full rounded-lg bg-[#F5F6F6] pl-4 pr-12 text-sm" />
      <button className="absolute right-1 bg-[#178841] rounded-md h-10 w-10">
        <Search className="text-white" />
      </button>
    </div>
    <div className="flex items-center gap-1">
      <button className="text-sm text-white">{accountActions}</button>
    </div>
  </div>
</div>

// Tier 2: White nav with category links
<div className="w-full border-b border-[#E0E0E0] bg-white">
  <div className="mx-auto flex h-12 max-w-[1280px] items-center px-4">
    <nav className="flex items-center gap-1">
      {NAV_LINKS.map(link => <Link className="rounded px-3 py-1.5 text-sm">{link.text}</Link>)}
    </nav>
  </div>
</div>
```

---

## Hero Section

### Westpac hero (bg-overlay with image)

Map: hero section -> relative container with bg image + text overlay + CTA button

```tsx
// westpac-hero.tsx
<div className="relative w-full overflow-hidden bg-[#DA1710]" style={{ height: 424 }}>
  <div className="absolute inset-0">
    <Image src="/brands/westpac/hero-home.png" alt="" fill
      className="object-cover object-right" priority />
  </div>
  <div className="relative mx-auto max-w-[1280px] px-[60px] pt-[90px]">
    <div className="max-w-[765px]">
      <h1 className="mb-4 text-white"
        style={{ fontFamily: '"Westpac-bold"', fontSize: "72px", lineHeight: "64.8px" }}>
        {heading}
      </h1>
      <p className="mb-6 max-w-[480px] text-base text-white/95">{subtitle}</p>
      <a className="inline-flex h-[42px] items-center rounded-[3px] border border-[#DA1710]
        bg-white px-5 text-base text-[#181B25] hover:bg-white/90">
        {ctaText}
      </a>
    </div>
  </div>
</div>
```

Key mapping decisions:
- Hero background colour is the brand primary (#DA1710), not a neutral
- CTA is white-on-brand-colour (inverted from nav CTA which is brand-colour-on-white)
- Font uses inline `style` for custom font-family that Tailwind doesn't know about
- `object-cover object-right` positions the background image to show the phone mockup

---

## Category Grid

### Westpac categories (icon + title + links)

Map: product categories -> grid of icon containers with link lists

```tsx
// westpac-categories.tsx
<div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
  {CATEGORIES.map((cat) => (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded bg-[#DA1710]">
          <cat.icon className="size-5 text-white" strokeWidth={2} />
        </div>
        <h3 className="text-xl font-bold text-[#1F1C4F]">{cat.title}</h3>
      </div>
      <ul className="ml-[52px] space-y-1">
        {cat.links.map((link) => (
          <li>
            <Link className="flex items-center gap-1 text-[14px] text-[#181B25]
              underline decoration-transparent hover:text-[#DA1710]">
              <ChevronRight className="size-4 text-[#DA1710]" />
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

---

## Promo / Feature Cards

### Westpac promo card (gradient Card)

Map: promotional section -> shadcn `Card` with gradient background

```tsx
// westpac-sections.tsx — HelpAndContact
<Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1F1C4F] to-[#DA1710]">
  <CardContent className="flex items-center gap-6 p-8 text-white">
    <div className="flex-1">
      <h2 className="mb-3 text-2xl font-bold text-white">{title}</h2>
      <p className="mb-4 text-sm text-white/90">{description}</p>
      <Button className="rounded-[3px] bg-white text-sm font-bold text-[#1F1C4F]">
        {ctaText}
      </Button>
    </div>
  </CardContent>
</Card>
```

### Westpac info cards (icon + heading + text)

Map: feature blocks -> icon container + heading + paragraph

```tsx
// westpac-sections.tsx — SecuritySection
<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
  <div className="flex gap-4">
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6]">
      <Shield className="size-6 text-[#1F1C4F]" />
    </div>
    <div>
      <h3 className="mb-2 text-lg font-bold text-[#1F1C4F]">{title}</h3>
      <p className="text-sm leading-[22px] text-[#575F65]">{description}</p>
    </div>
  </div>
</div>
```

---

## Footer

### Westpac footer (link columns + social + legal + artwork)

Map: footer -> grid of link columns + social icons row + legal text + optional artwork

```tsx
// westpac-footer.tsx
<footer className="w-full">
  {/* Link columns */}
  <div className="w-full bg-white py-8">
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 lg:grid-cols-5">
      {LINK_COLUMNS.map((col) => (
        <div className="space-y-1">
          {col.map((link) => (
            <Link className="flex items-center gap-1 py-1 text-sm text-[#575F65]
              hover:text-[#DA1710]">
              <ChevronRight className="size-4 text-[#DA1710]" />
              {link.text}
            </Link>
          ))}
        </div>
      ))}
    </div>
  </div>

  <Separator className="bg-[#DEDEE1]" />

  {/* Social icons */}
  <div className="w-full bg-white py-4">
    <div className="mx-auto flex max-w-[1280px] items-center justify-between">
      <div className="flex items-center gap-2">
        {SOCIAL_ICONS.map(icon => <img className="size-8" />)}
      </div>
      <BrandLogo />
    </div>
  </div>
</footer>
```

### Woolworths footer (dark sections + columns + apps)

Map: footer -> dark background sections with link columns, social, partner logos, app badges

```tsx
// ww-footer.tsx
<footer className="w-full">
  {/* Dark fulfilment bar */}
  <div className="w-full bg-[#25251F] py-8">
    <div className="mx-auto max-w-[1280px] px-6">
      <h3 className="mb-4 text-base font-medium text-white">Ways to shop</h3>
    </div>
  </div>

  {/* Dark link columns */}
  <div className="w-full bg-[#171C1F] py-10">
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      {FOOTER_COLUMNS.map(col => (
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">{col.title}</h4>
          <ul className="space-y-2">
            {col.links.map(link => (
              <Link className="text-sm text-[#A0A4A8] hover:text-white">{link}</Link>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</footer>
```

---

## Buttons

### Westpac button variants

| Context | Variant | Classes |
|---|---|---|
| Nav CTA (Sign in) | Primary filled | `h-9 rounded-[3px] border-2 border-[#DA1710] bg-[#DA1710] px-4 text-base font-bold text-white hover:bg-[#C21410]` |
| Hero CTA | White outline on dark bg | `inline-flex h-[42px] items-center rounded-[3px] border border-[#DA1710] bg-white px-5 text-base text-[#181B25] hover:bg-white/90` |
| Footer link | Text link with chevron | `flex items-center gap-1 py-1 text-sm text-[#575F65] hover:text-[#DA1710]` |
| Promo card CTA | White on gradient | `rounded-[3px] bg-white text-sm font-bold text-[#1F1C4F] hover:bg-white/90` |

### Woolworths button variants

| Context | Variant | Classes |
|---|---|---|
| Search button | Green icon button | `flex h-10 w-10 items-center justify-center rounded-md bg-[#178841] hover:bg-[#126b34]` |
| Nav pill buttons | Ghost on green | `flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-white hover:bg-white/10` |
| Footer social | Circle ghost | `flex h-9 w-9 items-center justify-center rounded-full bg-[#3A3F42] text-white hover:bg-[#505558]` |

---

## Full mapping summary

| Site element | shadcn component used | Files referencing this pattern |
|---|---|---|
| Navigation header | `Button`, `Link`, Lucide icons | `westpac-header.tsx`, `ww-header.tsx` |
| Hero banner | `next/image` + `Link` for CTA | `westpac-hero.tsx` |
| Category grid | `Link` + Lucide icons | `westpac-categories.tsx` |
| Feature cards | `Card`, `CardContent` | `westpac-sections.tsx` |
| Info blocks | Lucide icons + `Link` | `westpac-sections.tsx` |
| Promo banner | Full-width div with brand bg | `westpac-sections.tsx` |
| Footer columns | `Separator`, `Link` | `westpac-footer.tsx`, `ww-footer.tsx` |
| Social icons | Inline `img` tags | `westpac-footer.tsx`, `ww-footer.tsx` |
| App badges | SVG + `Link` | `ww-footer.tsx` |
| Logo component | Inline SVG | `westpac-logo.tsx`, `ww-logo.tsx` |
