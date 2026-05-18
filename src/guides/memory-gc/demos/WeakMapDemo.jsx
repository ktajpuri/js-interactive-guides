import { useState, useEffect, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { WEAKMAP_CODE } from '../data/demoCode';

// Module-level structures — intentional: these persist across renders to simulate real GC behavior
const strongMap = new Map();
const weakMap = new WeakMap();
let allKeys = []; // strong refs to all keys; cleared by "Drop key references"
let nextId = 1;

// Track finalization
const mapFinalized = new Set();    // ids GC'd from strong map context (won't happen — Map is strong)
const weakMapFinalized = new Set(); // ids GC'd (WeakMap keys collected)

const weakMapRegistry = new FinalizationRegistry((id) => {
  weakMapFinalized.add(id);
});
// We also register map keys to prove they never finalize while map holds them:
const mapRegistry = new FinalizationRegistry((id) => {
  mapFinalized.add(id);
});

// Track all added entries for the grid visualization
let addedEntries = []; // { id, mapKey, weakKey }

export default function WeakMapDemo() {
  const [entriesAdded, setEntriesAdded] = useState(0);
  const [mapSurviving, setMapSurviving] = useState(0);
  const [weakMapSurviving, setWeakMapSurviving] = useState(0);
  const [keysDropped, setKeysDropped] = useState(false);
  const [entryIds, setEntryIds] = useState([]); // array of ids for grid rendering
  const [gcedWeakIds, setGcedWeakIds] = useState(new Set()); // ids collected from WeakMap
  const [gcedMapIds, setGcedMapIds] = useState(new Set());

  const addEntries = () => {
    const newIds = [];
    for (let i = 0; i < 100; i++) {
      const id = nextId++;
      const mapKey = { id, type: 'map' };
      const weakKey = { id, type: 'weak' };
      const mapValue = new Float64Array(10_000); // ~80KB to make memory impact visible
      const weakValue = new Float64Array(10_000);
      strongMap.set(mapKey, mapValue);
      weakMap.set(weakKey, weakValue);
      allKeys.push({ mapKey, weakKey, id });
      addedEntries.push({ id, mapKey, weakKey });
      mapRegistry.register(mapKey, id);
      weakMapRegistry.register(weakKey, id);
      newIds.push(id);
    }
    setEntriesAdded(addedEntries.length);
    setEntryIds([...addedEntries.map(e => e.id)]);
    setMapSurviving(addedEntries.length - mapFinalized.size);
    setWeakMapSurviving(addedEntries.length - weakMapFinalized.size);
    setKeysDropped(false);
  };

  const dropKeyReferences = () => {
    allKeys = []; // drop strong refs to the keys
    setKeysDropped(true);
    // Note: strongMap still holds mapKeys (that's the whole point — Map keeps them alive)
    // weakMap's weakKeys are now only held weakly — GC can collect them
  };

  const applyGcPressure = () => {
    for (let i = 0; i < 3; i++) {
      const huge = new Float64Array(25_000_000);
      for (let j = 0; j < huge.length; j += 1024) huge[j] = j;
    }
    // Check finalization counts after a delay
    setTimeout(refreshCounts, 300);
    setTimeout(refreshCounts, 800);
    setTimeout(refreshCounts, 2000);
  };

  const refreshCounts = () => {
    setGcedWeakIds(new Set(weakMapFinalized));
    setGcedMapIds(new Set(mapFinalized));
    setMapSurviving(addedEntries.length - mapFinalized.size);
    setWeakMapSurviving(addedEntries.length - weakMapFinalized.size);
  };

  const resetAll = () => {
    strongMap.clear();
    allKeys = [];
    addedEntries = [];
    nextId = 1;
    mapFinalized.clear();
    weakMapFinalized.clear();
    setEntriesAdded(0);
    setMapSurviving(0);
    setWeakMapSurviving(0);
    setKeysDropped(false);
    setEntryIds([]);
    setGcedWeakIds(new Set());
    setGcedMapIds(new Set());
  };

  // Polling effect: update counts every 200ms
  useEffect(() => {
    const id = setInterval(refreshCounts, 200);
    return () => clearInterval(id);
  }, []);

  const someWeakGced = gcedWeakIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-rose-900/40 text-rose-400 text-xs font-bold px-2 py-0.5 rounded">Demo 3</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">WeakMap vs Map</h2>
        <p className="text-gray-400 text-sm">
          Map holds its keys strongly — they can never be GC'd while the Map exists. WeakMap holds keys
          weakly — they're collected as soon as no other references remain.
        </p>
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Map panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-red-400 font-semibold mb-3">🗺 Map (strong refs)</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm text-gray-300">Entries:</span>
            <span className="text-sm font-mono text-white">
              {mapSurviving} / {entriesAdded}
            </span>
          </div>
          <p className="text-xs text-red-400/70 italic mb-4">Keys never GC'd ← Map prevents it</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {entryIds.map(id => (
              <div
                key={id}
                title={`Entry ${id}`}
                className="aspect-square rounded-sm transition-colors duration-500"
                style={{ backgroundColor: gcedMapIds.has(id) ? '#374151' : '#f43f5e' }}
              />
            ))}
          </div>
        </div>

        {/* Right: WeakMap panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-green-400 font-semibold mb-3">🔗 WeakMap (weak refs)</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm text-gray-300">Surviving:</span>
            <span className="text-sm font-mono text-white">
              {weakMapSurviving} / {entriesAdded}
            </span>
          </div>
          {keysDropped && (
            <p className="text-xs text-green-400/70 italic mb-4">Keys dropped → eligible for GC</p>
          )}
          {!keysDropped && <div className="mb-4" />}
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {entryIds.map(id => (
              <div
                key={id}
                title={`Entry ${id} ${gcedWeakIds.has(id) ? "(GC'd)" : '(alive)'}`}
                className="aspect-square rounded-sm transition-colors duration-500"
                style={{ backgroundColor: gcedWeakIds.has(id) ? '#374151' : '#22c55e' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={addEntries}
            disabled={entriesAdded > 0}
            className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Step 1: Add 100 entries
          </button>
          <button
            onClick={dropKeyReferences}
            disabled={entriesAdded === 0 || keysDropped}
            className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Step 2: Drop key references
          </button>
          <button
            onClick={applyGcPressure}
            disabled={!keysDropped}
            className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Step 3: Force GC pressure
          </button>
          <button
            onClick={resetAll}
            className="px-4 py-2 rounded text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>

        {/* Status text */}
        {!entriesAdded && (
          <p className="text-gray-500 text-sm">Add 100 entries to both Map and WeakMap to begin.</p>
        )}
        {entriesAdded > 0 && !keysDropped && (
          <p className="text-yellow-400 text-sm">
            Both Map and WeakMap have 100 entries. Now drop the key references.
          </p>
        )}
        {keysDropped && !someWeakGced && (
          <p className="text-green-400 text-sm">
            Keys dropped. Apply GC pressure to encourage collection.
          </p>
        )}
        {someWeakGced && (
          <p className="text-rose-300 text-sm">
            🎉 WeakMap lost {weakMapFinalized.size} entries to GC. Map still has all {strongMap.size} entries.
          </p>
        )}
      </div>

      {/* Key insight callout */}
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 text-sm text-gray-300">
        After dropping the keys and applying GC pressure: the <strong className="text-white">Map</strong> still
        holds all 100 entries (Map keeps strong refs to its keys), while the{' '}
        <strong className="text-white">WeakMap</strong> has lost most or all of them. Use{' '}
        <code className="text-rose-300 bg-rose-950/40 px-1 rounded">WeakMap</code> for{' '}
        <strong className="text-white">metadata about objects you don't own</strong> — DOM node caches,
        private per-instance state, or memoization keyed by object identity. When the object is GC'd,
        the WeakMap entry vanishes automatically — no manual cleanup needed.
      </div>

      {/* Code block */}
      <CodeBlock code={WEAKMAP_CODE} />
    </div>
  );
}
