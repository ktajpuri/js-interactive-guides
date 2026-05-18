import { useState, useRef } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { FCP_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 1800, poor: 3000 };

const RESOURCES = [
  { id: 'css',       label: 'Large render-blocking CSS',      delta: 800,   bad: true,  tip: 'Inline critical CSS, defer the rest' },
  { id: 'script',    label: 'Sync <script> in <head>',        delta: 1200,  bad: true,  tip: 'Use defer or async attributes' },
  { id: 'analytics', label: 'Third-party analytics script',   delta: 600,   bad: true,  tip: 'Load 3rd-party scripts with async' },
  { id: 'font',      label: 'Font preloading (good practice)', delta: -200,  bad: false, tip: '<link rel="preload" as="font">' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function FCPDemo() {
  const [enabled, setEnabled] = useState({ css: false, script: false, analytics: false, font: false });
  const [phase, setPhase] = useState('idle');
  const [waterfall, setWaterfall] = useState([]);
  const [fcpValue, setFcpValue] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);

  const toggle = (id) => setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  const simulate = async () => {
    setPhase('running');
    setWaterfall([]);
    setFcpValue(null);
    setContentVisible(false);

    const t0 = performance.now();
    const bars = [];

    // Base TTFB
    const ttfbDuration = 120;
    await sleep(ttfbDuration);
    bars.push({ label: 'TTFB', duration: ttfbDuration, color: 'bg-blue-500' });
    setWaterfall([...bars]);

    // Blocking resources
    for (const r of RESOURCES) {
      if (r.delta > 0 && enabled[r.id]) {
        await sleep(r.delta);
        bars.push({ label: r.label, duration: r.delta, color: 'bg-red-500' });
        setWaterfall([...bars]);
      }
    }

    // Font preload benefit (negative delta applied as reduction)
    const fontBoost = enabled.font ? 200 : 0;
    if (fontBoost > 0) {
      bars.push({ label: 'Font preload (saved)', duration: fontBoost, color: 'bg-green-500' });
      setWaterfall([...bars]);
    }

    // FCP
    const parseDuration = 80;
    await sleep(parseDuration - Math.min(fontBoost, 80));
    setContentVisible(true);

    const fcp = Math.round(performance.now() - t0);
    setFcpValue(fcp);
    bars.push({ label: 'FCP', duration: parseDuration, color: 'bg-yellow-500' });
    setWaterfall([...bars]);
    setPhase('done');
  };

  const reset = () => { setPhase('idle'); setWaterfall([]); setFcpValue(null); setContentVisible(false); };

  const totalDuration = waterfall.reduce((s, b) => s + Math.abs(b.duration), 0) || 1;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 4</div>
        <h1 className="text-3xl font-bold text-white">FCP — First Contentful Paint</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          FCP measures when the browser first renders <strong className="text-white">any content</strong> — text, image, SVG, or canvas.
          Render-blocking resources in <code className="bg-gray-800 text-green-300 px-1 rounded">&lt;head&gt;</code> prevent the browser from painting until they finish downloading and executing.
          Toggle resources to see their impact on the waterfall.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Configure Resources</h2>
        <div className="space-y-3">
          {RESOURCES.map(r => (
            <label key={r.id} className="flex items-center gap-4 cursor-pointer group">
              <div
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${enabled[r.id] ? (r.bad ? 'bg-red-600' : 'bg-green-600') : 'bg-gray-700'}`}
                onClick={() => toggle(r.id)}
              >
                <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${enabled[r.id] ? 'translate-x-4' : ''}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-200">{r.label}</span>
                  <span className={`text-xs font-mono font-bold ${r.bad ? 'text-red-400' : 'text-green-400'}`}>
                    {r.bad ? `+${r.delta}ms` : `−${Math.abs(r.delta)}ms`}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{r.tip}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={simulate} disabled={phase === 'running'}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {phase === 'running' ? 'Simulating…' : 'Simulate Page Boot'}
          </button>
          {phase !== 'idle' && (
            <button onClick={reset} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">Reset</button>
          )}
        </div>
      </div>

      {/* Waterfall */}
      {waterfall.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Resource Waterfall</h2>
          {waterfall.map((bar, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-52 text-xs text-gray-400 truncate flex-shrink-0">{bar.label}</div>
              <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-300 ${bar.color}`}
                  style={{ width: `${(Math.abs(bar.duration) / totalDuration) * 100}%` }}
                />
              </div>
              <div className="text-xs font-mono text-gray-500 w-14 text-right flex-shrink-0">{bar.duration}ms</div>
            </div>
          ))}
        </div>
      )}

      {/* Mock page */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
          <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/60"/><div className="w-3 h-3 rounded-full bg-yellow-500/60"/><div className="w-3 h-3 rounded-full bg-green-500/60"/></div>
          <div className="flex-1 bg-gray-800 rounded text-xs text-gray-500 px-3 py-1 font-mono">https://example.com</div>
        </div>
        <div className="p-6 min-h-[140px] flex items-center justify-center">
          {!contentVisible && phase === 'idle' && <div className="text-gray-600 text-sm">Press "Simulate Page Boot" — page will be blank until FCP</div>}
          {!contentVisible && phase === 'running' && <div className="text-gray-700 text-sm animate-pulse">Blank screen — blocked by render-blocking resources…</div>}
          {contentVisible && (
            <div className="w-full animate-fadeIn space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
              <div className="text-xs text-green-400 mt-2">← First Contentful Paint!</div>
            </div>
          )}
        </div>
      </div>

      <MetricGauge value={fcpValue} unit="ms" thresholds={THRESHOLDS} label="Simulated FCP" max={4000} />

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={FCP_CODE} />
      </div>
    </section>
  );
}
