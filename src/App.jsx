import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GUIDES } from './guides/index';
import { Sidebar } from './components/Layout/Sidebar';
import GuideHome from './components/Layout/GuideHome';

function GuideRedirect() {
  const { guideId } = useParams();
  const guide = GUIDES.find(g => g.id === guideId);
  if (!guide) return <Navigate to="/" replace />;
  return <Navigate to={`/${guideId}/${guide.sections[0].id}`} replace />;
}

function GuidePage() {
  const { guideId, demoId } = useParams();
  const navigate = useNavigate();

  const guide = GUIDES.find(g => g.id === guideId);
  if (!guide) return <Navigate to="/" replace />;

  const section = guide.sections.find(s => s.id === demoId);
  if (!section) return <Navigate to={`/${guideId}/${guide.sections[0].id}`} replace />;

  const ActiveComponent = section.component;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      <Sidebar
        sections={guide.sections}
        activeSection={demoId}
        onNavigate={(id) => navigate(`/${guideId}/${id}`)}
        guide={guide}
        onBack={() => navigate('/')}
      />
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div key={demoId} className="animate-fadeIn min-h-screen p-6 md:p-10">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <GuideHome
        guides={GUIDES}
        onSelectGuide={(id) => {
          const g = GUIDES.find(g => g.id === id);
          navigate(`/${id}/${g.sections[0].id}`);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:guideId" element={<GuideRedirect />} />
      <Route path="/:guideId/:demoId" element={<GuidePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
