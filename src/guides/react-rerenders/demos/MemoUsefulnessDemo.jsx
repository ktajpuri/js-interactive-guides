import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { MEMO_CODE } from '../data/demoCode';

// ---------------------------------------------------------------------------
// Expensive child — burns ~3ms of CPU in its render body
// ---------------------------------------------------------------------------
function ExpensiveChild({ value, onRender }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    setFlashKey(k => k + 1);
    onRender?.(renderCountRef.current);
  }); // runs after every render

  // Simulate expensive render work (~3ms)
  const start = performance.now();
  while (performance.now() - start < 3) { /* burn CPU */ }

  return (
    <div className="relative rounded border border-gray-700 bg-gray-800 p-3">
      <div key={flashKey} className="node-flash absolute inset-0 rounded bg-sky-400/40 pointer-events-none" />
      <div className="text-xs text-gray-400">ExpensiveChild</div>
      <div className="text-xs font-mono text-sky-400">renders: {renderCountRef.current}</div>
      <div className="text-xs text-gray-600">value prop: {value}</div>
    </div>
  );
}
const ExpensiveChildMemo = memo(ExpensiveChild);

// ---------------------------------------------------------------------------
// Cheap child — trivial render (no artificial delay)
// ---------------------------------------------------------------------------
function CheapChild({ value, onRender }) {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    setFlashKey(k => k + 1);
    onRender?.(renderCountRef.current);
  }); // runs after every render

  return (
    <div className="relative rounded border border-gray-700 bg-gray-800 p-3">
      <div key={flashKey} className="node-flash absolute inset-0 rounded bg-sky-400/40 pointer-events-none" />
      <div className="text-xs text-gray-400">CheapChild</div>
      <div className="text-xs font-mono text-sky-400">renders: {renderCountRef.current}</div>
      <div className="text-xs text-gray-600">value prop: {value}</div>
    </div>
  );
}
const CheapChildMemo = memo(CheapChild);

// ---------------------------------------------------------------------------
// Main demo component
// ---------------------------------------------------------------------------
export default function MemoUsefulnessDemo() {
  const [tick, setTick] = useState(0);
  const [memoA, setMemoA] = useState(false);
  const [memoB, setMemoB] = useState(false);
  const [running, setRunning] = useState(false);
  const [expensiveRenders, setExpensiveRenders] = useState(0);
  const [cheapRenders, setCheapRenders] = useState(0);

  const intervalRef = useRef(null);
  const parentRenderRef = useRef(0);
  parentRenderRef.current += 1;

  // Auto-tick interval
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTick(t => t + 1);
      }, 800);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const showVerdict = parentRenderRef.current > 5;
  const showComparison = expensiveRenders > 3 && cheapRenders > 3;

  return (
    <div className="space-y-6">
      {/* Flash keyframe */}
      <style>{`
        @keyframes nodeFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .node-flash { animation: nodeFlash 400ms ease-out forwards; }
      `}</style>

      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-sky-900/40 text-sky-400 text-xs font-bold px-2 py-0.5 rounded">Demo 2</span>
          <h2 className="text-lg font-bold text-white">When useMemo Helps</h2>
        </div>
        <p className="text-sm text-gray-400">
          React.memo adds a shallow prop-comparison cost to every render. For cheap components this
          overhead matches the render cost. For genuinely expensive components, memo wins decisively.
        </p>
      </div>

      {/* Controls card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setRunning(r => !r)}
            className={
              running
                ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors'
                : 'px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors'
            }
          >
            {running ? 'Stop' : 'Start auto-tick (every 800ms)'}
          </button>
          <span className="text-sm text-gray-400">
            Parent renders: <span className="font-mono text-sky-400">{parentRenderRef.current}</span>
          </span>
        </div>
        <p className="text-xs text-gray-500">
          The parent re-renders every 800ms, passing the same constant prop (<code className="text-sky-400">value={'{42}'}</code>) to both
          children. Only memo status determines whether children re-render.
        </p>
      </div>

      {/* Two-column scenario panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Scenario A — Expensive child */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-amber-400 mb-1">🐢 Expensive child (~3ms render)</h3>
            <p className="text-xs text-gray-500">Burns ~3ms of CPU in the render body.</p>
          </div>

          <button
            onClick={() => setMemoA(m => !m)}
            className={
              memoA
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500 text-sky-400 bg-sky-950/40 hover:bg-sky-950/60 transition-colors'
                : 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-600 text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors'
            }
          >
            React.memo: {memoA ? 'ON ✓' : 'OFF'}
          </button>

          {memoA
            ? <ExpensiveChildMemo value={42} onRender={setExpensiveRenders} />
            : <ExpensiveChild value={42} onRender={setExpensiveRenders} />
          }

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400">Child renders:</span>
              <span className="text-xl font-bold font-mono text-sky-400">{expensiveRenders}</span>
            </div>
            <div className="text-xs text-gray-500">
              Total child CPU: ~<span className="text-amber-400 font-mono">{(expensiveRenders * 3).toFixed(0)} ms</span>
            </div>
          </div>

          {showVerdict && (
            <div>
              {!memoA
                ? <span className="text-red-400 text-xs">⚠ Unnecessary work every tick</span>
                : <span className="text-green-400 text-xs">
                    ✓ Child skipped {Math.max(0, parentRenderRef.current - expensiveRenders)} re-renders
                  </span>
              }
            </div>
          )}
        </div>

        {/* Scenario B — Cheap child */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-green-400 mb-1">⚡ Cheap child (&lt;0.1ms render)</h3>
            <p className="text-xs text-gray-500">Trivial render — no artificial delay.</p>
          </div>

          <button
            onClick={() => setMemoB(m => !m)}
            className={
              memoB
                ? 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500 text-sky-400 bg-sky-950/40 hover:bg-sky-950/60 transition-colors'
                : 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-600 text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors'
            }
          >
            React.memo: {memoB ? 'ON ✓' : 'OFF'}
          </button>

          {memoB
            ? <CheapChildMemo value={42} onRender={setCheapRenders} />
            : <CheapChild value={42} onRender={setCheapRenders} />
          }

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400">Child renders:</span>
              <span className="text-xl font-bold font-mono text-sky-400">{cheapRenders}</span>
            </div>
            <div className="text-xs text-gray-500">
              Memo overhead: ~<span className="text-green-400 font-mono">{(parentRenderRef.current * 0.01).toFixed(1)} ms</span>
            </div>
          </div>

          {showVerdict && (
            <div>
              <span className="text-gray-400 text-xs">memo ON vs OFF → ~same performance</span>
            </div>
          )}
        </div>
      </div>

      {/* Comparison table */}
      {showComparison && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-bold text-white mb-4">Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-gray-500 font-semibold"></th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-semibold">memo OFF</th>
                  <th className="text-left py-2 pr-4 text-gray-400 font-semibold">memo ON</th>
                  <th className="text-left py-2 text-gray-400 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="py-2 pr-4 text-amber-400 font-semibold">Expensive child</td>
                  <td className="py-2 pr-4 text-red-400 font-mono">~{(parentRenderRef.current * 3).toFixed(0)}ms wasted</td>
                  <td className="py-2 pr-4 text-green-400 font-mono">~0ms wasted</td>
                  <td className="py-2 text-green-400">Memo helps ✓</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-green-400 font-semibold">Cheap child</td>
                  <td className="py-2 pr-4 text-gray-400 font-mono">~0.1ms</td>
                  <td className="py-2 pr-4 text-gray-400 font-mono">~0.1ms</td>
                  <td className="py-2 text-gray-400">Memo neutral</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key insight callout */}
      <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-4 text-sm text-gray-300">
        <p>
          <code className="text-sky-400">React.memo</code> isn't free — it costs a shallow prop comparison every render.
          For children that render in &lt; 1ms, the memo overhead equals the render savings:{' '}
          <strong className="text-white">net zero</strong>. Memo expensive components (&gt;5ms renders), not all
          components. The React DevTools Profiler flame chart tells you exactly which components are slow.
        </p>
      </div>

      <CodeBlock code={MEMO_CODE} />
    </div>
  );
}
