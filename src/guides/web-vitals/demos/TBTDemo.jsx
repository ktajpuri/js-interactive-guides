import { useState, useRef } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { TBT_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 200, poor: 600 };

const PRESETS = [
  { label: 'Short (20ms)',     duration: 20,  color: 'bg-green-600' },
  { label: 'Borderline (55ms)', duration: 55, color: 'bg-yellow-600' },
  { label: 'Long (150ms)',     duration: 150, color: 'bg-orange-600' },
  { label: 'Very long (400ms)', duration: 400, color: 'bg-red-600' },
];

function blockMainThread(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

export default function TBTDemo() {
  const [queue, setQueue] = useState([]);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [tbt, setTbt] = useState(0);

  const addTask = (preset) => {
    setQueue(prev => [...prev, { ...preset, id: Date.now() + Math.random() }]);
  };

  const runAll = () => {
    if (queue.length === 0 || running) return;
    setRunning(true);
    setResults([]);
    setTbt(0);

    const tasks = [...queue];
    let totalTbt = 0;
    let i = 0;

    const runNext = () => {
      if (i >= tasks.length) { setRunning(false); return; }
      const task = tasks[i];
      setTimeout(() => {
        blockMainThread(task.duration);
        const blocking = Math.max(0, task.duration - 50);
        totalTbt += blocking;
        setTbt(totalTbt);
        setResults(prev => [...prev, { ...task, blocking, tbtSoFar: totalTbt }]);
        i++;
        runNext();
      }, 16);
    };

    runNext();
  };

  const reset = () => { setQueue([]); setResults([]); setTbt(0); setRunning(false); };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 5</div>
        <h1 className="text-3xl font-bold text-white">TBT — Total Blocking Time</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          TBT is the sum of <strong className="text-white">blocking time</strong> from all long tasks (tasks &gt;50ms) between FCP and TTI.
          The blocking portion of a task is everything beyond 50ms.
          A 200ms task contributes 150ms to TBT. Queue tasks below and run them to see TBT accumulate.
        </p>
        <div className="mt-3 px-4 py-2.5 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-sm text-yellow-300">
          ⚠️ Running tasks intentionally blocks the page — that's the point. Each task will freeze the UI briefly.
        </div>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Build Task Queue</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => addTask(p)} disabled={running}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 ${p.color} hover:opacity-90`}>
              + {p.label}
            </button>
          ))}
        </div>

        {/* Queue preview */}
        <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-gray-800 rounded-lg">
          {queue.length === 0 && <span className="text-gray-600 text-sm">Queue is empty — add tasks above</span>}
          {queue.map((t, i) => (
            <span key={t.id} className={`text-xs text-white px-2 py-1 rounded font-mono ${t.color}`}>{t.duration}ms</span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={runAll} disabled={queue.length === 0 || running}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
            {running ? 'Running…' : 'Run All Tasks'}
          </button>
          <button onClick={reset} disabled={running}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm rounded-lg transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Task timeline */}
      {results.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Task Timeline</h2>
          <p className="text-xs text-gray-500">Gray = acceptable (&lt;50ms), red = blocking portion (&gt;50ms)</p>
          <div className="space-y-2">
            {results.map((r, i) => {
              const acceptablePct = Math.min(50, r.duration) / r.duration * 100;
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-6 text-right flex-shrink-0">#{i+1}</div>
                  <div className="flex-1 h-7 rounded overflow-hidden bg-gray-800 flex">
                    <div className="bg-gray-600 h-full" style={{ width: `${acceptablePct}%` }} />
                    {r.blocking > 0 && <div className="bg-red-600 h-full flex-1" />}
                  </div>
                  <div className="text-xs font-mono text-gray-400 w-24 flex-shrink-0">
                    {r.duration}ms {r.blocking > 0 && <span className="text-red-400">(+{r.blocking}ms)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formula */}
          <div className="mt-4 p-3 bg-gray-800 rounded-lg font-mono text-xs text-gray-400">
            TBT = {results.map((r, i) => (
              <span key={r.id}>
                max(0, {r.duration}−50){i < results.length - 1 ? ' + ' : ''}
              </span>
            ))} = <span className="text-green-400 font-bold">{tbt}ms</span>
          </div>
        </div>
      )}

      <MetricGauge value={results.length > 0 ? tbt : null} unit="ms" thresholds={THRESHOLDS} label="Total Blocking Time" max={1000} />

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={TBT_CODE} />
      </div>
    </section>
  );
}
