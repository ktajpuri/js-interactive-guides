import { useState, useRef, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { LAYOUT_THRASHING_CODE } from '../data/demoCode';

// 250 items is enough for forced-layout cost to dominate: one thrash pass
// runs ~580ms vs ~6ms batched (≈ 100× speedup) on a modern laptop. We
// measure a single synchronous pass — no rAF loop — to keep the demo
// fast (under 1s total) and the result reproducible.
const ITEM_COUNT = 250;
const PASSES_PER_MEASUREMENT = 3;

function ItemGrid({ containerRef, count = ITEM_COUNT }) {
  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-0.5 overflow-auto"
      style={{ height: '200px' }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-item="true"
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: `hsl(${(i * 37) % 360}, 55%, 40%)`,
            borderRadius: '2px',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function TimeBadge({ ms, running, kind }) {
  if (running) {
    return (
      <div className="text-amber-400 text-sm animate-pulse">Running…</div>
    );
  }
  if (ms === null) {
    return <div className="text-gray-600 text-sm">—</div>;
  }
  // Thrash is bad: low ms = green, high ms = red.
  const color =
    kind === 'batched'
      ? 'text-green-400'
      : ms < 50 ? 'text-green-400' : ms < 200 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className={`text-3xl font-bold ${color}`}>
      {ms.toFixed(1)} <span className="text-sm font-normal text-gray-500">ms / pass</span>
    </div>
  );
}

export default function LayoutThrashingDemo() {
  const [thrashMs, setThrashMs] = useState(null);
  const [batchedMs, setBatchedMs] = useState(null);
  const [running, setRunning] = useState({ thrash: false, batched: false });
  const thrashRef = useRef(null);
  const batchedRef = useRef(null);

  // Defer the heavy work via setTimeout(0) so React can paint the "Running…"
  // spinner before the main thread freezes. (setTimeout is more reliable than
  // rAF in some contexts where rAF can be throttled, e.g. background tabs.)
  const measure = (containerRef, kind, setMs, onDone) => {
    if (!containerRef.current) return;
    setRunning(r => ({ ...r, [kind]: true }));
    setMs(null);
    setTimeout(() => {
      const items = containerRef.current.querySelectorAll('[data-item]');
      const t0 = performance.now();
      for (let pass = 0; pass < PASSES_PER_MEASUREMENT; pass++) {
        if (kind === 'thrash') {
          // BAD: read then write per element — forced sync layout per item.
          items.forEach(el => {
            const w = el.offsetWidth;
            el.style.width = ((w % 40) + 10) + 'px';
          });
        } else {
          // GOOD: all reads, then all writes — one forced layout per pass.
          const widths = [];
          items.forEach(el => widths.push(el.offsetWidth));
          items.forEach((el, i) => {
            el.style.width = ((widths[i] % 40) + 10) + 'px';
          });
        }
      }
      const elapsed = (performance.now() - t0) / PASSES_PER_MEASUREMENT;
      items.forEach(el => { el.style.width = '20px'; });
      setMs(elapsed);
      setRunning(r => ({ ...r, [kind]: false }));
      if (onDone) onDone();
    }, 0);
  };

  const runThrash = useCallback((onDone) => measure(thrashRef, 'thrash', setThrashMs, onDone), []);
  const runBatched = useCallback((onDone) => measure(batchedRef, 'batched', setBatchedMs, onDone), []);
  const runBoth = () => { runThrash(() => runBatched()); };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="mb-2">
          <span className="bg-amber-900/40 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">Demo 2</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Layout Thrashing</h2>
        <p className="text-sm text-gray-400">
          Reading a layout property (<code className="text-amber-300">offsetWidth</code>, <code className="text-amber-300">getBoundingClientRect</code>) after writing a CSS property forces the browser to flush all pending style changes immediately — a synchronous layout that blocks everything.
        </p>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Thrash panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-red-400">🔴 Thrash (read/write interleaved)</div>
          </div>
          <div className="mb-3">
            <TimeBadge ms={thrashMs} running={running.thrash} kind="thrash" />
          </div>
          <ItemGrid containerRef={thrashRef} />
          <div className="font-mono text-xs text-gray-600 mt-2">
            el.style.width = el.offsetWidth + &apos;px&apos;; {/* ← forces sync layout */}
          </div>
        </div>

        {/* Right: Batched panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-green-400">🟢 Batched (all reads, then all writes)</div>
          </div>
          <div className="mb-3">
            <TimeBadge ms={batchedMs} running={running.batched} kind="batched" />
          </div>
          <ItemGrid containerRef={batchedRef} />
          <div className="font-mono text-xs text-gray-600 mt-2">
            widths = items.map(el =&gt; el.offsetWidth); // reads<br />
            items.forEach((el,i) =&gt; el.style.width = widths[i] + &apos;px&apos;); // writes
          </div>
        </div>
      </div>

      {/* Controls card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runThrash}
            disabled={running.thrash}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-red-700 text-red-400 hover:bg-red-900/30"
          >
            Run Thrash only
          </button>
          <button
            onClick={runBoth}
            disabled={running.thrash || running.batched}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 text-white hover:bg-amber-500"
          >
            Run Both
          </button>
          <button
            onClick={runBatched}
            disabled={running.batched}
            className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-green-700 text-green-400 hover:bg-green-900/30"
          >
            Run Batched only
          </button>
        </div>
      </div>

      {/* Stats comparison card */}
      {thrashMs !== null && batchedMs !== null && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Results</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">{thrashMs.toFixed(1)} <span className="text-xs text-gray-500">ms</span></div>
              <div className="text-xs text-gray-500">Thrash per pass</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {batchedMs > 0 && thrashMs > 0 ? (thrashMs / batchedMs).toFixed(1) : '—'}×
              </div>
              <div className="text-xs text-gray-500">Speedup</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{batchedMs.toFixed(1)} <span className="text-xs text-gray-500">ms</span></div>
              <div className="text-xs text-gray-500">Batched per pass</div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar info card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-amber-400 font-medium mb-3">⚡ Layout-triggering reads</div>
        <div className="text-xs text-gray-400 space-y-1 font-mono">
          {[
            'offsetTop / offsetLeft / offsetWidth / offsetHeight',
            'clientTop / clientLeft / clientWidth / clientHeight',
            'scrollTop / scrollLeft / scrollWidth / scrollHeight',
            'getBoundingClientRect()',
            'getComputedStyle()',
            'window.innerWidth / innerHeight',
          ].map(r => (
            <div key={r} className="text-gray-500">• <span className="text-amber-300">{r}</span></div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-600">Calling any of these after a style write forces a synchronous layout flush.</div>
      </div>

      {/* Key insight callout */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 text-sm text-gray-300">
        Reading a layout property forces the browser to flush all pending style mutations and compute layout <strong>right now</strong> — even if you only changed a single property. In a loop of {ITEM_COUNT} items, that&apos;s {ITEM_COUNT} forced layouts per frame, vs. 1 layout with the batched approach. The fix isn&apos;t to avoid reads — it&apos;s to <strong>batch them</strong>: do all reads first, then all writes. Libraries like FastDOM automate this pattern.
      </div>

      <CodeBlock code={LAYOUT_THRASHING_CODE} />
    </div>
  );
}
