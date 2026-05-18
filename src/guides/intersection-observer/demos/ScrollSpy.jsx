import { useRef } from 'react';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { SCROLL_SPY_CODE } from '../data/demoCode';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    color: 'from-blue-500 to-indigo-500',
    content: 'Scroll Spy tracks which section is currently most visible and highlights it in the navigation. This pattern is used in documentation sites, long-form articles, and dashboards. Instead of calculating scroll positions manually, Intersection Observer handles it efficiently.',
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    color: 'from-purple-500 to-pink-500',
    content: 'Each section is observed with 11 thresholds (0 to 1 in steps of 0.1). On each callback, we record the intersection ratio for that section. The section with the highest ratio is declared "active". A rootMargin of "-20% 0px -70% 0px" creates a detection band in the top portion of the viewport.',
  },
  {
    id: 'rootmargin-trick',
    title: 'The rootMargin Trick',
    color: 'from-orange-500 to-red-500',
    content: 'The rootMargin "-20% 0px -70% 0px" shrinks the effective root from the top by 20% and from the bottom by 70%. This creates a narrow horizontal band (~10% of the viewport height) near the top. The section that occupies this band is considered "active" — mimicking how documentation sites highlight the section you are currently reading.',
  },
  {
    id: 'vs-scroll-events',
    title: 'vs Scroll Events',
    color: 'from-green-500 to-teal-500',
    content: 'Traditional scroll spy uses window.addEventListener("scroll") and reads element.getBoundingClientRect() on every frame — causing layout thrash. Intersection Observer fires asynchronously, outside the main thread painting cycle. The browser batches observations and notifies you only when boundaries are crossed.',
  },
  {
    id: 'click-to-scroll',
    title: 'Click to Scroll',
    color: 'from-cyan-500 to-blue-500',
    content: 'When a user clicks a nav item, we call scrollIntoView({ behavior: "smooth" }) on the target section. Crucially, we do NOT update the active state from the click handler — we let the observer do it. This keeps the two sources of truth synchronized: scroll position drives nav state, not clicks.',
  },
  {
    id: 'multi-observer',
    title: 'Multiple Observers',
    color: 'from-violet-500 to-purple-500',
    content: 'Each section gets its own IntersectionObserver instance. This is more efficient than one shared observer because the browser can optimize independent observers. Cleanup is straightforward — store all observers in an array and call disconnect() on each when the component unmounts.',
  },
];

export default function ScrollSpy() {
  const sectionRefs = useRef(SECTIONS.map(() => ({ current: null })));

  const setRef = (index) => (el) => {
    sectionRefs.current[index].current = el;
  };

  const activeIndex = useScrollSpy(sectionRefs.current, {
    rootMargin: '-20% 0px -70% 0px',
  });

  const scrollToSection = (index) => {
    sectionRefs.current[index].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-teal-900/30 text-teal-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-teal-800/50">
          Demo 8
        </div>
        <h1 className="text-3xl font-bold text-white">Scroll Spy</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Scroll Spy highlights the navigation item for the section currently in view.
          Using <code className="bg-gray-800 text-teal-300 px-1.5 py-0.5 rounded text-sm">intersectionRatio</code>{' '}
          instead of just <code className="bg-gray-800 text-teal-300 px-1.5 py-0.5 rounded text-sm">isIntersecting</code>{' '}
          correctly handles the case where multiple sections overlap the viewport.
        </p>
      </header>

      <div className="flex gap-6">
        {/* Sticky nav */}
        <nav className="hidden md:block w-48 flex-shrink-0 sticky top-4 self-start">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2">Sections</div>
            <ul className="space-y-0.5">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollToSection(i)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      activeIndex === i
                        ? 'bg-gray-800 text-white font-medium'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {activeIndex === i && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    )}
                    <span className={activeIndex === i ? '' : 'pl-3.5'}>{s.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-3">
            <div className="text-xs text-gray-500 mb-1">Active section</div>
            <div className="text-sm font-semibold text-teal-400">{SECTIONS[activeIndex].title}</div>
            <div className="text-xs text-gray-600 mt-0.5">index: {activeIndex}</div>
          </div>
        </nav>

        {/* Sections */}
        <div className="flex-1 min-w-0 space-y-4">
          {SECTIONS.map((s, i) => (
            <div
              key={s.id}
              ref={setRef(i)}
              className={`rounded-xl p-6 border-2 transition-all duration-300 ${
                activeIndex === i
                  ? 'border-teal-500/50 bg-gray-900'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              <div className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full mb-3 bg-gradient-to-r ${s.color} text-white`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h2 className={`text-xl font-bold mb-3 ${activeIndex === i ? 'text-white' : 'text-gray-300'}`}>
                {s.title}
              </h2>
              <p className="text-gray-400 leading-relaxed">{s.content}</p>
              {/* Extra height so each section is tall enough to be individually detectable */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 rounded-lg bg-gray-800/50" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Jump to section</div>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(i)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activeIndex === i ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Code</h2>
        <CodeBlock code={SCROLL_SPY_CODE} />
      </div>
    </section>
  );
}
