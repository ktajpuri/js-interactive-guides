import { useRef, useState, useCallback } from 'react';
import { CodeBlock } from '../Layout/CodeBlock';
import { ROOT_MARGIN_CODE } from '../../data/demoCode';
import { useEffect } from 'react';

const PRESETS = [
  { label: 'Default (none)', value: '0px 0px 0px 0px' },
  { label: 'Pre-load +200px', value: '0px 0px 200px 0px' },
  { label: 'Eager +100px all', value: '100px 100px 100px 100px' },
  { label: 'Center zone -30%', value: '-30% 0px -30% 0px' },
  { label: 'Top-only -50%', value: '-50% 0px 0px 0px' },
];

export default function RootMarginPlayground() {
  const targetRef = useRef(null);
  const [margins, setMargins] = useState({ top: '0px', right: '0px', bottom: '0px', left: '0px' });
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const observerRef = useRef(null);

  const rootMargin = `${margins.top} ${margins.right} ${margins.bottom} ${margins.left}`;

  const setupObserver = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!targetRef.current) return;

    try {
      const observer = new IntersectionObserver(([e]) => setEntry(e), { rootMargin });
      observer.observe(targetRef.current);
      observerRef.current = observer;
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [rootMargin]);

  useEffect(() => {
    const timer = setTimeout(setupObserver, 300);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  const applyPreset = (value) => {
    const parts = value.split(' ');
    setMargins({ top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] });
  };

  const isIntersecting = entry?.isIntersecting ?? false;
  const ratio = entry?.intersectionRatio ?? 0;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">
          Demo 3
        </div>
        <h1 className="text-3xl font-bold text-white">rootMargin Playground</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          <code className="bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded text-sm">rootMargin</code> works
          like CSS margin — it expands (+) or contracts (−) the root's bounding box before checking intersections.
          A positive bottom margin lets you detect elements <em>before</em> they enter the viewport — perfect for lazy loading.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                rootMargin === p.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Manual inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['top', 'right', 'bottom', 'left'].map(side => (
            <div key={side}>
              <label className="block text-xs text-gray-500 mb-1 capitalize">{side}</label>
              <input
                type="text"
                value={margins[side]}
                onChange={e => setMargins(prev => ({ ...prev, [side]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. 100px or 20%"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-sm bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-500">rootMargin: </span>
            <span className="text-orange-400">"{rootMargin}"</span>
          </div>
          {error && <div className="text-red-400 text-xs flex-1">{error}</div>}
        </div>

        {/* Visual explanation */}
        <div className="rounded-lg bg-gray-800 p-4 text-sm text-gray-400">
          <span className="text-orange-400 font-semibold">How it works: </span>
          The observer treats the root as if it's{' '}
          {margins.bottom !== '0px' && margins.bottom !== '0%' ? (
            <span className="text-green-400">expanded by {margins.bottom} at the bottom → triggers early (pre-loading)</span>
          ) : margins.top.startsWith('-') ? (
            <span className="text-yellow-400">shrunk from the top → element must scroll further in to trigger</span>
          ) : (
            <span className="text-gray-300">the exact viewport boundary</span>
          )}.
        </div>
      </div>

      {/* Demo */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Demo (scroll within box)</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            isIntersecting ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {isIntersecting ? `ACTIVE — ${(ratio * 100).toFixed(0)}%` : 'INACTIVE'}
          </span>
        </div>
        <div className="h-[420px] overflow-y-auto p-6 relative">
          <div className="h-40 flex flex-col items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mb-6 gap-1">
            <span>Scroll down to approach the target</span>
            <span className="text-xs text-gray-700">rootMargin will expand/contract the detection boundary</span>
          </div>

          {/* Simulated root margin indicator */}
          {margins.bottom && margins.bottom !== '0px' && !margins.bottom.startsWith('-') && (
            <div className="mb-4 rounded-lg border border-orange-700/50 border-dashed bg-orange-900/10 p-3 text-center text-xs text-orange-500">
              Expanded zone: observer fires here ({margins.bottom} above the actual element)
            </div>
          )}

          <div
            ref={targetRef}
            className="rounded-xl p-8 text-center transition-all duration-300 border-2"
            style={{
              background: isIntersecting
                ? `rgba(249, 115, 22, ${0.08 + ratio * 0.2})`
                : 'rgba(55,65,81,0.3)',
              borderColor: isIntersecting
                ? `rgba(249,115,22,${0.5 + ratio * 0.5})`
                : '#374151',
            }}
          >
            <div className="text-2xl font-bold text-white mb-2">Observed Target</div>
            <div className={`text-sm font-semibold ${isIntersecting ? 'text-green-400' : 'text-gray-500'}`}>
              {isIntersecting ? `Detected! ratio: ${ratio.toFixed(2)}` : 'Not in adjusted root zone'}
            </div>
          </div>

          <div className="h-40 flex items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mt-6">
            scroll more
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={ROOT_MARGIN_CODE} />
      </div>
    </section>
  );
}
