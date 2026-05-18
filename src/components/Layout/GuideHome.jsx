const COLOR_MAP = {
  blue: {
    border: 'border-blue-700/40 hover:border-blue-500/70',
    badge: 'bg-blue-900/40 text-blue-400',
    icon: 'bg-blue-900/30 text-blue-300',
    glow: 'hover:shadow-blue-900/20',
  },
  green: {
    border: 'border-green-700/40 hover:border-green-500/70',
    badge: 'bg-green-900/40 text-green-400',
    icon: 'bg-green-900/30 text-green-300',
    glow: 'hover:shadow-green-900/20',
  },
  orange: {
    border: 'border-orange-700/40 hover:border-orange-500/70',
    badge: 'bg-orange-900/40 text-orange-400',
    icon: 'bg-orange-900/30 text-orange-300',
    glow: 'hover:shadow-orange-900/20',
  },
};

export default function GuideHome({ guides, onSelectGuide }) {
  return (
    <div className="min-h-screen px-6 py-16 md:px-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
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
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {guides.map((guide) => {
          const c = COLOR_MAP[guide.color] ?? COLOR_MAP.blue;
          return (
            <button
              key={guide.id}
              onClick={() => onSelectGuide(guide.id)}
              className={`text-left bg-gray-900 rounded-2xl border p-6 transition-all duration-200 hover:shadow-xl ${c.border} ${c.glow} group`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 ${c.icon}`}>
                {guide.icon}
              </div>

              {/* Title + description */}
              <h2 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                {guide.label}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                {guide.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                  {guide.sections.length} demos
                </span>
                <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">
                  Explore →
                </span>
              </div>
            </button>
          );
        })}

        {/* Coming soon placeholder */}
        <div className="text-left bg-gray-900/50 rounded-2xl border border-dashed border-gray-800 p-6 flex flex-col items-start justify-center gap-3 opacity-60">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-800/50 text-gray-600">
            +
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500">More coming soon</div>
            <div className="text-xs text-gray-600 mt-1">Promises, Event Loop, Generators…</div>
          </div>
        </div>
      </div>
    </div>
  );
}
