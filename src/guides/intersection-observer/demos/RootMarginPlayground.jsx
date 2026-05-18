import { useRef, useState, useCallback, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ROOT_MARGIN_CODE } from '../data/demoCode';

const PRESETS = [
  { label: 'Default (none)',    value: '0px 0px 0px 0px' },
  { label: 'Pre-load +200px',  value: '0px 0px 200px 0px' },
  { label: 'Eager +100px all', value: '100px 100px 100px 100px' },
  { label: 'Center zone -30%', value: '-30% 0px -30% 0px' },
  { label: 'Top-only -50%',    value: '-50% 0px 0px 0px' },
];

const CONTAINER_H = 420;

function parseToContainerPx(val) {
  if (!val) return 0;
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  if (val.trim().endsWith('%')) return (num / 100) * CONTAINER_H;
  return num; // px
}

export default function RootMarginPlayground() {
  const targetRef = useRef(null);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const [margins, setMargins] = useState({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');

  const rootMargin = `${margins.top} ${margins.right} ${margins.bottom} ${margins.left}`;

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!targetRef.current || !containerRef.current) return;
    try {
      const observer = new IntersectionObserver(([e]) => setEntry(e), {
        root: containerRef.current,
        rootMargin,
      });
      observer.observe(targetRef.current);
      observerRef.current = observer;
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [rootMargin]);

  useEffect(() => {
    const timer = setTimeout(setupObserver, 300);
    return () => { clearTimeout(timer); observerRef.current?.disconnect(); };
  }, [setupObserver]);

  const applyPreset = (value) => {
    const parts = value.split(' ');
    setMargins({ top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] });
  };

  const isIntersecting = entry?.isIntersecting ?? false;
  const ratio = entry?.intersectionRatio ?? 0;

  // Compute overlay heights capped for display
  const topPx = parseToContainerPx(margins.top);
  const bottomPx = parseToContainerPx(margins.bottom);
  const OVERLAY_MAX = 80;
  const topOverlay = Math.min(Math.abs(topPx), OVERLAY_MAX);
  const bottomOverlay = Math.min(Math.abs(bottomPx), OVERLAY_MAX);

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">
          Demo 3
        </div>
        <h1 className="text-3xl font-bold text-white">rootMargin Playground</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          <code className="bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded text-sm">rootMargin</code> works
          like CSS margin — it expands (+) or contracts (−) the root's bounding box before checking intersections.
          A positive bottom margin lets you detect elements <em>before</em> they enter the viewport — perfect for lazy loading.
          The colored zones below show the detection boundary live as you scroll.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>

        <div className="flex flex-wrap gap-2" role="group" aria-label="rootMargin presets">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              aria-pressed={rootMargin === p.value}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
                rootMargin === p.value ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['top', 'right', 'bottom', 'left'].map(side => (
            <div key={side}>
              <label className="block text-xs text-gray-500 mb-1 capitalize" htmlFor={`margin-${side}`}>{side}</label>
              <input
                id={`margin-${side}`}
                type="text"
                value={margins[side]}
                onChange={e => setMargins(prev => ({ ...prev, [side]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 100px or 20%"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-sm bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-500">rootMargin: </span>
            <span className="text-orange-400">"{rootMargin}"</span>
          </div>
          {error && <div className="text-red-400 text-xs flex-1" role="alert">{error}</div>}
        </div>
      </div>

      {/* Demo with visual overlay */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Demo — scroll within box (root = this container)
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            isIntersecting ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`} aria-live="polite">
            {isIntersecting ? `ACTIVE — ${(ratio * 100).toFixed(0)}%` : 'INACTIVE'}
          </span>
        </div>

        {/* Overlay wrapper */}
        <div className="relative">
          {/* Top margin zone indicator (non-scrolling overlay) */}
          {topOverlay > 0 && (
            <div
              className={`absolute left-0 right-0 top-0 z-10 flex items-center justify-center text-xs font-mono pointer-events-none border-b border-dashed ${
                topPx >= 0
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}
              style={{ height: `${topOverlay}px` }}
              aria-hidden="true"
            >
              {topPx >= 0 ? `+${margins.top} expanded zone (detects early)` : `${margins.top} dead-zone (detects late)`}
            </div>
          )}

          {/* Bottom margin zone indicator (non-scrolling overlay) */}
          {bottomOverlay > 0 && (
            <div
              className={`absolute left-0 right-0 bottom-0 z-10 flex items-center justify-center text-xs font-mono pointer-events-none border-t border-dashed ${
                bottomPx >= 0
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}
              style={{ height: `${bottomOverlay}px` }}
              aria-hidden="true"
            >
              {bottomPx >= 0 ? `+${margins.bottom} expanded zone (detects early)` : `${margins.bottom} dead-zone (detects late)`}
            </div>
          )}

          {/* Scrollable content */}
          <div
            ref={containerRef}
            className="overflow-y-auto p-6"
            style={{ height: `${CONTAINER_H}px` }}
          >
            <div className="h-40 flex flex-col items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mb-6 gap-1">
              <span>Scroll down to approach the target</span>
              <span className="text-xs text-gray-700">rootMargin adjusts the detection boundary (shown as colored zones above/below)</span>
            </div>

            <div
              ref={targetRef}
              className="rounded-xl p-8 text-center transition-all duration-300 border-2"
              style={{
                background: isIntersecting
                  ? `rgba(249, 115, 22, ${0.08 + ratio * 0.2})`
                  : 'rgba(55,65,81,0.3)',
                borderColor: isIntersecting
                  ? `rgba(249,115,22,${0.5 + ratio * 0.5})`
                  : '#374151',
              }}
            >
              <div className="text-2xl font-bold text-white mb-2">Observed Target</div>
              <div className={`text-sm font-semibold ${isIntersecting ? 'text-green-400' : 'text-gray-500'}`}>
                {isIntersecting ? `Detected — ratio: ${ratio.toFixed(2)}` : 'Outside adjusted root zone'}
              </div>
            </div>

            <div className="h-40 flex items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mt-6">
              scroll more
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-green-500/30 border border-dashed border-green-500/60" />
          Positive margin — detection zone expanded (fires before element reaches edge)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-red-500/30 border border-dashed border-red-500/60" />
          Negative margin — detection zone contracted (fires only after element crosses threshold)
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={ROOT_MARGIN_CODE} />
      </div>
    </section>
  );
}
