import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { MICROTASK_CODE } from '../data/demoCode';

function Spinner({ frozen }) {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => {
    if (frozen) {
      cancelAnimationFrame(rafRef.current);
      prevRef.current = null;
      return;
    }
    const tick = (ts) => {
      if (prevRef.current !== null) {
        const delta = ts - prevRef.current;
        setAngle(a => (a + delta * 0.18) % 360);
      }
      prevRef.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frozen]);

  return (
    <div
      className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-orange-400 transition-none"
      style={{ transform: `rotate(${angle}deg)` }}
      aria-label="Animation indicator"
    />
  );
}

export default function MicrotaskStarvationDemo() {
  const [duration, setDuration]     = useState(500);
  const [result, setResult]         = useState(null);
  const [running, setRunning]       = useState(false);
  const [heartbeat, setHeartbeat]   = useState(0);
  const [spinnerFrozen, setSpinnerFrozen] = useState(false);

  const rafRef      = useRef(null);
  const heartRef    = useRef(0);
  const frozenRef   = useRef(false);
  const runningRef  = useRef(false);

  // Heartbeat counter — increments every rAF frame
  useEffect(() => {
    const tick = () => {
      if (!frozenRef.current) {
        heartRef.current += 1;
        setHeartbeat(heartRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const runHealthy = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setResult(null);

    const steps = Math.round(duration / 16);
    const startHeartbeat = heartRef.current;
    const startTime = performance.now();
    let count = 0;

    const step = () => {
      if (count >= steps) {
        const elapsed = performance.now() - startTime;
        const framesPainted = heartRef.current - startHeartbeat;
        setResult({
          type: 'healthy',
          blocked: 0,
          elapsed: Math.round(elapsed),
          framesPainted,
          message: 'UI remained responsive — the browser painted frames between each setTimeout.',
        });
        runningRef.current = false;
        setRunning(false);
        return;
      }
      count++;
      // simulate a tiny bit of work
      const end = performance.now() + 1;
      while (performance.now() < end) { /* busy wait 1ms */ }
      setTimeout(step, 0);
    };

    setTimeout(step, 0);
  }, [duration]);

  const runStarving = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setResult(null);

    // Brief delay so React can render the "running" state before we block
    setTimeout(() => {
      const startHeartbeat = heartRef.current;

      // Freeze spinner before blocking
      frozenRef.current = true;
      setSpinnerFrozen(true);

      const blockStart = performance.now();

      // Schedule N microtasks that each do a small amount of busy work
      // This blocks the microtask queue for ~duration ms
      const msPerTask = 0.5;
      const numTasks = Math.round(duration / msPerTask);

      let queued = 0;
      let completed = 0;

      const doWork = () => {
        const end = performance.now() + msPerTask;
        while (performance.now() < end) { /* busy work */ }
        completed++;
        if (completed === numTasks) {
          const blockDuration = performance.now() - blockStart;
          frozenRef.current = false;
          setSpinnerFrozen(false);

          // Use rAF to measure if a frame painted during block
          requestAnimationFrame(() => {
            const framesPainted = heartRef.current - startHeartbeat;
            setResult({
              type: 'starving',
              blocked: Math.round(blockDuration),
              elapsed: Math.round(blockDuration),
              framesPainted,
              message: `UI was blocked for ~${Math.round(blockDuration)}ms. The browser could not paint during this time.`,
            });
            runningRef.current = false;
            setRunning(false);
          });
        }
      };

      // Queue all microtasks at once
      for (let i = 0; i < numTasks; i++) {
        queued++;
        queueMicrotask(doWork);
      }
    }, 50);
  }, [duration]);

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">Demo 4</div>
        <h1 className="text-3xl font-bold text-white">Microtask Starvation</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Microtasks run to completion before the browser can paint. Scheduling a large batch of microtasks at once blocks rendering and freezes the UI. Compare a healthy setTimeout chain against a microtask-heavy workload.
        </p>
      </header>

      {/* Warning */}
      <div className="bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-red-400 font-bold text-sm flex-shrink-0">Warning</span>
        <p className="text-red-300 text-sm">This demo deliberately blocks the browser's main thread for up to 2 seconds to demonstrate starvation. The page will be unresponsive during that time.</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Work duration</span>
            <span className="font-mono text-orange-400 font-bold">{duration}ms</span>
          </div>
          <input
            type="range" min="100" max="2000" step="100" value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            disabled={running}
            className="w-full accent-orange-500 disabled:opacity-50"
            aria-label="Starvation duration"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>100ms</span>
            <span>2000ms</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={runHealthy}
            disabled={running}
            className="px-5 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Healthy (setTimeout chain)
          </button>
          <button
            onClick={runStarving}
            disabled={running}
            className="px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Starving (microtask batch)
          </button>
        </div>
      </div>

      {/* Heartbeat + Spinner */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">UI Responsiveness Indicator</h2>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner frozen={spinnerFrozen} />
            <span className="text-xs text-gray-500">{spinnerFrozen ? 'FROZEN' : 'Animating'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">rAF heartbeat</span>
            <span className="font-mono text-2xl font-bold text-white">{heartbeat}</span>
            <span className="text-xs text-gray-600">frames painted since load</span>
          </div>
          {running && (
            <div className="ml-auto">
              <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-800/50 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 text-sm font-semibold">Running...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`bg-gray-900 rounded-xl p-5 border space-y-3 ${
          result.type === 'healthy' ? 'border-green-800/50' : 'border-red-800/50'
        }`}>
          <div className={`text-xs font-semibold uppercase tracking-widest ${
            result.type === 'healthy' ? 'text-green-400' : 'text-red-400'
          }`}>
            {result.type === 'healthy' ? 'Result: Healthy' : 'Result: Starvation'}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{result.message}</p>
          <div className="flex gap-6 text-sm">
            {result.type === 'starving' && (
              <div>
                <span className="text-gray-400">UI blocked: </span>
                <span className="font-mono font-bold text-red-400">{result.blocked}ms</span>
              </div>
            )}
            <div>
              <span className="text-gray-400">Total elapsed: </span>
              <span className="font-mono font-bold text-white">{result.elapsed}ms</span>
            </div>
            <div>
              <span className="text-gray-400">Frames painted during run: </span>
              <span className={`font-mono font-bold ${result.framesPainted > 3 ? 'text-green-400' : 'text-red-400'}`}>
                {result.framesPainted}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="bg-gray-900 rounded-xl p-5 border border-orange-800/30">
        <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">How It Works</div>
        <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
          <div className="flex gap-3">
            <span className="bg-green-900/40 text-green-300 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 self-start mt-0.5">setTimeout</span>
            <span>Each iteration is a separate macrotask. The browser can paint a frame between macrotasks, so the animation stays smooth and the UI remains responsive.</span>
          </div>
          <div className="flex gap-3">
            <span className="bg-red-900/40 text-red-300 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 self-start mt-0.5">queueMicrotask</span>
            <span>All microtasks are queued at once and drain before the browser gets a chance to paint. The entire batch runs synchronously from the browser's perspective — rendering is blocked until every microtask completes.</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={MICROTASK_CODE} />
      </div>
    </section>
  );
}
