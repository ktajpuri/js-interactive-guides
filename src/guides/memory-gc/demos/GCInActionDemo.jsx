import { useState, useEffect } from 'react';
import { useHeapMonitor, formatMB } from '../hooks/useHeapMonitor';
import HeapChart from '../components/HeapChart';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { GC_IN_ACTION_CODE } from '../data/demoCode';

// ---------------------------------------------------------------------------
// Module-level GC tracking (intentionally outside the component so references
// survive re-renders and the FinalizationRegistry outlives any single render)
// ---------------------------------------------------------------------------
let aliveIds = new Set();
let strongRefs = [];
let nextId = 1;
let gcEventCount = 0;
let lastGcBatch = { count: 0, time: null };
let batchAccumulator = 0;
let batchTimerHandle = null;

const registry = new FinalizationRegistry((id) => {
  aliveIds.delete(id);
  gcEventCount++;
  batchAccumulator++;
  clearTimeout(batchTimerHandle);
  batchTimerHandle = setTimeout(() => {
    lastGcBatch = { count: batchAccumulator, time: Date.now() };
    batchAccumulator = 0;
  }, 200);
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GCInActionDemo() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'created' | 'dropped' | 'collecting'
  const [displayAliveIds, setDisplayAliveIds] = useState(new Set());
  const [displayGcEventCount, setDisplayGcEventCount] = useState(0);
  const [displayLastBatch, setDisplayLastBatch] = useState({ count: 0, time: null });
  const [totalCreated, setTotalCreated] = useState(0);
  const [allIds, setAllIds] = useState([]);
  const { samples, current, peak, available, reset } = useHeapMonitor();

  // Poll module-level state every 100ms so React reflects GC callbacks
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayAliveIds(new Set(aliveIds));
      setDisplayGcEventCount(gcEventCount);
      setDisplayLastBatch({ ...lastGcBatch });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const createObjects = () => {
    const ids = [];
    for (let i = 0; i < 100; i++) {
      const id = nextId++;
      const obj = { id, payload: new Float64Array(10_000) }; // ~80 KB each
      aliveIds.add(id);
      strongRefs.push(obj);
      registry.register(obj, id);
      ids.push(id);
    }
    setAllIds(prev => [...prev, ...ids]);
    setTotalCreated(prev => prev + 100);
    setDisplayAliveIds(new Set(aliveIds));
    setPhase('created');
  };

  const dropReferences = () => {
    strongRefs = [];
    setPhase('dropped');
  };

  const forceGcPressure = () => {
    setPhase('collecting');
    for (let i = 0; i < 5; i++) {
      const huge = new Float64Array(25_000_000);
      for (let j = 0; j < huge.length; j += 1024) huge[j] = j;
    }
  };

  const resetAll = () => {
    aliveIds = new Set();
    strongRefs = [];
    nextId = 1;
    gcEventCount = 0;
    lastGcBatch = { count: 0, time: null };
    batchAccumulator = 0;
    clearTimeout(batchTimerHandle);
    setPhase('idle');
    setDisplayAliveIds(new Set());
    setDisplayGcEventCount(0);
    setDisplayLastBatch({ count: 0, time: null });
    setTotalCreated(0);
    setAllIds([]);
    reset();
  };

  // -------------------------------------------------------------------------
  // Derived UI values
  // -------------------------------------------------------------------------
  const step1Disabled = phase === 'dropped';
  const step2Disabled = phase !== 'created';
  const step3Disabled = phase !== 'dropped' && phase !== 'collecting';

  const phaseMessage = {
    idle: 'Click Step 1 to allocate 100 objects (~8MB). Each is registered with FinalizationRegistry.',
    created: 'Objects created and held in strongRefs. Step 2 will clear the array — making objects eligible for GC.',
    dropped: 'References dropped! Objects are now eligible for collection. Apply memory pressure to encourage V8 to run GC.',
    collecting: 'GC pressure applied. Watch the grid — cells will go dark as FinalizationRegistry callbacks fire.',
  };

  const phaseClass = {
    idle: 'text-gray-500 text-sm',
    created: 'text-yellow-400 text-sm',
    dropped: 'text-green-400 text-sm',
    collecting: 'text-rose-300 text-sm',
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-rose-900/40 text-rose-400 text-xs font-bold px-2 py-0.5 rounded">Demo 4</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          GC in Action (WeakRef &amp; FinalizationRegistry)
        </h2>
        <p className="text-gray-400 text-sm">
          Create 100 tracked objects, drop all references, then apply memory pressure — and watch{' '}
          <code className="text-rose-300">FinalizationRegistry</code> callbacks fire as V8 collects
          them in batches.
        </p>
      </div>

      {/* Heap chart card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Live Heap</p>
        <HeapChart samples={samples} current={current} peak={peak} available={available} />
      </div>

      {/* Object grid card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Tracked Objects</h3>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {displayAliveIds.size} alive
          </span>
        </div>

        {allIds.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">
            No objects created yet — click Step 1 to begin.
          </p>
        ) : (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {allIds.map(id => {
              const alive = displayAliveIds.has(id);
              return (
                <div
                  key={id}
                  title={`Object ${id} — ${alive ? 'alive' : "GC'd"}`}
                  className="aspect-square rounded transition-all duration-700"
                  style={{
                    backgroundColor: alive ? '#f43f5e' : '#111827',
                    border: alive ? 'none' : '1px dashed #374151',
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Alive: <span className="text-rose-400 font-medium">{displayAliveIds.size}</span> /{' '}
            {totalCreated}
          </span>
          <span>
            GC events detected:{' '}
            <span className="text-rose-400 font-medium">{displayGcEventCount}</span>
          </span>
        </div>

        {displayLastBatch.time && (
          <p className="mt-2 text-rose-300 text-xs">
            Last batch: <strong>{displayLastBatch.count}</strong> objects collected at{' '}
            {new Date(displayLastBatch.time).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Controls card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {/* Step 1 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Step 1</span>
            <button
              onClick={createObjects}
              disabled={step1Disabled}
              className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create 100 tracked objects
            </button>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Step 2</span>
            <button
              onClick={dropReferences}
              disabled={step2Disabled}
              className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Drop all references
            </button>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Step 3 (repeat multiple times)</span>
            <button
              onClick={forceGcPressure}
              disabled={step3Disabled}
              className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Force GC pressure
            </button>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Step 4</span>
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <p className={phaseClass[phase]}>{phaseMessage[phase]}</p>
      </div>

      {/* Key insight callout */}
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 text-sm text-gray-300">
        <p className="mb-2">
          <code className="text-rose-300">FinalizationRegistry</code> is the JS API for hooking into
          GC. Key observations from this demo:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-3">
          <li>
            GC runs in <strong>batches</strong>, not per-object
          </li>
          <li>
            It only runs when V8 decides — typically under <strong>memory pressure</strong>
          </li>
          <li>
            Some objects may <strong>survive several pressure rounds</strong> before being collected
          </li>
          <li>
            <strong>Order of collection</strong> within a batch is not specified
          </li>
        </ul>
        <p className="text-yellow-400/90">
          ⚠ <strong>Don't use FinalizationRegistry for cleanup logic</strong> — it's
          non-deterministic and may never fire. Use it only for monitoring and debugging.
        </p>
      </div>

      {/* Code block */}
      <CodeBlock code={GC_IN_ACTION_CODE} />
    </div>
  );
}
