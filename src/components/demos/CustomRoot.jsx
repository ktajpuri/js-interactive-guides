import { useRef, useState, useEffect } from 'react';
import { CodeBlock } from '../Layout/CodeBlock';
import { CUSTOM_ROOT_CODE } from '../../data/demoCode';

const CONTAINER_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: `Item ${i + 1}`,
}));

function ScrollContainer({ containerRef, activeRootId, myId, label, color }) {
  const itemRefs = useRef([]);
  const [visibleIds, setVisibleIds] = useState(new Set());
  const observerRef = useRef(null);

  const isActiveRoot = activeRootId === myId;

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!containerRef.current) return;

    const root = isActiveRoot ? containerRef.current : null;

    const observer = new IntersectionObserver((entries) => {
      setVisibleIds(prev => {
        const next = new Set(prev);
        entries.forEach(e => {
          const id = parseInt(e.target.dataset.itemid);
          if (e.isIntersecting) next.add(id);
          else next.delete(id);
        });
        return next;
      });
    }, { root, threshold: 0.5 });

    itemRefs.current.forEach(el => { if (el) observer.observe(el); });
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [isActiveRoot, containerRef]);

  return (
    <div className="flex-1 min-w-0">
      <div className={`text-xs font-semibold mb-2 flex items-center gap-2 ${color.text}`}>
        {label}
        {isActiveRoot && (
          <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-normal">Active Root</span>
        )}
      </div>
      <div
        ref={containerRef}
        className={`h-64 overflow-y-auto rounded-xl border-2 bg-gray-900 transition-all ${
          isActiveRoot ? color.border : 'border-gray-700'
        }`}
      >
        <div className="divide-y divide-gray-800">
          {CONTAINER_ITEMS.map((item, i) => {
            const isVisible = visibleIds.has(item.id);
            return (
              <div
                key={item.id}
                ref={el => itemRefs.current[i] = el}
                data-itemid={item.id}
                className={`px-4 py-3 flex items-center justify-between transition-all ${
                  isVisible ? 'bg-gray-800' : ''
                }`}
              >
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isVisible
                    ? `${color.badgeBg} ${color.badgeText}`
                    : 'bg-gray-800 text-gray-600'
                }`}>
                  {isVisible ? 'visible' : 'hidden'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {visibleIds.size} item{visibleIds.size !== 1 ? 's' : ''} intersecting
        {!isActiveRoot && ' (scoped to viewport)'}
      </div>
    </div>
  );
}

export default function CustomRoot() {
  const [activeRoot, setActiveRoot] = useState('left'); // 'left' | 'right' | 'viewport'
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const leftRootRef = activeRoot === 'left' ? leftRef : { current: null };
  const rightRootRef = activeRoot === 'right' ? rightRef : { current: null };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-violet-900/30 text-violet-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-violet-800/50">
          Demo 7
        </div>
        <h1 className="text-3xl font-bold text-white">Custom Root Element</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          By default, the root is the browser viewport. But you can pass any scrollable ancestor
          as the <code className="bg-gray-800 text-violet-300 px-1.5 py-0.5 rounded text-sm">root</code> option.
          This scopes the observer — items are only "intersecting" when visible within <em>that</em> container.
          Useful for modals, sidebars, or nested scroll areas.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select Root</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'left', label: 'Left container as root' },
            { id: 'right', label: 'Right container as root' },
            { id: 'viewport', label: 'Viewport (default)' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveRoot(opt.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeRoot === opt.id ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="text-sm rounded-lg px-4 py-3 bg-gray-800 text-gray-400">
          <span className="text-violet-400 font-semibold">Current root: </span>
          {activeRoot === 'left' && 'Left scrollable container — only items visible in the left box are "intersecting"'}
          {activeRoot === 'right' && 'Right scrollable container — only items visible in the right box are "intersecting"'}
          {activeRoot === 'viewport' && 'The browser viewport — standard behavior'}
        </div>
      </div>

      {/* Side-by-side containers */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Demo</h2>
        <div className="flex gap-4">
          <ScrollContainer
            containerRef={leftRef}
            activeRootId={activeRoot}
            myId="left"
            label="Left Container"
            color={{
              text: 'text-blue-400',
              border: 'border-blue-500',
              badgeBg: 'bg-blue-900/50',
              badgeText: 'text-blue-400',
            }}
          />
          <ScrollContainer
            containerRef={rightRef}
            activeRootId={activeRoot}
            myId="right"
            label="Right Container"
            color={{
              text: 'text-emerald-400',
              border: 'border-emerald-500',
              badgeBg: 'bg-emerald-900/50',
              badgeText: 'text-emerald-400',
            }}
          />
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-white">Key insight</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          When <code className="bg-gray-800 text-violet-300 px-1 rounded">root</code> is set to a container,
          the <code className="bg-gray-800 text-violet-300 px-1 rounded">rootBounds</code> in the entry reflects
          that container's bounding rect — not the viewport. An element can be "not intersecting"
          even if it's visible on screen, because it's outside its scoped root.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={CUSTOM_ROOT_CODE} />
      </div>
    </section>
  );
}
