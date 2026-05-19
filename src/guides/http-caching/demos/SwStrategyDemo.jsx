import { useState } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { SW_STRATEGY_CODE } from '../data/demoCode';

const STRATEGIES = [
  {
    id: 'cache-first',
    label: 'Cache First',
    icon: '💾',
    description: 'Return cache if available; fetch from network only on cache miss.',
    bestFor: 'Versioned assets (JS/CSS with hash)',
  },
  {
    id: 'network-first',
    label: 'Network First',
    icon: '🌐',
    description: 'Try network; fall back to cache if offline.',
    bestFor: 'HTML pages, fresh API data',
  },
  {
    id: 'swr',
    label: 'Stale-While-Revalidate',
    icon: '♻️',
    description: 'Return cache immediately; update cache in background.',
    bestFor: 'Avatars, product listings, feeds',
  },
  {
    id: 'network-only',
    label: 'Network Only',
    icon: '📡',
    description: 'Always fetch from network; never use cache.',
    bestFor: 'POST requests, login, payments',
  },
  {
    id: 'cache-only',
    label: 'Cache Only',
    icon: '📦',
    description: 'Return cache or fail; never goes to network.',
    bestFor: 'Pre-cached app shell (offline-first)',
  },
];

function simulate({ strategy, online, cachePopulated }) {
  switch (strategy) {
    case 'cache-first':
      if (cachePopulated) return { source: 'cache', latencyMs: 5, ok: true, note: 'Cache hit', sideEffect: null };
      if (online)         return { source: 'network', latencyMs: 200, ok: true, note: 'Cache miss → fetched from network', sideEffect: 'Cache populated' };
      return                     { source: null, latencyMs: 0, ok: false, note: 'No cache and offline — request failed' };

    case 'network-first':
      if (online)         return { source: 'network', latencyMs: 200, ok: true, note: 'Network request succeeded', sideEffect: 'Cache updated' };
      if (cachePopulated) return { source: 'cache', latencyMs: 5, ok: true, note: 'Offline — served from cache fallback' };
      return                     { source: null, latencyMs: 0, ok: false, note: 'Offline and no cache — request failed' };

    case 'swr':
      if (cachePopulated) {
        const note = online ? 'Served stale immediately; background revalidate fired' : 'Served from cache (offline — no revalidation)';
        return { source: 'cache', latencyMs: 5, ok: true, note, sideEffect: online ? 'Cache updated in background' : null };
      }
      if (online)         return { source: 'network', latencyMs: 200, ok: true, note: 'No cache — fetched from network', sideEffect: 'Cache populated' };
      return                     { source: null, latencyMs: 0, ok: false, note: 'No cache and offline — request failed' };

    case 'network-only':
      if (online)         return { source: 'network', latencyMs: 200, ok: true, note: 'Network request (cache bypassed)', sideEffect: null };
      return                     { source: null, latencyMs: 0, ok: false, note: 'Offline — network-only always fails offline' };

    case 'cache-only':
      if (cachePopulated) return { source: 'cache', latencyMs: 5, ok: true, note: 'Served from pre-cached resource' };
      return                     { source: null, latencyMs: 0, ok: false, note: 'No cache — cache-only fails without pre-cache' };

    default:
      return { source: null, latencyMs: 0, ok: false, note: 'Unknown strategy' };
  }
}

export default function SwStrategyDemo() {
  const [strategy, setStrategy] = useState('cache-first');
  const [online, setOnline] = useState(true);
  const [cachePopulated, setCachePopulated] = useState(false);
  const [log, setLog] = useState([]);
  const [reqCount, setReqCount] = useState(0);

  function makeRequest() {
    const result = simulate({ strategy, online, cachePopulated });
    const reqNum = reqCount + 1;
    setReqCount(reqNum);
    setLog(prev => [{ ...result, reqNum, strategy, online, cachePopulated }, ...prev].slice(0, 10));
    if (
      result.sideEffect === 'Cache populated' ||
      result.sideEffect === 'Cache updated in background' ||
      result.sideEffect === 'Cache updated'
    ) {
      setCachePopulated(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <span className="bg-teal-900/40 text-teal-400 text-xs font-bold px-2 py-0.5 rounded">Demo 4</span>
        <h2 className="text-white font-bold text-lg mt-2">Service Worker Strategy Picker</h2>
        <p className="text-gray-400 text-sm mt-1">
          Service workers intercept fetch requests and apply a caching strategy. Pick a strategy, set online/offline and cache state, then simulate requests to see what gets returned.
        </p>
      </div>

      {/* 2. Strategy picker card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                strategy === s.id
                  ? 'border-teal-500 bg-teal-900/30'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{s.icon}</div>
              <div className={`text-xs font-bold ${strategy === s.id ? 'text-teal-300' : 'text-gray-300'}`}>{s.label}</div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">{s.description}</div>
              <div className="text-xs text-gray-600 mt-1">Best for: {s.bestFor}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Controls + simulation card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Controls (left) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setOnline(o => !o)}
                className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                  online
                    ? 'border-green-700 bg-green-900/30 text-green-400'
                    : 'border-red-700 bg-red-900/30 text-red-400'
                }`}
              >
                {online ? '🌐 Online' : '🔌 Offline'}
              </button>
              <button
                onClick={() => setCachePopulated(c => !c)}
                className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
                  cachePopulated
                    ? 'border-blue-700 bg-blue-900/30 text-blue-400'
                    : 'border-gray-700 bg-gray-800 text-gray-500'
                }`}
              >
                {cachePopulated ? '💾 Cache populated' : '🗑 Cache empty'}
              </button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-950 rounded p-2 font-mono">
              strategy: {strategy} | online: {String(online)} | cache: {String(cachePopulated)}
            </div>

            <button
              onClick={makeRequest}
              className="px-6 py-2.5 rounded text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors"
            >
              → Make Request
            </button>
          </div>

          {/* Last result (right) */}
          {log.length > 0 && (() => {
            const r = log[0];
            return (
              <div className={`rounded-lg border p-4 ${
                r.ok ? 'border-green-700/50 bg-green-900/20' : 'border-red-700/50 bg-red-900/20'
              }`}>
                <div className={`text-lg font-bold ${r.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {r.ok ? '✓ ' + (r.source === 'cache' ? 'Served from cache' : 'Served from network') : '✗ Request failed'}
                </div>
                <div className="text-sm text-gray-400 mt-1">{r.note}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <div>
                    <span className="text-gray-500">Latency: </span>
                    <span className={`font-mono font-bold ${r.latencyMs < 10 ? 'text-green-400' : r.latencyMs < 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {r.latencyMs === 0 && !r.ok ? '—' : `~${r.latencyMs}ms`}
                    </span>
                  </div>
                  {r.sideEffect && <div className="text-teal-400">↪ {r.sideEffect}</div>}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. Request log card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase text-gray-500 font-medium">Request log</span>
          {log.length > 0 && (
            <button
              onClick={() => { setLog([]); setReqCount(0); }}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <div className="text-xs text-gray-600 italic">No requests yet — click "Make Request" to start.</div>
        ) : (
          <div>
            {log.map(r => (
              <div key={r.reqNum} className={`flex items-center gap-2 text-xs p-2 rounded border mb-1 ${
                r.ok ? 'border-green-800/40 bg-green-950/20' : 'border-red-800/40 bg-red-950/20'
              }`}>
                <span className="text-gray-600 w-5">#{r.reqNum}</span>
                <span className={`w-4 text-center ${r.ok ? 'text-green-400' : 'text-red-400'}`}>{r.ok ? '✓' : '✗'}</span>
                <span className="text-gray-400 w-28 shrink-0">{STRATEGIES.find(s => s.id === r.strategy)?.icon} {STRATEGIES.find(s => s.id === r.strategy)?.label}</span>
                <span className="text-gray-500 shrink-0">{r.online ? '🌐' : '🔌'} {r.cachePopulated ? '💾' : '🗑'}</span>
                <span className={`font-mono shrink-0 ${r.latencyMs < 10 && r.ok ? 'text-green-400' : r.latencyMs < 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {r.ok ? `~${r.latencyMs}ms` : 'fail'}
                </span>
                <span className="text-gray-600 truncate">{r.note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Comparison matrix card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs uppercase text-gray-500 mb-3">Strategy comparison matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-500 pb-2 font-normal">Strategy</th>
                <th className="text-center text-gray-500 pb-2 font-normal">Online + Cache</th>
                <th className="text-center text-gray-500 pb-2 font-normal">Online + No Cache</th>
                <th className="text-center text-gray-500 pb-2 font-normal">Offline + Cache</th>
                <th className="text-center text-gray-500 pb-2 font-normal">Offline + No Cache</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Cache First',   icon: '💾', cols: ['⚡ Cache (5ms)', '🌐 Network (200ms)', '⚡ Cache (5ms)',  '❌ Fail'] },
                { label: 'Network First', icon: '🌐', cols: ['🌐 Network (200ms)', '🌐 Network (200ms)', '⚡ Cache (5ms)', '❌ Fail'] },
                { label: 'SWR',           icon: '♻️', cols: ['⚡ Cache + BG', '🌐 Network (200ms)', '⚡ Cache (5ms)', '❌ Fail'] },
                { label: 'Network Only',  icon: '📡', cols: ['🌐 Network (200ms)', '🌐 Network (200ms)', '❌ Fail', '❌ Fail'] },
                { label: 'Cache Only',    icon: '📦', cols: ['⚡ Cache (5ms)', '❌ Fail', '⚡ Cache (5ms)', '❌ Fail'] },
              ].map(row => (
                <tr key={row.label} className="border-b border-gray-800/50">
                  <td className="py-2 text-gray-300 font-medium">{row.icon} {row.label}</td>
                  {row.cols.map((cell, i) => (
                    <td key={i} className={`py-2 text-center ${cell.startsWith('❌') ? 'text-red-400' : cell.startsWith('⚡') ? 'text-green-400' : 'text-yellow-400'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Key insight callout */}
      <div className="bg-teal-950/20 border border-teal-800/40 rounded-lg p-4 text-sm text-gray-300">
        No strategy is universally best — pick based on the freshness vs speed trade-off for each route. A typical production app uses <strong className="text-white">multiple strategies in one service worker</strong>: Cache First for <code className="text-teal-400 text-xs">/_assets/*.{'{js,css}'}</code> (versioned, immutable), Network First for <code className="text-teal-400 text-xs">/api/*</code> (need fresh, offline fallback), Network Only for <code className="text-teal-400 text-xs">/auth/*</code> (must hit server), Cache Only for the app shell. Workbox's <code className="text-teal-400 text-xs">registerRoute(matcher, strategy)</code> makes this composable.
      </div>

      {/* 7. Code block */}
      <CodeBlock code={SW_STRATEGY_CODE} />
    </div>
  );
}
