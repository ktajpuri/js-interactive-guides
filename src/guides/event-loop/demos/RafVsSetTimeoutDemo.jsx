import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { RAF_CODE } from '../data/demoCode';

const TARGET_FPS = 1000 / 60; // ~16.67ms
const HISTORY_SIZE = 30;
const ROLLING_FPS = 10;

function IntervalBar({ ms }) {
  const diff = Math.abs(ms - TARGET_FPS);
  const color = diff <= 2 ? 'bg-green-500' : diff <= 5 ? 'bg-yellow-500' : 'bg-red-500';
  const height = Math.min(100, Math.round((ms / 50) * 100));
  return (
    <div className="flex flex-col items-center justify-end h-12 w-full">
      <div
        className={`w-full rounded-sm ${color} transition-all`}
        style={{ height: `${height}%`, minHeight: '2px' }}
        title={`${ms.toFixed(1)}ms`}
      />
    </div>
  );
}

function StatCard({ label, value, unit, highlight }) {
  return (
    <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-800">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-mono font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>
        {value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

function TimingPanel({ label, colorClass, stats, history }) {
  return (
    <div className="flex-1 bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
      <div className={`text-sm font-semibold ${colorClass}`}>{label}</div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="FPS (rolling)" value={stats.fps} unit="fps" />
        <StatCard label="Avg interval" value={stats.avg.toFixed(1)} unit="ms" />
        <StatCard label="Min" value={stats.min === Infinity ? '--' : stats.min.toFixed(1)} unit="ms" />
        <StatCard label="Max" value={stats.max === 0 ? '--' : stats.max.toFixed(1)} unit="ms" />
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-1">Last {HISTORY_SIZE} intervals</div>
        <div className="flex gap-0.5 items-end h-12 bg-gray-950 rounded p-1 border border-gray-800">
          {history.length === 0
            ? <div className="text-xs text-gray-600 self-center w-full text-center">Waiting...</div>
            : history.map((ms, i) => <IntervalBar key={i} ms={ms} />)
          }
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>older</span>
          <span className="flex gap-3">
            <span className="text-green-500">within 2ms</span>
            <span className="text-yellow-500">within 5ms</span>
            <span className="text-red-500">further</span>
          </span>
          <span>newest</span>
        </div>
      </div>

      <div className={`text-sm font-mono font-bold text-center py-2 rounded-lg bg-gray-950 border border-gray-800 ${colorClass}`}>
        Jitter: {stats.jitter === 0 ? '--' : stats.jitter.toFixed(1) + 'ms'}
      </div>
    </div>
  );
}

function computeStats(history, rollingHistory) {
  if (history.length === 0) return { fps: 0, avg: 0, min: Infinity, max: 0, jitter: 0 };
  const recent = rollingHistory.slice(-ROLLING_FPS);
  const avg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const fps = avg > 0 ? Math.round(1000 / avg) : 0;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const jitter = max - min;
  return { fps, avg, min, max, jitter };
}

export default function RafVsSetTimeoutDemo() {
  const [running, setRunning] = useState(false);
  const [rafHistory, setRafHistory] = useState([]);
  const [stHistory, setStHistory]   = useState([]);
  const [rafRolling, setRafRolling] = useState([]);
  const [stRolling, setStRolling]   = useState([]);

  const rafIdRef   = useRef(null);
  const stIdRef    = useRef(null);
  const rafPrevRef = useRef(null);
  const stPrevRef  = useRef(null);
  const stBufRef   = useRef([]);   // buffer intervals between display updates
  const runningRef = useRef(false);

  const pushHistory = (setter, ms) =>
    setter(prev => {
      const next = [...prev, ms];
      return next.length > HISTORY_SIZE ? next.slice(next.length - HISTORY_SIZE) : next;
    });

  const pushRolling = (setter, ms) =>
    setter(prev => {
      const next = [...prev, ms];
      return next.length > ROLLING_FPS * 2 ? next.slice(next.length - ROLLING_FPS * 2) : next;
    });

  const rafLoop = useCallback((ts) => {
    if (!runningRef.current) return;
    if (rafPrevRef.current !== null) {
      const ms = ts - rafPrevRef.current;
      pushHistory(setRafHistory, ms);
      pushRolling(setRafRolling, ms);
    }
    rafPrevRef.current = ts;
    rafIdRef.current = requestAnimationFrame(rafLoop);
  }, []);

  const stLoop = useCallback(() => {
    if (!runningRef.current) return;
    const now = performance.now();
    if (stPrevRef.current !== null) {
      const ms = now - stPrevRef.current;
      stBufRef.current.push(ms);
      // flush buffer to state periodically (every ~10 samples) to avoid too-frequent re-renders
      if (stBufRef.current.length >= 3) {
        const buf = [...stBufRef.current];
        stBufRef.current = [];
        setStHistory(prev => {
          const next = [...prev, ...buf];
          return next.length > HISTORY_SIZE ? next.slice(next.length - HISTORY_SIZE) : next;
        });
        setStRolling(prev => {
          const next = [...prev, ...buf];
          return next.length > ROLLING_FPS * 2 ? next.slice(next.length - ROLLING_FPS * 2) : next;
        });
      }
    }
    stPrevRef.current = now;
    stIdRef.current = setTimeout(stLoop, 0);
  }, []);

  const start = useCallback(() => {
    runningRef.current = true;
    setRunning(true);
    setRafHistory([]);
    setStHistory([]);
    setRafRolling([]);
    setStRolling([]);
    rafPrevRef.current = null;
    stPrevRef.current  = null;
    stBufRef.current   = [];
    rafIdRef.current = requestAnimationFrame(rafLoop);
    stIdRef.current  = setTimeout(stLoop, 0);
  }, [rafLoop, stLoop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    cancelAnimationFrame(rafIdRef.current);
    clearTimeout(stIdRef.current);
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    cancelAnimationFrame(rafIdRef.current);
    clearTimeout(stIdRef.current);
  }, []);

  const rafStats = computeStats(rafHistory, rafRolling);
  const stStats  = computeStats(stHistory, stRolling);

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">Demo 3</div>
        <h1 className="text-3xl font-bold text-white">rAF vs setTimeout</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          <span className="text-white font-mono text-sm">requestAnimationFrame</span> syncs to the display refresh cycle (~16.67ms at 60 Hz). <span className="text-white font-mono text-sm">setTimeout(fn, 0)</span> has no such guarantee — it fires as soon as the macrotask queue is free, which can vary significantly.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>
        <div className="flex gap-3">
          {!running ? (
            <button onClick={start}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Start
            </button>
          ) : (
            <button onClick={stop}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Stop
            </button>
          )}
        </div>
        {running && (
          <p className="text-xs text-gray-500">Collecting frame timing data... let it run for a few seconds for stable stats.</p>
        )}
      </div>

      {/* Side-by-side panels */}
      <div className="flex gap-4">
        <TimingPanel
          label="requestAnimationFrame"
          colorClass="text-orange-400"
          stats={rafStats}
          history={rafHistory}
        />
        <TimingPanel
          label="setTimeout(fn, 0)"
          colorClass="text-blue-400"
          stats={stStats}
          history={stHistory}
        />
      </div>

      {/* Key insight */}
      {(rafHistory.length > 10 && stHistory.length > 10) && (
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-800/30 space-y-2">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Key Insight</div>
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-gray-400">rAF jitter: </span>
              <span className="font-mono font-bold text-orange-400">{rafStats.jitter.toFixed(1)}ms</span>
            </div>
            <div>
              <span className="text-gray-400">setTimeout jitter: </span>
              <span className="font-mono font-bold text-blue-400">{stStats.jitter.toFixed(1)}ms</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            rAF is throttled to the display's vsync — intervals cluster tightly around 16.67ms. setTimeout(fn, 0) has no vsync alignment, so intervals are irregular. For animations, always prefer rAF.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={RAF_CODE} />
      </div>
    </section>
  );
}
