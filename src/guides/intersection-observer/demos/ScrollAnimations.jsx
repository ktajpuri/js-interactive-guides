import { useRef, useState, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { SCROLL_ANIMATIONS_CODE } from '../data/demoCode';

const ANIMATION_TYPES = [
  { id: 'fade', label: 'Fade In' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'slide-left', label: 'Slide Left' },
  { id: 'slide-right', label: 'Slide Right' },
  { id: 'zoom', label: 'Zoom In' },
];

const CARD_DATA = [
  { icon: '🎯', title: 'Precision', desc: 'Threshold control lets you fine-tune exactly when animations fire.' },
  { icon: '⚡', title: 'Performance', desc: 'No scroll event listeners. Browser handles observation natively.' },
  { icon: '✨', title: 'Stagger', desc: 'Delay each card by its index × stagger ms for a cascade effect.' },
  { icon: '♻️', title: 'Once or Repeat', desc: 'Unobserve after first trigger, or keep observing for repeats.' },
  { icon: '📦', title: 'No Layout Thrash', desc: 'Callbacks are asynchronous — never block the main thread.' },
  { icon: '🎨', title: 'CSS Transitions', desc: 'Use CSS opacity and transform for GPU-accelerated animations.' },
  { icon: '🔍', title: 'Root Flexibility', desc: 'Animate within any scrollable container, not just the viewport.' },
  { icon: '📱', title: 'Responsive', desc: 'Works across all viewports and device sizes seamlessly.' },
];

function getInitialTransform(type) {
  switch (type) {
    case 'slide-up': return 'translateY(40px)';
    case 'slide-left': return 'translateX(-40px)';
    case 'slide-right': return 'translateX(40px)';
    case 'zoom': return 'scale(0.8)';
    default: return 'none';
  }
}

function AnimatedCard({ data, index, animationType, staggerMs, threshold, resetKey }) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(false);
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasAnimated(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, resetKey]);

  const style = {
    transitionDelay: `${index * staggerMs}ms`,
    transitionDuration: '600ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionProperty: 'opacity, transform',
    opacity: hasAnimated ? 1 : 0,
    transform: hasAnimated ? 'none' : getInitialTransform(animationType),
  };

  return (
    <div ref={ref} style={style} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <div className="text-3xl mb-3">{data.icon}</div>
      <h3 className="font-semibold text-white mb-1">{data.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{data.desc}</p>
    </div>
  );
}

export default function ScrollAnimations() {
  const [animationType, setAnimationType] = useState('slide-up');
  const [staggerMs, setStaggerMs] = useState(80);
  const [threshold, setThreshold] = useState(0.2);
  const [resetKey, setResetKey] = useState(0);
  const containerRef = useRef(null);

  const reset = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setResetKey(k => k + 1), 400);
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-pink-900/30 text-pink-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-pink-800/50">
          Demo 5
        </div>
        <h1 className="text-3xl font-bold text-white">Scroll-Triggered Animations</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Intersection Observer powers "animate on scroll" effects without a single scroll event listener.
          Each card is an independent observed element. When it enters the viewport beyond the
          threshold, a CSS transition animates it in — staggered by index for a cascade effect.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Controls</h2>

        <div className="space-y-2">
          <div className="text-sm text-gray-400">Animation Type</div>
          <div className="flex flex-wrap gap-2">
            {ANIMATION_TYPES.map(a => (
              <button
                key={a.id}
                onClick={() => { setAnimationType(a.id); setResetKey(k => k + 1); }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  animationType === a.id ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Stagger delay</span>
              <span className="font-mono text-pink-400">{staggerMs}ms per card</span>
            </div>
            <input
              type="range" min="0" max="300" step="10"
              value={staggerMs}
              onChange={e => setStaggerMs(Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trigger threshold</span>
              <span className="font-mono text-pink-400">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>
        </div>

        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Reset Animations
        </button>
      </div>

      {/* Demo */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Scroll to animate cards</h2>
        </div>
        <div ref={containerRef} className="h-[550px] overflow-y-auto p-5">
          <div className="h-20 flex items-center justify-center text-gray-600 text-sm mb-4">
            Scroll down to trigger animations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CARD_DATA.map((data, i) => (
              <AnimatedCard
                key={`${resetKey}-${i}`}
                data={data}
                index={i}
                animationType={animationType}
                staggerMs={staggerMs}
                threshold={threshold}
                resetKey={resetKey}
              />
            ))}
          </div>
          <div className="h-16" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={SCROLL_ANIMATIONS_CODE} />
      </div>
    </section>
  );
}
