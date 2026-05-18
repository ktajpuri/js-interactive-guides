import { useState } from 'react';
import { GUIDES } from './guides/index';
import { Sidebar } from './components/Layout/Sidebar';
import GuideHome from './components/Layout/GuideHome';

export default function App() {
  const [activeGuideId, setActiveGuideId] = useState(null);
  const [activeDemoId, setActiveDemoId] = useState(null);

  const guide = GUIDES.find(g => g.id === activeGuideId) ?? null;
  const ActiveComponent = guide?.sections.find(s => s.id === activeDemoId)?.component ?? null;

  const selectGuide = (id) => {
    const g = GUIDES.find(g => g.id === id);
    setActiveGuideId(id);
    setActiveDemoId(g?.sections[0]?.id ?? null);
  };

  const goHome = () => {
    setActiveGuideId(null);
    setActiveDemoId(null);
  };

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <GuideHome guides={GUIDES} onSelectGuide={selectGuide} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar
        sections={guide.sections}
        activeSection={activeDemoId}
        onNavigate={setActiveDemoId}
        guide={guide}
        onBack={goHome}
      />
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div key={activeDemoId} className="animate-fadeIn min-h-screen p-6 md:p-10">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
    </div>
  );
}
