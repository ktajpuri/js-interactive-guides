import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ABORT_CONTROLLER_CODE } from '../data/demoCode';

// ---------------------------------------------------------------------------
// Simulated fetch — never touches the network
// ---------------------------------------------------------------------------
function simulateFetch(query, signal, minMs, maxMs) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => resolve({ query, results: `Found 42 results for "${query}"` }),
      delay,
    );
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const STATUS_STYLES = {
  pending:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  completed: 'bg-green-500/20  text-green-300  border border-green-500/40',
  stale:     'bg-red-500/20    text-red-300    border border-red-500/40',
  cancelled: 'bg-gray-500/20  text-gray-400   border border-gray-500/40',
};

const STATUS_LABEL = {
  pending:   'Pending',
  completed: 'Completed',
  stale:     'Stale',
  cancelled: 'Cancelled',
};

const MODE_INSIGHT = {
  naive:
    '⚠ Race condition present — old responses can overwrite new results. Responses arrive in random order; the last one to arrive wins, not the most recent query.',
  'ref-guard':
    '✓ Correct results, but stale requests still complete in the background (wasted bandwidth). The guard ignores late arrivals but cannot stop them.',
  abort:
    '✓ Correct results + stale requests cancelled immediately. AbortController tears down the in-flight request as soon as a newer query is fired.',
};

const LATENCY_MIN = 200;
const MAX_LOG = 15;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AbortControllerDemo() {
  const [mode, setMode]                   = useState('naive');
  const [query, setQuery]                 = useState('');
  const [displayedResult, setDisplayedResult] = useState(null);
  const [requests, setRequests]           = useState([]);
  const [latencyMax, setLatencyMax]       = useState(1200);

  // Refs that survive renders without causing them
  const requestIdCounter  = useRef(0);
  const latestIdRef       = useRef(0);
  const abortControllerRef = useRef(null);
  const debounceTimer     = useRef(null);

  // Reset everything when mode changes
  useEffect(() => {
    setQuery('');
    setDisplayedResult(null);
    setRequests([]);
    requestIdCounter.current = 0;
    latestIdRef.current      = 0;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Core fetch dispatch — called after debounce
  // ---------------------------------------------------------------------------
  const dispatchFetch = useCallback(
    (q) => {
      if (!q.trim()) return;

      const id        = ++requestIdCounter.current;
      const startTime = Date.now();

      const addEntry = () => {
        setRequests((prev) => {
          const entry = { id, query: q, startTime, endTime: null, delay: null, status: 'pending' };
          return [...prev.slice(-(MAX_LOG - 1)), entry];
        });
      };

      const updateEntry = (patch) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        );
      };

      if (mode === 'naive') {
        addEntry();
        simulateFetch(q, null, LATENCY_MIN, latencyMax).then((res) => {
          const endTime = Date.now();
          const delay   = endTime - startTime;
          // Mark all previously completed entries as stale; this one becomes completed
          setRequests((prev) => {
            const latestCompletedId = prev
              .filter((r) => r.status === 'completed')
              .reduce((max, r) => Math.max(max, r.id), -1);
            return prev.map((r) => {
              if (r.id === id) return { ...r, endTime, delay, status: 'completed' };
              // If this response arrived AFTER a newer completed response, it's stale
              if (r.status === 'completed' && r.id < id) return { ...r, status: 'stale' };
              return r;
            });
          });
          setDisplayedResult(res.results);
        });
      }

      if (mode === 'ref-guard') {
        latestIdRef.current = id;
        addEntry();
        simulateFetch(q, null, LATENCY_MIN, latencyMax).then((res) => {
          const endTime = Date.now();
          const delay   = endTime - startTime;
          if (id === latestIdRef.current) {
            updateEntry({ endTime, delay, status: 'completed' });
            setDisplayedResult(res.results);
          } else {
            updateEntry({ endTime, delay, status: 'stale' });
          }
        });
      }

      if (mode === 'abort') {
        // Cancel the previous in-flight request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        addEntry();
        simulateFetch(q, controller.signal, LATENCY_MIN, latencyMax)
          .then((res) => {
            const endTime = Date.now();
            const delay   = endTime - startTime;
            updateEntry({ endTime, delay, status: 'completed' });
            setDisplayedResult(res.results);
          })
          .catch((err) => {
            if (err.name === 'AbortError') {
              const endTime = Date.now();
              updateEntry({ endTime, delay: endTime - startTime, status: 'cancelled' });
            }
          });
      }
    },
    [mode, latencyMax],
  );

  // ---------------------------------------------------------------------------
  // Input handler — debounced 300 ms
  // ---------------------------------------------------------------------------
  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => dispatchFetch(val), 300);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            Demo 6
          </span>
          <h2 className="text-xl font-bold text-white">AbortController &amp; Race Conditions</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Type quickly in the search box. Without cancellation, a slow earlier response can
          arrive after a faster later one — silently showing wrong results.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'naive',     label: 'Naïve (bug)' },
          { key: 'ref-guard', label: 'Ref Guard' },
          { key: 'abort',     label: 'AbortController' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Search for something… type fast!"
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-orange-500 placeholder-gray-500 text-sm"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
          300 ms debounce
        </span>
      </div>

      {/* Latency slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Simulated latency variance</span>
          <span className="text-orange-400 font-mono">{LATENCY_MIN}–{latencyMax} ms</span>
        </div>
        <input
          type="range"
          min={300}
          max={3000}
          step={100}
          value={latencyMax}
          onChange={(e) => setLatencyMax(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>300 ms</span>
          <span>3000 ms</span>
        </div>
      </div>

      {/* In-flight requests timeline */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-300">In-flight requests</h3>
        <div
          className="overflow-y-auto rounded-lg border border-gray-700 bg-gray-900"
          style={{ height: 200 }}
        >
          {requests.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Type in the search box quickly to see the race condition!
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {[...requests].reverse().map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-800/50 transition-colors"
                >
                  {/* Request id */}
                  <span className="text-gray-600 font-mono text-xs w-6 text-right flex-shrink-0">
                    #{req.id}
                  </span>

                  {/* Query */}
                  <span className="text-gray-300 truncate flex-1 font-mono text-xs">
                    &quot;{req.query}&quot;
                  </span>

                  {/* Latency */}
                  <span className="text-gray-500 text-xs w-20 text-right flex-shrink-0">
                    {req.delay != null ? `${req.delay} ms` : '…'}
                  </span>

                  {/* Status pill */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLES[req.status]}`}
                  >
                    {STATUS_LABEL[req.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result panel */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 min-h-[60px] flex items-center">
        {displayedResult ? (
          <p className="text-green-300 text-sm font-mono">{displayedResult}</p>
        ) : (
          <p className="text-gray-600 text-sm">Results will appear here…</p>
        )}
      </div>

      {/* Key insight callout */}
      <div
        className={`rounded-lg px-4 py-3 text-sm border ${
          mode === 'naive'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : mode === 'ref-guard'
            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            : 'bg-green-500/10 border-green-500/30 text-green-300'
        }`}
      >
        {MODE_INSIGHT[mode]}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <span key={key} className={`px-2 py-0.5 rounded-full ${STATUS_STYLES[key]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Code block */}
      <CodeBlock code={ABORT_CONTROLLER_CODE ?? ''} />
    </div>
  );
}
