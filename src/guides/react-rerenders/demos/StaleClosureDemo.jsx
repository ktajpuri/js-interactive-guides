import { useState, useEffect, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { STALE_CLOSURE_CODE } from '../data/demoCode';

export default function StaleClosureDemo() {
  // ── Scenario 1 state ──────────────────────────────────────────────────────
  const [buggyCount, setBuggyCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [s1Status, setS1Status] = useState(null); // null | 'buggy-fired' | 'correct-fired'

  // ── Scenario 2 state ──────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState('hello');
  const [buggyLog, setBuggyLog] = useState([]);
  const [correctLog, setCorrectLog] = useState([]);

  const inputRef = useRef('hello');
  useEffect(() => { inputRef.current = inputValue; }, [inputValue]);

  // Buggy interval: empty deps, captures stale inputValue
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => {
      const msg = `${new Date().toLocaleTimeString()}: "${inputValue}"`;
      setBuggyLog(prev => [...prev.slice(-4), msg]);
    }, 1200);
    return () => clearInterval(id);
  }, []); // ← empty deps: only runs once, captures initial inputValue

  // Correct interval: reads from ref
  useEffect(() => {
    const id = setInterval(() => {
      const msg = `${new Date().toLocaleTimeString()}: "${inputRef.current}"`;
      setCorrectLog(prev => [...prev.slice(-4), msg]);
    }, 1200);
    return () => clearInterval(id);
  }, []); // safe — reads from ref, not closed-over value

  // ── Scenario 3 state ──────────────────────────────────────────────────────
  const [asyncCount, setAsyncCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [buggyResult, setBuggyResult] = useState(null);
  const [correctResult, setCorrectResult] = useState(null);
  const asyncCountRef = useRef(asyncCount);
  useEffect(() => { asyncCountRef.current = asyncCount; }, [asyncCount]);

  // ── Scenario 1 functions ──────────────────────────────────────────────────
  const buggyIncrement = () => {
    // BUG: all closures capture the same `buggyCount` value
    for (let i = 0; i < 10; i++) {
      setTimeout(() => setBuggyCount(buggyCount + 1), i * 30);
    }
    setTimeout(() => setS1Status('buggy-fired'), 350);
  };

  const correctIncrement = () => {
    // FIX: functional updater sees previous result
    for (let i = 0; i < 10; i++) {
      setTimeout(() => setCorrectCount(c => c + 1), i * 30);
    }
    setTimeout(() => setS1Status('correct-fired'), 350);
  };

  const resetScenario1 = () => {
    setBuggyCount(0);
    setCorrectCount(0);
    setS1Status(null);
  };

  // ── Scenario 3 functions ──────────────────────────────────────────────────
  const buggyFetch = async () => {
    setPending(true);
    // Simulates 2s async operation (like a real fetch)
    await new Promise(res => setTimeout(res, 2000));
    // BUG: closes over asyncCount from when button was clicked
    setBuggyResult(asyncCount);
    setPending(false);
  };

  const correctFetch = async () => {
    // FIX: reads from ref at the time the operation completes
    await new Promise(res => setTimeout(res, 2000));
    setCorrectResult(asyncCountRef.current);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const initialInputValue = 'hello';

  return (
    <div className="space-y-6">
      {/* 1 — Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <span className="bg-sky-900/40 text-sky-400 text-xs font-bold px-2 py-0.5 rounded">Demo 4</span>
        <h2 className="mt-2 text-xl font-bold text-white">Stale Closure Lab</h2>
        <p className="mt-1 text-sm text-gray-400">
          JavaScript closures capture values at the time the function is created, not when it runs.
          In React, every render creates new closures — async callbacks, intervals, and setTimeout
          handlers can all capture stale values.
        </p>
      </div>

      {/* 2 — Scenario 1 card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-200 mb-1">
            Scenario 1 — setTimeout increment
          </p>
          <p className="text-xs text-gray-500">
            Scheduling 10 setTimeouts in a loop. The buggy version captures the same stale count in
            every closure; the correct version uses a functional updater that always sees the latest value.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Buggy card */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
            <p className="text-red-400 text-sm font-semibold">🚨 Stale closure</p>
            <div
              className="text-4xl font-bold text-center py-2"
              style={{ color: s1Status === 'buggy-fired' && buggyCount < 10 ? '#f87171' : '#ffffff' }}
            >
              {buggyCount}
            </div>
            <button
              onClick={buggyIncrement}
              className="w-full border border-red-700 text-red-400 hover:bg-red-900/30 px-3 py-1.5 text-sm rounded transition-colors"
            >
              Increment 10× via setTimeout
            </button>
            <p className="font-mono text-xs text-gray-500">
              {'setCount(count + 1)'}{' '}
              <span className="text-gray-600">// ← captures stale count</span>
            </p>
            {s1Status === 'buggy-fired' && (
              <p className="text-red-400 text-xs">
                Expected 10, got {buggyCount}
              </p>
            )}
          </div>

          {/* Correct card */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
            <p className="text-green-400 text-sm font-semibold">✓ Functional updater</p>
            <div className="text-4xl font-bold text-center py-2 text-white">
              {correctCount}
            </div>
            <button
              onClick={correctIncrement}
              className="w-full border border-green-700 text-green-400 hover:bg-green-900/30 px-3 py-1.5 text-sm rounded transition-colors"
            >
              Increment 10× via setTimeout
            </button>
            <p className="font-mono text-xs text-gray-500">
              {'setCount(c => c + 1)'}{' '}
              <span className="text-gray-600">// ← always sees latest</span>
            </p>
            {s1Status === 'correct-fired' && (
              <p className="text-green-400 text-xs">
                Got {correctCount} ✓
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetScenario1}
            className="border border-gray-600 text-gray-400 hover:bg-gray-800 px-3 py-1.5 text-sm rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3 — Scenario 2 card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-200 mb-1">
            Scenario 2 — useEffect with missing deps
          </p>
          <p className="text-xs text-gray-500">
            Both intervals log the current value every 1.2 seconds. The buggy interval has empty deps
            so it never re-creates — it forever logs the initial value. The correct version reads from
            a ref that's kept up-to-date.
          </p>
        </div>

        {/* Shared input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-medium">
            Type to change the value:
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={e => {
              inputRef.current = e.target.value;
              setInputValue(e.target.value);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sky-600"
            placeholder="Type something…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Buggy log */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-2">
            <p className="text-red-400 text-xs font-semibold">🚨 Buggy (empty deps [])</p>
            <p className="text-gray-600 text-xs font-mono">
              {'useEffect(() => { … }, [])'}
            </p>
            {buggyLog.length === 0 ? (
              <p className="text-gray-600 text-xs italic">Waiting for first tick…</p>
            ) : (
              <ul className="space-y-1">
                {buggyLog.map((entry, i) => {
                  const isStale = !entry.includes(`"${inputValue}"`);
                  return (
                    <li
                      key={i}
                      className="text-xs font-mono rounded px-1.5 py-0.5"
                      style={{
                        color: isStale ? '#f87171' : '#9ca3af',
                        backgroundColor: isStale ? 'rgba(239,68,68,0.08)' : 'transparent',
                      }}
                    >
                      {isStale && (
                        <span className="mr-1 text-red-500 text-xs font-bold">STALE</span>
                      )}
                      {entry}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Correct log */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-2">
            <p className="text-green-400 text-xs font-semibold">✓ Correct (ref pattern)</p>
            <p className="text-gray-600 text-xs font-mono">
              {'reads inputRef.current'}
            </p>
            {correctLog.length === 0 ? (
              <p className="text-gray-600 text-xs italic">Waiting for first tick…</p>
            ) : (
              <ul className="space-y-1">
                {correctLog.map((entry, i) => {
                  const isCurrent = entry.includes(`"${inputValue}"`);
                  return (
                    <li
                      key={i}
                      className="text-xs font-mono rounded px-1.5 py-0.5"
                      style={{
                        color: isCurrent ? '#4ade80' : '#9ca3af',
                      }}
                    >
                      {entry}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600">
          After typing something, the buggy log keeps showing <span className="font-mono">"{initialInputValue}"</span> while the correct log updates immediately.
        </p>
      </div>

      {/* 4 — Scenario 3 card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-200 mb-1">
            Scenario 3 — async callback captures stale state
          </p>
          <p className="text-xs text-gray-500">
            A 2-second simulated fetch reads the counter. If you increment while it's in flight, the
            buggy version returns the value from when you clicked; the correct version reads the current
            value via a ref.
          </p>
        </div>

        {/* Counter row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
            <span className="text-gray-400 text-sm">Counter:</span>
            <span className="text-3xl font-bold text-white">{asyncCount}</span>
            <button
              onClick={() => setAsyncCount(c => c + 1)}
              className="border border-gray-600 text-gray-300 hover:bg-gray-700 w-8 h-8 rounded text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
          {pending && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <span>⏳</span>
              <span>Fetching… ({asyncCount} currently)</span>
            </div>
          )}
        </div>

        {/* Fetch buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={buggyFetch}
            disabled={pending}
            className="border border-red-700 text-red-400 hover:bg-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-sm rounded transition-colors"
          >
            Buggy fetch (2s delay)
          </button>
          <button
            onClick={correctFetch}
            disabled={pending}
            className="border border-green-700 text-green-400 hover:bg-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-sm rounded transition-colors"
          >
            Correct fetch (ref, 2s delay)
          </button>
        </div>

        <p className="text-xs text-gray-500">
          1. Click a fetch button. 2. While waiting, increment the counter. 3. See which result is stale.
        </p>

        {/* Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Buggy result after 2s:</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: buggyResult !== null && buggyResult !== asyncCount ? '#f87171' : '#6b7280',
              }}
            >
              {buggyResult !== null ? buggyResult : '…'}
            </p>
            {buggyResult !== null && buggyResult !== asyncCount && (
              <p className="text-red-400 text-xs">Stale! Counter is now {asyncCount}</p>
            )}
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Correct result after 2s:</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: correctResult !== null && correctResult === asyncCount ? '#4ade80' : '#6b7280',
              }}
            >
              {correctResult !== null ? correctResult : '…'}
            </p>
            {correctResult !== null && correctResult === asyncCount && (
              <p className="text-green-400 text-xs">Up-to-date ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* 5 — Key insight callout */}
      <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-4 text-sm text-gray-300 space-y-3">
        <p>
          JavaScript closures capture the <strong className="text-white">value</strong> of a variable
          at the time the function was created. In React, every render creates new closures. If your
          function runs asynchronously — in a <code className="text-sky-400">setTimeout</code>, interval,
          or after <code className="text-sky-400">await</code> — it sees values from the render it was
          created in, not the current render.
        </p>
        <p>
          <strong className="text-white">Fixes:</strong>{' '}
          (1) functional updater <code className="text-sky-400">{'setX(prev => prev + 1)'}</code> always
          sees the latest state, (2) include the value in effect deps array (creates a fresh closure each
          time it changes), (3) keep the latest value in a{' '}
          <code className="text-sky-400">useRef</code> and read{' '}
          <code className="text-sky-400">ref.current</code> in async callbacks.
        </p>
      </div>

      {/* 6 — Code block */}
      <CodeBlock code={STALE_CLOSURE_CODE} />
    </div>
  );
}
