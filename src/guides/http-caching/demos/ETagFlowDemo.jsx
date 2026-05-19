import { useState, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ETAG_CODE } from '../data/demoCode';

const RESOURCE_SIZE_BYTES = 51_200; // 50KB resource
const RESPONSE_HEADERS_BYTES = 200; // ~200B for 304 headers

export default function ETagFlowDemo() {
  const [serverEtag, setServerEtag] = useState('"v1"');
  const [serverVersion, setServerVersion] = useState(1);
  const [cacheState, setCacheState] = useState(null); // null | { etag, body }
  const [cacheStale, setCacheStale] = useState(false);
  const [requestLog, setRequestLog] = useState([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { status, bytes, source }
  const requestCount = useRef(0);

  function changeServerResource() {
    const newVersion = serverVersion + 1;
    setServerVersion(newVersion);
    setServerEtag(`"v${newVersion}"`);
  }

  function forceStale() {
    setCacheStale(true);
  }

  async function makeRequest() {
    if (animating) return;
    setAnimating(true);
    requestCount.current += 1;
    const reqNum = requestCount.current;

    await new Promise(res => setTimeout(res, 300)); // brief animation delay

    let result;

    if (!cacheState) {
      // No cache — full fetch
      result = {
        reqNum,
        status: 200,
        statusText: '200 OK',
        bytes: RESOURCE_SIZE_BYTES,
        source: 'origin',
        etag: serverEtag,
        note: 'First request — full response, cache populated',
        cacheHit: false,
      };
      setCacheState({ etag: serverEtag, body: `<resource v${serverVersion}>` });
      setCacheStale(false);
    } else if (!cacheStale) {
      // Fresh cache hit — no network
      result = {
        reqNum,
        status: null,
        statusText: 'Cache Hit',
        bytes: 0,
        source: 'cache',
        etag: cacheState.etag,
        note: 'Served from cache — no network request made',
        cacheHit: true,
      };
    } else {
      // Stale — conditional request
      if (cacheState.etag === serverEtag) {
        // Content unchanged → 304
        result = {
          reqNum,
          status: 304,
          statusText: '304 Not Modified',
          bytes: RESPONSE_HEADERS_BYTES,
          source: 'origin (304)',
          etag: serverEtag,
          note: `ETag matched ${serverEtag} — body skipped, cache refreshed`,
          cacheHit: false,
          is304: true,
        };
        setCacheStale(false);
      } else {
        // Content changed → 200 with new body
        result = {
          reqNum,
          status: 200,
          statusText: '200 OK (new content)',
          bytes: RESOURCE_SIZE_BYTES,
          source: 'origin',
          etag: serverEtag,
          note: `ETag changed (${cacheState.etag} → ${serverEtag}) — full response`,
          cacheHit: false,
        };
        setCacheState({ etag: serverEtag, body: `<resource v${serverVersion}>` });
        setCacheStale(false);
      }
    }

    setTotalBytes(b => b + result.bytes);
    setRequestLog(log => [result, ...log].slice(0, 8));
    setLastResult(result);
    setAnimating(false);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-teal-900/40 text-teal-400 text-xs font-bold px-2 py-0.5 rounded">Demo 2</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-1">ETag / 304 Flow</h2>
        <p className="text-sm text-gray-400">
          ETags let the browser ask 'is my cached copy still fresh?' with a tiny conditional request. If unchanged, the server returns 304 — just headers, no body — saving 99%+ of bandwidth.
        </p>
      </div>

      {/* 2. State panel card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="grid grid-cols-2 gap-6">
          {/* Server state */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Server</div>
            <div className="bg-gray-950 rounded p-3 space-y-1 text-sm">
              <div><span className="text-gray-500">Resource: </span><span className="font-mono text-white">50KB document (v{serverVersion})</span></div>
              <div><span className="text-gray-500">ETag: </span><span className="font-mono text-teal-300">{serverEtag}</span></div>
              <div><span className="text-gray-500">Size: </span><span className="font-mono text-white">{(RESOURCE_SIZE_BYTES / 1024).toFixed(0)} KB</span></div>
            </div>
            <button onClick={changeServerResource} className="mt-2 px-3 py-1.5 text-xs rounded border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors">
              ✏ Change resource content
            </button>
          </div>

          {/* Browser cache */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Browser Cache</div>
            {cacheState ? (
              <div className={`bg-gray-950 rounded p-3 space-y-1 text-sm border ${cacheStale ? 'border-yellow-700/50' : 'border-green-700/50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${cacheStale ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>
                    {cacheStale ? 'STALE' : 'FRESH'}
                  </span>
                </div>
                <div><span className="text-gray-500">Cached ETag: </span><span className="font-mono text-teal-300">{cacheState.etag}</span></div>
                <div><span className="text-gray-500">Body: </span><span className="font-mono text-gray-400">50KB (cached)</span></div>
              </div>
            ) : (
              <div className="bg-gray-950 rounded p-3 text-sm text-gray-600 italic">Empty — no cache yet</div>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={forceStale} disabled={!cacheState || cacheStale} className="px-3 py-1.5 text-xs rounded border border-yellow-700 text-yellow-400 hover:bg-yellow-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                ⏰ Expire cache (force stale)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Request animation card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <button
          onClick={makeRequest}
          disabled={animating}
          className="px-6 py-3 rounded text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {animating ? '⏳ Requesting…' : '→ Make Request'}
        </button>

        {lastResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            lastResult.cacheHit ? 'border-green-700/50 bg-green-900/20' :
            lastResult.is304    ? 'border-blue-700/50 bg-blue-900/20' :
                                  'border-red-700/50 bg-red-900/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold font-mono ${
                lastResult.cacheHit ? 'text-green-400' :
                lastResult.is304    ? 'text-blue-400' :
                                      'text-red-400'
              }`}>{lastResult.statusText}</span>
              <span className="text-gray-400 text-sm">{lastResult.note}</span>
            </div>
            <div className="mt-2 flex gap-6 text-sm">
              <div>
                <span className="text-gray-500">Bytes transferred: </span>
                <span className={`font-mono font-bold ${lastResult.bytes === 0 ? 'text-green-400' : lastResult.bytes < 1000 ? 'text-blue-400' : 'text-red-400'}`}>
                  {lastResult.bytes === 0 ? '0 bytes (cache hit)' : `${lastResult.bytes.toLocaleString()} bytes`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Source: </span>
                <span className="font-mono text-teal-300">{lastResult.source}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Total bytes transferred: <span className="font-mono text-white">{totalBytes.toLocaleString()}</span>
          {totalBytes < requestCount.current * RESOURCE_SIZE_BYTES && requestCount.current > 1 && (
            <span className="ml-3 text-green-400 font-medium">
              Saved: {((1 - totalBytes / (requestCount.current * RESOURCE_SIZE_BYTES)) * 100).toFixed(0)}% vs no caching
            </span>
          )}
        </div>
      </div>

      {/* 4. Request log card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Request history</div>
        <div className="space-y-1.5">
          {requestLog.map((entry) => (
            <div key={entry.reqNum} className={`flex items-center gap-3 text-xs p-2 rounded border ${
              entry.cacheHit ? 'border-green-800/40 bg-green-950/20' :
              entry.is304    ? 'border-blue-800/40 bg-blue-950/20' :
                               'border-gray-800 bg-gray-900'
            }`}>
              <span className="text-gray-600 w-6 text-right shrink-0">#{entry.reqNum}</span>
              <span className={`w-40 font-mono shrink-0 ${
                entry.cacheHit ? 'text-green-400' :
                entry.is304    ? 'text-blue-400' :
                                 'text-white'
              }`}>{entry.statusText}</span>
              <span className={`w-28 font-mono shrink-0 ${entry.bytes === 0 ? 'text-green-400' : entry.bytes < 1000 ? 'text-blue-400' : 'text-gray-400'}`}>
                {entry.bytes === 0 ? '0 B (cache)' : `${entry.bytes.toLocaleString()} B`}
              </span>
              <span className="text-gray-600 truncate">{entry.note}</span>
            </div>
          ))}
          {requestLog.length === 0 && <div className="text-xs text-gray-600 italic">No requests yet</div>}
        </div>
      </div>

      {/* 5. Key insight callout */}
      <div className="bg-teal-950/20 border border-teal-800/40 rounded-lg p-4 text-sm text-gray-300">
        ETags turn revalidation into a ~200-byte exchange. On a 50KB asset, that's <strong>99.6% bandwidth savings</strong> when content hasn't changed. The catch: even a 304 still incurs a full round-trip (network latency). For assets you guarantee never change, prefer <code className="font-mono text-teal-300">Cache-Control: immutable</code> to skip the round-trip entirely. ETags shine for content that <em>might</em> change — API responses, HTML pages, user-generated content.
      </div>

      {/* 6. Code block */}
      <CodeBlock code={ETAG_CODE} />
    </div>
  );
}
