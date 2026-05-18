export const PIPELINE_MAP_CODE = `// Every CSS property triggers a subset of the rendering pipeline:
//   Layout → Paint → Composite
//
// Cheap (Composite only):           transform, opacity, filter (some)
// Medium (Paint + Composite):       color, background-color, box-shadow
// Expensive (Layout + Paint + Composite):  width, height, top, left, margin, padding
//
// Rule: animate transform/opacity. Animate position/size at your peril.

// BAD: triggers Layout every frame
function moveBad(el, x) { el.style.left = x + 'px'; }

// GOOD: triggers only Composite
function moveGood(el, x) { el.style.transform = \`translateX(\${x}px)\`; }`;

export const LAYOUT_THRASHING_CODE = `// Layout thrashing: forced synchronous layout from interleaved read/write.
// When you READ a layout property after WRITING, the browser must flush
// pending style changes to compute the answer → expensive sync layout.

// BAD: read-write-read-write forces layout on EVERY iteration
function thrashing(items) {
  for (const el of items) {
    el.style.width = el.offsetWidth + 10 + 'px';   // read offsetWidth (sync layout!)
                                                    // then write width (invalidates layout)
  }
}

// GOOD: batch reads, then batch writes → only ONE layout pass
function batched(items) {
  const widths = items.map(el => el.offsetWidth);   // all reads first
  items.forEach((el, i) => {
    el.style.width = widths[i] + 10 + 'px';         // all writes after
  });
}

// Layout-triggering reads (any of these forces sync layout):
// offsetTop/Left/Width/Height, clientTop/Left/Width/Height,
// scrollTop/Left/Width/Height, getBoundingClientRect(),
// getComputedStyle(), window.innerWidth (in some browsers)`;

export const LAYER_PROMOTION_CODE = `// The compositor thread is INDEPENDENT of the main thread.
// CSS transforms/opacity on promoted layers continue animating
// even when JavaScript freezes the main thread.

// Promote an element to its own compositor layer:
.smooth {
  will-change: transform;        // explicit promotion (preferred)
  /* OR */
  transform: translateZ(0);      // legacy hack — works in older browsers
}

// Trade-off: each layer uses GPU memory (width × height × 4 bytes).
// A full-screen layer at 1920×1080 = ~8MB. Don't promote everything.

// Use cases:
// - Critical UI feedback (spinners, loaders) you want to stay smooth under load
// - Elements that animate frequently
// - The cursor / drag handle during interactions

// Anti-pattern:
.everything-promoted * { will-change: transform; }  // 🚨 burns GPU memory`;

export const PAINT_REGION_CODE = `// Paint cost = pixels repainted × per-pixel cost.
// Smaller invalidation rectangles = faster paint.

// BAD: changing background on <body> repaints the entire viewport
document.body.style.backgroundColor = '#222';

// GOOD: scoped change — only the target element's rect is repainted
target.style.backgroundColor = '#222';

// Box-shadow, filter, and large gradients are expensive to paint.
// Animate them on a promoted layer if you must change them.

// To visualize paint regions yourself:
// Chrome DevTools → ... menu → More tools → Rendering → "Paint flashing"
// Areas that repaint flash green.`;
