import { useState } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { SWR_CODE } from '../data/demoCode';

function classifyRequest(time, maxAge, swrWindow) {
  if (time === 0) return { state: 'miss', label: 'Cache miss', latency: 200, bgRevalidate: false, color: '#ef4444' };
  if (time <= maxAge) return { state: 'fresh', label: 'Fresh (cache hit)', latency: 0, bgRevalidate: false, color: '#22c55e' };
  if (time <= maxAge + swrWindow) return { state: 'stale-swr', label: 'Stale (SWR)', latency: 5, bgRevalidate: true, color: '#eab308' };
  return { state: 'expired', label: 'Expired (fetch)', latency: 200, bgRevalidate: false, color: '#ef4444' };
}

const TIMELINE_DURATION = 600;

export default function SwrTimelineDemo() {
  const [maxAge, setMaxAge] = useState(60);
  const [swrWindow, setSwrWindow] = useState(300);
  const [requests, setRequests] = useState([]);
  const [nextId, setNextId] = useState(1);

  function handleTimelineClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time = Math.round(ratio * TIMELINE_DURATION);
    const classification = classifyRequest(time, maxAge, swrWindow);
    setRequests(prev => [...prev, { id: nextId, time, ...classification }]);
    setNextId(n => n + 1);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="mb-2">
          <span className="bg-teal-900/40 text-teal-400 text-xs font-bold px-2 py-0.5 rounded">Demo 3</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">Stale-While-Revalidate Timeline</h2>
        <p className="text-sm text-gray-400">
          SWR serves a stale cached response immediately while fetching fresh data in the background. Users get zero-latency responses; the next request gets fresh data.
        </p>
      </div>

      {/* 2. Config card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">max-age</span>
              <span className="font-mono text-teal-400">{maxAge}s ({maxAge < 60 ? `${maxAge}s` : `${Math.round(maxAge / 60)}m`})</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={maxAge}
              onChange={e => { setMaxAge(Number(e.target.value)); setRequests([]); setNextId(1); }}
              className="w-full accent-teal-500"
            />
            <div className="text-xs text-gray-600 mt-1">Fresh window — served directly from cache</div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">stale-while-revalidate</span>
              <span className="font-mono text-yellow-400">{swrWindow}s ({Math.round(swrWindow / 60)}m)</span>
            </div>
            <input
              type="range"
              min={0}
              max={600}
              step={30}
              value={swrWindow}
              onChange={e => { setSwrWindow(Number(e.target.value)); setRequests([]); setNextId(1); }}
              className="w-full accent-yellow-500"
            />
            <div className="text-xs text-gray-600 mt-1">Stale window — serve stale + revalidate in background</div>
          </div>
        </div>

        <div className="mt-4 font-mono text-sm bg-gray-950 rounded p-2 text-teal-300">
          Cache-Control: max-age={maxAge}{swrWindow > 0 ? `, stale-while-revalidate=${swrWindow}` : ''}
        </div>
      </div>

      {/* 3. Timeline card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">Request Timeline</h3>
          <button
            onClick={() => { setRequests([]); setNextId(1); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>

        <div
          className="relative h-16 bg-gray-950 rounded-lg border border-gray-700 cursor-crosshair select-none mt-3"
          onClick={handleTimelineClick}
        >
          {/* Fresh zone */}
          <div
            className="absolute top-0 bottom-0 bg-green-900/25 border-r border-green-700/40"
            style={{ left: 0, width: `${(maxAge / TIMELINE_DURATION) * 100}%` }}
          />
          {/* SWR zone */}
          {swrWindow > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-yellow-900/20 border-r border-yellow-700/40"
              style={{
                left: `${(maxAge / TIMELINE_DURATION) * 100}%`,
                width: `${Math.min(swrWindow / TIMELINE_DURATION, 1 - maxAge / TIMELINE_DURATION) * 100}%`,
              }}
            />
          )}

          {/* Zone labels */}
          <div className="absolute top-1 left-1 text-xs text-green-500/70 pointer-events-none">FRESH</div>
          {swrWindow > 0 && maxAge < TIMELINE_DURATION && (
            <div
              className="absolute top-1 text-xs text-yellow-500/70 pointer-events-none"
              style={{ left: `calc(${(maxAge / TIMELINE_DURATION) * 100}% + 4px)` }}
            >
              SWR
            </div>
          )}
          {(maxAge + swrWindow) < TIMELINE_DURATION && (
            <div
              className="absolute top-1 text-xs text-red-500/70 pointer-events-none"
              style={{ left: `calc(${Math.min((maxAge + swrWindow) / TIMELINE_DURATION, 0.85) * 100}% + 4px)` }}
            >
              EXPIRED
            </div>
          )}

          {/* Request markers */}
          {requests.map(req => (
            <div
              key={req.id}
              className="absolute top-3 flex flex-col items-center pointer-events-none"
              style={{ left: `${(req.time / TIMELINE_DURATION) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border-2 border-gray-900"
                style={{ backgroundColor: req.color }}
              />
              <div className="text-xs font-mono mt-1" style={{ color: req.color }}>{req.time}s</div>
              {req.bgRevalidate && (
                <div className="text-xs text-yellow-400/60">↺</div>
              )}
            </div>
          ))}

          {/* Hint text */}
          {requests.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 pointer-events-none">
              Click anywhere on the timeline to place a request
            </div>
          )}
        </div>

        {/* Time axis */}
        <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
          <span>0s</span>
          <span>{TIMELINE_DURATION / 4}s</span>
          <span>{TIMELINE_DURATION / 2}s</span>
          <span>{TIMELINE_DURATION * 3 / 4}s</span>
          <span>{TIMELINE_DURATION}s</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-2 text-xs flex-wrap">
          {[
            { color: '#22c55e', label: 'Fresh (0ms)' },
            { color: '#eab308', label: 'SWR stale (~5ms + BG revalidate)' },
            { color: '#ef4444', label: 'Expired (200ms fetch)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Results table card */}
      {requests.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">Request Results</h3>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-xl font-bold text-green-400">
                {requests.filter(r => r.state === 'fresh').length}
              </div>
              <div className="text-xs text-gray-500">Instant (cache hits)</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-400">
                {requests.filter(r => r.state === 'stale-swr').length}
              </div>
              <div className="text-xs text-gray-500">SWR served stale</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-400">
                {requests.filter(r => r.state === 'miss' || r.state === 'expired').length}
              </div>
              <div className="text-xs text-gray-500">Blocking fetches</div>
            </div>
          </div>

          {/* Request list */}
          <div className="space-y-1.5">
            {[...requests].reverse().map(req => (
              <div
                key={req.id}
                className="flex items-center gap-3 text-xs p-2 rounded bg-gray-800 border border-gray-700"
              >
                <span className="font-mono text-gray-500 shrink-0">t={req.time}s</span>
                <span className="font-bold shrink-0" style={{ color: req.color }}>{req.label}</span>
                <span className={`font-mono shrink-0 ${req.latency === 0 ? 'text-green-400' : req.latency < 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {req.latency === 0 ? '~0ms' : `~${req.latency}ms`}
                </span>
                {req.bgRevalidate && <span className="text-yellow-400/80">↺ BG revalidate fired</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Key insight callout */}
      <div className="bg-teal-950/20 border border-teal-800/40 rounded-lg p-4 text-sm text-gray-300">
        <code>stale-while-revalidate</code> is the best caching directive for non-critical data. Users get{' '}
        <strong>instant responses</strong> (0ms) from cache even when stale; the background revalidation quietly
        updates the cache so the <em>next</em> request gets fresh data. A common pattern:{' '}
        <code>max-age=60, stale-while-revalidate=86400</code> — fresh for a minute, serve-stale for a day. The
        user never sees a blocking fetch unless the cache is over 24 hours old.
      </div>

      {/* 6. Code block */}
      <CodeBlock code={SWR_CODE} />
    </div>
  );
}
