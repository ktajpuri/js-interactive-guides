import { useState, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { PIPELINE_MAP_CODE } from '../data/demoCode';

const PROPERTIES = [
  { name: 'transform',        triggers: ['composite'],                    cost: 'cheap',     value: 'translateX(40px) rotate(15deg)' },
  { name: 'opacity',          triggers: ['composite'],                    cost: 'cheap',     value: '0.4' },
  { name: 'filter',           triggers: ['composite'],                    cost: 'medium',    value: 'blur(3px)' },
  { name: 'color',            triggers: ['paint', 'composite'],           cost: 'medium',    value: '#22d3ee' },
  { name: 'background-color', triggers: ['paint', 'composite'],           cost: 'medium',    value: '#0ea5e9' },
  { name: 'border-color',     triggers: ['paint', 'composite'],           cost: 'medium',    value: '#f43f5e' },
  { name: 'box-shadow',       triggers: ['paint', 'composite'],           cost: 'expensive', value: '0 0 24px rgba(244,63,94,0.8)' },
  { name: 'border-radius',    triggers: ['paint', 'composite'],           cost: 'medium',    value: '40%' },
  { name: 'visibility',       triggers: ['paint', 'composite'],           cost: 'cheap',     value: 'hidden' },
  { name: 'width',            triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '180px' },
  { name: 'height',           triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '100px' },
  { name: 'top',              triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '24px' },
  { name: 'left',             triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '40px' },
  { name: 'margin',           triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '20px' },
  { name: 'padding',          triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '24px' },
  { name: 'font-size',        triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '22px' },
  { name: 'font-weight',      triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '900' },
  { name: 'line-height',      triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: '2.5' },
  { name: 'display',          triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: 'inline-block' },
  { name: 'position',         triggers: ['layout', 'paint', 'composite'], cost: 'expensive', value: 'relative' },
];

export default function PipelineMapDemo() {
  const [active, setActive] = useState(null);
  const [flashCounts, setFlashCounts] = useState({ layout: 0, paint: 0, composite: 0 });
  const victimRef = useRef(null);

  function handlePropertyClick(prop) {
    setActive(prop);
    if (victimRef.current) {
      victimRef.current.removeAttribute('style');
      victimRef.current.style[prop.name.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = prop.value;
    }
    setFlashCounts(prev => ({
      layout:    prop.triggers.includes('layout')    ? prev.layout + 1    : prev.layout,
      paint:     prop.triggers.includes('paint')     ? prev.paint + 1     : prev.paint,
      composite: prop.triggers.includes('composite') ? prev.composite + 1 : prev.composite,
    }));
  }

  function handleReset() {
    setActive(null);
    if (victimRef.current) victimRef.current.removeAttribute('style');
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes stageFlash {
          0%   { transform: scale(1.05); box-shadow: 0 0 16px currentColor; }
          100% { transform: scale(1); box-shadow: none; }
        }
      `}</style>

      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-900/40 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">Demo 1</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Pipeline Trigger Map</h2>
        <p className="text-sm text-gray-400">
          Click any CSS property to see which rendering pipeline stages it triggers — and watch a live element update with that property applied.
        </p>
      </div>

      {/* Two-column card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left: Live victim panel */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Live preview</div>
          <div
            className="relative flex items-center justify-center rounded-lg border border-gray-800"
            style={{ minHeight: '180px', background: 'rgb(3,7,18)' }}
          >
            <div
              ref={victimRef}
              className="w-24 h-16 rounded-lg bg-amber-500 flex items-center justify-center text-white text-sm font-bold transition-none"
            >
              Element
            </div>
          </div>
          <div className="mt-3 font-mono text-xs text-gray-500 min-h-[20px]">
            {active ? (
              <><span className="text-amber-400">{active.name}</span>: <span className="text-white">{active.value}</span></>
            ) : (
              <span className="text-gray-700">← click a property to preview it</span>
            )}
          </div>
          <button
            onClick={handleReset}
            className="mt-3 text-xs border border-gray-700 text-gray-400 px-3 py-1 rounded hover:border-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Right: Pipeline diagram */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="text-xs text-gray-500 uppercase mb-3">Pipeline stages triggered</div>
          <div className="flex gap-3 items-center">
            {/* LAYOUT */}
            <div
              key={flashCounts.layout}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition-all duration-300 ${active?.triggers.includes('layout') ? 'border-red-400 bg-red-900/50' : 'border-red-700/40 bg-red-950/20'}`}
              style={active?.triggers.includes('layout') ? { animation: 'stageFlash 700ms ease-out' } : {}}
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${active?.triggers.includes('layout') ? 'bg-red-500' : 'bg-gray-700'}`} />
              <div className={`text-sm font-bold uppercase tracking-wider ${active?.triggers.includes('layout') ? 'text-red-300' : 'text-gray-600'}`}>Layout</div>
            </div>

            <span className="text-gray-600 text-lg">→</span>

            {/* PAINT */}
            <div
              key={flashCounts.paint}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition-all duration-300 ${active?.triggers.includes('paint') ? 'border-yellow-400 bg-yellow-900/50' : 'border-yellow-700/40 bg-yellow-950/20'}`}
              style={active?.triggers.includes('paint') ? { animation: 'stageFlash 700ms ease-out' } : {}}
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${active?.triggers.includes('paint') ? 'bg-yellow-500' : 'bg-gray-700'}`} />
              <div className={`text-sm font-bold uppercase tracking-wider ${active?.triggers.includes('paint') ? 'text-yellow-300' : 'text-gray-600'}`}>Paint</div>
            </div>

            <span className="text-gray-600 text-lg">→</span>

            {/* COMPOSITE */}
            <div
              key={flashCounts.composite}
              className={`flex-1 rounded-lg border-2 p-4 text-center transition-all duration-300 ${active?.triggers.includes('composite') ? 'border-green-400 bg-green-900/50' : 'border-green-700/40 bg-green-950/20'}`}
              style={active?.triggers.includes('composite') ? { animation: 'stageFlash 700ms ease-out' } : {}}
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${active?.triggers.includes('composite') ? 'bg-green-500' : 'bg-gray-700'}`} />
              <div className={`text-sm font-bold uppercase tracking-wider ${active?.triggers.includes('composite') ? 'text-green-300' : 'text-gray-600'}`}>Composite</div>
            </div>
          </div>

          {/* Summary line */}
          <div className="mt-4 text-xs text-gray-400">
            {!active ? (
              <span className="text-gray-600">Select a property above to see which stages fire.</span>
            ) : (
              <span>
                ⬆ <span className="font-mono text-amber-400">{active.name}</span> fires {active.triggers.join(' + ')}
                {' '}
                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                  active.cost === 'cheap' ? 'bg-green-900/40 text-green-400' :
                  active.cost === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-red-900/40 text-red-400'
                }`}>{active.cost}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Property picker card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-gray-500 uppercase mb-3">CSS properties — click to test</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROPERTIES.map(prop => (
            <button
              key={prop.name}
              onClick={() => handlePropertyClick(prop)}
              className={`p-2 rounded text-left border transition-colors text-xs ${
                active?.name === prop.name
                  ? 'border-amber-500 bg-amber-900/30'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="font-mono text-gray-200 truncate">{prop.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${prop.triggers.includes('layout') ? 'bg-red-500' : 'bg-gray-700'}`} />
                <div className={`w-2 h-2 rounded-full ${prop.triggers.includes('paint') ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                <div className={`w-2 h-2 rounded-full ${prop.triggers.includes('composite') ? 'bg-green-500' : 'bg-gray-700'}`} />
                <span className={`ml-auto text-xs px-1 rounded ${
                  prop.cost === 'cheap' ? 'bg-green-900/40 text-green-400' :
                  prop.cost === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-red-900/40 text-red-400'
                }`}>{prop.cost}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Layout</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Paint</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Composite</span>
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 text-sm text-gray-300">
        Of the 20 most-used CSS properties, 12 trigger Layout — the most expensive stage.{' '}
        <strong className="text-white"><code>transform</code> and <code>opacity</code></strong> are the only "free" animations: they skip Layout AND Paint, going straight to the compositor on the GPU. That's why every smooth UI library animates with{' '}
        <strong className="text-white"><code>transform: translate3d()</code></strong> instead of{' '}
        <strong className="text-white"><code>top</code>/<code>left</code></strong>.
      </div>

      <CodeBlock code={PIPELINE_MAP_CODE} />
    </div>
  );
}
