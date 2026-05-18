import { useState, useRef } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { INP_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 200, poor: 500 };

function blockMainThread(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) { /* intentionally blocks */ }
}

function measureINP(t0, callback) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    callback(Math.round(performance.now() - t0));
  }));
}

export default function INPDemo() {
  const [blockingMs, setBlockingMs] = useState(300);
  const [fastColor, setFastColor] = useState(false);
  const [slowColor, setSlowColor] = useState(false);
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [worstINP, setWorstINP] = useState(null);

  const handleFast = () => {
    const t0 = performance.now();
    setFastColor(v => !v);
    measureINP(t0, (inp) => {
      const entry = { id: Date.now(), type: 'Fast', ms: inp };
      setHistory(prev => [entry, ...prev].slice(0, 8));
      setWorstINP(prev => prev === null ? inp : Math.max(prev, inp));
    });
  };

  const handleSlow = () => {
    if (blockingMs > 0) setStatus('Working…');
    const t0 = performance.now();
    blockMainThread(blockingMs);
    setSlowColor(v => !v);
    setStatus('');
    measureINP(t0, (inp) => {
      const entry = { id: Date.now(), type: 'Sluggish', ms: inp };
      setHistory(prev => [entry, ...prev].slice(0, 8));
      setWorstINP(prev => prev === null ? inp : Math.max(prev, inp));
    });
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 3</div>
        <h1 className="text-3xl font-bold text-white">INP — Interaction to Next Paint</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          INP measures the time from user interaction (click, key, tap) to when the browser paints the next frame.
          High INP means the page feels unresponsive. The cause: <strong className="text-white">long JavaScript tasks blocking the main thread</strong> after an interaction.
          Click both buttons and compare the measured delay.
        </p>
        <div className="mt-3 px-4 py-2.5 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-sm text-yellow-300">
          ⚠️ The "Sluggish" button intentionally freezes the page for {blockingMs}ms — this is what high INP feels like.
        </div>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Blocking work duration</span>
            <span className="font-mono text-green-400 font-bold">{blockingMs}ms</span>
          </div>
          <input type="range" min="0" max="1000" step="50" value={blockingMs}
            onChange={e => setBlockingMs(Number(e.target.value))}
            className="w-full accent-green-500" />
          <div className="flex justify-between text-xs text-gray-600">
            <span>0ms (instant)</span><span>500ms (poor)</span><span>1000ms (very poor)</span>
          </div>
        </div>
      </div>

      {/* Buttons side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <div className="text-xs font-semibold text-green-400 uppercase tracking-widest">Responsive Button</div>
          <button onClick={handleFast}
            className={`w-full py-6 rounded-xl text-lg font-bold transition-all duration-100 border-2 ${fastColor ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-600'}`}>
            Click Me
          </button>
          <p className="text-xs text-gray-500">No blocking work. Paint happens immediately after setState.</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-widest">Sluggish Button ({blockingMs}ms block)</div>
          <button onClick={handleSlow}
            className={`w-full py-6 rounded-xl text-lg font-bold transition-all duration-100 border-2 ${slowColor ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-600'}`}>
            {status || 'Click Me'}
          </button>
          <p className="text-xs text-gray-500">Runs a synchronous blocking loop before updating. You'll feel the freeze.</p>
        </div>
      </div>

      {/* Click history + worst INP */}
      <div className="grid md:grid-cols-2 gap-4">
        <MetricGauge value={worstINP} unit="ms" thresholds={THRESHOLDS} label="Worst INP (max observed)" max={1100} />
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Click History</span>
            <button onClick={() => { setHistory([]); setWorstINP(null); }} className="text-xs text-gray-600 hover:text-white transition-colors">Clear</button>
          </div>
          <div className="h-48 overflow-y-auto divide-y divide-gray-800/50">
            {history.length === 0 && <div className="text-center text-gray-600 text-sm py-8">Click a button to measure INP</div>}
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-2.5">
                <span className={`text-xs font-medium ${item.type === 'Fast' ? 'text-green-400' : 'text-red-400'}`}>{item.type}</span>
                <span className={`text-sm font-mono font-bold ${item.ms <= 200 ? 'text-green-400' : item.ms <= 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {item.ms}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={INP_CODE} />
      </div>
    </section>
  );
}
