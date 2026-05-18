import { useState, useRef } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ToggleSwitch } from '../../../components/Shared/ToggleSwitch';
import { LCP_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 2500, poor: 4000 };
const NETWORK_MULTIPLIERS = { 'Fast 4G': 1, 'Slow 4G': 2.2, '3G': 4.5 };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function LCPDemo() {
  const [optimizedImage, setOptimizedImage] = useState(true);
  const [renderBlocking, setRenderBlocking] = useState(false);
  const [network, setNetwork] = useState('Fast 4G');
  const [phase, setPhase] = useState('idle');
  const [timeline, setTimeline] = useState([]);
  const [lcpValue, setLcpValue] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const startRef = useRef(null);

  const run = async () => {
    setPhase('running');
    setTimeline([]);
    setHeroVisible(false);
    setLcpValue(null);

    const mult = NETWORK_MULTIPLIERS[network];
    startRef.current = performance.now();
    const mark = (label, color) => {
      const t = Math.round(performance.now() - startRef.current);
      setTimeline(prev => [...prev, { label, t, color }]);
      return t;
    };

    await sleep(Math.round(120 * mult));
    mark('TTFB', 'bg-blue-500');

    if (renderBlocking) {
      await sleep(Math.round(1400 * mult));
      mark('Render-blocking JS', 'bg-red-500');
    }

    await sleep(Math.round(80 * mult));
    mark('FCP — first text', 'bg-yellow-500');

    const imgDelay = optimizedImage ? Math.round(300 * mult) : Math.round(2800 * mult);
    await sleep(imgDelay);
    setHeroVisible(true);
    const lcpT = mark('LCP — hero image', 'bg-green-500');

    setLcpValue(lcpT);
    setPhase('done');
  };

  const reset = () => { setPhase('idle'); setTimeline([]); setLcpValue(null); setHeroVisible(false); };
  const maxT = lcpValue ? Math.max(lcpValue * 1.1, 500) : 5000;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 1</div>
        <h1 className="text-3xl font-bold text-white">LCP — Largest Contentful Paint</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          LCP measures when the <strong className="text-white">largest above-the-fold element</strong> finishes rendering — usually a hero image or large heading. It's the most impactful Core Web Vital for perceived load speed. Toggle the factors below and simulate a page load to see how each one shifts LCP.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <ToggleSwitch
            checked={optimizedImage}
            onChange={setOptimizedImage}
            label="Optimized hero image"
            description={optimizedImage ? 'WebP, compressed (~300ms)' : 'Unoptimized PNG (~2800ms)'}
          />
          <ToggleSwitch
            checked={renderBlocking}
            onChange={setRenderBlocking}
            activeColor="bg-red-600"
            label="Render-blocking script"
            description={renderBlocking ? 'Adds ~1400ms before first paint' : 'No blocking resources'}
          />
          <div>
            <div className="text-sm font-medium text-gray-200 mb-2">Network speed</div>
            <div className="flex gap-2" role="group" aria-label="Network speed">
              {Object.keys(NETWORK_MULTIPLIERS).map(n => (
                <button key={n} onClick={() => setNetwork(n)}
                  aria-pressed={network === n}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${network === n ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={run} disabled={phase === 'running'}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400">
            {phase === 'running' ? 'Simulating…' : 'Simulate Page Load'}
          </button>
          {phase !== 'idle' && (
            <button onClick={reset} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">Reset</button>
          )}
        </div>
      </div>

      {/* Mock browser */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 bg-gray-800 rounded text-xs text-gray-500 px-3 py-1 font-mono">https://example.com</div>
        </div>
        <div className="p-6 min-h-[220px] relative">
          {phase === 'idle' && <div className="text-gray-600 text-sm text-center pt-10">Click "Simulate Page Load" to begin</div>}
          {phase !== 'idle' && (
            <div className="space-y-4">
              <div className="h-8 bg-gray-800 rounded-lg w-full animate-pulse" aria-hidden="true" />
              <div className={`rounded-xl overflow-hidden transition-all duration-300 ${heroVisible ? 'h-32' : 'h-32 bg-gray-800 animate-pulse'}`}>
                {heroVisible && (
                  <div className="h-full bg-gradient-to-br from-green-800 to-teal-700 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Hero Image — LCP element</span>
                  </div>
                )}
              </div>
              <div className="space-y-2" aria-hidden="true">
                <div className="h-4 bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Paint Timeline</h2>
          <div className="relative h-10 bg-gray-800 rounded-lg overflow-hidden mb-3" role="img" aria-label="Paint timeline visualization">
            {timeline.map((evt, i) => (
              <div key={i} className={`absolute top-0 bottom-0 w-0.5 ${evt.color}`} style={{ left: `${(evt.t / maxT) * 100}%` }}>
                <div className={`absolute -top-0.5 left-1 text-xs font-mono whitespace-nowrap ${evt.color.replace('bg-', 'text-')}`}>{evt.t}ms</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {timeline.map((evt, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${evt.color}`} aria-hidden="true" />
                <span>{evt.label}</span>
                <span className="font-mono text-gray-500">{evt.t}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MetricGauge value={lcpValue} unit="ms" thresholds={THRESHOLDS} label="Simulated LCP" max={6000} />

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={LCP_CODE} />
      </div>
    </section>
  );
}
