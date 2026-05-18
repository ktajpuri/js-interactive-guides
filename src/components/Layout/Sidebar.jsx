import { useState } from 'react';

export function Sidebar({ sections, activeSection, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-base font-bold text-white leading-tight">Intersection Observer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Interactive Guide</p>
      </div>
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sections.map((section, i) => (
          <li key={section.id}>
            <button
              onClick={() => { onNavigate(section.id); setMobileOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className={`text-xs font-mono w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${
                activeSection === section.id ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'
              }`}>
                {i + 1}
              </span>
              <span className="leading-tight">{section.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          MDN: <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:text-blue-400"
          >
            Intersection Observer API
          </a>
        </p>
      </div>
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
        <span className="text-sm font-semibold text-white">
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
