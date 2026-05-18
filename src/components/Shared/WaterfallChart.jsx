export function WaterfallChart({ bars, maxValue, unit = 'ms', labelWidth = 'w-32', animated = false }) {
  const max = maxValue ?? (bars.reduce((s, b) => s + b.value, 0) || 1);

  return (
    <div className="space-y-2">
      {bars.map((bar, i) => (
        <div key={bar.id ?? i} className={`flex items-center gap-3 ${animated ? 'animate-fadeIn' : ''}`}>
          <div className={`${labelWidth} text-xs text-gray-400 flex-shrink-0 truncate`}>{bar.label}</div>
          <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-300 ${bar.color}`}
              style={{ width: `${(bar.value / max) * 100}%` }}
            />
          </div>
          <div className="text-xs font-mono text-gray-500 w-16 text-right flex-shrink-0">
            {bar.value}{unit}
          </div>
        </div>
      ))}
    </div>
  );
}
