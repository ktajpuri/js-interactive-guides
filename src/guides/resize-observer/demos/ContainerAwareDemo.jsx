import { useState, useEffect, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { CONTAINER_AWARE_CODE } from '../data/demoCode';

function ProductCard({ layoutMode }) {
  if (layoutMode === 'narrow') {
    return (
      <div className="flex flex-col items-center gap-3 p-3">
        <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">Image</span>
        </div>
        <div className="w-full space-y-1">
          <div className="text-white font-semibold text-sm leading-snug">Wireless Headphones</div>
          <div className="text-purple-400 font-bold text-sm">$79</div>
        </div>
      </div>
    );
  }

  if (layoutMode === 'medium') {
    return (
      <div className="flex gap-3 p-3 items-center">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">Image</span>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-white font-semibold text-sm">Wireless Headphones</div>
          <div className="text-gray-400 text-xs">Active noise cancellation</div>
          <div className="text-purple-400 font-bold text-sm">$79</div>
        </div>
      </div>
    );
  }

  // wide
  return (
    <div className="flex gap-4 p-4 items-start">
      <div className="w-32 h-32 flex-shrink-0 bg-gray-700 rounded-xl flex items-center justify-center">
        <span className="text-gray-400 text-xs">Image</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-white font-bold text-base">Wireless Headphones Pro</div>
        <div className="text-gray-400 text-sm leading-relaxed">
          Industry-leading active noise cancellation with 30-hour battery life and premium sound quality.
        </div>
        <div className="text-purple-400 font-bold text-lg">$79</div>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function ContainerAwareDemo() {
  const [containerWidth, setContainerWidth] = useState(400);
  const [layoutMode, setLayoutMode] = useState('medium');
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const innerRef = useRef(null);

  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-gray-400">
        ResizeObserver is not supported in this browser.
      </div>
    );
  }

  useEffect(() => {
    if (!innerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setMeasuredWidth(Math.round(w));
      if (w < 280) setLayoutMode('narrow');
      else if (w < 420) setLayoutMode('medium');
      else setLayoutMode('wide');
    });
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

  const modeColor = {
    narrow: 'text-red-400',
    medium: 'text-yellow-400',
    wide:   'text-green-400',
  }[layoutMode];

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-purple-900/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-purple-800/50">
          Demo 2
        </div>
        <h1 className="text-3xl font-bold text-white">Container-Aware Component</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          A component changes its own internal layout based on the width of its <strong className="text-white">container</strong> — not the viewport.
          Drag the slider to resize the container and watch the Product Card adapt its layout.
          This works inside a sidebar, modal, or any container — viewport width is irrelevant.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Container Width</h2>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Width</span>
            <span className="font-mono text-purple-400 font-bold">{containerWidth}px</span>
          </div>
          <input
            type="range" min={200} max={700} step={10} value={containerWidth}
            onChange={e => setContainerWidth(Number(e.target.value))}
            className="w-full accent-purple-500"
            aria-label="Container width"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>200px (narrow)</span>
            <span>280px</span>
            <span>420px</span>
            <span>700px (wide)</span>
          </div>
        </div>
      </div>

      {/* Container demo */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Preview</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">measured: <span className="font-mono text-gray-300">{measuredWidth}px</span></span>
            <span className={`font-semibold ${modeColor} uppercase tracking-wide`}>{layoutMode}</span>
          </div>
        </div>

        {/* The outer wrapper shows the resize visually */}
        <div className="overflow-hidden">
          <div
            style={{ width: containerWidth + 'px' }}
            className="relative transition-all duration-75 border border-purple-700/30 rounded-xl bg-gray-800 overflow-hidden"
          >
            {/* Width indicator line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-600/40" />
            <div ref={innerRef}>
              <ProductCard layoutMode={layoutMode} />
            </div>
          </div>
        </div>

        {/* Breakpoint legend */}
        <div className="flex gap-4 flex-wrap text-xs text-gray-500 pt-2 border-t border-gray-800">
          <span><span className="text-red-400 font-semibold">narrow</span> — &lt; 280px: stacked</span>
          <span><span className="text-yellow-400 font-semibold">medium</span> — 280–420px: horizontal</span>
          <span><span className="text-green-400 font-semibold">wide</span> — &gt; 420px: expanded with description + button</span>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={CONTAINER_AWARE_CODE} />
      </div>
    </section>
  );
}
