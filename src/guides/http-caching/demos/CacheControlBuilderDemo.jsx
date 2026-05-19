import { useState } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { CACHE_CONTROL_CODE } from '../data/demoCode';

const REQUEST_TIMES = [
  { label: 'Immediate',    age: 0 },
  { label: '30s later',   age: 30 },
  { label: '1h later',    age: 3600 },
  { label: '1 day later', age: 86400 },
  { label: '1 week later', age: 604800 },
];

const LAYER_STYLES = {
  memory: { label: 'Memory Cache', color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-700/50',  icon: '⚡' },
  disk:   { label: 'Disk Cache',   color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-700/50',   icon: '💾' },
  cdn:    { label: 'CDN Edge',     color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700/50', icon: '🌐' },
  origin: { label: 'Origin',       color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/50',    icon: '🖥' },
};

function buildHeader(d) {
  const parts = [];
  if (d.public)         parts.push('public');
  if (d.private)        parts.push('private');
  if (d.noStore)        parts.push('no-store');
  else if (d.noCache)   parts.push('no-cache');
  if (d.maxAge > 0 && !d.noStore) parts.push(`max-age=${d.maxAge}`);
  if (d.sMaxAge > 0 && !d.noStore) parts.push(`s-maxage=${d.sMaxAge}`);
  if (d.immutable && !d.noStore)   parts.push('immutable');
  if (d.mustRevalidate && !d.noStore) parts.push('must-revalidate');
  if (d.swr > 0 && !d.noStore)    parts.push(`stale-while-revalidate=${d.swr}`);
  return parts.length ? `Cache-Control: ${parts.join(', ')}` : 'Cache-Control: (none)';
}

function simulateRequest(d, age) {
  if (d.noStore) return { layer: 'origin', latencyMs: 200, reason: 'no-store: never cached' };

  if (age === 0) {
    return { layer: 'origin', latencyMs: 200, reason: 'First request — populates cache' };
  }

  if (d.noCache) {
    return { layer: 'origin', latencyMs: 60, reason: 'no-cache: revalidating (304 path)', is304: true };
  }

  if (d.immutable && age < d.maxAge) {
    return { layer: 'memory', latencyMs: 0, reason: 'immutable + fresh: browser never asks again' };
  }

  if (age < d.maxAge) {
    const layer = age < 60 ? 'memory' : 'disk';
    return { layer, latencyMs: layer === 'memory' ? 0 : 5, reason: `Fresh (age=${age}s < max-age=${d.maxAge}s)` };
  }

  const swrEnd = d.maxAge + d.swr;
  if (d.swr > 0 && age < swrEnd) {
    return { layer: 'disk', latencyMs: 5, reason: `SWR window (age=${age}s): served stale + background revalidate`, isSwr: true };
  }

  if (d.mustRevalidate) {
    return { layer: 'origin', latencyMs: 200, reason: 'must-revalidate: stale, must fetch fresh' };
  }

  if (d.public && d.sMaxAge > 0 && age < d.sMaxAge) {
    return { layer: 'cdn', latencyMs: 30, reason: `CDN fresh (age=${age}s < s-maxage=${d.sMaxAge}s)` };
  }

  return { layer: 'origin', latencyMs: 200, reason: 'Stale: fetching fresh from origin' };
}

export default function CacheControlBuilderDemo() {
  const [directives, setDirectives] = useState({
    public: false,
    private: false,
    noCache: false,
    noStore: false,
    mustRevalidate: false,
    immutable: false,
    maxAge: 3600,
    sMaxAge: 0,
    swr: 0,
  });

  const toggle = (key) => setDirectives(d => ({ ...d, [key]: !d[key] }));
  const setNum = (key, val) => setDirectives(d => ({ ...d, [key]: Number(val) }));

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="mb-2">
          <span className="bg-teal-900/40 text-teal-400 text-xs font-bold px-2 py-0.5 rounded">Demo 1</span>
        </div>
        <h2 className="text-lg font-bold text-gray-100 mb-1">Cache-Control Builder</h2>
        <p className="text-sm text-gray-400">
          Configure Cache-Control directives and see how they affect 5 requests made at different times. The simulation
          shows where each request resolves — memory cache, disk cache, CDN, or origin.
        </p>
      </div>

      {/* Builder card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        {/* Live header preview */}
        <div className="font-mono text-sm bg-gray-950 border border-gray-700 rounded p-3 mb-4 text-teal-300 break-all">
          {buildHeader(directives)}
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Boolean toggles */}
          <div className="space-y-3">
            <div className="text-xs uppercase text-gray-500 mb-2">Directives</div>
            {[
              { key: 'public',         label: 'public',           desc: 'Cacheable by CDNs and proxies' },
              { key: 'private',        label: 'private',          desc: 'Browser only, not CDNs' },
              { key: 'noCache',        label: 'no-cache',         desc: 'Must revalidate before use (not "no cache"!)' },
              { key: 'noStore',        label: 'no-store',         desc: 'Never cache anywhere' },
              { key: 'mustRevalidate', label: 'must-revalidate',  desc: 'Once stale, must go to origin' },
              { key: 'immutable',      label: 'immutable',        desc: 'Content never changes, skip revalidation' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={directives[key]}
                  onChange={() => toggle(key)}
                  className="mt-0.5 accent-teal-500"
                />
                <div>
                  <span className="text-sm font-mono text-gray-200">{label}</span>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Right — Numeric sliders */}
          <div className="space-y-4">
            <div className="text-xs uppercase text-gray-500 mb-2">Time values</div>
            {[
              {
                key: 'maxAge',
                label: 'max-age',
                max: 86400,
                step: 60,
                format: v =>
                  v === 0 ? 'not set' :
                  v < 60 ? `${v}s` :
                  v < 3600 ? `${Math.round(v / 60)}m` :
                  `${Math.round(v / 3600)}h`,
              },
              {
                key: 'sMaxAge',
                label: 's-maxage',
                max: 86400,
                step: 3600,
                format: v => v === 0 ? 'not set' : `${Math.round(v / 3600)}h`,
              },
              {
                key: 'swr',
                label: 'stale-while-revalidate',
                max: 86400,
                step: 300,
                format: v =>
                  v === 0 ? 'not set' :
                  v < 3600 ? `${Math.round(v / 60)}m` :
                  `${Math.round(v / 3600)}h`,
              },
            ].map(({ key, label, max, step, format }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-gray-300">{label}</span>
                  <span className="text-teal-400 font-mono">{format(directives[key])}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={max}
                  step={step}
                  value={directives[key]}
                  onChange={e => setNum(key, e.target.value)}
                  className="w-full accent-teal-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            {
              label: 'Static asset (forever)',
              d: { public: true, noCache: false, noStore: false, private: false, mustRevalidate: false, immutable: true, maxAge: 31536000, sMaxAge: 0, swr: 0 },
            },
            {
              label: 'HTML page',
              d: { public: false, noCache: true, noStore: false, private: false, mustRevalidate: false, immutable: false, maxAge: 0, sMaxAge: 0, swr: 0 },
            },
            {
              label: 'API (SWR)',
              d: { public: false, noCache: false, noStore: false, private: true, mustRevalidate: false, immutable: false, maxAge: 60, sMaxAge: 0, swr: 300 },
            },
            {
              label: 'No cache ever',
              d: { public: false, noCache: false, noStore: true, private: false, mustRevalidate: false, immutable: false, maxAge: 0, sMaxAge: 0, swr: 0 },
            },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => setDirectives(preset.d)}
              className="px-3 py-1 text-xs rounded border border-teal-700/50 text-teal-400 hover:bg-teal-900/30 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs uppercase text-gray-500 mb-3">Simulated requests</div>
        {REQUEST_TIMES.map(({ label, age }) => {
          const result = simulateRequest(directives, age);
          const style = LAYER_STYLES[result.layer];
          return (
            <div
              key={age}
              className={`flex items-center gap-3 p-3 rounded-lg border ${style.border} ${style.bg} mb-2`}
            >
              <div className="text-lg">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
                  <span className={`text-sm font-bold ${style.color}`}>{style.label}</span>
                  {result.is304 && (
                    <span className="text-xs bg-blue-900/40 text-blue-400 px-1 rounded">304</span>
                  )}
                  {result.isSwr && (
                    <span className="text-xs bg-yellow-900/40 text-yellow-400 px-1 rounded">SWR</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{result.reason}</div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`text-sm font-mono font-bold ${
                    result.latencyMs === 0
                      ? 'text-green-400'
                      : result.latencyMs < 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {result.latencyMs === 0 ? '0ms' : `~${result.latencyMs}ms`}
                </div>
                <div className="text-xs text-gray-600">latency</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key insight callout */}
      <div className="bg-teal-950/20 border border-teal-800/40 rounded-lg p-4 text-sm text-gray-300">
        <code className="text-teal-300">Cache-Control</code> is the most misunderstood HTTP header.{' '}
        <code className="text-teal-300">no-cache</code> does <strong>not</strong> mean &ldquo;don&rsquo;t
        cache&rdquo; — it means &ldquo;always revalidate before using&rdquo;. The actual &ldquo;never
        cache&rdquo; directive is <code className="text-teal-300">no-store</code>. For versioned static
        assets (CSS/JS with a content hash in the filename), use{' '}
        <code className="text-teal-300">public, max-age=31536000, immutable</code> — the browser never asks
        for them again until you ship a new filename.
      </div>

      {/* Code block */}
      <CodeBlock code={CACHE_CONTROL_CODE} />
    </div>
  );
}
