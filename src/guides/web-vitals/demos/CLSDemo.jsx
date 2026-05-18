import { useState, useRef, useEffect } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { CLS_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 0.1, poor: 0.25 };

export default function CLSDemo() {
  const [clsScore, setClsScore] = useState(0);
  const [log, setLog] = useState([]);
  const [hasAd, setHasAd] = useState(false);
  const [hasUnsizedImg, setHasUnsizedImg] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [hasFontSwap, setHasFontSwap] = useState(false);
  const [flashEl, setFlashEl] = useState(null);
  const isActiveRef = useRef(false);
  const observerRef = useRef(null);

  useEffect(() => {
    isActiveRef.current = true;
    setClsScore(0);
    setLog([]);

    if (!window.PerformanceObserver) return;
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    if (!supported.includes('layout-shift')) return;

    const observer = new PerformanceObserver((list) => {
      if (!isActiveRef.current) return;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput && entry.value > 0.001) {
          setClsScore(prev => {
            const next = prev + entry.value;
            return Math.round(next * 10000) / 10000;
          });
          setLog(prev => [...prev, {
            id: Date.now() + Math.random(),
            value: entry.value.toFixed(4),
            time: new Date().toLocaleTimeString('en', { hour12: false }),
          }]);
        }
      }
    });

    try { observer.observe({ type: 'layout-shift', buffered: false }); } catch {}
    observerRef.current = observer;

    return () => {
      isActiveRef.current = false;
      observer.disconnect();
    };
  }, []);

  const flash = (el) => { setFlashEl(el); setTimeout(() => setFlashEl(null), 600); };

  const injectAd = () => {
    setHasAd(true);
    flash('ad');
  };

  const injectUnsizedImg = () => {
    setHasUnsizedImg(true);
    setTimeout(() => { setImgExpanded(true); flash('img'); }, 100);
  };

  const toggleFont = () => {
    setHasFontSwap(v => !v);
    flash('text');
  };

  const reset = () => {
    setHasAd(false);
    setHasUnsizedImg(false);
    setImgExpanded(false);
    setHasFontSwap(false);
    setClsScore(0);
    setLog([]);
  };

  const cls = clsScore;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 2</div>
        <h1 className="text-3xl font-bold text-white">CLS — Cumulative Layout Shift</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          CLS measures the sum of all unexpected layout shifts. A shift happens when a visible element moves between frames without user interaction.
          This demo triggers <strong className="text-white">real layout shifts</strong> in the DOM — the PerformanceObserver reads genuine browser data.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trigger Layout Shifts</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={injectAd} disabled={hasAd}
            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-red-800/50 text-red-300 text-sm rounded-lg transition-all">
            Inject Ad Banner
          </button>
          <button onClick={injectUnsizedImg} disabled={hasUnsizedImg}
            className="px-4 py-2 bg-orange-900/40 hover:bg-orange-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-orange-800/50 text-orange-300 text-sm rounded-lg transition-all">
            Load Unsized Image
          </button>
          <button onClick={toggleFont}
            className="px-4 py-2 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-800/50 text-yellow-300 text-sm rounded-lg transition-all">
            {hasFontSwap ? 'Revert Font' : 'Swap Web Font'}
          </button>
          <button onClick={reset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition-all">
            Reset
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Note: layout-shift entries below 0.001 are filtered out. Some shifts may be too small to measure in this layout.
        </p>
      </div>

      {/* Mock article */}
      <div className={`bg-gray-900 rounded-xl border overflow-hidden transition-colors ${flashEl ? 'border-red-500' : 'border-gray-800'}`}>
        <div className="px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-widest">Mock Article</div>
        <div className="p-6 space-y-4">
          {/* Ad banner — injects ABOVE content */}
          {hasAd && (
            <div className={`w-full h-16 rounded-lg flex items-center justify-center text-sm font-medium transition-all border ${flashEl === 'ad' ? 'bg-red-900/50 border-red-500 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              📢 Advertisement — injected above content (causes shift!)
            </div>
          )}

          {/* Unsized image */}
          {hasUnsizedImg && (
            <div className={`overflow-hidden rounded-lg transition-all duration-200 ${flashEl === 'img' ? 'ring-2 ring-red-500' : ''}`}
              style={{ height: imgExpanded ? '120px' : '0px' }}>
              <div className="h-full bg-gradient-to-r from-orange-900 to-red-900 flex items-center justify-center text-sm text-orange-300">
                Image loaded without explicit dimensions → shifted content below
              </div>
            </div>
          )}

          {/* Article text */}
          <div className={`space-y-2 ${flashEl === 'text' ? 'ring-2 ring-yellow-500 rounded-lg p-1' : ''}`}
            style={{ fontFamily: hasFontSwap ? 'Georgia, serif' : 'inherit', lineHeight: hasFontSwap ? '2' : '1.6' }}>
            <h3 className="text-lg font-bold text-white">Article Headline</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              This is the article body text. When a font swaps in with different metrics, the line height and character widths change — shifting everything below the text block. This is why <code className="bg-gray-800 px-1 rounded">font-display: optional</code> or preloading fonts prevents CLS.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Reserve space for images with explicit width and height attributes. Ads injected above content are the most common source of high CLS on the web.
            </p>
          </div>
        </div>
      </div>

      {/* Score + log */}
      <div className="grid md:grid-cols-2 gap-4">
        <MetricGauge value={cls} unit="" thresholds={THRESHOLDS} label="Cumulative Layout Shift" max={0.5} />
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Shift Log</span>
            <button onClick={() => setLog([])} className="text-xs text-gray-600 hover:text-white transition-colors">Clear</button>
          </div>
          <div className="h-40 overflow-y-auto p-4 font-mono text-xs space-y-1.5">
            {log.length === 0 && <div className="text-gray-600 text-center mt-4">No shifts recorded yet</div>}
            {log.map(item => (
              <div key={item.id} className="flex gap-3 text-xs">
                <span className="text-gray-600">{item.time}</span>
                <span className="text-red-400">shift</span>
                <span className="text-yellow-400">+{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={CLS_CODE} />
      </div>
    </section>
  );
}
