import { useState, useEffect, useRef, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { DEBOUNCE_CODE } from '../data/demoCode';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

const MAX_SPARKS = 20;

function Sparkline({ timestamps }) {
  if (timestamps.length < 2) {
    return (
      <div className="h-8 flex items-end gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-1 bg-gray-800 rounded-sm" style={{ height: '4px' }} />
        ))}
      </div>
    );
  }
  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push(timestamps[i] - timestamps[i - 1]);
  }
  const maxGap = Math.max(...gaps, 1);
  const bars = gaps.slice(-MAX_SPARKS);
  return (
    <div className="h-8 flex items-end gap-0.5">
      {bars.map((gap, i) => {
        const h = Math.max(4, Math.round((gap / maxGap) * 28));
        return (
          <div
            key={i}
            className="flex-1 bg-purple-500 rounded-sm opacity-80"
            style={{ height: h + 'px' }}
          />
        );
      })}
      {bars.length < MAX_SPARKS &&
        Array.from({ length: MAX_SPARKS - bars.length }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 bg-gray-800 rounded-sm" style={{ height: '4px' }} />
        ))}
    </div>
  );
}

function ObserverPanel({ label, count, timestamps, active, accentClass, description }) {
  return (
    <div className={`bg-gray-900 rounded-xl p-4 border transition-all duration-150 ${active ? 'border-purple-600' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${active ? 'bg-purple-400 shadow-lg shadow-purple-500/50' : 'bg-gray-700'}`}
        />
      </div>
      <div className={`text-3xl font-bold font-mono mb-0.5 ${accentClass}`}>{count}</div>
      <div className="text-xs text-gray-600 mb-3">{description}</div>
      <Sparkline timestamps={timestamps} />
      <div className="text-xs text-gray-600 mt-1">bar height = gap between calls</div>
    </div>
  );
}

export default function DebouncePatternDemo() {
  const [elementWidth, setElementWidth] = useState(300);
  const [rawCount, setRawCount]         = useState(0);
  const [debCount, setDebCount]         = useState(0);
  const [thrCount, setThrCount]         = useState(0);
  const [rawTs, setRawTs]               = useState([]);
  const [debTs, setDebTs]               = useState([]);
  const [thrTs, setThrTs]               = useState([]);
  const [rawActive, setRawActive]       = useState(false);
  const [debActive, setDebActive]       = useState(false);
  const [thrActive, setThrActive]       = useState(false);
  const [fastRunning, setFastRunning]   = useState(false);
  const [summary, setSummary]           = useState(null);

  const elementRef = useRef(null);
  const rawRef     = useRef({ count: 0, ts: [] });
  const debRef     = useRef({ count: 0, ts: [] });
  const thrRef     = useRef({ count: 0, ts: [] });

  const rawTimer = useRef(null);
  const debTimer = useRef(null);
  const thrTimer = useRef(null);

  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">
        ResizeObserver is not supported in this browser.
      </div>
    );
  }

  const flash = (setter, timerRef) => {
    setter(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setter(false), 200);
  };

  const rawCallback = useCallback(() => {
    const now = Date.now();
    rawRef.current.count += 1;
    rawRef.current.ts = [...rawRef.current.ts, now].slice(-MAX_SPARKS + 1);
    setRawCount(rawRef.current.count);
    setRawTs([...rawRef.current.ts]);
    flash(setRawActive, rawTimer);
  }, []);

  const debCallback = useCallback(debounce(() => {
    const now = Date.now();
    debRef.current.count += 1;
    debRef.current.ts = [...debRef.current.ts, now].slice(-MAX_SPARKS + 1);
    setDebCount(debRef.current.count);
    setDebTs([...debRef.current.ts]);
    flash(setDebActive, debTimer);
  }, 100), []);

  const thrCallback = useCallback(throttle(() => {
    const now = Date.now();
    thrRef.current.count += 1;
    thrRef.current.ts = [...thrRef.current.ts, now].slice(-MAX_SPARKS + 1);
    setThrCount(thrRef.current.count);
    setThrTs([...thrRef.current.ts]);
    flash(setThrActive, thrTimer);
  }, 100), []);

  useEffect(() => {
    if (!elementRef.current) return;
    const rawObs = new ResizeObserver(rawCallback);
    const debObs = new ResizeObserver(debCallback);
    const thrObs = new ResizeObserver(thrCallback);
    rawObs.observe(elementRef.current);
    debObs.observe(elementRef.current);
    thrObs.observe(elementRef.current);
    return () => {
      rawObs.disconnect();
      debObs.disconnect();
      thrObs.disconnect();
    };
  }, [rawCallback, debCallback, thrCallback]);

  const handleFastResize = () => {
    if (fastRunning) return;
    setFastRunning(true);
    setSummary(null);
    const startRaw = rawRef.current.count;
    const startDeb = debRef.current.count;
    const startThr = thrRef.current.count;
    let step = 0;
    const steps = 50;
    const startWidth = 150;
    const interval = setInterval(() => {
      step++;
      setElementWidth(startWidth + step * 5);
      if (step >= steps) {
        clearInterval(interval);
        // wait for debounce to settle
        setTimeout(() => {
          setSummary({
            raw: rawRef.current.count - startRaw,
            deb: debRef.current.count - startDeb,
            thr: thrRef.current.count - startThr,
          });
          setFastRunning(false);
        }, 300);
      }
    }, 10);
  };

  const handleReset = () => {
    setElementWidth(300);
    setRawCount(0); setDebCount(0); setThrCount(0);
    setRawTs([]); setDebTs([]); setThrTs([]);
    rawRef.current = { count: 0, ts: [] };
    debRef.current = { count: 0, ts: [] };
    thrRef.current = { count: 0, ts: [] };
    setSummary(null);
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-purple-900/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-purple-800/50">
          Demo 4
        </div>
        <h1 className="text-3xl font-bold text-white">Debounce Pattern</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          ResizeObserver can fire on <strong className="text-white">every pixel change</strong> during a resize.
          Compare raw callbacks vs debounced (fires after resize settles) vs throttled (fires at most once per 100ms).
          Hit "Fast Resize" to see the frequency difference clearly.
        </p>
      </header>

      {/* Element + controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Observed Element</h2>
        <div className="flex justify-center py-2">
          <div
            ref={elementRef}
            style={{ width: elementWidth + 'px' }}
            className="h-14 bg-purple-900/20 border-2 border-purple-600/50 rounded-lg flex items-center justify-center transition-none"
          >
            <span className="text-purple-300 text-xs font-mono select-none">{elementWidth}px</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Width</span>
            <span className="font-mono text-purple-400 font-bold">{elementWidth}px</span>
          </div>
          <input
            type="range" min={150} max={400} step={1} value={elementWidth}
            onChange={e => setElementWidth(Number(e.target.value))}
            className="w-full accent-purple-500"
            aria-label="Element width"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleFastResize}
            disabled={fastRunning}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {fastRunning ? 'Resizing…' : 'Fast Resize (50 steps)'}
          </button>
          <button
            onClick={handleReset}
            disabled={fastRunning}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Three observer panels */}
      <div className="grid md:grid-cols-3 gap-4">
        <ObserverPanel
          label="Raw"
          count={rawCount}
          timestamps={rawTs}
          active={rawActive}
          accentClass="text-red-400"
          description="Every callback"
        />
        <ObserverPanel
          label="Debounced 100ms"
          count={debCount}
          timestamps={debTs}
          active={debActive}
          accentClass="text-yellow-400"
          description="Fires after resize settles"
        />
        <ObserverPanel
          label="Throttled 100ms"
          count={thrCount}
          timestamps={thrTs}
          active={thrActive}
          accentClass="text-green-400"
          description="At most once per 100ms"
        />
      </div>

      {/* Summary after fast resize */}
      {summary && (
        <div className="bg-gray-900 rounded-xl p-4 border border-purple-800/40">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Fast Resize Summary</h2>
          <p className="text-sm text-gray-300">
            <span className="text-red-400 font-bold font-mono">{summary.raw}</span> raw callbacks,{' '}
            <span className="text-yellow-400 font-bold font-mono">{summary.deb}</span> debounced callbacks,{' '}
            <span className="text-green-400 font-bold font-mono">{summary.thr}</span> throttled callbacks
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Debounce and throttle reduce expensive work by {summary.raw > 0 ? Math.round((1 - summary.deb / summary.raw) * 100) : 0}% and {summary.raw > 0 ? Math.round((1 - summary.thr / summary.raw) * 100) : 0}% respectively.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={DEBOUNCE_CODE} />
      </div>
    </section>
  );
}
