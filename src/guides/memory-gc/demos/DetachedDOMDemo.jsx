import { useState, useEffect, useRef, useCallback } from 'react';
import { useHeapMonitor, formatMB } from '../hooks/useHeapMonitor';
import HeapChart from '../components/HeapChart';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { DETACHED_DOM_CODE } from '../data/demoCode';

// Module-level — survives component unmount (this IS the bug)
const leakedNodes = [];
let leakyMountCount = 0;
let cleanMountCount = 0;
const survivingWeakRefs = []; // WeakRef<object> tracking all instances ever created

export default function DetachedDOMDemo() {
  const [leakyMounted, setLeakyMounted] = useState(false);
  const [cleanMounted, setCleanMounted] = useState(false);
  const [leakyCycles, setLeakyCycles] = useState(0);
  const [cleanCycles, setCleanCycles] = useState(0);
  const [survivingCount, setSurvivingCount] = useState(0);
  const [leakedNodesCount, setLeakedNodesCount] = useState(0);
  const [isRepeating, setIsRepeating] = useState({ leaky: false, clean: false });

  const leakyContainerRef = useRef(null);
  const cleanContainerRef = useRef(null);
  const cleanNodesRef = useRef(null);
  const leakyMountedRef = useRef(false);
  const cleanMountedRef = useRef(false);

  const { samples, current, peak, available, reset } = useHeapMonitor();

  // Poll leakedNodes.length every 500ms since it lives outside React state
  useEffect(() => {
    const id = setInterval(() => setLeakedNodesCount(leakedNodes.length), 500);
    return () => clearInterval(id);
  }, []);

  const updateSurviving = useCallback(() => {
    const count = survivingWeakRefs.filter(r => r.deref() !== undefined).length;
    setSurvivingCount(count);
  }, []);

  const mountLeaky = useCallback(() => {
    if (!leakyContainerRef.current || leakyMountedRef.current) return;
    leakyMountedRef.current = true;
    leakyMountCount++;
    const instance = { id: leakyMountCount, mode: 'leaky' };
    survivingWeakRefs.push(new WeakRef(instance));
    for (let i = 0; i < 5000; i++) {
      const div = document.createElement('div');
      div.textContent = `Item ${i}`;
      div.dataset.leak = 'true';
      leakyContainerRef.current.appendChild(div);
      leakedNodes.push(div); // THE LEAK
    }
    setLeakyMounted(true);
    setLeakyCycles(c => c + 1);
    updateSurviving();
  }, [updateSurviving]);

  const unmountLeaky = useCallback(() => {
    if (!leakyContainerRef.current || !leakyMountedRef.current) return;
    leakyMountedRef.current = false;
    leakyContainerRef.current.innerHTML = '';
    // leakedNodes still holds all the refs! nodes are detached but not GC-able
    setLeakyMounted(false);
    updateSurviving();
  }, [updateSurviving]);

  const mountClean = useCallback(() => {
    if (!cleanContainerRef.current || cleanMountedRef.current) return;
    cleanMountedRef.current = true;
    cleanMountCount++;
    const instance = { id: cleanMountCount, mode: 'clean' };
    survivingWeakRefs.push(new WeakRef(instance));
    const nodes = [];
    for (let i = 0; i < 5000; i++) {
      const div = document.createElement('div');
      div.textContent = `Item ${i}`;
      cleanContainerRef.current.appendChild(div);
      nodes.push(div);
    }
    cleanNodesRef.current = nodes;
    setCleanMounted(true);
    setCleanCycles(c => c + 1);
    updateSurviving();
  }, [updateSurviving]);

  const unmountClean = useCallback(() => {
    if (!cleanContainerRef.current || !cleanMountedRef.current) return;
    cleanMountedRef.current = false;
    cleanContainerRef.current.innerHTML = '';
    if (cleanNodesRef.current) {
      cleanNodesRef.current.length = 0; // explicit clear
      cleanNodesRef.current = null;
    }
    setCleanMounted(false);
    updateSurviving();
  }, [updateSurviving]);

  const repeatLeaky = async () => {
    setIsRepeating(r => ({ ...r, leaky: true }));
    for (let i = 0; i < 10; i++) {
      mountLeaky();
      await new Promise(res => setTimeout(res, 80));
      unmountLeaky();
      await new Promise(res => setTimeout(res, 80));
    }
    setIsRepeating(r => ({ ...r, leaky: false }));
  };

  const repeatClean = async () => {
    setIsRepeating(r => ({ ...r, clean: true }));
    for (let i = 0; i < 10; i++) {
      mountClean();
      await new Promise(res => setTimeout(res, 80));
      unmountClean();
      await new Promise(res => setTimeout(res, 80));
    }
    setIsRepeating(r => ({ ...r, clean: false }));
  };

  const gcPressure = () => {
    for (let i = 0; i < 3; i++) {
      const huge = new Float64Array(25_000_000);
      for (let j = 0; j < huge.length; j += 1024) huge[j] = j;
    }
    setTimeout(updateSurviving, 500);
  };

  const resetAll = () => {
    leakedNodes.length = 0;
    survivingWeakRefs.length = 0;
    if (leakyContainerRef.current) leakyContainerRef.current.innerHTML = '';
    if (cleanContainerRef.current) cleanContainerRef.current.innerHTML = '';
    cleanNodesRef.current = null;
    leakyMountedRef.current = false;
    cleanMountedRef.current = false;
    setLeakyMounted(false);
    setCleanMounted(false);
    setLeakyCycles(0);
    setCleanCycles(0);
    setSurvivingCount(0);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-1 rounded text-xs font-semibold bg-rose-900/40 text-rose-400">Demo 2</span>
          <h2 className="text-lg font-semibold text-white">Detached DOM Leak</h2>
        </div>
        <p className="text-gray-400 text-sm">
          The most common React-era memory leak: DOM node references held in module-level state after the
          component that created them has unmounted. The nodes are removed from the document but cannot be
          garbage-collected while a strong reference still exists.
        </p>
      </div>

      {/* Heap Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <HeapChart samples={samples} current={current} peak={peak} available={available} reset={reset} />
      </div>

      {/* Two-column panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leaky Panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🔴</span>
            <span className="font-semibold text-red-400">Leaky Mode</span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="text-gray-400">
              Mount cycles: <span className="font-mono text-white">{leakyCycles}</span>
            </div>
            <div className="text-gray-400">
              Leaked node refs:{' '}
              <span className="font-mono text-red-400">{leakedNodesCount.toLocaleString()}</span>
            </div>
            <div className="text-gray-500 text-xs">
              DOM preview: [{leakyMounted ? 'mounted' : 'unmounted'}]
            </div>
          </div>

          {/* Hidden DOM container — just holds the nodes */}
          <div ref={leakyContainerRef} className="hidden" />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={mountLeaky}
              disabled={leakyMounted || isRepeating.leaky}
              className="px-3 py-1.5 rounded text-sm font-medium border border-red-700 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mount
            </button>
            <button
              onClick={unmountLeaky}
              disabled={!leakyMounted || isRepeating.leaky}
              className="px-3 py-1.5 rounded text-sm font-medium border border-red-700 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Unmount
            </button>
            <button
              onClick={repeatLeaky}
              disabled={isRepeating.leaky}
              className="px-3 py-1.5 rounded text-sm font-medium border border-red-700 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRepeating.leaky ? 'Running…' : 'Repeat 10×'}
            </button>
          </div>
        </div>

        {/* Clean Panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🟢</span>
            <span className="font-semibold text-green-400">Clean Mode</span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="text-gray-400">
              Mount cycles: <span className="font-mono text-white">{cleanCycles}</span>
            </div>
            <div className="text-gray-400">
              Surviving WeakRefs:{' '}
              <span className="font-mono text-green-400">{survivingCount}</span>
            </div>
            <div className="text-gray-500 text-xs">
              DOM preview: [{cleanMounted ? 'mounted' : 'unmounted'}]
            </div>
          </div>

          {/* Hidden DOM container — just holds the nodes */}
          <div ref={cleanContainerRef} className="hidden" />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={mountClean}
              disabled={cleanMounted || isRepeating.clean}
              className="px-3 py-1.5 rounded text-sm font-medium border border-green-700 text-green-400 hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mount
            </button>
            <button
              onClick={unmountClean}
              disabled={!cleanMounted || isRepeating.clean}
              className="px-3 py-1.5 rounded text-sm font-medium border border-green-700 text-green-400 hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Unmount
            </button>
            <button
              onClick={repeatClean}
              disabled={isRepeating.clean}
              className="px-3 py-1.5 rounded text-sm font-medium border border-green-700 text-green-400 hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRepeating.clean ? 'Running…' : 'Repeat 10×'}
            </button>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={gcPressure}
            className="px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors"
          >
            Force GC Pressure
          </button>
          <button
            onClick={resetAll}
            className="px-4 py-2 rounded text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            Reset Everything
          </button>
          <div className="ml-auto text-sm text-gray-400">
            Leaked nodes held:{' '}
            <span className="font-mono font-bold text-rose-400 text-lg">
              {leakedNodesCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 text-sm text-gray-300">
        After 10 mount/unmount cycles in <strong>Leaky</strong> mode, the DOM panel is empty but the heap
        stays elevated — because the module-level <code className="text-gray-300">leakedNodes</code> array
        holds references to 50,000 detached DOM nodes. The GC{' '}
        <strong>cannot collect them</strong> as long as that reference exists. In{' '}
        <strong>Clean</strong> mode, references are dropped on cleanup, and GC reclaims the memory. This is
        the most common React-era memory leak: capturing DOM nodes or large objects in module globals, event
        handlers, or closures that outlive their components.
      </div>

      {/* Code block */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <CodeBlock code={DETACHED_DOM_CODE} />
      </div>
    </div>
  );
}
