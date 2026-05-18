import { useState, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { TRANSFERABLE_CODE } from '../data/demoCode';

// ── Worker that echoes data back so we can measure round-trip ─────────────────

const ECHO_WORKER_SRC = `
  self.onmessage = ({ data }) => {
    // Echo the buffer back (with transfer if it's transferable)
    const buf = data.buf;
    if (buf && buf.byteLength > 0) {
      self.postMessage({ buf }, [buf]);
    } else {
      self.postMessage({ buf });
    }
  };
`;

function createEchoWorker() {
  const blob = new Blob([ECHO_WORKER_SRC], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mbLabel(elements) {
  return ((elements * 4) / (1024 * 1024)).toFixed(1);
}

function formatMs(ms) {
  if (ms === null) return '—';
  if (ms < 0.1) return '<0.1ms';
  return `${ms.toFixed(2)}ms`;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function ComparisonBars({ copyMs, transferMs }) {
  const max = Math.max(copyMs ?? 0, transferMs ?? 0, 0.1);
  const copyPct = copyMs !== null ? Math.max(2, (copyMs / max) * 100) : 0;
  const transferPct = transferMs !== null ? Math.max(2, (transferMs / max) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-widest">Timing comparison</div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-20 flex-shrink-0">Copy</span>
          <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${copyPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-orange-400 w-20 text-right">{formatMs(copyMs)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-20 flex-shrink-0">Transfer</span>
          <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${transferPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400 w-20 text-right">{formatMs(transferMs)}</span>
        </div>
      </div>

      {copyMs !== null && transferMs !== null && copyMs > 0.1 && (
        <div className="text-xs text-gray-400 pt-1">
          Transfer is{' '}
          <span className="text-cyan-400 font-bold">
            {(copyMs / Math.max(transferMs, 0.01)).toFixed(1)}×
          </span>{' '}
          faster
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TransferableDemo() {
  const [elements, setElements] = useState(1_000_000);
  const [copyMs, setCopyMs] = useState(null);
  const [transferMs, setTransferMs] = useState(null);
  const [transferredByteLength, setTransferredByteLength] = useState(null);
  const [running, setRunning] = useState(null); // 'copy' | 'transfer' | null

  const workerRef = useRef(null);

  const mb = mbLabel(elements);

  const handleCopy = () => {
    if (running) return;
    setRunning('copy');
    setCopyMs(null);

    const bigArray = new Float32Array(elements);
    // Fill with some data so the runtime doesn't optimize it away
    for (let i = 0; i < Math.min(100, elements); i++) bigArray[i] = i * 0.5;

    const w = createEchoWorker();
    workerRef.current = w;

    const t0 = performance.now();
    // Structured clone — copies the buffer
    w.postMessage({ buf: bigArray.buffer });
    w.onmessage = () => {
      const ms = performance.now() - t0;
      setCopyMs(ms);
      setRunning(null);
      w.terminate();
      workerRef.current = null;
    };
  };

  const handleTransfer = () => {
    if (running) return;
    setRunning('transfer');
    setTransferMs(null);
    setTransferredByteLength(null);

    const bigArray = new Float32Array(elements);
    for (let i = 0; i < Math.min(100, elements); i++) bigArray[i] = i * 0.5;

    const buffer = bigArray.buffer;

    const w = createEchoWorker();
    workerRef.current = w;

    const t0 = performance.now();
    // Transfer — zero-copy, ownership moves to worker
    w.postMessage({ buf: buffer }, [buffer]);
    // After transfer, buffer.byteLength === 0
    setTransferredByteLength(buffer.byteLength);

    w.onmessage = () => {
      const ms = performance.now() - t0;
      setTransferMs(ms);
      setRunning(null);
      w.terminate();
      workerRef.current = null;
    };
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-cyan-900/30 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-cyan-800/50">
          Demo 2
        </div>
        <h1 className="text-3xl font-bold text-white">Transferable Objects</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          By default, <span className="text-white font-mono text-sm">postMessage</span> uses{' '}
          <em>structured clone</em> — copying the entire buffer. Transferable objects move{' '}
          <em>ownership</em> to the worker in <span className="text-white font-semibold">O(1) time</span>,
          regardless of size. The original buffer becomes detached and unusable on the sender side.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</div>

        {/* Size slider */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">
            Float32Array:{' '}
            <span className="font-mono font-bold text-cyan-400">{elements.toLocaleString()}</span>{' '}
            elements{' '}
            <span className="text-gray-500">(~{mb} MB)</span>
          </label>
          <input
            type="range"
            min={100_000}
            max={5_000_000}
            step={100_000}
            value={elements}
            onChange={(e) => {
              setElements(Number(e.target.value));
              setCopyMs(null);
              setTransferMs(null);
              setTransferredByteLength(null);
            }}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>100K (~0.4 MB)</span>
            <span>5M (~20 MB)</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            disabled={!!running}
            className="py-3 bg-orange-700 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/30"
          >
            {running === 'copy' ? 'Sending…' : 'Send (copy)'}
          </button>
          <button
            onClick={handleTransfer}
            disabled={!!running}
            className="py-3 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          >
            {running === 'transfer' ? 'Sending…' : 'Send (transfer)'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Results</div>

        {/* Individual timing cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 space-y-1">
            <div className="text-xs text-gray-500">Structured clone (copy)</div>
            <div className="text-2xl font-mono font-bold text-orange-400">{formatMs(copyMs)}</div>
            <div className="text-xs text-gray-600">O(n) — proportional to size</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 space-y-1">
            <div className="text-xs text-gray-500">Transferable (transfer)</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">{formatMs(transferMs)}</div>
            <div className="text-xs text-gray-600">O(1) — constant regardless of size</div>
          </div>
        </div>

        {/* Bar chart */}
        {(copyMs !== null || transferMs !== null) && (
          <ComparisonBars copyMs={copyMs} transferMs={transferMs} />
        )}

        {/* Ownership transfer evidence */}
        {transferredByteLength !== null && (
          <div className="bg-gray-950 rounded-lg p-4 border border-cyan-700/40 space-y-1">
            <div className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-2">
              Ownership transferred
            </div>
            <div className="font-mono text-sm text-gray-300">
              bigArray.buffer.byteLength ==={' '}
              <span className="text-red-400 font-bold">{transferredByteLength}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The buffer is now detached — the main thread can no longer access it. This is how
              the runtime achieves zero-copy: it simply reassigns the memory's ownership pointer.
            </p>
          </div>
        )}

        {(copyMs === null && transferMs === null) && (
          <p className="text-gray-600 text-sm text-center py-4">
            Run both tests to see a comparison.
          </p>
        )}
      </div>

      {/* Key insight callout */}
      <div className="bg-gray-900 rounded-xl p-5 border border-cyan-700/40 space-y-3">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Key Insight</div>
        <p className="text-gray-300 text-sm leading-relaxed">
          For audio processing, image manipulation, or ML inference results — transferable objects
          are essential. A 10 MB copy takes ~5 ms; a 10 MB transfer takes ~0 ms. This matters most
          at 60 fps where your entire frame budget is 16.67 ms.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">AudioBuffer</div>
            <div className="text-cyan-400 text-sm font-semibold">Transferable ✓</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">ArrayBuffer</div>
            <div className="text-cyan-400 text-sm font-semibold">Transferable ✓</div>
          </div>
          <div className="bg-gray-950 rounded-lg p-3 border border-gray-800 text-center">
            <div className="text-xs text-gray-500 mb-1">ImageBitmap</div>
            <div className="text-cyan-400 text-sm font-semibold">Transferable ✓</div>
          </div>
        </div>
      </div>

      {/* Code block */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Real-world Code
        </h2>
        <CodeBlock code={TRANSFERABLE_CODE} />
      </div>
    </section>
  );
}
