export function LabeledSlider({ label, value, min, max, step = 1, onChange, formatValue, unit = '', accentClass = 'accent-green-500', markers }) {
  const display = formatValue ? formatValue(value) : value;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-green-400 font-bold">{display}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full ${accentClass}`}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      {markers && (
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          {markers.map((m, i) => <span key={i}>{m}</span>)}
        </div>
      )}
    </div>
  );
}
