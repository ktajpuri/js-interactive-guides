import { useRef, useMemo } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { CodeBlock } from '../Layout/CodeBlock';
import { ENTRY_PROPERTIES_CODE } from '../../data/demoCode';

function DomRectDisplay({ label, rect, color }) {
  if (!rect) return (
    <div className={`rounded-lg p-3 border ${color.border} bg-gray-900`}>
      <div className={`text-xs font-semibold mb-1 ${color.text}`}>{label}</div>
      <div className="text-xs text-gray-500 font-mono">null (viewport root)</div>
    </div>
  );
  return (
    <div className={`rounded-lg p-3 border ${color.border} bg-gray-900`}>
      <div className={`text-xs font-semibold mb-2 ${color.text}`}>{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-gray-300">
        {['top', 'right', 'bottom', 'left', 'width', 'height'].map(k => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-gray-500">{k}</span>
            <span>{typeof rect[k] === 'number' ? rect[k].toFixed(1) : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EntryProperties() {
  const targetRef = useRef(null);
  const thresholds = useMemo(() => Array.from({ length: 101 }, (_, i) => i / 100), []);
  const entry = useIntersectionObserver(targetRef, { threshold: thresholds });

  const ratio = entry?.intersectionRatio ?? 0;
  const isIntersecting = entry?.isIntersecting ?? false;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-blue-800/50">
          Demo 1
        </div>
        <h1 className="text-3xl font-bold text-white">API Basics & Entry Properties</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Every Intersection Observer callback receives an array of{' '}
          <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm">IntersectionObserverEntry</code>{' '}
          objects. Each entry describes the intersection between the observed element and the root.
          Scroll down to see all properties update in real time.
        </p>
      </header>

      {/* Live dashboard */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 sticky top-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Entry Properties</h2>
          <span className={`text-xs font-mono px-2 py-1 rounded-full font-semibold ${
            isIntersecting ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'
          }`}>
            {isIntersecting ? 'INTERSECTING' : 'NOT INTERSECTING'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* isIntersecting */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-mono mb-1">isIntersecting</div>
            <div className={`text-lg font-bold font-mono ${isIntersecting ? 'text-green-400' : 'text-red-400'}`}>
              {String(isIntersecting)}
            </div>
          </div>

          {/* intersectionRatio */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-mono mb-1">intersectionRatio</div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold font-mono text-yellow-400 w-12">{ratio.toFixed(2)}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-green-400 transition-all duration-100"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* time */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-mono mb-1">time</div>
            <div className="text-base font-bold font-mono text-purple-400">
              {entry ? entry.time.toFixed(1) + 'ms' : '—'}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">since page load</div>
          </div>

          {/* target */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 font-mono mb-1">target</div>
            <div className="text-sm font-mono text-cyan-400 truncate">
              {entry ? `<div id="observed-target">` : '—'}
            </div>
          </div>
        </div>

        {/* DOMRect displays */}
        <div className="grid md:grid-cols-3 gap-3">
          <DomRectDisplay
            label="boundingClientRect"
            rect={entry?.boundingClientRect}
            color={{ border: 'border-red-800/50', text: 'text-red-400' }}
          />
          <DomRectDisplay
            label="intersectionRect"
            rect={entry?.intersectionRect}
            color={{ border: 'border-blue-800/50', text: 'text-blue-400' }}
          />
          <DomRectDisplay
            label="rootBounds"
            rect={entry?.rootBounds}
            color={{ border: 'border-green-800/50', text: 'text-green-400' }}
          />
        </div>
      </div>

      {/* Scrollable demo */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Scroll to observe</h2>
        </div>
        <div className="h-[500px] overflow-y-auto p-6" style={{ scrollbarGutter: 'stable' }}>
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mb-6">
            Scroll down to bring the target into view
          </div>

          <div
            id="observed-target"
            ref={targetRef}
            className="relative rounded-xl border-2 border-dashed border-blue-500 p-8 transition-all duration-200"
            style={{
              background: `rgba(59, 130, 246, ${0.05 + ratio * 0.2})`,
              borderColor: isIntersecting ? `rgba(59, 130, 246, ${0.4 + ratio * 0.6})` : '#374151',
            }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2" style={{ opacity: 0.3 + ratio * 0.7 }}>
                Target Element
              </div>
              <div className="text-gray-400 text-sm">
                I am being observed. My visibility is{' '}
                <span className="text-yellow-400 font-mono font-bold">{(ratio * 100).toFixed(0)}%</span>
              </div>
            </div>
            {/* Ratio bar */}
            <div className="mt-6 bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-100"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>

          <div className="h-48 flex items-center justify-center text-gray-600 text-sm border border-dashed border-gray-700 rounded-xl mt-6">
            Keep scrolling...
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={ENTRY_PROPERTIES_CODE} />
      </div>
    </section>
  );
}
