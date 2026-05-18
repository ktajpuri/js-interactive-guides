import { useState } from 'react';
import { MetricGauge } from '../components/MetricGauge';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { ToggleSwitch } from '../../../components/Shared/ToggleSwitch';
import { WaterfallChart } from '../../../components/Shared/WaterfallChart';
import { TTFB_CODE } from '../data/demoCode';

const THRESHOLDS = { good: 800, poor: 1800 };

const PHASES = [
  { id: 'dns',    label: 'DNS Lookup',     base: 40,  color: 'bg-purple-500' },
  { id: 'tcp',    label: 'TCP Connect',    base: 30,  color: 'bg-blue-500' },
  { id: 'tls',    label: 'TLS Handshake',  base: 50,  color: 'bg-cyan-500' },
  { id: 'server', label: 'Server Process', base: 200, color: 'bg-orange-500' },
  { id: 'byte',   label: 'First Byte',     base: 20,  color: 'bg-green-500' },
];

const REGIONS = { 'Same region': 0, 'Cross-country': 80, 'Different continent': 280 };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function TTFBDemo() {
  const [cdn, setCdn] = useState(false);
  const [dbCache, setDbCache] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [region, setRegion] = useState('Same region');
  const [serverMs, setServerMs] = useState(300);
  const [phase, setPhase] = useState('idle');
  const [bars, setBars] = useState([]);
  const [ttfb, setTtfb] = useState(null);
  const [isWarm, setIsWarm] = useState(false);

  const simulate = async (warm = false) => {
    setPhase('running');
    setBars([]);
    setTtfb(null);

    const latency = REGIONS[region];
    const cdnBoost = cdn ? 0.4 : 1;
    const cacheBoost = dbCache ? 0.3 : 1;
    const coldPenalty = (coldStart && !warm) ? 900 : 0;

    const phaseDurations = [
      { ...PHASES[0], duration: Math.round((PHASES[0].base + latency * 0.4) * cdnBoost) },
      { ...PHASES[1], duration: Math.round((PHASES[1].base + latency * 0.3) * cdnBoost) },
      { ...PHASES[2], duration: Math.round((PHASES[2].base + latency * 0.2) * cdnBoost) },
      { ...PHASES[3], duration: Math.round((serverMs * cacheBoost) + coldPenalty) },
      { ...PHASES[4], duration: Math.round((PHASES[4].base + latency * 0.1) * cdnBoost) },
    ];

    let total = 0;
    const accumulated = [];
    for (const p of phaseDurations) {
      const delay = Math.min(p.duration, 600);
      await sleep(delay);
      total += p.duration;
      accumulated.push({ id: p.id, label: p.label, value: p.duration, color: p.color });
      setBars([...accumulated]);
    }

    setTtfb(total);
    setPhase('done');
    setIsWarm(true);
  };

  const reset = () => { setPhase('idle'); setBars([]); setTtfb(null); setIsWarm(false); };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">Demo 6</div>
        <h1 className="text-3xl font-bold text-white">TTFB — Time to First Byte</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          TTFB is the time from a request being sent to the <strong className="text-white">first byte of the server response</strong> arriving.
          It's the foundation — LCP, FCP, and all other metrics cannot be better than TTFB.
          Configure the server conditions and watch the waterfall animate phase by phase.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Server Configuration</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[
              { id: 'cdn',  label: 'CDN enabled',            desc: 'Serves from edge near user',      val: cdn,      set: setCdn },
              { id: 'db',   label: 'DB result cached',        desc: 'Avoids slow DB query',            val: dbCache,  set: setDbCache },
              { id: 'cold', label: 'Cold start (serverless)', desc: 'First request spin-up penalty',   val: coldStart, set: setColdStart },
            ].map(opt => (
              <ToggleSwitch
                key={opt.id}
                checked={opt.val}
                onChange={(v) => opt.set(v)}
                label={opt.label}
                description={opt.desc}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-200 mb-2">Geographic region</div>
              <div className="flex flex-col gap-1.5" role="group" aria-label="Geographic region">
                {Object.keys(REGIONS).map(r => (
                  <button key={r} onClick={() => setRegion(r)}
                    aria-pressed={region === r}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${region === r ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {r} {REGIONS[r] > 0 && <span className="text-xs opacity-70">(+{REGIONS[r]}ms latency)</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Server processing</span>
                <span className="font-mono text-green-400">{serverMs}ms</span>
              </div>
              <input type="range" min="50" max="3000" step="50" value={serverMs}
                onChange={e => setServerMs(Number(e.target.value))}
                className="w-full accent-green-500"
                aria-label="Server processing time"
                aria-valuenow={serverMs} aria-valuemin={50} aria-valuemax={3000} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => simulate(false)} disabled={phase === 'running'}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400">
            {phase === 'running' ? 'Requesting…' : 'Send Request'}
          </button>
          {isWarm && coldStart && (
            <button onClick={() => simulate(true)} disabled={phase === 'running'}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Repeat (warm server)
            </button>
          )}
          {phase !== 'idle' && (
            <button onClick={reset} disabled={phase === 'running'}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Waterfall */}
      {bars.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Request Waterfall</h2>
          <WaterfallChart bars={bars} animated />
          {ttfb && (
            <div className="pt-2 border-t border-gray-800 flex justify-between text-sm">
              <span className="text-gray-400">Total TTFB</span>
              <span className={`font-mono font-bold ${ttfb <= 800 ? 'text-green-400' : ttfb <= 1800 ? 'text-yellow-400' : 'text-red-400'}`}>{ttfb}ms</span>
            </div>
          )}
        </div>
      )}

      <MetricGauge value={ttfb} unit="ms" thresholds={THRESHOLDS} label="Simulated TTFB" max={3000} />

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={TTFB_CODE} />
      </div>
    </section>
  );
}
