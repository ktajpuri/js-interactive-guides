import { useState, useRef, useEffect } from 'react';
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function FpsBadge({ fps }) {
  const color =
    fps >= 55 ? 'bg-green-900/60 text-green-400 border-green-700/40' :
    fps >= 30 ? 'bg-yellow-900/60 text-yellow-400 border-yellow-700/40' :
                'bg-red-900/60 text-red-400 border-red-700/40';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold border ${color}`}>
      {fps} FPS
    </span>
  );
}

function StatusDisplay({ status }) {
  if (status === 'idle') {
    return <span className="text-gray-500 text-sm">Idle</span>;
  }
  if (status === 'running') {
    return <span className="text-yellow-400 text-sm font-medium animate-pulse">Running…</span>;
  }
  // done:count:ms
  const parts = status.split(':');
  const count = parseInt(parts[1], 10);
  const ms = parseFloat(parts[2]);
  const secs = (ms / 1000).toFixed(1);
  const frac = (ms % 1000).toFixed(1);
  return (
    <span className="text-green-400 text-sm font-medium">
      Done in {secs}s.{frac.split('.')[0]}ms — found{' '}
      <span className="font-mono font-bold">{count.toLocaleString()}</span> primes
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MainThreadFreezeDemo() {
  const [n, setN] = useState(5_000_000);
  const [mode, setMode] = useState('worker');
  const [status, setStatus] = useState('idle');
  const [fps, setFps] = useState(60);

  const ballRef = useRef(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const rafRef = useRef(null);
  const fpsRef = useRef({ last: performance.now(), frames: 0 });
  const workerRef = useRef(null);

  // rAF animation loop
  useEffect(() => {
    const animate = (now) => {
      posRef.current += 2 * dirRef.current;
      if (posRef.current >= 200 || posRef.current <= 0) dirRef.current *= -1;
      if (ballRef.current) {
        ballRef.current.style.transform = `translateX(${posRef.current}px)`;
      }
      fpsRef.current.frames++;
      const elapsed = now - fpsRef.current.last;
      if (elapsed >= 500) {
        setFps(Math.round((fpsRef.current.frames / elapsed) * 1000));
        fpsRef.current = { last: now, frames: 0 };
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleRun = () => {
    if (status === 'running') return;
    const t0 = performance.now();
    setStatus('running');

    if (mode === 'main') {
      // Give React one frame to render "Running…" before the freeze
      setTimeout(() => {
        const count = runSieveMainThread(n);
        const ms = performance.now() - t0;
        setStatus(`done:${count}:${ms.toFixed(1)}`);
      }, 16);
    } else {
      const w = createWorker();
      workerRef.current = w;
      w.postMessage({ n });
      w.onmessage = ({ data }) => {
        const ms = performance.now() - t0;
        setStatus(`done:${data.count}:${ms.toFixed(1)}`);
        w.terminate();
        workerRef.current = null;
      };
    }
  };

  const nFormatted = n.toLocaleString();

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-cyan-900/30 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-cyan-800/50">
          Demo 1
        </div>
        <h1 className="text-3xl font-bold text-white">Main Thread Freeze</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Run the same prime-number sieve on the{' '}
          <span className="text-white font-mono text-sm">main thread</span> vs a{' '}
          <span className="text-white font-mono text-sm">Web Worker</span>. Watch the animation
          panel on the left — when the main thread is blocked, the rAF loop stalls and FPS drops
          to&nbsp;0. Workers run on a separate OS thread and leave the main thread free.
        </p>
      </header>

      {/* Two-panel grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: animation panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Animation</span>
            <FpsBadge fps={fps} />
          </div>

          {/* Ball track */}
          <div className="relative bg-gray-950 rounded-xl border border-gray-800 h-20 flex items-center overflow-hidden px-2">
            <div
              ref={ballRef}
              className="w-10 h-10 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/30 flex-shrink-0"
              style={{ transform: 'translateX(0px)', willChange: 'transform' }}
            />
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Driven by <span className="text-gray-300 font-mono">requestAnimationFrame</span> — not a
            CSS animation. When the main thread is busy, this loop stalls completely.
          </p>

          {/* FPS bar visualization */}
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Live FPS</span>
              <span className="font-mono text-white">{fps} / 60</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (fps / 60) * 100)}%`,
                  backgroundColor: fps >= 55 ? '#22c55e' : fps >= 30 ? '#eab308' : '#ef4444',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: controls panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Computation</span>

          {/* N slider */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              N ={' '}
              <span className="font-mono font-bold text-cyan-400">{nFormatted}</span>
            </label>
            <input
              type="range"
              min={1_000_000}
              max={15_000_000}
              step={500_000}
              value={n}
              onChange={(e) => {
                setStatus('idle');
                setN(Number(e.target.value));
              }}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>1M</span>
              <span>15M</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 mb-2">Execution mode</div>
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
            {status === 'running' ? 'Running…' : 'Run Sieve'}
          </button>

          {/* Status */}
          <div className="bg-gray-950 rounded-lg px-4 py-3 border border-gray-800 min-h-[3rem] flex items-center">
            <StatusDisplay status={status} />
          </div>

          {/* Main thread warning */}
          {mode === 'main' && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-400">
              <span className="flex-shrink-0">⚠</span>
              <span>Main thread is blocked — animation freezes!</span>
            </div>
          )}
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-gray-900 rounded-xl p-5 border border-cyan-700/40 space-y-3">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Key Insight</div>
        <p className="text-gray-300 text-sm leading-relaxed">
          CSS animations run on the <span className="text-white font-semibold">compositor thread</span> and
          would <em>not</em> freeze — even with the main thread blocked. But{' '}
          <span className="font-mono text-white text-xs">requestAnimationFrame</span> callbacks run on the{' '}
          <span className="text-white font-semibold">main thread</span>, so they halt whenever JS is busy. Web
          Workers move heavy computation to a dedicated OS thread, keeping{' '}
          <span className="font-mono text-white text-xs">requestAnimationFrame</span>, event handlers, and all
          other JS running without interruption.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">CSS animation</div>
            <div className="text-green-400 text-sm font-semibold">Compositor ✓</div>
            <div className="text-xs text-gray-600 mt-1">Never blocks</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">rAF (main thread)</div>
            <div className="text-red-400 text-sm font-semibold">Main thread ✗</div>
            <div className="text-xs text-gray-600 mt-1">Freezes under load</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">rAF + Worker</div>
            <div className="text-green-400 text-sm font-semibold">Both free ✓</div>
            <div className="text-xs text-gray-600 mt-1">Best of both worlds</div>
          </div>
        </div>
      </div>

      {/* Code block */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Real-world Code
        </h2>
        <CodeBlock code={WORKER_BASICS_CODE} />
      </div>
    </section>
  );
}
