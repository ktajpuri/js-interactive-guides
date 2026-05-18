import { useState } from 'react';
import { useHeapMonitor, formatMB } from '../hooks/useHeapMonitor';
import HeapChart from '../components/HeapChart';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { HEAP_MONITOR_CODE } from '../data/demoCode';

export default function HeapMonitorDemo() {
  const [allocations, setAllocations] = useState([]);
  const [log, setLog] = useState([]);
  const { samples, current, peak, available, reset } = useHeapMonitor();

  const addLog = (action, color = 'text-gray-400') => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    setLog(prev => [{ time, action, color }, ...prev].slice(0, 8));
  };

  const allocate = (mb) => {
    const arr = new Float64Array((mb * 1024 * 1024) / 8);
    for (let i = 0; i < arr.length; i += 1024) arr[i] = Math.random();
    setAllocations(prev => [...prev, arr]);
    addLog(`+${mb}MB allocated`, 'text-green-400');
  };

  const freeAll = () => {
    setAllocations([]);
    addLog('freed all references', 'text-gray-400');
  };

  const gcPressure = () => {
    for (let i = 0; i < 3; i++) {
      const huge = new Float64Array(25_000_000);
      for (let j = 0; j < huge.length; j += 1024) huge[j] = j;
      // huge drops at end of iteration
    }
    addLog('GC pressure applied (~600MB allocated+dropped)', 'text-rose-400');
  };

  const totalMB = (allocations.reduce((s, a) => s + a.byteLength, 0) / 1024 / 1024).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-1 rounded text-xs font-semibold bg-rose-900/40 text-rose-400">Demo 1</span>
          <h2 className="text-lg font-semibold text-white">Heap Monitor</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Watch the JavaScript heap grow and shrink in real time. Allocate memory, free it, and see how V8's garbage collector responds.
        </p>
      </div>

      {/* Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <HeapChart samples={samples} current={current} peak={peak} available={available} reset={reset} />
      </div>

      {/* Controls + Stats */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="space-y-3">
            <button
              onClick={() => allocate(1)}
              className="w-full px-4 py-2 rounded text-sm font-medium border border-rose-700 text-rose-400 hover:bg-rose-900/30 transition-colors"
            >
              Allocate 1 MB
            </button>
            <button
              onClick={() => allocate(10)}
              className="w-full px-4 py-2 rounded text-sm font-medium border border-rose-700 text-rose-400 hover:bg-rose-900/30 transition-colors"
            >
              Allocate 10 MB
            </button>
            <button
              onClick={freeAll}
              className="w-full px-4 py-2 rounded text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors"
            >
              Free Everything
            </button>
            <div>
              <button
                onClick={gcPressure}
                className="w-full px-4 py-2 rounded text-sm font-medium bg-rose-700 text-white hover:bg-rose-600 transition-colors"
              >
                GC Pressure
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Allocates &amp; drops ~600MB to encourage V8 to run GC
              </p>
            </div>

            {/* Allocation log */}
            <div className="mt-4">
              <p className="text-gray-500 text-xs mb-2">Allocation log</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <div key={i} className="text-xs font-mono">
                    <span className="text-gray-600">{entry.time}</span>{' '}
                    <span className={entry.color}>{entry.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">Currently held:</p>
              <p className="text-2xl font-bold text-rose-400">
                {allocations.length} <span className="text-sm font-normal text-gray-400">chunks</span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Total held:</p>
              <p className="text-2xl font-bold text-white">
                {totalMB} <span className="text-sm font-normal text-gray-400">MB</span>
              </p>
            </div>

            <hr className="border-gray-800" />

            {/* GC Primer */}
            <div className="bg-gray-900 rounded p-3 text-xs border border-gray-800">
              <p className="text-rose-400 font-medium mb-2">🗑 GC Primer</p>
              <ul className="space-y-1 text-gray-400 list-disc list-inside">
                <li>You cannot force GC from JS</li>
                <li><code className="text-gray-300">`gc()`</code> requires <code className="text-gray-300">`--expose-gc`</code> Chrome flag</li>
                <li>Allocations create pressure that <em>triggers</em> it</li>
                <li>GC runs in batches, non-deterministically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-4 text-sm text-gray-300">
        Watch the chart for a few seconds after clicking 'GC Pressure': the heap spikes briefly as ~600MB is
        allocated, then drops sharply as V8's mark-and-sweep runs. That sawtooth pattern is GC at work. The
        timing is <strong>non-deterministic</strong> — V8 decides based on allocation pressure, idle time, and heuristics.
      </div>

      {/* Code block */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <CodeBlock code={HEAP_MONITOR_CODE} />
      </div>
    </div>
  );
}
