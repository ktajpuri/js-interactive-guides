import { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import EntryProperties from './components/demos/EntryProperties';
import ThresholdVisualizer from './components/demos/ThresholdVisualizer';
import RootMarginPlayground from './components/demos/RootMarginPlayground';
import LazyLoadingImages from './components/demos/LazyLoadingImages';
import ScrollAnimations from './components/demos/ScrollAnimations';
import InfiniteScroll from './components/demos/InfiniteScroll';
import CustomRoot from './components/demos/CustomRoot';
import ScrollSpy from './components/demos/ScrollSpy';

const SECTIONS = [
  { id: 'entry-properties', label: 'API Basics & Entry Properties', component: EntryProperties },
  { id: 'threshold-visualizer', label: 'Threshold Visualizer', component: ThresholdVisualizer },
  { id: 'root-margin', label: 'rootMargin Playground', component: RootMarginPlayground },
  { id: 'lazy-loading', label: 'Lazy Loading Images', component: LazyLoadingImages },
  { id: 'scroll-animations', label: 'Scroll-Triggered Animations', component: ScrollAnimations },
  { id: 'infinite-scroll', label: 'Infinite Scroll', component: InfiniteScroll },
  { id: 'custom-root', label: 'Custom Root Element', component: CustomRoot },
  { id: 'scroll-spy', label: 'Scroll Spy', component: ScrollSpy },
];

export default function App() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar sections={SECTIONS} activeSection={activeSection} onNavigate={setActiveSection} />

      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div key={activeSection} className="animate-fadeIn min-h-screen p-6 md:p-10">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
    </div>
  );
}
