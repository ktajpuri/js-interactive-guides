import { useRef, useState, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { WINDOWING_CODE } from '../data/demoCode';

const ITEM_HEIGHT = 48;
const OVERSCAN = 3;
const PANEL_HEIGHT = 400;

function useVirtualList(containerRef, totalCount) {
  const [range, setRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
      const end = Math.min(
        totalCount,
        Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
      );
      setRange({ start, end });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [containerRef, totalCount]);

  return range;
}

function itemColor(index) {
  return `hsl(${(index * 37) % 360}, 55%, 42%)`;
}

function NaiveItem({ index }) {
  return (
    <div
      data-item
      style={{ height: ITEM_HEIGHT, backgroundColor: itemColor(index) }}
      className="flex items-center px-3 text-white text-sm font-medium border-b border-black/10"
    >
      <span className="opacity-40 w-10 text-xs">{index + 1}</span>
      Item #{index + 1}
    </div>
  );
}

function VirtualItem({ index }) {
  return (
    <div
      data-item
      style={{
        position: 'absolute',
        top: index * ITEM_HEIGHT,
        height: ITEM_HEIGHT,
        left: 0,
        right: 0,
        backgroundColor: itemColor(index),
      }}
      className="flex items-center px-3 text-white text-sm font-medium border-b border-black/10"
    >
      <span className="opacity-40 w-10 text-xs">{index + 1}</span>
      Item #{index + 1}
    </div>
  );
}

function NodeCounter({ containerRef, label, danger }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (containerRef.current) {
        setCount(containerRef.current.querySelectorAll('[data-item]').length);
      }
    }, 500);
    return () => clearInterval(id);
  }, [containerRef]);

  const isRed = danger && count > 5000;

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold font-mono ${isRed ? 'text-red-400' : 'text-green-400'}`}>
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function WindowingDemo() {
  const [totalCount, setTotalCount] = useState(5000);
  const naiveRef = useRef(null);
  const virtualContainerRef = useRef(null);

  const { start, end } = useVirtualList(virtualContainerRef, totalCount);

  const jumpToMiddle = useCallback(() => {
    const midpoint = Math.floor(totalCount / 2) * ITEM_HEIGHT;
    if (naiveRef.current) naiveRef.current.scrollTop = midpoint;
    if (virtualContainerRef.current) virtualContainerRef.current.scrollTop = midpoint;
  }, [totalCount]);

  // Reset scroll positions when total count changes
  useEffect(() => {
    if (naiveRef.current) naiveRef.current.scrollTop = 0;
    if (virtualContainerRef.current) virtualContainerRef.current.scrollTop = 0;
  }, [totalCount]);

  const naiveItems = Array.from({ length: totalCount }, (_, i) => i);
  const virtualItems = Array.from({ length: end - start }, (_, i) => start + i);

  const showWarning = totalCount >= 20000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Windowing / Virtual Scroll</h2>
        <p className="text-sm text-gray-400">
          Render only the ~20 visible items regardless of list size by positioning them absolutely
          inside a full-height spacer. The scrollbar stays accurate while the DOM stays tiny.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-800/60 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-400 mb-1">
              List size: <span className="text-white font-mono font-semibold">{totalCount.toLocaleString()} items</span>
            </label>
            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={totalCount}
              onChange={(e) => setTotalCount(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5">
              <span>1,000</span>
              <span>50,000</span>
            </div>
          </div>
          <button
            onClick={jumpToMiddle}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Jump to middle
          </button>
        </div>
        {showWarning && (
          <p className="text-xs text-yellow-400 flex items-center gap-1.5">
            <span>⚠</span>
            High item counts will slow down the naïve panel — that&apos;s the point.
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <NodeCounter containerRef={naiveRef} label="Naïve DOM nodes" danger={true} />
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <NodeCounter containerRef={virtualContainerRef} label="Windowed DOM nodes" danger={false} />
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold font-mono text-blue-400">
            ~{Math.round(((totalCount - 26) / totalCount) * 100)}%
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Nodes saved</div>
        </div>
      </div>

      {/* Two-panel comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Naïve panel */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-sm font-medium text-white">Naïve — all items in DOM</span>
          </div>
          <div
            ref={naiveRef}
            style={{ height: PANEL_HEIGHT, overflowY: 'auto' }}
            className="rounded-lg border border-gray-700 bg-gray-900"
          >
            {naiveItems.map((i) => (
              <NaiveItem key={i} index={i} />
            ))}
          </div>
        </div>

        {/* Windowed panel */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-sm font-medium text-white">Windowed — only visible items</span>
          </div>
          <div
            ref={virtualContainerRef}
            style={{ height: PANEL_HEIGHT, overflowY: 'auto' }}
            className="rounded-lg border border-gray-700 bg-gray-900"
          >
            {/* Spacer that gives the scrollbar its full travel */}
            <div style={{ height: totalCount * ITEM_HEIGHT, position: 'relative' }}>
              {virtualItems.map((i) => (
                <VirtualItem key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-blue-300">How it works</h3>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>
            A spacer <code className="text-blue-300">{'<div>'}</code> is set to{' '}
            <code className="text-blue-300">height = totalCount × {ITEM_HEIGHT}px</code>, giving
            the scrollbar its full range.
          </li>
          <li>
            On every scroll event, we calculate which indices are visible:{' '}
            <code className="text-blue-300">
              start = floor(scrollTop / {ITEM_HEIGHT}) − {OVERSCAN}
            </code>
            .
          </li>
          <li>
            Only those ~{OVERSCAN * 2 + Math.ceil(PANEL_HEIGHT / ITEM_HEIGHT)} items are rendered,
            each positioned with{' '}
            <code className="text-blue-300">top = index × {ITEM_HEIGHT}px</code>.
          </li>
          <li>
            Both lists look and scroll identically — windowing is invisible to the user.
          </li>
        </ul>
      </div>

      <CodeBlock code={WINDOWING_CODE} />
    </div>
  );
}
