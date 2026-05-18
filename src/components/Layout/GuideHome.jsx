import { GUIDE_COLORS } from '../../theme';

export default function GuideHome({ guides, onSelectGuide }) {
  return (
    <div className="min-h-screen px-6 py-16 md:px-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          Interactive Learning
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          JS Interactive Guides
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Hands-on, visual demos for JavaScript and browser API concepts.
          Pick a topic to explore.
        </p>
      </div>

      {/* Guide cards */}
      <ul className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0" role="list">
        {guides.map((guide) => {
          const c = GUIDE_COLORS[guide.color] ?? GUIDE_COLORS.blue;
          return (
            <li key={guide.id}>
              <button
                onClick={() => onSelectGuide(guide.id)}
                className={`w-full text-left bg-gray-900 rounded-2xl border p-6 transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/20 ${c.border} ${c.glow} group`}
                aria-label={`${guide.label} — ${guide.sections.length} demos`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${c.icon}`} aria-hidden="true">
                  {guide.icon}
                </div>
                <h2 className="text-lg font-bold text-white mb-2">
                  {guide.label}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">
                  {guide.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.cardBadge}`}>
                    {guide.sections.length} demos
                  </span>
                  <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm" aria-hidden="true">
                    Explore →
                  </span>
                </div>
              </button>
            </li>
          );
        })}

        {/* Coming soon placeholder */}
        <li aria-hidden="true">
          <div className="text-left bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 p-6 flex flex-col items-start justify-center gap-3 opacity-60">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-800/50 text-gray-600">+</div>
            <div>
              <div className="text-sm font-semibold text-gray-500">More coming soon</div>
              <div className="text-xs text-gray-600 mt-1">Event Loop, ResizeObserver, Memory Leaks…</div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
