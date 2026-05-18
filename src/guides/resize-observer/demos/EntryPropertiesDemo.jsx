import { useState, useEffect, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ENTRY_PROPERTIES_CODE } from '../data/demoCode';

function PropValue({ value, colorClass }) {
  return (
    <span className={`font-mono font-bold text-sm ${colorClass}`}>
      {typeof value === 'number' ? value.toFixed(1) : value}
    </span>
  );
}

function PropRow({ label, value, colorClass }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <PropValue value={value} colorClass={colorClass} />
    </div>
  );
}

export default function EntryPropertiesDemo() {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [entry, setEntry] = useState(null);
  const [callCount, setCallCount] = useState(0);

  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">
        ResizeObserver is not supported in this browser.
      </div>
    );
  }

  useEffect(() => {
    if (!boxRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const e = entries[0];
      setEntry(e);
      setCallCount(c => c + 1);
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  const cr = entry?.contentRect;
  const bbs = entry?.borderBoxSize?.[0];
  const cbs = entry?.contentBoxSize?.[0];

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-purple-900/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-purple-800/50">
          Demo 1
        </div>
        <h1 className="text-3xl font-bold text-white">Entry Properties Explorer</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Every ResizeObserver callback receives an array of <strong className="text-white">ResizeObserverEntry</strong> objects.
          Use the sliders to resize the observed element and watch the entry properties update in real time.
          <br />
          <span className="text-blue-400">contentRect</span> excludes padding/border.{' '}
          <span className="text-green-400">borderBoxSize</span> includes padding + border.{' '}
          <span className="text-purple-400">contentBoxSize</span> = contentRect in logical (writing-mode-aware) coordinates.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Resize Controls</h2>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Width</span>
            <span className="font-mono text-purple-400 font-bold">{width}px</span>
          </div>
          <input
            type="range" min={150} max={500} step={1} value={width}
            onChange={e => setWidth(Number(e.target.value))}
            className="w-full accent-purple-500"
            aria-label="Element width"
          />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Height</span>
            <span className="font-mono text-purple-400 font-bold">{height}px</span>
          </div>
          <input
            type="range" min={150} max={500} step={1} value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="w-full accent-purple-500"
            aria-label="Element height"
          />
        </div>
      </div>

      {/* Observed box + live properties */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Observed element */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Observed Element</h2>
            <span className="text-xs text-purple-400 font-mono">callbacks: {callCount}</span>
          </div>
          <div className="flex items-start justify-center min-h-[220px] pt-2">
            <div
              ref={boxRef}
              style={{ width: width + 'px', height: height + 'px' }}
              className="bg-purple-900/20 border-2 border-purple-600/60 rounded-lg flex items-center justify-center transition-all duration-75"
            >
              <span className="text-purple-300 text-sm font-mono select-none">
                {width} × {height}
              </span>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-4">
          {/* contentRect */}
          <div className="bg-gray-900 rounded-xl p-4 border border-blue-800/40">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">contentRect</h3>
            {cr ? (
              <div>
                <PropRow label="width"  value={cr.width}  colorClass="text-blue-400" />
                <PropRow label="height" value={cr.height} colorClass="text-blue-400" />
                <PropRow label="top"    value={cr.top}    colorClass="text-blue-400" />
                <PropRow label="left"   value={cr.left}   colorClass="text-blue-400" />
                <PropRow label="right"  value={cr.right}  colorClass="text-blue-400" />
                <PropRow label="bottom" value={cr.bottom} colorClass="text-blue-400" />
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Waiting for first callback…</p>
            )}
          </div>

          {/* borderBoxSize */}
          <div className="bg-gray-900 rounded-xl p-4 border border-green-800/40">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">borderBoxSize[0]</h3>
            {bbs ? (
              <div>
                <PropRow label="inlineSize" value={bbs.inlineSize} colorClass="text-green-400" />
                <PropRow label="blockSize"  value={bbs.blockSize}  colorClass="text-green-400" />
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Waiting for first callback…</p>
            )}
          </div>

          {/* contentBoxSize */}
          <div className="bg-gray-900 rounded-xl p-4 border border-purple-800/40">
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">contentBoxSize[0]</h3>
            {cbs ? (
              <div>
                <PropRow label="inlineSize" value={cbs.inlineSize} colorClass="text-purple-400" />
                <PropRow label="blockSize"  value={cbs.blockSize}  colorClass="text-purple-400" />
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Waiting for first callback…</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={ENTRY_PROPERTIES_CODE} />
      </div>
    </section>
  );
}
