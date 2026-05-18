import { useRef, useState, useEffect, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { INFINITE_SCROLL_CODE } from '../data/demoCode';

let globalId = 1;

function generateItems(count) {
  return Array.from({ length: count }, () => {
    const id = globalId++;
    return {
      id,
      title: `Item #${id}`,
      desc: `Loaded on scroll — observer fires when sentinel enters the container root.`,
      color: `hsl(${(id * 37) % 360}, 60%, 35%)`,
    };
  });
}

const EVENT_ICONS = { detect: '[DETECT]', load: '[LOAD]', done: '[DONE]' };
const EVENT_COLORS = { detect: 'text-cyan-400', load: 'text-yellow-400', done: 'text-green-400' };

export default function InfiniteScroll() {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);
  const sessionStartRef = useRef(performance.now());
  const [items, setItems] = useState(() => generateItems(8));
  const [isLoading, setIsLoading] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [rootReady, setRootReady] = useState(false);
  const [events, setEvents] = useState([]);

  const addEvent = useCallback((type, label) => {
    const t = Math.round(performance.now() - sessionStartRef.current);
    setEvents(prev => [...prev.slice(-29), { id: Date.now() + Math.random(), type, label, t }]);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    const batchNum = loadCount + 1;
    addEvent('load', `Batch #${batchNum} fetching…`);
    setTimeout(() => {
      setItems(prev => [...prev, ...generateItems(8)]);
      setLoadCount(c => {
        const next = c + 1;
        addEvent('done', `Batch #${next} loaded (+8 items)`);
        return next;
      });
      setIsLoading(false);
      isLoadingRef.current = false;
    }, 800);
  }, [loadCount, addEvent]);

  useEffect(() => {
    if (containerRef.current) setRootReady(true);
  }, []);

  useEffect(() => {
    if (!rootReady || !sentinelRef.current || !containerRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        addEvent('detect', 'Sentinel entered container');
        loadMore();
      }
    }, {
      root: containerRef.current,
      rootMargin: '0px 0px 150px 0px',
    });

    observer.observe(sentinelRef.current);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [rootReady, loadMore, addEvent]);

  const reset = () => {
    globalId = 1;
    setItems(generateItems(8));
    setLoadCount(0);
    setIsLoading(false);
    setEvents([]);
    isLoadingRef.current = false;
    sessionStartRef.current = performance.now();
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-cyan-900/30 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-cyan-800/50">
          Demo 6
        </div>
        <h1 className="text-3xl font-bold text-white">Infinite Scroll</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          An invisible "sentinel" element sits at the bottom of the list. When it enters the
          scroll container's viewport (which is the <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm">root</code>),
          the observer fires and loads the next batch. A{' '}
          <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm">rootMargin</code>{' '}
          of 150px pre-fetches before the sentinel is actually visible. Watch the Observer Log to see each event as it fires.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Items',    value: items.length, color: 'text-cyan-400' },
          { label: 'Batches Loaded', value: loadCount,    color: 'text-purple-400' },
          { label: 'Status',         value: isLoading ? 'Fetching…' : 'Idle', color: isLoading ? 'text-yellow-400' : 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
            <div className={`text-2xl font-bold font-mono ${s.color}`} aria-live="polite">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List + Observer Log side by side on desktop */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Scrollable list (2/3 width) */}
        <div className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Scrollable list (root = this container)
            </h2>
            <button
              onClick={reset}
              className="text-xs text-gray-500 hover:text-white transition-colors focus:outline-none focus:underline"
            >
              Reset
            </button>
          </div>

          <div ref={containerRef} className="h-[480px] overflow-y-auto divide-y divide-gray-800">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/50 transition-colors">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: item.color }}
                  aria-hidden="true"
                >
                  {item.id}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                </div>
                <div className="text-xs text-gray-700 font-mono flex-shrink-0">#{i + 1}</div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-6 text-sm text-gray-500" aria-live="polite">
                <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" aria-hidden="true" />
                Loading more items…
              </div>
            )}

            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </div>
        </div>

        {/* Observer Log (1/3 width) */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Observer Log</span>
            <button
              onClick={() => setEvents([])}
              className="text-xs text-gray-600 hover:text-white transition-colors focus:outline-none focus:underline"
            >
              Clear
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y divide-gray-800/50 font-mono text-xs h-[480px]"
            aria-live="polite"
            aria-label="Observer event log"
          >
            {events.length === 0 && (
              <div className="text-center text-gray-600 py-8 px-4">
                Scroll the list to see events
              </div>
            )}
            {[...events].reverse().map(evt => (
              <div key={evt.id} className="flex flex-col gap-0.5 px-4 py-2.5">
                <span className="text-gray-600">{evt.t}ms</span>
                <span className={EVENT_COLORS[evt.type]}>
                  {EVENT_ICONS[evt.type]} {evt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-white">How it works</h3>
        <div className="space-y-2 text-sm text-gray-400">
          {[
            { key: 'root:', desc: 'Set to the scrollable container div (not the viewport). The observer is scoped to this element.' },
            { key: 'sentinel:', desc: 'An invisible 1px div at the bottom of the list. When it enters the root, the callback fires.' },
            { key: 'rootMargin:', desc: '150px bottom margin means the callback fires 150px before the sentinel is actually visible — pre-fetch.' },
            { key: 'guard:', desc: 'A ref (not state) prevents duplicate fetches. Ref mutations are synchronous — state updates are not.' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex gap-3">
              <span className="text-cyan-400 font-mono text-xs mt-0.5 flex-shrink-0">{key}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={INFINITE_SCROLL_CODE} />
      </div>
    </section>
  );
}
