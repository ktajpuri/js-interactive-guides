import { useState, useRef, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { LAYER_PROMOTION_CODE } from '../data/demoCode';

export default function LayerPromotionDemo() {
  const [blocking, setBlocking] = useState(false);
  const [freezeMs, setFreezeMs] = useState(null);
  const [promoted, setPromoted] = useState(true);
  const rafSpinnerRef = useRef(null);
  const freezeStartRef = useRef(null);

  useEffect(() => {
    let rafId;
    let angle = 0;
    const tick = () => {
      angle = (angle + 3) % 360;
      if (rafSpinnerRef.current) {
        rafSpinnerRef.current.style.transform = `rotate(${angle}deg)`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function blockMainThread() {
    setBlocking(true);
    setFreezeMs(null);
    freezeStartRef.current = performance.now();
    setTimeout(() => {
      function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); }
      fib(42);
      const elapsed = performance.now() - freezeStartRef.current;
      setBlocking(false);
      setFreezeMs(Math.round(elapsed));
    }, 50);
  }

  return (
    <div className="space-y-6">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-900/40 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">Demo 3</span>
        </div>
        <h2 className="text-white text-lg font-bold mb-2">Layer Promotion</h2>
        <p className="text-gray-400 text-sm">
          The compositor thread is independent of JavaScript. CSS animations on promoted layers (
          <code className="text-amber-300 text-xs">will-change: transform</code>) continue at 60fps even when your
          main thread is completely frozen.
        </p>
      </div>

      {/* Two-column spinner panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: rAF spinner */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col items-center">
          <div className="text-yellow-400 font-semibold text-sm mb-4">🟡 JavaScript-driven (rAF)</div>
          <div
            ref={rafSpinnerRef}
            className="w-20 h-20 rounded-full border-4 border-amber-500 border-t-transparent"
          />
          <div className="text-xs text-gray-500 mt-4 text-center">
            Animates via requestAnimationFrame<br />
            Runs on main thread — freezes under JS load
          </div>
          {blocking && (
            <span className="mt-2 px-2 py-1 rounded bg-red-900/40 text-red-400 text-xs font-bold animate-pulse">
              FROZEN
            </span>
          )}
        </div>

        {/* Right: CSS spinner */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col items-center">
          <button
            onClick={() => setPromoted(p => !p)}
            className={`text-xs px-2 py-1 rounded border mb-4 ${
              promoted ? 'border-green-700 text-green-400' : 'border-gray-600 text-gray-500'
            }`}
          >
            will-change: {promoted ? 'transform (promoted)' : 'auto (not promoted)'}
          </button>
          <div
            className="w-20 h-20 rounded-full border-4 border-green-500 border-t-transparent"
            style={{
              animation: 'spin 1s linear infinite',
              willChange: promoted ? 'transform' : 'auto',
            }}
          />
          <div className="text-green-400 font-semibold text-sm mt-4">🟢 CSS animation</div>
          <div className="text-xs text-gray-500 mt-4 text-center">
            Animates via CSS keyframes<br />
            Compositor thread — stays smooth
          </div>
          <span className="mt-2 px-2 py-1 rounded bg-green-900/40 text-green-400 text-xs font-bold">
            RUNNING
          </span>
        </div>
      </div>

      {/* Controls card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <button
          onClick={blockMainThread}
          disabled={blocking}
          className="px-6 py-3 rounded text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Block main thread (fib 42)
        </button>
        <div className="text-xs text-gray-500 mt-2">
          ⚠ This will freeze the page for ~3–4 seconds. Watch which spinner stops.
        </div>
        {blocking && (
          <div className="mt-3 text-sm font-bold text-red-400 animate-pulse">
            🔒 Main thread blocked — computing fib(42)…
          </div>
        )}
        {freezeMs !== null && (
          <div className="mt-3 text-sm text-amber-300">
            Freeze duration: <span className="font-bold font-mono">{freezeMs} ms</span>
          </div>
        )}
      </div>

      {/* GPU Memory explainer card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-amber-400 font-medium mb-3">Layer memory cost</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs p-2 rounded bg-green-950/30 border border-green-800/40">
            <span className="text-green-400">Compositor layer (80×80 spinner)</span>
            <span className="font-mono text-green-300">~25 KB GPU</span>
          </div>
          <div className="flex items-center justify-between text-xs p-2 rounded bg-gray-800 border border-gray-700">
            <span className="text-gray-400">Main layer (rest of the page)</span>
            <span className="font-mono text-gray-400">~8 MB GPU (1080p)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Promoting a full-screen element costs ~8 MB of GPU memory. Promote only small, frequently-animated elements.
        </p>
      </div>

      {/* Key insight callout */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 text-sm text-gray-300">
        <p>
          The compositor thread runs <strong>independently of JavaScript</strong>. CSS animations on{' '}
          <code className="text-amber-300 text-xs">transform</code> and{' '}
          <code className="text-amber-300 text-xs">opacity</code> are handed to the GPU and continue painting at
          60fps even when your main thread is completely frozen — as this demo shows. That's why critical UI
          feedback — spinners, loaders, progress bars — should always be CSS-animated, not JS-driven via{' '}
          <code className="text-amber-300 text-xs">requestAnimationFrame</code>.
        </p>
        <p className="mt-3">
          The cost: each promoted layer reserves GPU memory equal to{' '}
          <code className="text-amber-300 text-xs">width × height × 4 bytes</code>. A full-screen 1920×1080
          layer is ~8 MB. <strong>Don't promote everything</strong> — use{' '}
          <code className="text-amber-300 text-xs">will-change</code> only on elements you know will animate
          frequently.
        </p>
      </div>

      <CodeBlock code={LAYER_PROMOTION_CODE} />
    </div>
  );
}
