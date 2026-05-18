import { useState, useEffect, useRef } from 'react';
import { GUIDE_COLORS } from '../../theme';

export function Sidebar({ sections, activeSection, onNavigate, guide, onBack }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const c = GUIDE_COLORS[guide?.color] ?? GUIDE_COLORS.blue;
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Close drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { setMobileOpen(false); hamburgerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    // Move focus into drawer
    drawerRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const close = () => { setMobileOpen(false); hamburgerRef.current?.focus(); };

  const NavContent = () => (
    <nav className="flex flex-col h-full" aria-label={`${guide?.label} guide navigation`}>
      {/* Header */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => { onBack(); close(); }}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-300 transition-colors hover:bg-gray-900 focus:outline-none focus:bg-gray-900"
          aria-label="Back to all guides"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Guides
        </button>
        <div className="px-5 pb-4">
          <div className="text-lg" aria-hidden="true">{guide?.icon}</div>
          <h1 className="text-sm font-bold text-white leading-tight mt-1">{guide?.label}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Interactive Guide</p>
        </div>
      </div>

      {/* Nav items */}
      <ul className="flex-1 overflow-y-auto py-4 px-3 space-y-1" role="list">
        {sections.map((section, i) => (
          <li key={section.id}>
            <button
              onClick={() => { onNavigate(section.id); close(); }}
              aria-current={activeSection === section.id ? 'page' : undefined}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/20 ${
                activeSection === section.id
                  ? c.active
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className={`text-xs font-mono w-5 h-5 flex items-center justify-center rounded flex-shrink-0 ${
                activeSection === section.id ? c.badge : c.inactive
              }`} aria-hidden="true">
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
            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-400 focus:outline-none focus:underline"
            >
              {guide.label} <span className="sr-only">(opens in new tab)</span>
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
          ref={hamburgerRef}
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white truncate">
          {sections.find(s => s.id === activeSection)?.label}
        </span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-drawer"
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
          <div ref={drawerRef} className="relative w-72 bg-gray-950 h-full flex flex-col border-r border-gray-800">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}
