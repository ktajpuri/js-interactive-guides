import { useState, useRef, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { LAYOUT_THRASHING_CODE } from '../data/demoCode';

function ItemGrid({ containerRef, count = 200 }) {
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

function FpsBadge({ fps, running }) {
  if (running) {
    return (
      <div className="text-amber-400 text-sm animate-pulse">Running…</div>
    );
  }
  if (fps === null) {
    return <div className="text-gray-600 text-sm">—</div>;
  }
  const color =
    fps > 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';
  return <div className={`text-3xl font-bold ${color}`}>{fps} <span className="text-sm font-normal text-gray-500">FPS</span></div>;
}

export default function LayoutThrashingDemo() {
  const [thrashFps, setThrashFps] = useState(null);
  const [batchedFps, setBatchedFps] = useState(null);
  const [running, setRunning] = useState({ thrash: false, batched: false });
  const thrashRef = useRef(null);
  const batchedRef = useRef(null);
  const thrashRafRef = useRef(null);
  const batchedRafRef = useRef(null);

  const runThrash = useCallback(() => {
    if (!thrashRef.current) return;
    setRunning(r => ({ ...r, thrash: true }));
    setThrashFps(null);
    const items = thrashRef.current.querySelectorAll('[data-item]');
    const startTime = performance.now();
    let frameCount = 0;

    function step() {
      // BAD: Read then write on each element — forces sync layout per element
      items.forEach(el => {
        const w = el.offsetWidth; // forced layout read
        el.style.width = ((w % 40) + 10) + 'px'; // write (invalidates layout)
      });
      frameCount++;
      const elapsed = performance.now() - startTime;
      if (elapsed < 3000) {
        thrashRafRef.current = requestAnimationFrame(step);
      } else {
        setThrashFps(Math.round(frameCount / (elapsed / 1000)));
        setRunning(r => ({ ...r, thrash: false }));
        // Reset all widths
        items.forEach(el => { el.style.width = '20px'; });
      }
    }
    thrashRafRef.current = requestAnimationFrame(step);
  }, []);

  const runBatched = useCallback(() => {
    if (!batchedRef.current) return;
    setRunning(r => ({ ...r, batched: true }));
    setBatchedFps(null);
    const items = batchedRef.current.querySelectorAll('[data-item]');
    const startTime = performance.now();
    let frameCount = 0;

    function step() {
      // GOOD: All reads first, then all writes
      const widths = [];
      items.forEach(el => widths.push(el.offsetWidth)); // batch all reads
      items.forEach((el, i) => {
        el.style.width = ((widths[i] % 40) + 10) + 'px'; // batch all writes
      });
      frameCount++;
      const elapsed = performance.now() - startTime;
      if (elapsed < 3000) {
        batchedRafRef.current = requestAnimationFrame(step);
      } else {
        setBatchedFps(Math.round(frameCount / (elapsed / 1000)));
        setRunning(r => ({ ...r, batched: false }));
        items.forEach(el => { el.style.width = '20px'; });
      }
    }
    batchedRafRef.current = requestAnimationFrame(step);
  }, []);

  const runBoth = () => { runThrash(); runBatched(); };

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
            <FpsBadge fps={thrashFps} running={running.thrash} />
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
            <FpsBadge fps={batchedFps} running={running.batched} />
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
            Run Both (3s)
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
      {thrashFps !== null && batchedFps !== null && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Results</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">{thrashFps}</div>
              <div className="text-xs text-gray-500">Thrash FPS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">
                {batchedFps > 0 && thrashFps > 0 ? (batchedFps / thrashFps).toFixed(1) : '—'}×
              </div>
              <div className="text-xs text-gray-500">Speedup</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{batchedFps}</div>
              <div className="text-xs text-gray-500">Batched FPS</div>
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
        Reading a layout property forces the browser to flush all pending style mutations and compute layout <strong>right now</strong> — even if you only changed a single property. In a loop of 200 items, that&apos;s 200 forced layouts per frame, vs. 1 layout with the batched approach. The fix isn&apos;t to avoid reads — it&apos;s to <strong>batch them</strong>: do all reads first, then all writes. Libraries like FastDOM automate this pattern.
      </div>

      <CodeBlock code={LAYOUT_THRASHING_CODE} />
    </div>
  );
}
