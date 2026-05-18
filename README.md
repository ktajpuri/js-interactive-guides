# JS Interactive Guides

An interactive learning platform for JavaScript and browser APIs. Each guide is a hands-on collection of live demos — no slides, no static code examples, just real behavior you can poke at.

**Stack:** React 18 · Vite 5 · Tailwind CSS v3 · react-syntax-highlighter

---

## Guides

### 👁 Intersection Observer (8 demos)

Covers the `IntersectionObserver` API from first principles through real-world patterns.

| # | Demo | What you learn |
|---|------|----------------|
| 1 | **API Basics & Entry Properties** | Live feed of every `IntersectionObserverEntry` field (`isIntersecting`, `intersectionRatio`, `boundingClientRect`, `rootBounds`, `time`) as you scroll a target element in and out of view. |
| 2 | **Threshold Visualizer** | Drag a threshold slider (0–1.0) and watch the callback fire exactly at the configured ratio. Illustrates how the threshold array works and what "X% visible" means in practice. |
| 3 | **rootMargin Playground** | Adjustable `rootMargin` with a visual overlay showing the expanded/contracted detection zone. Demonstrates negative margins (fire late) and positive margins (fire early / preload trigger). |
| 4 | **Lazy Loading Images** | Grid of images that load only when they scroll into the viewport. Shows the placeholder-to-image swap and the IntersectionObserver `unobserve` pattern used to avoid repeated callbacks. |
| 5 | **Scroll-Triggered Animations** | Elements animate in (fade + slide) as they enter the viewport. Configurable threshold so you can see how visibility percentage affects when the animation fires. |
| 6 | **Infinite Scroll** | Feed of cards that auto-loads more content when a sentinel element at the bottom of the list becomes visible. Demonstrates the "sentinel / load more / move sentinel" loop. |
| 7 | **Custom Root Element** | Observer scoped to a scrollable `div` instead of the viewport. Shows that `root` can be any ancestor element, not just the document. |
| 8 | **Scroll Spy** | Table-of-contents where the active link updates as you scroll through sections. Implements the multi-target observe pattern with a single observer instance. |

---

### ⚡ Web Vitals (6 demos)

Covers all six Core Web Vitals. Every demo either measures real browser data via `PerformanceObserver` or simulates metric behavior with configurable controls so you can see exactly how code choices move the numbers.

| # | Metric | Demo approach |
|---|--------|---------------|
| 1 | **LCP — Largest Contentful Paint** | Simulated page-load sequence in a mock browser chrome. Toggles for optimized vs. unoptimized hero image, render-blocking JS, and network speed (1×/2×/4× delay). Shows an animated FCP→LCP timeline and MetricGauge. |
| 2 | **CLS — Cumulative Layout Shift** | Triggers **real** layout shifts in the DOM — the score comes from a live `PerformanceObserver` on `layout-shift` entries. Buttons inject an ad banner above content, load an unsized image that expands, or swap a web font with different metrics. Each shift is logged with its `entry.value`. |
| 3 | **INP — Interaction to Next Paint** | Two side-by-side buttons: one instant, one backed by a configurable blocking loop (0–1000ms slider). Click latency is measured with the double-`requestAnimationFrame` pattern (`rAF → rAF → performance.now()`). A click history log shows measured INP per interaction alongside the worst observed value. |
| 4 | **FCP — First Contentful Paint** | Configurable resource checklist: large CSS (+800ms), sync `<script>` in `<head>` (+1200ms), third-party analytics (+600ms), font preload (−200ms). Each selection adds a bar to an animated waterfall, and a mock page stays blank until the simulated FCP fires. |
| 5 | **TBT — Total Blocking Time** | Task-queue builder: add presets (20ms / 55ms / 150ms / 400ms tasks), then run them. Tasks execute in a `setTimeout` chain so the UI updates between each. The timeline shows the first 50ms of each bar in gray (acceptable) and anything beyond 50ms in red (blocking). Live formula: `TBT = Σ max(0, task − 50ms)`. |
| 6 | **TTFB — Time to First Byte** | Simulated HTTP request waterfall (DNS → TCP → TLS → Server → First Byte). Controls: CDN toggle, DB cache toggle, cold-start penalty, geographic region selector, and a server processing time slider. Each phase animates in sequence with its measured duration. |

---

## Architecture

```
src/
├── App.jsx                          # Guide selector shell + two-level navigation
├── components/Layout/
│   ├── Sidebar.jsx                  # Per-guide sidebar with back button
│   ├── GuideHome.jsx                # Landing card grid
│   └── CodeBlock.jsx                # Syntax-highlighted code viewer
└── guides/
    ├── index.js                     # Guide registry
    ├── intersection-observer/
    │   ├── config.js                # Guide metadata + sections[]
    │   ├── data/demoCode.js         # Code snippets shown in each demo
    │   ├── hooks/                   # useIntersectionObserver, useScrollSpy
    │   └── demos/                   # 8 demo components
    └── web-vitals/
        ├── config.js
        ├── data/demoCode.js
        ├── components/MetricGauge.jsx
        ├── hooks/usePerformanceObserver.js
        └── demos/                   # 6 demo components
```

Adding a new guide means creating a directory under `src/guides/`, a `config.js` with guide metadata and a `sections[]` array, and registering it in `src/guides/index.js`.

---

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

```bash
npm run build   # production build
npm run preview # preview the production build locally
```
