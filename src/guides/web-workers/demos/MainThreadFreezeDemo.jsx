import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { WORKER_BASICS_CODE } from '../data/demoCode';

// ── Sieve helpers ──────────────────────────────────────────────────────────────

function runSieveMainThread(n) {
  const sieve = new Uint8Array(n + 1);
  for (let i = 2; i * i <= n; i++) {
    if (!sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = 1;
  }
  let count = 0;
  for (let i = 2; i <= n; i++) if (!sieve[i]) count++;
  return count;
}

const WORKER_SRC = `
  self.onmessage = ({ data: { n } }) => {
    const sieve = new Uint8Array(n + 1);
    for (let i = 2; i * i <= n; i++) {
      if (!sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = 1;
    }
    let count = 0;
    for (let i = 2; i <= n; i++) if (!sieve[i]) count++;
    self.postMessage({ count });
  };
`;

function createWorker() {
  const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// Initial ball configs — pos, speed (px/frame), direction
const BALLS_INIT = [
  { pos: 10,  speed: 1.2, dir: 1,  color: '#22d3ee' }, // cyan
  { pos: 80,  speed: 2.8, dir: 1,  color: '#a78bfa' }, // violet
  { pos: 155, speed: 4.5, dir: -1, color: '#fb923c' }, // orange
  { pos: 40,  speed: 3.5, dir: 1,  color: '#4ade80' }, // green
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function FpsBadge({ fps }) {
  const color =
    fps >= 55 ? 'bg-green-900/60 text-green-400 border-green-700/40' :
    fps >= 20 ? 'bg-yellow-900/60 text-yellow-400 border-yellow-700/40' :
                'bg-red-900/60 text-red-400 border-red-700/40';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${color}`}>
      {fps} FPS
    </span>
  );
}

function PanelLabel({ title, subtitle, ok }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="text-xs font-semibold text-white">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
      </div>
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ok ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
        {ok ? '✓ smooth' : '✗ freezes'}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MainThreadFreezeDemo() {
  const [n, setN] = useState(12_000_000);
  const [mode, setMode] = useState('worker');
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'done:count:ms:freezeMs'
  const [fps, setFps] = useState(60);
  const [stopwatch, setStopwatch] = useState('00:00.000');
  const [frameCount, setFrameCount] = useState(0);
  const [queuedClicks, setQueuedClicks] = useState(null);

  // Ball DOM refs
  const ball0Ref = useRef(null);
  const ball1Ref = useRef(null);
  const ball2Ref = useRef(null);
  const ball3Ref = useRef(null);
  const ballRefs = [ball0Ref, ball1Ref, ball2Ref, ball3Ref];

  // Mutable animation state (no re-render)
  const ballsRef = useRef(BALLS_INIT.map(b => ({ ...b })));
  const rafRef = useRef(null);
  const fpsTrackerRef = useRef({ last: performance.now(), frames: 0 });
  const startTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const workerRef = useRef(null);
  const runningRef = useRef(false); // true during computation
  const freezeStartRef = useRef(0);
  const freezeEndRef = useRef(0);
  const clicksDuringFreezeRef = useRef(0);

  // rAF animation loop — drives all 3 panels
  useEffect(() => {
    const animate = (now) => {
      // 1) Move the 4 balls
      ballsRef.current.forEach((b, i) => {
        b.pos += b.speed * b.dir;
        if (b.pos >= 210 || b.pos <= 0) b.dir *= -1;
        if (ballRefs[i].current) {
          ballRefs[i].current.style.transform = `translateX(${b.pos}px)`;
        }
      });

      // 2) Stopwatch
      frameCountRef.current++;
      const elapsed = now - startTimeRef.current;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      const ms   = Math.floor(elapsed % 1000);
      const timeStr = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;

      // 3) FPS — update state at ~4Hz to avoid excessive renders
      fpsTrackerRef.current.frames++;
      const fpsDelta = now - fpsTrackerRef.current.last;
      if (fpsDelta >= 250) {
        const liveFps = Math.round((fpsTrackerRef.current.frames / fpsDelta) * 1000);
        setFps(liveFps);
        setStopwatch(timeStr);
        setFrameCount(frameCountRef.current);
        fpsTrackerRef.current = { last: now, frames: 0 };
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup worker on unmount
  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);

  const handleRun = useCallback(() => {
    if (runningRef.current) return;

    clicksDuringFreezeRef.current = 0;
    setQueuedClicks(null);
    runningRef.current = true;
    const t0 = performance.now();
    setStatus('running');

    if (mode === 'main') {
      freezeStartRef.current = performance.now();
      // One rAF delay so "Running…" renders, then block
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const count = runSieveMainThread(n);
          const totalMs = performance.now() - t0;
          freezeEndRef.current = performance.now();
          const freezeMs = freezeEndRef.current - freezeStartRef.current;
          runningRef.current = false;
          setStatus(`done:${count}:${totalMs.toFixed(0)}:${freezeMs.toFixed(0)}`);
          // Queued clicks will fire immediately after this synchronous block
          setTimeout(() => {
            setQueuedClicks(clicksDuringFreezeRef.current);
          }, 50);
        });
      });
    } else {
      const w = createWorker();
      workerRef.current = w;
      w.postMessage({ n });
      w.onmessage = ({ data }) => {
        const totalMs = performance.now() - t0;
        runningRef.current = false;
        setStatus(`done:${data.count}:${totalMs.toFixed(0)}:0`);
        setQueuedClicks(0);
        w.terminate();
        workerRef.current = null;
      };
    }
  }, [mode, n]);

  // Click handler for the "click me" button — records clicks using event.timeStamp
  const handleClickTarget = useCallback((e) => {
    // If this click timestamp falls inside the freeze window, it was queued
    if (
      freezeStartRef.current > 0 &&
      e.timeStamp >= freezeStartRef.current &&
      e.timeStamp <= (freezeEndRef.current || Infinity)
    ) {
      clicksDuringFreezeRef.current++;
    }
  }, []);

  // Parse status string
  const statusParts = status.startsWith('done:') ? status.split(':') : null;
  const doneCount   = statusParts ? parseInt(statusParts[1], 10) : null;
  const doneTotalMs = statusParts ? parseInt(statusParts[2], 10) : null;
  const doneFreezeMs= statusParts ? parseInt(statusParts[3], 10) : null;

  return (
    <section className="max-w-4xl mx-auto space-y-6 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-cyan-900/30 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-cyan-800/50">
          Demo 1
        </div>
        <h1 className="text-3xl font-bold text-white">Main Thread Freeze</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Three live animations run simultaneously. Run the prime sieve on the{' '}
          <span className="font-mono text-white text-sm">main thread</span> and watch all three
          freeze at once. Switch to a <span className="font-mono text-white text-sm">Web Worker</span>{' '}
          — they all stay smooth.
        </p>
      </header>

      {/* ── Animation sandbox ── */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Animation Sandbox</span>
          <FpsBadge fps={fps} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Panel 1 — CSS spinner (compositor thread) */}
          <div className="bg-gray-950 rounded-lg border border-gray-800 p-4 flex flex-col items-center gap-3">
            <PanelLabel title="CSS Spinner" subtitle="compositor thread" ok={true} />
            <div className="flex items-center justify-center h-20">
              <div
                className="w-14 h-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-400"
                style={{ animation: 'spin 1s linear infinite' }}
              />
            </div>
            <p className="text-xs text-center text-gray-600">
              CSS <code className="text-gray-500">animation</code> runs on the compositor — immune to JS freezes.
            </p>
          </div>

          {/* Panel 2 — rAF balls (main thread) */}
          <div className="bg-gray-950 rounded-lg border border-gray-800 p-4 flex flex-col gap-3">
            <PanelLabel title="rAF Balls (×4)" subtitle="main thread" ok={false} />
            <div className="relative h-20 overflow-hidden">
              {BALLS_INIT.map((b, i) => (
                <div
                  key={i}
                  ref={ballRefs[i]}
                  style={{
                    position: 'absolute',
                    top: `${10 + i * 14}px`,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: b.color,
                    boxShadow: `0 0 8px ${b.color}80`,
                    willChange: 'transform',
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-center text-gray-600">
              4 balls at different speeds — all stop instantly when JS blocks.
            </p>
          </div>

          {/* Panel 3 — JS stopwatch (main thread) */}
          <div className="bg-gray-950 rounded-lg border border-gray-800 p-4 flex flex-col items-center gap-3">
            <PanelLabel title="JS Stopwatch" subtitle="main thread" ok={false} />
            <div className="flex flex-col items-center justify-center h-20 gap-1">
              <div className="font-mono text-2xl font-bold text-white tracking-tight">
                {stopwatch}
              </div>
              <div className="text-xs text-gray-600">
                Frame <span className="font-mono text-gray-400">#{frameCount.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-center text-gray-600">
              Updated every rAF — mid-number freeze is unmistakable.
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls + results ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Controls */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Computation</span>

          {/* N slider */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              N = <span className="font-mono font-bold text-cyan-400">{n.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={2_000_000}
              max={20_000_000}
              step={1_000_000}
              value={n}
              onChange={(e) => { setN(Number(e.target.value)); setStatus('idle'); }}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>2M (~0.5s)</span>
              <span>20M (~5s)</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Execution mode</div>
            <div className="flex rounded-lg overflow-hidden border border-gray-700 text-sm font-semibold">
              <button
                onClick={() => { setMode('main'); setStatus('idle'); }}
                className={`flex-1 py-2 transition-colors focus:outline-none ${
                  mode === 'main'
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                Main Thread
              </button>
              <button
                onClick={() => { setMode('worker'); setStatus('idle'); }}
                className={`flex-1 py-2 transition-colors focus:outline-none ${
                  mode === 'worker'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                Web Worker
              </button>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={status === 'running'}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          >
            {status === 'running' ? 'Running…' : 'Run Prime Sieve'}
          </button>

          {/* Click target experiment */}
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Click-during-freeze test</div>
            <button
              onClick={handleClickTarget}
              className="w-full py-2 border border-dashed border-gray-600 text-gray-400 text-sm rounded-lg hover:border-cyan-700 hover:text-cyan-400 transition-colors focus:outline-none"
            >
              👆 Spam-click me while frozen
            </button>
            {queuedClicks !== null && (
              <p className="text-xs text-center">
                {queuedClicks > 0 ? (
                  <span className="text-yellow-400 font-semibold">
                    {queuedClicks} click{queuedClicks !== 1 ? 's' : ''} were queued during freeze!
                  </span>
                ) : (
                  <span className="text-green-400">No queued clicks — UI stayed responsive ✓</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4 flex flex-col">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Results</span>

          {status === 'idle' && (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-600 text-center px-4">
              Pick a mode and click "Run Prime Sieve".<br />Watch the sandbox above.
            </div>
          )}

          {status === 'running' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-yellow-400 text-sm font-medium">
                {mode === 'main' ? 'Main thread blocked — look at the sandbox!' : 'Worker computing in background…'}
              </span>
            </div>
          )}

          {statusParts && (
            <div className="space-y-3 flex-1">
              {/* Primes found */}
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 text-center">
                <div className="text-xs text-gray-500 mb-1">Primes found up to {n.toLocaleString()}</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {doneCount?.toLocaleString()}
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
                  <div className="text-xs text-gray-500 mb-1">Total time</div>
                  <div className="font-mono font-bold text-cyan-400">{doneTotalMs}ms</div>
                </div>
                <div className={`rounded-lg p-3 border text-center ${
                  doneFreezeMs && doneFreezeMs > 100
                    ? 'bg-red-950/40 border-red-800/40'
                    : 'bg-green-950/40 border-green-800/40'
                }`}>
                  <div className="text-xs text-gray-500 mb-1">UI frozen for</div>
                  <div className={`font-mono font-bold ${doneFreezeMs && doneFreezeMs > 100 ? 'text-red-400' : 'text-green-400'}`}>
                    {doneFreezeMs && doneFreezeMs > 100 ? `${doneFreezeMs}ms` : '~0ms'}
                  </div>
                </div>
              </div>

              {/* Mode-specific verdict */}
              {mode === 'main' && doneFreezeMs && doneFreezeMs > 100 ? (
                <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-sm text-red-300">
                  ⚠ The main thread was blocked for{' '}
                  <span className="font-mono font-bold">{(doneFreezeMs / 1000).toFixed(2)}s</span>.
                  Every click, scroll, and animation was paused.
                </div>
              ) : (
                <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-3 text-sm text-green-300">
                  ✓ Worker ran on a separate thread — the main thread was never blocked.
                  Animations and events stayed live throughout.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-gray-900 rounded-xl p-5 border border-cyan-700/40 space-y-3">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Key Insight</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center space-y-1">
            <div className="text-sm font-semibold text-green-400">CSS animation</div>
            <div className="text-xs text-gray-500">Compositor thread</div>
            <div className="text-xs text-gray-400">Continues even when JS is fully blocked. Safe for visual polish.</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center space-y-1">
            <div className="text-sm font-semibold text-red-400">rAF / event handlers</div>
            <div className="text-xs text-gray-500">Main thread</div>
            <div className="text-xs text-gray-400">Pauses instantly when any synchronous JS blocks. No exceptions.</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center space-y-1">
            <div className="text-sm font-semibold text-cyan-400">Web Worker</div>
            <div className="text-xs text-gray-500">Separate OS thread</div>
            <div className="text-xs text-gray-400">Heavy computation runs concurrently — main thread stays free.</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={WORKER_BASICS_CODE} />
      </div>
    </section>
  );
}
