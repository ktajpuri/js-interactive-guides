import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { DEBOUNCE_THROTTLE_CODE } from '../data/demoCode';

// ─── Constants ───────────────────────────────────────────────────────────────

const STRATEGIES = [
  { key: 'raw',       label: 'Raw',          colorClass: 'text-gray-400',   dotBg: 'bg-gray-400',   borderClass: 'border-gray-600'   },
  { key: 'debounced', label: 'Debounced',    colorClass: 'text-blue-400',   dotBg: 'bg-blue-400',   borderClass: 'border-blue-800/50' },
  { key: 'throttled', label: 'Throttled',    colorClass: 'text-yellow-400', dotBg: 'bg-yellow-400', borderClass: 'border-yellow-800/50' },
  { key: 'raf',       label: 'rAF Throttled',colorClass: 'text-green-400',  dotBg: 'bg-green-400',  borderClass: 'border-green-800/50' },
];

const CENTER = { x: 50, y: 50 };

// ─── Sub-components ──────────────────────────────────────────────────────────

function StrategyPanel({ strategy, position, received, handled }) {
  const { label, colorClass, dotBg, borderClass } = strategy;
  const ratio = received > 0 ? Math.round((handled / received) * 100) : 0;

  return (
    <div className={`flex-1 min-w-0 bg-gray-900 rounded-xl p-4 border ${borderClass} space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotBg}`} />
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
      </div>

      {/* Dot tracker */}
      <div
        className="relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
        style={{ height: '80px' }}
        aria-label={`${label} dot position tracker`}
      >
        <div
          className={`absolute w-3 h-3 rounded-full ${dotBg} shadow-lg -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75`}
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-950 rounded-lg p-2 text-center border border-gray-800">
          <div className="text-xs text-gray-500 mb-0.5">Received</div>
          <div className="font-mono font-bold text-white text-lg leading-none">{received}</div>
        </div>
        <div className="bg-gray-950 rounded-lg p-2 text-center border border-gray-800">
          <div className="text-xs text-gray-500 mb-0.5">Handled</div>
          <div className={`font-mono font-bold text-lg leading-none ${colorClass}`}>{handled}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DebounceThrottleDemo() {
  const [delay, setDelay] = useState(200);

  // Per-strategy state: position + counters
  const [rawPos,       setRawPos]       = useState(CENTER);
  const [debouncedPos, setDebouncedPos] = useState(CENTER);
  const [throttledPos, setThrottledPos] = useState(CENTER);
  const [rafPos,       setRafPos]       = useState(CENTER);

  const [rawHandled,       setRawHandled]       = useState(0);
  const [debouncedHandled, setDebouncedHandled] = useState(0);
  const [throttledHandled, setThrottledHandled] = useState(0);
  const [rafHandled,       setRafHandled]       = useState(0);

  // Shared received counter (all strategies share the same source events)
  const [received, setReceived] = useState(0);

  // Refs for handler implementations
  const debounceTimerRef = useRef(null);
  const throttleLastRef  = useRef(0);
  const rafScheduledRef  = useRef(false);
  const rafPendingPos    = useRef(null);
  const rafIdRef         = useRef(null);

  // Interaction area ref for bounding rect
  const areaRef = useRef(null);

  // ── Utilities ──────────────────────────────────────────────────────────────

  const getPct = useCallback((clientX, clientY) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top)  / rect.height) * 100));
    return { x, y };
  }, []);

  // ── Strategy handlers (rebuilt when delay changes) ─────────────────────────

  const handleRaw = useCallback((pos) => {
    setRawPos(pos);
    setRawHandled(c => c + 1);
  }, []);

  const handleDebounced = useCallback((pos) => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedPos(pos);
      setDebouncedHandled(c => c + 1);
    }, delay);
  }, [delay]);

  const handleThrottled = useCallback((pos) => {
    const now = Date.now();
    if (now - throttleLastRef.current >= delay) {
      throttleLastRef.current = now;
      setThrottledPos(pos);
      setThrottledHandled(c => c + 1);
    }
  }, [delay]);

  const handleRaf = useCallback((pos) => {
    rafPendingPos.current = pos;
    if (!rafScheduledRef.current) {
      rafScheduledRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        rafScheduledRef.current = false;
        if (rafPendingPos.current) {
          setRafPos(rafPendingPos.current);
          setRafHandled(c => c + 1);
        }
      });
    }
  }, []);

  // ── Shared mousemove dispatcher ────────────────────────────────────────────

  const onMove = useCallback((clientX, clientY) => {
    const pos = getPct(clientX, clientY);
    if (!pos) return;
    setReceived(c => c + 1);
    handleRaw(pos);
    handleDebounced(pos);
    handleThrottled(pos);
    handleRaf(pos);
  }, [getPct, handleRaw, handleDebounced, handleThrottled, handleRaf]);

  const onMouseMove = useCallback((e) => {
    onMove(e.clientX, e.clientY);
  }, [onMove]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) onMove(touch.clientX, touch.clientY);
  }, [onMove]);

  // ── Reset throttle timestamp when delay changes ────────────────────────────
  useEffect(() => {
    throttleLastRef.current = 0;
  }, [delay]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setReceived(0);
    setRawHandled(0);
    setDebouncedHandled(0);
    setThrottledHandled(0);
    setRafHandled(0);
    setRawPos(CENTER);
    setDebouncedPos(CENTER);
    setThrottledPos(CENTER);
    setRafPos(CENTER);
    clearTimeout(debounceTimerRef.current);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafScheduledRef.current = false;
    throttleLastRef.current = 0;
  }, []);

  // ── Derived values for insight table ──────────────────────────────────────

  const insightData = [
    { label: 'Raw',           handled: rawHandled,       colorClass: 'text-gray-400'   },
    { label: 'Debounced',     handled: debouncedHandled, colorClass: 'text-blue-400'   },
    { label: 'Throttled',     handled: throttledHandled, colorClass: 'text-yellow-400' },
    { label: 'rAF Throttled', handled: rafHandled,       colorClass: 'text-green-400'  },
  ];

  const panelData = [
    { strategy: STRATEGIES[0], position: rawPos,       handled: rawHandled       },
    { strategy: STRATEGIES[1], position: debouncedPos, handled: debouncedHandled },
    { strategy: STRATEGIES[2], position: throttledPos, handled: throttledHandled },
    { strategy: STRATEGIES[3], position: rafPos,       handled: rafHandled       },
  ];

  const showInsight = received >= 20;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">
          Demo 5
        </div>
        <h1 className="text-3xl font-bold text-white">Debounce / Throttle / rAF Throttle</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Four rate-limiting strategies applied to the same stream of <span className="text-white font-mono text-sm">mousemove</span> events.
          Move your mouse over the interaction area to see how each strategy filters the event flood differently.
        </p>
      </header>

      {/* Interaction area */}
      <div
        ref={areaRef}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        className="relative bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 select-none cursor-crosshair flex items-center justify-center"
        style={{ height: '200px', touchAction: 'none' }}
        aria-label="Mouse interaction area — move your mouse here"
        role="region"
      >
        <span className="text-gray-500 text-sm font-medium pointer-events-none">
          Move your mouse here
        </span>
        {received > 0 && (
          <div className="absolute top-3 right-3 bg-gray-900/80 rounded-lg px-3 py-1 border border-gray-700">
            <span className="text-xs text-gray-400">Events received: </span>
            <span className="font-mono font-bold text-orange-400 text-sm">{received}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Delay slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="delay-slider" className="text-sm text-gray-300 font-medium">
                Debounce &amp; Throttle delay
              </label>
              <span className="font-mono text-orange-400 text-sm font-bold">{delay}ms</span>
            </div>
            <input
              id="delay-slider"
              type="range"
              min={50}
              max={1000}
              step={50}
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>50ms</span>
              <span className="text-gray-500 text-xs">rAF is always ~16ms (60fps)</span>
              <span>1000ms</span>
            </div>
          </div>

          {/* Reset */}
          <div className="flex sm:justify-end">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Strategy panels */}
      <div className="flex flex-col sm:flex-row gap-4">
        {panelData.map(({ strategy, position, handled }) => (
          <StrategyPanel
            key={strategy.key}
            strategy={strategy}
            position={position}
            received={received}
            handled={handled}
          />
        ))}
      </div>

      {/* Key insight table */}
      {showInsight && (
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-800/30 space-y-4">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Key Insight</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="pb-2 pr-4 font-medium">Strategy</th>
                  <th className="pb-2 pr-4 font-medium text-right">Received</th>
                  <th className="pb-2 pr-4 font-medium text-right">Handled</th>
                  <th className="pb-2 font-medium text-right">Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {insightData.map(({ label, handled, colorClass }) => {
                  const ratio = received > 0 ? Math.round((handled / received) * 100) : 0;
                  return (
                    <tr key={label}>
                      <td className={`py-2 pr-4 font-semibold ${colorClass}`}>{label}</td>
                      <td className="py-2 pr-4 text-right font-mono text-gray-400">{received}</td>
                      <td className={`py-2 pr-4 text-right font-mono font-bold ${colorClass}`}>{handled}</td>
                      <td className="py-2 text-right">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                            ratio === 100
                              ? 'bg-gray-700 text-gray-300'
                              : ratio >= 50
                              ? 'bg-yellow-900/40 text-yellow-400'
                              : ratio >= 5
                              ? 'bg-blue-900/40 text-blue-400'
                              : 'bg-blue-900/20 text-blue-300'
                          }`}
                        >
                          {ratio}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-gray-300 font-semibold">Raw</span> handles every event (100%).{' '}
            <span className="text-yellow-400 font-semibold">Throttled</span> fires at most once per {delay}ms.{' '}
            <span className="text-green-400 font-semibold">rAF</span> coalesces events to ~60fps — ideal for visual updates.{' '}
            <span className="text-blue-400 font-semibold">Debounced</span> fires only after the mouse stops — great for search inputs, but useless for live tracking.
          </p>
        </div>
      )}

      {/* Code block */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={DEBOUNCE_THROTTLE_CODE ?? ''} />
      </div>
    </section>
  );
}
