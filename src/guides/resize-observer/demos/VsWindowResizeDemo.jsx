import { useState, useEffect, useRef, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { VS_RESIZE_CODE } from '../data/demoCode';

function PanelCard({ title, subtitle, count, lastInfo, flash, accentClass, borderClass, badgeClass, children }) {
  return (
    <div
      className={`bg-gray-900 rounded-xl p-5 border transition-all duration-200 ${borderClass} ${flash ? 'ring-2 ring-offset-2 ring-offset-gray-950' : ''}`}
      style={{ boxShadow: flash ? undefined : 'none' }}
    >
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${badgeClass}`}>
        {title}
      </div>
      <div className={`text-4xl font-bold font-mono mb-1 ${accentClass}`}>{count}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">callbacks fired</div>
      {lastInfo && <div className="text-xs text-gray-400 mt-2 font-mono truncate">{lastInfo}</div>}
      <div className="text-xs text-gray-600 mt-2">{subtitle}</div>
      {children}
    </div>
  );
}

export default function VsWindowResizeDemo() {
  const [targetWidth, setTargetWidth] = useState(300);
  const [windowCount, setWindowCount] = useState(0);
  const [windowLastTs, setWindowLastTs] = useState(null);
  const [roCount, setRoCount] = useState(0);
  const [roLastDims, setRoLastDims] = useState(null);
  const [windowFlash, setWindowFlash] = useState(false);
  const [roFlash, setRoFlash] = useState(false);
  const targetRef = useRef(null);
  const windowFlashTimer = useRef(null);
  const roFlashTimer = useRef(null);

  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">
        ResizeObserver is not supported in this browser.
      </div>
    );
  }

  const triggerWindowFlash = useCallback(() => {
    setWindowFlash(true);
    clearTimeout(windowFlashTimer.current);
    windowFlashTimer.current = setTimeout(() => setWindowFlash(false), 400);
  }, []);

  const triggerRoFlash = useCallback(() => {
    setRoFlash(true);
    clearTimeout(roFlashTimer.current);
    roFlashTimer.current = setTimeout(() => setRoFlash(false), 400);
  }, []);

  useEffect(() => {
    const handler = () => {
      setWindowCount(c => c + 1);
      setWindowLastTs(new Date().toLocaleTimeString());
      triggerWindowFlash();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [triggerWindowFlash]);

  useEffect(() => {
    if (!targetRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRoCount(c => c + 1);
      setRoLastDims(`${Math.round(width)} × ${Math.round(height)}px`);
      triggerRoFlash();
    });
    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [triggerRoFlash]);

  const sliderMoves = useRef(0);
  const handleSlider = (val) => {
    sliderMoves.current += 1;
    setTargetWidth(val);
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-purple-900/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-purple-800/50">
          Demo 3
        </div>
        <h1 className="text-3xl font-bold text-white">ResizeObserver vs window resize</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          <code className="text-yellow-300 text-sm">window.addEventListener('resize', ...)</code> only fires when the <strong className="text-white">browser window</strong> resizes.
          ResizeObserver fires for <strong className="text-white">any element size change</strong> — regardless of cause.
          Use the slider below to resize the target element without touching the browser window.
        </p>
      </header>

      {/* Target element with slider */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Target Element (observed by both)</h2>
        <div className="flex justify-center py-2">
          <div
            ref={targetRef}
            style={{ width: targetWidth + 'px' }}
            className="h-16 bg-purple-900/30 border-2 border-purple-600/50 rounded-lg flex items-center justify-center transition-all duration-75"
          >
            <span className="text-purple-300 text-xs font-mono select-none">{targetWidth}px wide</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Element width (drag without resizing window)</span>
            <span className="font-mono text-purple-400 font-bold">{targetWidth}px</span>
          </div>
          <input
            type="range" min={100} max={550} step={1} value={targetWidth}
            onChange={e => handleSlider(Number(e.target.value))}
            className="w-full accent-purple-500"
            aria-label="Target element width"
          />
        </div>
      </div>

      {/* Side-by-side panels */}
      <div className="grid md:grid-cols-2 gap-4">
        <PanelCard
          title="window resize event"
          subtitle="Resize your browser window to trigger this counter"
          count={windowCount}
          lastInfo={windowLastTs ? `Last at ${windowLastTs}` : 'No events yet'}
          flash={windowFlash}
          accentClass="text-yellow-400"
          borderClass={windowFlash ? 'border-yellow-500' : 'border-gray-800'}
          badgeClass="bg-yellow-900/40 text-yellow-400"
        >
          <div className="mt-3 text-xs text-gray-600 italic">
            Slider does not affect this counter
          </div>
        </PanelCard>

        <PanelCard
          title="ResizeObserver"
          subtitle="Fires for any size change to the element above"
          count={roCount}
          lastInfo={roLastDims ? `Last: ${roLastDims}` : 'No events yet'}
          flash={roFlash}
          accentClass="text-purple-400"
          borderClass={roFlash ? 'border-purple-500' : 'border-gray-800'}
          badgeClass="bg-purple-900/40 text-purple-400"
        />
      </div>

      {/* Key insight */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-400 leading-relaxed">
          <strong className="text-white">Key insight:</strong>{' '}
          Every slider move increments the ResizeObserver counter. The window resize counter stays at 0 until you resize the browser window.
          {roCount > 0 && windowCount === 0 && (
            <span className="text-purple-300">
              {' '}Right now: <span className="font-mono">{roCount}</span> slider change{roCount !== 1 ? 's' : ''} = <span className="font-mono">{roCount}</span> ResizeObserver callback{roCount !== 1 ? 's' : ''}, 0 window resize events.
            </span>
          )}
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={VS_RESIZE_CODE} />
      </div>
    </section>
  );
}
