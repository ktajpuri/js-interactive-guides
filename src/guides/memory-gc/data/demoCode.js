export const HEAP_MONITOR_CODE = `// Measure JS heap usage (Chromium-based browsers only)
if (performance.memory) {
  console.log('Used:', performance.memory.usedJSHeapSize);
  console.log('Total:', performance.memory.totalJSHeapSize);
  console.log('Limit:', performance.memory.jsHeapSizeLimit);
}

// Sample at intervals to chart heap over time
setInterval(() => {
  const mb = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
  console.log(\`Heap: \${mb} MB\`);
}, 1000);

// You cannot force GC from JS. But you can *encourage* it:
// allocating large blocks creates memory pressure that triggers V8's collector.
function triggerGcPressure() {
  for (let i = 0; i < 5; i++) {
    const huge = new Float64Array(25_000_000); // 200MB each
    for (let j = 0; j < huge.length; j += 1024) huge[j] = j; // touch pages
  } // huge goes out of scope → eligible for GC
}`;

export const DETACHED_DOM_CODE = `// THE BUG: capturing DOM nodes in long-lived state
const leakedNodes = []; // module-level — survives component unmount

function MyComponent({ container }) {
  useEffect(() => {
    for (let i = 0; i < 5000; i++) {
      const div = document.createElement('div');
      container.appendChild(div);
      leakedNodes.push(div); // ← leaks every node, forever
    }
    return () => {
      container.innerHTML = ''; // detaches from DOM, but leakedNodes still holds refs
    };
  }, []);
}

// THE FIX: scope refs to the component, drop on cleanup
function MyComponentFixed({ container }) {
  useEffect(() => {
    const nodes = []; // local scope — eligible for GC after cleanup
    for (let i = 0; i < 5000; i++) {
      const div = document.createElement('div');
      container.appendChild(div);
      nodes.push(div);
    }
    return () => {
      container.innerHTML = '';
      nodes.length = 0; // explicit clear (also fine to just let it go out of scope)
    };
  }, []);
}

// To detect leaks: snapshot the heap in DevTools → click around → take another snapshot
// → "Comparison" view → look for "Detached HTMLDivElement" entries.`;

export const WEAKMAP_CODE = `// Map: keys are held STRONGLY. Map prevents GC of its keys.
const map = new Map();
let key1 = { id: 1 };
map.set(key1, 'value');
key1 = null;             // No other refs — but Map still holds it.
// The key & value live forever (unless map.delete or map = null).

// WeakMap: keys are held WEAKLY. Keys can be GC'd.
const weakMap = new WeakMap();
let key2 = { id: 2 };
weakMap.set(key2, 'value');
key2 = null;             // No other refs — eligible for GC.
// After GC, the WeakMap entry is gone automatically.

// Use WeakMap for METADATA about objects you don't own:
const cache = new WeakMap();
function getProcessed(domNode) {
  if (!cache.has(domNode)) {
    cache.set(domNode, expensiveProcess(domNode));
  }
  return cache.get(domNode);
}
// When the DOM node is removed and GC'd, its cache entry vanishes — no manual cleanup needed.

// Limitations: WeakMap is NOT iterable, has no .size, and keys MUST be objects (not primitives).
// Use Map when you need iteration, size, or primitive keys.`;

export const GC_IN_ACTION_CODE = `// FinalizationRegistry: get notified (sometimes) when an object is GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log('Collected:', heldValue);
});

let obj = { name: 'temporary' };
registry.register(obj, 'temp-1'); // 'temp-1' is the "held value" passed to the callback
obj = null;
// Sometime later, after GC runs: "Collected: temp-1"

// WeakRef: a reference that doesn't prevent GC
let target = { name: 'data' };
const ref = new WeakRef(target);
target = null;

setTimeout(() => {
  const deref = ref.deref();
  if (deref === undefined) {
    console.log('Target was collected');
  } else {
    console.log('Still alive:', deref.name);
  }
}, 5000);

// ⚠ Both APIs are intentionally non-deterministic. Do NOT use for:
// - Releasing critical resources (use try/finally or explicit cleanup)
// - Notifying users when something is "done"
// - Anything that requires timing guarantees
//
// DO use for:
// - Memory monitoring tools
// - Cache eviction hints
// - Leak detection in test suites`;
