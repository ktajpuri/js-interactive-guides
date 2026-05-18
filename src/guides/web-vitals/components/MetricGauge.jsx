export function classifyMetric(value, thresholds) {
  if (value === null || value === undefined) return null;
  if (value <= thresholds.good) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-700/50', bar: 'bg-green-500' };
  if (value <= thresholds.poor) return { label: 'Needs Improvement', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/50', bar: 'bg-yellow-500' };
  return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-700/50', bar: 'bg-red-500' };
}

// thresholds: { good: number, poor: number }
// max: the value at which the bar is 100% full
export function MetricGauge({ value, unit = 'ms', thresholds, label, max }) {
  const cls = value !== null ? classifyMetric(value, thresholds) : null;
  const displayMax = max ?? thresholds.poor * 1.5;
  const pct = value !== null ? Math.min(100, (value / displayMax) * 100) : 0;
  const goodPct = (thresholds.good / displayMax) * 100;
  const poorPct = (thresholds.poor / displayMax) * 100;

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        {cls && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cls.bg} ${cls.color} ${cls.border}`}>
            {cls.label}
          </span>
        )}
      </div>

      <div className="flex items-end gap-3">
        <span className={`text-3xl font-bold font-mono ${cls?.color ?? 'text-gray-500'}`}>
          {value !== null && value !== undefined ? (Number.isInteger(value) ? value : value.toFixed(3)) : '—'}
        </span>
        <span className="text-gray-500 text-sm mb-1">{unit}</span>
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        {/* Zone markers */}
        <div className="absolute top-0 bottom-0 bg-green-900/30" style={{ left: 0, width: `${goodPct}%` }} />
        <div className="absolute top-0 bottom-0 bg-yellow-900/20" style={{ left: `${goodPct}%`, width: `${poorPct - goodPct}%` }} />
        <div className="absolute top-0 bottom-0 bg-red-900/20" style={{ left: `${poorPct}%`, right: 0 }} />
        {/* Value fill */}
        {value !== null && (
          <div
            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${cls?.bar ?? 'bg-gray-600'}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {/* Threshold ticks */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/20" style={{ left: `${goodPct}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/20" style={{ left: `${poorPct}%` }} />
      </div>

      {/* Threshold labels */}
      <div className="flex justify-between text-xs text-gray-600 font-mono">
        <span>0</span>
        <span className="text-green-700">{thresholds.good}{unit}</span>
        <span className="text-red-700">{thresholds.poor}{unit}</span>
        <span>{displayMax.toFixed(0)}{unit}</span>
      </div>
    </div>
  );
}
