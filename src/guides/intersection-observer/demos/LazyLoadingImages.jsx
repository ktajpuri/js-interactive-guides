import { useRef, useState, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { LAZY_LOADING_CODE } from '../data/demoCode';

const IMAGE_COUNT = 20;

function LazyImage({ seed, lazyMode, forceLoad }) {
  const ref = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | visible | loaded | error

  useEffect(() => {
    if (!lazyMode || forceLoad) {
      setStatus('visible');
      return;
    }

    setStatus('idle');
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatus('visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '100px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, [lazyMode, forceLoad]);

  return (
    <div
      ref={ref}
      className="relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700"
      style={{ aspectRatio: '4/3' }}
    >
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
          <span className="text-xs text-gray-600">Not loaded</span>
        </div>
      )}

      {status === 'visible' && (
        <>
          <img
            src={`https://picsum.photos/seed/${seed}/400/300`}
            alt={`Image ${seed}`}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>
        </>
      )}

      {status === 'loaded' && (
        <>
          <img
            src={`https://picsum.photos/seed/${seed}/400/300`}
            alt={`Image ${seed}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
            Loaded
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs">
          Error loading
        </div>
      )}

      <div className="absolute bottom-2 left-2 text-xs text-white/70 font-mono bg-black/40 px-1.5 py-0.5 rounded">
        #{seed}
      </div>
    </div>
  );
}

export default function LazyLoadingImages() {
  const [lazyMode, setLazyMode] = useState(true);
  const [forceLoad, setForceLoad] = useState(false);
  const [key, setKey] = useState(0);
  const seeds = Array.from({ length: IMAGE_COUNT }, (_, i) => i + 1);

  const reset = () => {
    setForceLoad(false);
    setKey(k => k + 1);
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-green-800/50">
          Demo 4
        </div>
        <h1 className="text-3xl font-bold text-white">Lazy Loading Images</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Instead of loading all images on page load, Intersection Observer loads each image only when it
          approaches the viewport. This dramatically reduces initial bandwidth and speeds up page load.
          After loading, the observer is disconnected — no wasted callbacks.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => { setLazyMode(true); reset(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                lazyMode ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Lazy Mode
            </button>
            <button
              onClick={() => { setLazyMode(false); setForceLoad(true); setKey(k => k + 1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !lazyMode ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Load All
            </button>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>

        <div className={`text-sm rounded-lg px-4 py-3 border ${
          lazyMode
            ? 'bg-green-900/20 border-green-800/50 text-green-300'
            : 'bg-red-900/20 border-red-800/50 text-red-300'
        }`}>
          {lazyMode
            ? 'Images load only when within 100px of the viewport. Scroll down to trigger loads.'
            : 'All images load immediately regardless of scroll position — notice the difference!'}
        </div>
      </div>

      {/* Image grid */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {IMAGE_COUNT} Images — scroll to load lazily
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto" key={key}>
          {seeds.map(seed => (
            <LazyImage
              key={`${seed}-${key}`}
              seed={seed}
              lazyMode={lazyMode}
              forceLoad={forceLoad}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={LAZY_LOADING_CODE} />
      </div>
    </section>
  );
}
