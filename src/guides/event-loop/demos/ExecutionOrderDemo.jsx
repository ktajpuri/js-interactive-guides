import { useState, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { EXECUTION_ORDER_CODE } from '../data/demoCode';

const SCENARIOS = [
  {
    id: 'promise-settimeout',
    label: 'Promise + setTimeout',
    code: `console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');`,
    steps: [
      { output: 'A', type: 'sync',      reason: 'Synchronous — runs immediately on the call stack' },
      { output: 'D', type: 'sync',      reason: 'Synchronous — call stack continues before any async work' },
      { output: 'C', type: 'microtask', reason: 'Promise.then microtask — runs after call stack empties' },
      { output: 'B', type: 'macrotask', reason: 'setTimeout callback — runs after all microtasks complete' },
    ],
    explanation: 'Even though setTimeout(fn, 0) was registered before the Promise, the Promise.then callback runs first. Microtasks always drain before the next macrotask. The call stack (A, D) runs first, then the microtask queue (C), then the macrotask queue (B).',
  },
  {
    id: 'nested-promises',
    label: 'Nested Promises',
    code: `Promise.resolve()
  .then(() => {
    console.log('1');
    return Promise.resolve();
  })
  .then(() => console.log('2'));

Promise.resolve().then(() => console.log('3'));`,
    steps: [
      { output: '1', type: 'microtask', reason: 'First .then on the first chain — scheduled as a microtask' },
      { output: '3', type: 'microtask', reason: 'The standalone .then — also a microtask, runs before the nested chain resumes' },
      { output: '2', type: 'microtask', reason: 'Second .then in the first chain — returning Promise.resolve() adds an extra microtask tick' },
    ],
    explanation: 'Both promise chains start at the same time. After "1" runs, returning Promise.resolve() delays the second .then by one extra microtask tick. This lets the standalone chain (printing "3") jump ahead. All three are microtasks — no macrotasks involved.',
  },
  {
    id: 'async-await',
    label: 'async / await',
    code: `async function main() {
  console.log('start');
  await Promise.resolve();
  console.log('after await');
}

main();
console.log('sync after call');`,
    steps: [
      { output: 'start',           type: 'sync',      reason: 'Inside main() before await — runs synchronously when main() is called' },
      { output: 'sync after call', type: 'sync',      reason: 'After main() returns a Promise — synchronous code in the outer scope continues' },
      { output: 'after await',     type: 'microtask', reason: 'The code after "await" resumes as a microtask once the awaited value resolves' },
    ],
    explanation: 'async/await is syntactic sugar over Promises. When main() hits "await", it suspends and returns a pending Promise. Control returns to the caller, which logs "sync after call". Once the call stack empties, the microtask queue resumes main() from after the await.',
  },
];

const TYPE_COLORS = {
  sync:      { badge: 'bg-gray-700 text-gray-300',       text: 'text-gray-300' },
  microtask: { badge: 'bg-blue-900/60 text-blue-300',    text: 'text-blue-300' },
  macrotask: { badge: 'bg-orange-900/60 text-orange-300', text: 'text-orange-300' },
};

const TYPE_LABELS = { sync: 'SYNC', microtask: 'MICROTASK', macrotask: 'MACROTASK' };

export default function ExecutionOrderDemo() {
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [done, setDone]                 = useState(false);
  const timeoutsRef = useRef([]);

  const scenario = SCENARIOS.find(s => s.id === selectedId);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const selectScenario = (id) => {
    clearTimeouts();
    setSelectedId(id);
    setVisibleSteps([]);
    setIsPlaying(false);
    setDone(false);
  };

  const run = () => {
    if (isPlaying) return;
    clearTimeouts();
    setVisibleSteps([]);
    setDone(false);
    setIsPlaying(true);

    const steps = SCENARIOS.find(s => s.id === selectedId).steps;
    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setVisibleSteps(prev => [...prev, step]);
        if (i === steps.length - 1) {
          setIsPlaying(false);
          setDone(true);
        }
      }, 400 + i * 450);
      timeoutsRef.current.push(t);
    });
  };

  const reset = () => {
    clearTimeouts();
    setVisibleSteps([]);
    setIsPlaying(false);
    setDone(false);
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">Demo 2</div>
        <h1 className="text-3xl font-bold text-white">Execution Order Explorer</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Select a code scenario and press Run to watch the output animate line by line. Each output line is labeled with why it runs at that moment — sync, microtask, or macrotask.
        </p>
      </header>

      {/* Scenario Selector */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Scenario</h2>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => selectScenario(s.id)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${
                selectedId === s.id
                  ? 'bg-orange-600 text-white font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1 border-t border-gray-800">
          <button
            onClick={run}
            disabled={isPlaying}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {isPlaying ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={reset}
            disabled={isPlaying}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</div>
        <pre className="bg-gray-950 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed border border-gray-800">
          {scenario.code}
        </pre>
      </div>

      {/* Output Console */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Console Output</div>
        <div className="bg-gray-950 rounded-lg border border-gray-800 p-4 min-h-32 space-y-2">
          {visibleSteps.length === 0 && !isPlaying && (
            <div className="text-gray-600 text-xs">Press Run to see execution order</div>
          )}
          {visibleSteps.map((step, i) => {
            const colors = TYPE_COLORS[step.type];
            return (
              <div key={i} className="flex items-start gap-3 animate-[fadeIn_0.3s_ease]">
                <span className={`font-mono text-sm font-bold ${colors.text} min-w-fit`}>
                  &gt; {step.output}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${colors.badge}`}>
                  {TYPE_LABELS[step.type]}
                </span>
                <span className="text-xs text-gray-500 leading-relaxed">{step.reason}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {done && (
        <div className="bg-gray-900 rounded-xl p-5 border border-orange-800/30">
          <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Why this order?</div>
          <p className="text-gray-400 text-sm leading-relaxed">{scenario.explanation}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-semibold">SYNC</span> Call stack</span>
        <span className="flex items-center gap-1.5"><span className="inline-block bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded font-semibold">MICROTASK</span> Promise / queueMicrotask</span>
        <span className="flex items-center gap-1.5"><span className="inline-block bg-orange-900/60 text-orange-300 px-1.5 py-0.5 rounded font-semibold">MACROTASK</span> setTimeout / setInterval</span>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={EXECUTION_ORDER_CODE} />
      </div>
    </section>
  );
}
