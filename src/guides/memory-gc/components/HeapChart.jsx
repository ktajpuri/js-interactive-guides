import { formatMB } from '../hooks/useHeapMonitor';

const CHART_HEIGHT = 140;
const Y_PADDING = 10;

export default function HeapChart({ samples, current, peak, available }) {
  if (!available) {
    return (
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 text-center">
        <div className="text-yellow-400 text-sm font-medium mb-1">⚠ Heap profiling unavailable</div>
        <div className="text-xs text-gray-500">
          <code className="text-gray-400">performance.memory</code> is only exposed in
          Chromium-based browsers (Chrome, Edge, Brave). Open this demo in Chrome to see live heap data.
        </div>
      </div>
    );
  }

  if (samples.length === 0) {
    return (
      <div className="bg-gray-950 border border-gray-800 rounded-lg h-[140px] flex items-center justify-center text-xs text-gray-600">
        Sampling heap…
      </div>
    );
  }

  // Y-axis scaling: 0 to (peak * 1.15) so the line never touches the top
  const yMax = Math.max(peak * 1.15, current * 1.15, 10 * 1024 * 1024);
  const yMin = 0;

  const points = samples.map((v, i) => {
    const x = (i / Math.max(1, samples.length - 1)) * 100; // 0–100%
    const y = ((yMax - v) / (yMax - yMin)) * (CHART_HEIGHT - Y_PADDING * 2) + Y_PADDING;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2 text-xs">
        <div>
          <span className="text-gray-500">Current: </span>
          <span className="text-white font-mono font-bold">{formatMB(current)} MB</span>
        </div>
        <div>
          <span className="text-gray-500">Peak: </span>
          <span className="text-rose-400 font-mono font-bold">{formatMB(peak)} MB</span>
        </div>
      </div>
      <svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Y-axis gridlines */}
        {[0.25, 0.5, 0.75].map(p => (
          <line
            key={p}
            x1="0" y1={CHART_HEIGHT * p}
            x2="100" y2={CHART_HEIGHT * p}
            stroke="#1f2937" strokeWidth="0.3" strokeDasharray="1,1"
          />
        ))}
        {/* Area fill under the line */}
        <polygon
          points={`0,${CHART_HEIGHT} ${points} 100,${CHART_HEIGHT}`}
          fill="rgba(244, 63, 94, 0.15)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="text-xs text-gray-600 mt-1 text-right">
        {(samples.length * 100 / 1000).toFixed(1)}s window
      </div>
    </div>
  );
}
