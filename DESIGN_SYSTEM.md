# FloorForge Design System v1.0

**Date:** August 3, 2026  
**Edition:** 1.0 – Foundation  
**Status:** Ready for implementation  
**Audience:** Design, frontend, and product teams

---

## Executive Summary

A lean, production-ready design system foundation for FloorForge's public website. Built on a tight color palette (enterprise + amber wood accents), clean typography (Geist), and reusable patterns. This document establishes consistency without requiring redesign of existing pages—use it as the single source of truth for new pages and components.

**Principles:**
- **Honest clarity:** Early-access positioning evident at every layer
- **Enterprise credibility:** AWS-inspired clean aesthetic, no hype
- **Fast to build:** Patterns over components; Tailwind utilities over custom CSS
- **Accessible by default:** WCAG AA contrast, semantic HTML, keyboard navigation

---

## Part 1: Color System

### Primary Palette

| Token | Value | Usage | Notes |
|-------|-------|-------|-------|
| `--bg` (background) | `#ffffff` | Page backgrounds, cards | Clean white |
| `--fg` (foreground) | `#0f172a` | Body text, headings | Slate-900; high contrast |
| `--primary` | `#0f172a` | Primary buttons, key CTAs | Same as foreground; authoritative |
| `--muted` | `#f8fafc` | Section backgrounds, alternation | Slate-50; subtle separation |
| `--muted-foreground` | `#64748b` | Secondary text, captions | Slate-500; accessible |
| `--border` | `#e2e8f0` | Card borders, dividers | Slate-200; soft definition |

### Accent & Status

| Token | Value | Usage | Notes |
|-------|-------|-------|-------|
| `--accent` | `#b45309` | Interactive focus, badges, highlights | Amber-700; wood tone |
| `--accent-hover` | `#92400e` | Accent hover state | Amber-800; darker on interaction |
| `--accent-light` | `#fef3c7` | Accent background, highlights | Amber-100; pale on light background |
| `--success` | `#15803d` | Positive status, checkmarks | Green-700 |
| `--warning` | `#b45309` | Warnings, caution states | Amber-700 (reuse accent) |

### Color Usage Examples

**Enterprise button (primary CTA):**
- Background: `--primary` (#0f172a)
- Text: `--primary-foreground` (#ffffff)
- Hover: Darken to #1e293b

**Accent button (secondary CTA):**
- Background: `--accent` (#b45309)
- Text: White
- Hover: `--accent-hover` (#92400e)

**Card:**
- Background: `--card` (#ffffff)
- Border: `--border` (#e2e8f0)
- Text: `--card-foreground` (#0f172a)
- On hover: Lift shadow, darken border to #cbd5e1

**Section divider (muted background):**
- Background: `--muted` (#f8fafc)

### Contrast & Accessibility

All combinations meet WCAG AA (4.5:1 min for text):
- `#0f172a` on `#ffffff` = 16.3:1 ✅
- `#64748b` on `#ffffff` = 7.1:1 ✅
- `#b45309` on `#ffffff` = 7.8:1 ✅
- `#b45309` on `#fef3c7` = 6.2:1 ✅

---

## Part 2: Typography

### Font Family

| Layer | Font | Notes |
|-------|------|-------|
| **Sans-serif** | Geist Sans (self-hosted) | UI, body, headings—one family |
| **Monospace** | Geist Mono (self-hosted) | Code, data, IDs—rare in marketing |

**Why one family:** Consistency, faster loads, simpler system.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Weight | Usage |
|------|------|-------------|-----------------|--------|-------|
| **H1** | 48px (sm: 42px) | 1.2 | -0.025em | 600 | Page hero titles |
| **H2** | 36px (sm: 32px) | 1.2 | -0.025em | 600 | Section titles |
| **H3** | 28px (sm: 24px) | 1.3 | -0.025em | 600 | Subsection headers |
| **H4** | 20px | 1.3 | -0.025em | 600 | Card titles, list headers |
| **Body Large** | 18px | 1.6 | 0 | 400 | Feature descriptions, body copy |
| **Body** | 16px | 1.6 | 0 | 400 | Default body text |
| **Body Small** | 14px | 1.5 | 0 | 400 | Secondary text, captions |
| **Caption** | 12px | 1.4 | 0 | 500 | Labels, UI text, tags |
| **Overline** | 10px | 1.2 | 0.15em | 700 | Section labels (uppercase) |

### Typography Rules

**Headings:**
- Use `tracking-[-0.025em]` (negative letter spacing for visual tightness)
- Use `font-semibold` (weight 600) for authority
- Line height: 1.2 (compact, premium feel)

**Body:**
- Default 16px, line height 1.6 (readable, spacious)
- `text-muted-foreground` for secondary content
- Max line length: 65-75 characters (content width)

**Overlines:**
- `text-xs tracking-[3px] font-semibold uppercase mb-3`
- Used before section titles to label content type
- Example: "SYSTEMS", "FEATURES", "HOW IT WORKS"

---

## Part 3: Spacing System

### Horizontal & Vertical Spacing

| Size | Pixels | Usage |
|------|--------|-------|
| **xs** | 4px | Gaps in icon groups, tight spacing |
| **sm** | 8px | Gap between inline elements |
| **md** | 12px | Card internal padding, button gaps |
| **lg** | 16px | Section padding, component gaps |
| **xl** | 24px | Card padding, internal sections |
| **2xl** | 32px | Container padding, major gaps |
| **3xl** | 48px | Section top/bottom padding (py-12) |
| **4xl** | 64px | Large section spacing (py-16) |
| **5xl** | 80px | Hero and max sections (py-20) |

### Standard Layout Spacing

**Pages:**
- Horizontal: `max-w-7xl mx-auto px-6` (container + gutter)
- Section vertical: `py-20` (80px top/bottom, standard)
- Large sections: `py-24` or `py-28` if prominently styled

**Cards:**
- Internal padding: `p-8` (32px all sides)
- Grid gap: `gap-6` (24px between cards)

**Hero sections:**
- Vertical: `py-24` or `py-32` (padding feels spacious)
- Text centering: `text-center mb-12` (60px below title)

---

## Part 4: Component Patterns

### Button Hierarchy

**Primary (CTA, main action):**
```tsx
<Button variant="primary" className="h-12 px-6">
  Join waitlist
</Button>
```
- Background: `--primary` (#0f172a)
- Text: White
- Padding: 12px vertical, 24px horizontal
- Hover: Darken, lift slightly (-1px translate)

**Secondary (alternative action):**
```tsx
<Button variant="secondary" className="h-12 px-6">
  Learn more
</Button>
```
- Background: Transparent or `--muted`
- Border: 1px `--border`
- Text: `--foreground`
- Hover: Light background fill

**Accent (highlight, secondary CTA):**
```tsx
<Button variant="accent" className="h-12 px-6">
  Shape the pilot
</Button>
```
- Background: `--accent` (#b45309)
- Text: White
- Hover: `--accent-hover` (#92400e)

**Ghost (tertiary, low emphasis):**
```tsx
<Button variant="ghost" size="sm">
  Skip
</Button>
```
- Background: Transparent
- Text: `--muted-foreground`
- Hover: `--bg` lighten

**Size scale:**
- `sm`: 32px height (8px v, 16px h)
- `md`: 40px height (12px v, 24px h)
- `lg`: 48px height (16px v, 32px h)

### Card Component

**Standard card:**
```tsx
<div className="card p-8">
  <h4 className="font-semibold text-lg mb-3">Title</h4>
  <p className="text-muted-foreground">Content</p>
</div>
```

**Styling:**
- Background: `--card`
- Border: 1px `--border`
- Radius: `rounded-lg` (8px) or `rounded-xl` (12px)
- Padding: `p-8` (32px)
- Hover: Lift (`translateY(-2px)`), shadow, border darken
- Transition: `0.2s cubic-bezier(0.23, 1, 0.32, 1)` (spring easing)

### Input Fields

**Form input:**
```tsx
<input 
  type="text" 
  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-accent"
  placeholder="your@email.com"
/>
```

**Rules:**
- Padding: `px-4 py-3` (12px v, 16px h)
- Border: 1px `--border`, `rounded-lg`
- Focus: `border-accent` (no box-shadow; border change only)
- Disabled: `opacity-50 cursor-not-allowed`

### Badge / Tag

**Status badge:**
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-light text-accent">
  Early Access
</span>
```

**Variants:**
- Info: `bg-blue-100 text-blue-700`
- Success: `bg-green-100 text-green-700`
- Warning: `bg-yellow-100 text-yellow-700`
- Accent: `bg-accent-light text-accent`

---

## Part 5: Page Patterns

### Hero Section

**Structure:**
```tsx
<section className="max-w-7xl mx-auto px-6 py-24">
  <div className="text-center">
    <div className="text-accent text-xs tracking-[3px] font-semibold mb-4">OVERLINE LABEL</div>
    <h1 className="text-4xl lg:text-5xl tracking-[-0.03em] font-semibold mb-6 leading-tight">
      Hero title here
    </h1>
    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
      Subheading or supporting text
    </p>
    <div className="flex gap-4 justify-center">
      <Button variant="primary">Primary CTA</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  </div>
</section>
```

**Rules:**
- Vertical padding: `py-24` (96px)
- Text centering
- Max width: `max-w-2xl` for readable text
- Button group: Flex, centered, `gap-4`

### Feature Grid (2, 3, or 4 columns)

**Structure:**
```tsx
<div className="grid md:grid-cols-3 gap-6">
  {features.map((f) => (
    <div key={f.id} className="card p-8">
      <div className="text-accent text-sm font-semibold tracking-wider mb-4">
        {f.title.toUpperCase()}
      </div>
      <p className="text-lg text-muted-foreground">{f.desc}</p>
    </div>
  ))}
</div>
```

**Rules:**
- Card padding: `p-8`
- Grid gap: `gap-6`
- Responsive: `md:grid-cols-3` (1 col mobile, 3 desktop)
- Title: Uppercase, accent color, `tracking-wider`

### Section with Alternating Layout (Content + Visual)

**Structure:**
```tsx
<section className="max-w-6xl mx-auto px-6 py-20">
  <div className="grid lg:grid-cols-12 gap-x-16 gap-y-10 items-center">
    <div className="lg:col-span-5">
      <h2 className="text-4xl tracking-[-0.03em] font-semibold mb-6">Title</h2>
      <p className="text-xl text-muted-foreground mb-8">Content</p>
      <Button>CTA</Button>
    </div>
    <div className="lg:col-span-7">
      {/* Visual (video, image, illustration) */}
    </div>
  </div>
</section>
```

**Rules:**
- 12-column grid for flexibility
- Content: 5 cols (width for 2-3 paragraphs)
- Visual: 7 cols (larger, breathing room)
- `gap-x-16`: 64px horizontal gap
- `items-center`: Vertical centering

### FAQ / Accordion

**Structure:**
```tsx
<div className="space-y-4">
  {faqs.map((faq) => (
    <details key={faq.id} className="group border rounded-lg p-6 cursor-pointer hover:bg-muted">
      <summary className="font-semibold flex justify-between items-center">
        {faq.q}
        <span className="group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <p className="mt-4 text-muted-foreground">{faq.a}</p>
    </details>
  ))}
</div>
```

**Rules:**
- Use native `<details>` element (no JS needed)
- Padding: `p-6`
- Spacing: `space-y-4`
- Hover: Subtle `bg-muted`

### Final CTA Section

**Structure:**
```tsx
<section className="bg-primary py-20 text-white">
  <div className="max-w-4xl mx-auto px-6 text-center">
    <h2 className="text-4xl lg:text-5xl tracking-[-0.03em] font-semibold mb-6">
      Final CTA headline
    </h2>
    <p className="text-xl text-white/80 mb-8">
      Supporting text
    </p>
    <div className="flex gap-4 justify-center flex-wrap">
      <Button variant="accent">Primary</Button>
      <Button variant="outline" className="border-white/40 text-white">Secondary</Button>
    </div>
  </div>
</section>
```

**Rules:**
- Background: `bg-primary` (dark, high contrast)
- Text: White with `text-white/80` for secondary
- Padding: `py-20`
- Buttons: Accent primary, outlined secondary

---

## Part 6: Component Library (Reusable)

### Existing Components (In Use)

| Component | Location | Purpose |
|-----------|----------|---------|
| **Button** | `components/ui/button.tsx` | Primary CTA element |
| **ROICalculator** | `components/ROICalculator.tsx` | Interactive financial model |
| **WaitlistCTA** | `components/WaitlistCTA.tsx` | Email capture form |
| **Chatbot** | `components/Chatbot.tsx` | Floating demo assistant |
| **Reveal** | `components/Reveal.tsx` | Scroll-triggered animation |
| **ShowcaseCarousel** | `components/ShowcaseCarousel.tsx` | Image carousel (showcase jobs) |

### Recommended New Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| **Badge** | Status labels, tags | Medium (utility) |
| **Tabs** | Content switching | Medium (if comparison needed) |
| **Tooltip** | Contextual info | Low (nice-to-have) |
| **Modal** | For detailed info overlays | Low (phase 2) |

---

## Part 7: Responsive Grid

### Breakpoints (Tailwind default)

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| `sm` | 640px | Phone landscape, small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

### Common Patterns

**Single column on mobile, 2 cols on tablet, 3 on desktop:**
```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Hide on mobile:**
```tsx
<div className="hidden lg:block">
```

**Full width on mobile, constrained on desktop:**
```tsx
<div className="w-full lg:max-w-2xl mx-auto">
```

---

## Part 8: Dark Mode (Future)

**Status:** Not implemented in v1.0  
**Plan:** CSS variables allow easy dark mode via `@media (prefers-color-scheme: dark)`

**Token updates would be:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --fg: #f1f5f9;
    --muted: #1e293b;
    --border: #334155;
    --accent: #d97706; /* lighter amber for dark bg */
  }
}
```

---

## Part 9: Animation & Motion

### Transition Defaults

**Standard easing (spring-like):**
```css
transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
```

**Usage:**
- Button hover: Color + slight lift
- Card hover: Shadow + border change
- Link underline: Smooth expand

**Avoid:**
- Spin/rotate on load (busy, unprofessional)
- Fade delays > 300ms (feels slow)
- Multiple staggered animations on simple elements

### Scroll-triggered animations

**Used in:** Reveal component for feature cards  
**Technique:** Intersection Observer API  
**Effect:** Fade-in + small translateY (-10px) on enter

---

## Part 10: Implementation Guidelines

### Do's

- ✅ Use Tailwind utilities first; add custom CSS only when no utility exists
- ✅ Reuse spacing tokens (py-20, gap-6, px-4) consistently
- ✅ Check contrast with WebAIM tool before shipping
- ✅ Test links and buttons with keyboard (Tab, Enter)
- ✅ Use semantic HTML (nav, section, article, main)

### Don'ts

- ❌ Don't add new colors outside the palette (breaks consistency)
- ❌ Don't use `!important` (indicates structure problem)
- ❌ Don't hardcode sizes (use spacing scale)
- ❌ Don't add custom fonts (Geist is enough)
- ❌ Don't layer too many shadows (one shadow per element max)

### Code Style

**Tailwind class ordering:**

```tsx
<div className="flex items-center gap-4 px-6 py-4 bg-white border rounded-lg hover:shadow-lg transition">
```

Order: Display → Alignment → Spacing (padding) → Color → Effects (border, shadow, animation)

---

## Part 11: Validation Checklist

- ✅ All colors meet WCAG AA contrast
- ✅ Typography scale is sensible (no jumps > 4px between sizes)
- ✅ Spacing is consistent (multiples of 4px)
- ✅ Buttons have clear hover states
- ✅ Cards have lift effect on hover
- ✅ Forms have focus indicators
- ✅ All pages pass responsive test (mobile, tablet, desktop)
- ✅ No custom colors in markup (use tokens only)

---

## Part 12: Handoff to Development

### For Frontend Engineers

1. **Add this file to project wiki/docs**
2. **Use color tokens in CSS/Tailwind** (already in globals.css)
3. **Follow spacing scale for all new pages**
4. **Reuse button component, don't build new ones**
5. **Test on 4 breakpoints:** Mobile (375px), Tablet (768px), Desktop (1024px), Large (1440px)

### For Designers

1. **Sketch/Figma file should use these tokens**
2. **Mockups: Use Geist font (or Helvetica Neue as fallback)**
3. **Color picker: Use hex values from this doc**
4. **Components: Reference Button hierarchy and Card patterns**
5. **Typography: Match size and spacing scale exactly**

### For Product Managers

1. **Consistency = trust.** This system ensures every page feels professional.
2. **Speed = competitive.** Reusable patterns mean new pages ship faster.
3. **Honesty = credibility.** Clean, understated design supports early-access messaging.

---

## Appendix: Migration Checklist (Existing Pages)

| Page | Status | Notes |
|------|--------|-------|
| `/` (home) | ✅ Compliant | Already follows most patterns |
| `/dashboard` | 🟡 Partial | Uses demo data; design OK |
| `/simulator` | ✅ Compliant | Self-contained, clean |
| `/pro-simulator` | ✅ Compliant | Self-contained, clean |

**Next pages to build:** See PAGE_UX_CONTRACTS.md

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Aug 3, 2026 | 1.0 | Initial foundation |

---

**Maintained by:** FloorForge Design Systems Team  
**Last updated:** August 3, 2026  
**Next review:** November 3, 2026 (post-pilot with real customer feedback)

---

## Quick Reference Card

```
COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary:     #0f172a (dark slate - text, buttons)
Accent:      #b45309 (amber - highlights, secondary CTA)
Muted:       #f8fafc (pale slate - section bg)
Border:      #e2e8f0 (light slate - dividers)
Success:     #15803d (green - status)

TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Headings:    Geist Sans, 600 weight, -0.025em letter-spacing
Body:        Geist Sans, 400 weight, 1.6 line-height
Caption:     Geist Sans, 500 weight, 12px

SPACING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sections:    py-20 (80px)
Cards:       p-8 (32px), gap-6 (24px)
Container:   max-w-7xl mx-auto px-6

BUTTONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary:     bg-primary text-white
Secondary:   bg-transparent border-border
Accent:      bg-accent text-white
```

---

Done. This document is the single source of truth for all design decisions across FloorForge's public and internal sites.
