import { useRef, useState, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { CUSTOM_ROOT_CODE } from '../data/demoCode';

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
          <span className="bg-violet-600 text-white px-1.5 py-0.5 rounded text-xs font-normal">Active Root</span>
        )}
      </div>
      <div
        ref={containerRef}
        className={`h-64 overflow-y-auto rounded-xl border-2 bg-gray-900 transition-all ${isActiveRoot ? color.border : 'border-gray-700'}`}
        aria-label={`${label} scroll container`}
      >
        <div className="divide-y divide-gray-800">
          {CONTAINER_ITEMS.map((item, i) => {
            const isVisible = visibleIds.has(item.id);
            return (
              <div
                key={item.id}
                ref={el => { itemRefs.current[i] = el; }}
                data-itemid={item.id}
                className={`px-4 py-3 flex items-center justify-between transition-all ${isVisible ? 'bg-gray-800' : ''}`}
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
      <div className="mt-2 text-xs text-gray-500">
        {visibleIds.size} item{visibleIds.size !== 1 ? 's' : ''} intersecting
        {!isActiveRoot && activeRootId !== 'viewport' && ' (scoped to viewport)'}
      </div>
    </div>
  );
}

const ROOT_EXPLANATIONS = {
  left: {
    title: 'Root = Left container',
    rows: [
      { icon: 'bg-blue-500', label: 'Left container', desc: 'Items "intersecting" only when visible inside this box — even if they\'re also visible on screen.' },
      { icon: 'bg-gray-600', label: 'Right container', desc: 'Uses viewport as root (null). Items are "intersecting" when visible in the browser window.' },
      { icon: 'bg-violet-700', label: 'Key difference', desc: 'Scroll the left box — items flip between visible/hidden. Scroll the right box — nothing changes until you scroll the page.' },
    ],
  },
  right: {
    title: 'Root = Right container',
    rows: [
      { icon: 'bg-gray-600', label: 'Left container', desc: 'Uses viewport as root (null). Items tracked against the browser window.' },
      { icon: 'bg-emerald-500', label: 'Right container', desc: 'Items "intersecting" only when visible inside this box.' },
      { icon: 'bg-violet-700', label: 'Key difference', desc: 'Scroll the right box — items flip. Scroll the left box — nothing changes (viewport root, no window scroll happening).' },
    ],
  },
  viewport: {
    title: 'Root = Browser viewport (default)',
    rows: [
      { icon: 'bg-gray-400', label: 'Both containers', desc: 'Both use root: null, meaning the browser viewport is the root for all observations.' },
      { icon: 'bg-violet-700', label: 'Key difference', desc: 'Items in either container are "intersecting" when their bounding box overlaps the viewport — regardless of scroll within the containers.' },
    ],
  },
};

export default function CustomRoot() {
  const [activeRoot, setActiveRoot] = useState('left');
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const leftRootRef = activeRoot === 'left' ? leftRef : { current: null };
  const rightRootRef = activeRoot === 'right' ? rightRef : { current: null };

  const explanation = ROOT_EXPLANATIONS[activeRoot];

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
          This scopes the observer — items are only "intersecting" when visible within <em>that container</em>, not the window.
          Useful for modals, sidebars, or nested scroll areas.
        </p>
      </header>

      {/* Root selector */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Select Root</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Root element selection">
          {[
            { id: 'left',     label: 'Left container as root' },
            { id: 'right',    label: 'Right container as root' },
            { id: 'viewport', label: 'Viewport (default)' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveRoot(opt.id)}
              aria-pressed={activeRoot === opt.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ${
                activeRoot === opt.id ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* What the observer sees */}
      <div className="bg-gray-900 rounded-xl p-5 border border-violet-800/30 space-y-3">
        <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest">What the observer sees — {explanation.title}</h2>
        <div className="space-y-2.5">
          {explanation.rows.map((row, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${row.icon}`} aria-hidden="true" />
              <div>
                <span className="text-gray-200 font-medium">{row.label}: </span>
                <span className="text-gray-400">{row.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual diagram */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Root boundary diagram
        </h2>
        <div className="relative border border-gray-700 rounded-xl p-4 bg-gray-950">
          {/* Viewport label */}
          <div className="absolute -top-3 left-4 text-xs font-mono bg-gray-950 px-2 text-gray-500">
            Browser Viewport
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Left container */}
            <div className={`rounded-lg border-2 p-3 transition-all ${activeRoot === 'left' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700'}`}>
              <div className="text-xs font-mono mb-2 text-center">
                {activeRoot === 'left'
                  ? <span className="text-blue-400 font-semibold">root = this div</span>
                  : <span className="text-gray-600">root = null (viewport)</span>}
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`h-5 rounded text-xs flex items-center px-2 ${activeRoot === 'left' ? 'bg-blue-800/40 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                    item {n} — detected by {activeRoot === 'left' ? 'container' : 'viewport'}
                  </div>
                ))}
              </div>
            </div>
            {/* Right container */}
            <div className={`rounded-lg border-2 p-3 transition-all ${activeRoot === 'right' ? 'border-emerald-500 bg-emerald-900/10' : 'border-gray-700'}`}>
              <div className="text-xs font-mono mb-2 text-center">
                {activeRoot === 'right'
                  ? <span className="text-emerald-400 font-semibold">root = this div</span>
                  : <span className="text-gray-600">root = null (viewport)</span>}
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`h-5 rounded text-xs flex items-center px-2 ${activeRoot === 'right' ? 'bg-emerald-800/40 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
                    item {n} — detected by {activeRoot === 'right' ? 'container' : 'viewport'}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {activeRoot !== 'viewport' && (
            <p className="text-xs text-gray-600 mt-3 text-center">
              An item can be visible on screen but report "not intersecting" if it's scrolled out of the active root container.
            </p>
          )}
        </div>
      </div>

      {/* Side-by-side live demo */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Live demo — scroll each container</h2>
        <div className="flex gap-4">
          <ScrollContainer
            containerRef={leftRef}
            activeRootId={activeRoot}
            myId="left"
            label="Left Container"
            color={{ text: 'text-blue-400', border: 'border-blue-500', badgeBg: 'bg-blue-900/50', badgeText: 'text-blue-400' }}
          />
          <ScrollContainer
            containerRef={rightRef}
            activeRootId={activeRoot}
            myId="right"
            label="Right Container"
            color={{ text: 'text-emerald-400', border: 'border-emerald-500', badgeBg: 'bg-emerald-900/50', badgeText: 'text-emerald-400' }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={CUSTOM_ROOT_CODE} />
      </div>
    </section>
  );
}
