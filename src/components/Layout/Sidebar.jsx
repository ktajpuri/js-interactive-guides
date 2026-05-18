import { useState } from 'react';

const ACCENT = {
  blue:   { active: 'bg-blue-600 text-white',   badge: 'bg-blue-500 text-white',   inactive: 'bg-gray-800 text-gray-500' },
  green:  { active: 'bg-green-600 text-white',  badge: 'bg-green-500 text-white',  inactive: 'bg-gray-800 text-gray-500' },
  orange: { active: 'bg-orange-600 text-white', badge: 'bg-orange-500 text-white', inactive: 'bg-gray-800 text-gray-500' },
};

export function Sidebar({ sections, activeSection, onNavigate, guide, onBack }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const accent = ACCENT[guide?.color] ?? ACCENT.blue;

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => { onBack(); setMobileOpen(false); }}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors hover:bg-gray-900"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Guides
        </button>
        <div className="px-5 pb-4">
          <div className="text-lg">{guide?.icon}</div>
          <h1 className="text-sm font-bold text-white leading-tight mt-1">{guide?.label}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Interactive Guide</p>
        </div>
      </div>

      {/* Nav items */}
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sections.map((section, i) => (
          <li key={section.id}>
            <button
              onClick={() => { onNavigate(section.id); setMobileOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
                activeSection === section.id
                  ? accent.active
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className={`text-xs font-mono w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${
                activeSection === section.id ? accent.badge : accent.inactive
              }`}>
                {i + 1}
              </span>
              <span className="leading-tight">{section.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      {guide?.docsUrl && (
        <div className="px-6 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">
            Docs:{' '}
            <a href={guide.docsUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400">
              {guide.label}
            </a>
          </p>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-950 border-r border-gray-800 fixed top-0 left-0 h-screen z-40">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white truncate">
          {sections.find(s => s.id === activeSection)?.label}
        </span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-gray-950 h-full flex flex-col border-r border-gray-800">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
