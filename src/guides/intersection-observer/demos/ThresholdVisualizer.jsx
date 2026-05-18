import { useRef, useState, useMemo, useEffect } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { THRESHOLD_CODE } from '../data/demoCode';

const PRESET_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];

export default function ThresholdVisualizer() {
  const targetRef = useRef(null);
  const [mode, setMode] = useState('single'); // 'single' | 'multiple'
  const [singleValue, setSingleValue] = useState(0.5);
  const [selectedPresets, setSelectedPresets] = useState([0, 0.5, 1]);
  const [log, setLog] = useState([]);

  const threshold = useMemo(() => {
    if (mode === 'single') return singleValue;
    return selectedPresets.length ? selectedPresets : 0;
  }, [mode, singleValue, selectedPresets]);

  const entry = useIntersectionObserver(targetRef, { threshold });

  // Append to log when entry changes
  useEffect(() => {
    if (!entry) return;
    setLog(prev => {
      const item = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString('en', { hour12: false }),
        ratio: entry.intersectionRatio.toFixed(3),
        isIntersecting: entry.isIntersecting,
      };
      return [item, ...prev].slice(0, 20);
    });
  }, [entry]);

  const togglePreset = (val) => {
    setSelectedPresets(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val].sort((a, b) => a - b)
    );
  };

  const ratio = entry?.intersectionRatio ?? 0;
  const isIntersecting = entry?.isIntersecting ?? false;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-purple-900/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-purple-800/50">
          Demo 2
        </div>
        <h1 className="text-3xl font-bold text-white">Threshold Visualizer</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          The <code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-sm">threshold</code> option
          controls <em>when</em> the observer callback fires — not what happens when it fires.
          A single value fires once. An array fires at each boundary crossing.
          Adjust the threshold and scroll to see callbacks trigger in the log.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {['single', 'multiple'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {m === 'single' ? 'Single Threshold' : 'Multiple Thresholds'}
            </button>
          ))}
        </div>

        {mode === 'single' ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Threshold value</span>
              <span className="font-mono text-purple-400 font-bold">{singleValue.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={singleValue}
              onChange={e => setSingleValue(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>0 (any pixel)</span>
              <span>0.5 (half visible)</span>
              <span>1 (fully visible)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-400">Select thresholds (callback fires at each)</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_THRESHOLDS.map(val => (
                <button
                  key={val}
                  onClick={() => togglePreset(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                    selectedPresets.includes(val)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600 font-mono">
              threshold: [{selectedPresets.join(', ')}]
            </div>
          </div>
        )}
      </div>

      {/* Demo + Log */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Scrollable demo */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Demo</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              isIntersecting ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              ratio: {ratio.toFixed(3)}
            </span>
          </div>
          <div className="h-80 overflow-y-auto p-4">
            <div className="h-32 flex items-center justify-center text-gray-600 text-xs border border-dashed border-gray-700 rounded-lg mb-4">
              scroll down
            </div>
            <div
              ref={targetRef}
              className="rounded-xl p-6 text-center transition-all duration-200 border-2"
              style={{
                background: isIntersecting
                  ? `rgba(168,85,247,${0.1 + ratio * 0.3})`
                  : 'rgba(55,65,81,0.3)',
                borderColor: isIntersecting
                  ? `rgba(168,85,247,${0.5 + ratio * 0.5})`
                  : '#374151',
              }}
            >
              <div className="text-2xl font-bold text-white mb-1">Target</div>
              <div className="text-sm text-gray-400">
                {(ratio * 100).toFixed(0)}% visible
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-100"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
              {/* Threshold markers */}
              {mode === 'multiple' && (
                <div className="mt-3 flex justify-between text-xs text-gray-600 relative h-2">
                  {selectedPresets.map(t => (
                    <div
                      key={t}
                      className="absolute top-0 bottom-0 w-0.5 bg-purple-400 opacity-60"
                      style={{ left: `${t * 100}%` }}
                      title={`Threshold: ${t}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="h-32 flex items-center justify-center text-gray-600 text-xs border border-dashed border-gray-700 rounded-lg mt-4">
              scroll up
            </div>
          </div>
        </div>

        {/* Event log */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Callback Log</h2>
            <button
              onClick={() => setLog([])}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-1.5 font-mono text-xs">
            {log.length === 0 && (
              <div className="text-gray-600 text-center mt-8">
                Scroll the demo to trigger callbacks
              </div>
            )}
            {log.map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                <span className="text-gray-600 flex-shrink-0">{item.time}</span>
                <span className={item.isIntersecting ? 'text-green-400' : 'text-red-400'}>
                  {item.isIntersecting ? '▲ enter' : '▼ leave'}
                </span>
                <span className="text-yellow-400">ratio: {item.ratio}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={THRESHOLD_CODE} />
      </div>
    </section>
  );
}
