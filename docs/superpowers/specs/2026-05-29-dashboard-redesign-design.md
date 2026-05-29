# DocFlow Dashboard Redesign

**Date:** 2026-05-29  
**Aesthetic:** Dark/midnight — deep navy bg, blue/purple glowing accents, framer-motion throughout

## Sections (scroll-driven, single page)

1. **Hero** — Full-viewport `#0a0f1e` bg, animated headline, floating document cards with parallax via `useScroll`/`useTransform`, arrow CTA scrolls to upload
2. **How It Works** — 3-column pipeline cards (Extract → Classify → Route), stagger-revealed on scroll with connecting animated line
3. **Upload** — Oversized drag-drop zone, pulsing border glow on hover, spring scale on drag-over
4. **Processing** — Full-screen overlay when processing: each step dramatically animates in sequence with glowing progress trail
5. **Results** — `AnimatePresence` slide-up card, confidence bar spring-fills, extracted fields stagger in
6. **History** — Real data from `GET /history` backend endpoint; rows stagger in with framer-motion

## Color Palette

| Token | Value |
|-------|-------|
| bg | `#0a0f1e` |
| card | `#1e293b` |
| accent blue | `#3b82f6` |
| accent purple | `#818cf8` |
| success | `#10b981` |
| text | white / `gray-300` / `gray-400` |

## Framer-Motion Usage

- `whileInView` + `viewport` for scroll-triggered section entrances
- `AnimatePresence` for processing overlay and results card mount/unmount
- `staggerChildren` / `delayChildren` on pipeline steps and history rows
- `useScroll` + `useTransform` for hero parallax
- Spring physics (`type: "spring"`) on interactive hover/drag states
- `motion.div` with `initial/animate/exit` everywhere

## Backend Change

Add `GET /history` to `api/main.py`: reads all `output/*/routing_log.jsonl` files, returns array of processed document records sorted by timestamp descending.

## File Changes

| File | Change |
|------|--------|
| `dashboard/src/App.jsx` | Full rewrite — 6 sections, framer-motion throughout |
| `dashboard/src/index.css` | Add custom keyframes, scrollbar styling |
| `api/main.py` | Add `GET /history` endpoint |
