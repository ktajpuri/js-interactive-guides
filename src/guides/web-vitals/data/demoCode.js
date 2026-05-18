export const LCP_CODE = `// Observe LCP candidates using PerformanceObserver
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  // The last entry is always the most recent LCP candidate
  const lcp = entries[entries.length - 1];
  console.log('LCP candidate:', lcp.startTime.toFixed(0) + 'ms');
  console.log('LCP element:', lcp.element);
});
observer.observe({ type: 'largest-contentful-paint', buffered: true });

// LCP stops updating after the first user interaction
['keydown', 'click', 'pointerdown'].forEach(event => {
  document.addEventListener(event, () => observer.disconnect(), { once: true });
});

// What causes poor LCP:
// - Large unoptimized hero images (no WebP, no srcset, no preload)
// - Render-blocking <script> and <link> in <head>
// - Slow server response (high TTFB)
// - Client-side rendering without SSR`;

export const CLS_CODE = `// Observe real layout shifts using PerformanceObserver
let clsScore = 0;

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Ignore shifts caused by user interaction (scroll, click)
    if (!entry.hadRecentInput) {
      clsScore += entry.value;
      console.log('Shift value:', entry.value.toFixed(4));
      console.log('Shifted nodes:', entry.sources?.map(s => s.node));
      console.log('Cumulative CLS:', clsScore.toFixed(4));
    }
  }
});
observer.observe({ type: 'layout-shift', buffered: true });

// What causes layout shifts:
// - Images/videos without explicit width + height attributes
// - Ads or embeds injected above existing content
// - Web fonts that swap and change text dimensions
// - Dynamically injected content above the fold`;

export const INP_CODE = `// The main thread blocking pattern that causes high INP
function blockMainThread(ms) {
  const start = performance.now();
  // Tight loop — genuinely prevents the browser from painting
  while (performance.now() - start < ms) { /* blocking */ }
}

button.addEventListener('click', () => {
  const t0 = performance.now();

  blockMainThread(500); // simulates heavy JS work after interaction
  updateUI();           // state change that triggers repaint

  // Measure time-to-next-paint using double requestAnimationFrame
  // rAF 1: queued at end of current frame
  // rAF 2: fires at the start of the NEXT frame after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const inp = performance.now() - t0;
      console.log('INP:', inp.toFixed(0) + 'ms');
    });
  });
});

// Fix: break work into chunks with scheduler.yield() or setTimeout(0)
async function respondToClick() {
  updateUIImmediately(); // Let browser paint first
  await scheduler.yield(); // Yield to browser
  doHeavyWork();           // Then do expensive work
}`;

export const FCP_CODE = `// Read FCP from the Paint Timing API
const [fcpEntry] = performance.getEntriesByType('paint')
  .filter(e => e.name === 'first-contentful-paint');

if (fcpEntry) {
  console.log('FCP:', fcpEntry.startTime.toFixed(0) + 'ms');
}

// Or observe it in real time:
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'first-contentful-paint') {
      console.log('FCP:', entry.startTime.toFixed(0) + 'ms');
    }
  }
}).observe({ type: 'paint', buffered: true });

// What causes poor FCP:
// Render-blocking resources delay ALL painting until they finish.
//
// Bad — blocks FCP:
// <head>
//   <link rel="stylesheet" href="large-styles.css"> <!-- blocks render -->
//   <script src="analytics.js"></script>             <!-- blocks render -->
// </head>
//
// Better — unblocks FCP:
// <link rel="preload" href="font.woff2" as="font" crossorigin>
// <script src="analytics.js" defer></script>         <!-- non-blocking -->`;

export const TBT_CODE = `// Observe long tasks using the Long Tasks API
let totalBlockingTime = 0;

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Any task > 50ms contributes its excess to TBT
    const blockingPortion = entry.duration - 50;
    totalBlockingTime += blockingPortion;
    console.log(
      'Long task:', entry.duration.toFixed(0) + 'ms',
      '| Blocking portion:', blockingPortion.toFixed(0) + 'ms',
      '| TBT so far:', totalBlockingTime.toFixed(0) + 'ms'
    );
  }
});
// Note: longtasks does NOT support buffered:true
observer.observe({ type: 'longtasks' });

// Fix: break long tasks into smaller chunks
// Bad — one 500ms task:
function processAll(items) {
  items.forEach(item => expensiveWork(item)); // blocks for 500ms
}

// Good — yield between chunks:
async function processInChunks(items) {
  for (let i = 0; i < items.length; i++) {
    expensiveWork(items[i]);
    if (i % 50 === 0) await scheduler.yield(); // yield every 50 items
  }
}`;

export const TTFB_CODE = `// Read TTFB from the Navigation Timing API
const [navEntry] = performance.getEntriesByType('navigation');
if (navEntry) {
  const ttfb = navEntry.responseStart - navEntry.requestStart;
  console.log('TTFB:', ttfb.toFixed(0) + 'ms');

  // Full breakdown of the navigation phases:
  console.log('DNS lookup:',    (navEntry.domainLookupEnd  - navEntry.domainLookupStart).toFixed(0)  + 'ms');
  console.log('TCP connect:',   (navEntry.connectEnd       - navEntry.connectStart).toFixed(0)       + 'ms');
  console.log('TLS handshake:', (navEntry.secureConnectionStart > 0
    ? navEntry.connectEnd - navEntry.secureConnectionStart : 0).toFixed(0)                           + 'ms');
  console.log('Request:',       (navEntry.responseStart    - navEntry.requestStart).toFixed(0)       + 'ms');
  console.log('Response:',      (navEntry.responseEnd      - navEntry.responseStart).toFixed(0)      + 'ms');
}

// For fetch() requests:
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.initiatorType === 'fetch') {
      const ttfb = entry.responseStart - entry.requestStart;
      console.log(\`Fetch TTFB (\${entry.name}):\`, ttfb.toFixed(0) + 'ms');
    }
  }
}).observe({ type: 'resource', buffered: true });`;
