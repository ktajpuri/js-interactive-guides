export function ToggleSwitch({ checked, onChange, label, description, activeColor = 'bg-green-600', disabled = false }) {
  const handleKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKey}
        className={`mt-0.5 w-10 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? activeColor : 'bg-gray-700'
        }`}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      {(label || description) && (
        <div className={disabled ? 'opacity-50' : 'cursor-pointer'} onClick={() => !disabled && onChange(!checked)}>
          {label && <div className="text-sm text-gray-200" aria-hidden="true">{label}</div>}
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
      )}
    </div>
  );
}
