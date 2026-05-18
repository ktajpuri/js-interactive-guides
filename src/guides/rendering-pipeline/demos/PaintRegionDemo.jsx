import { useState, useRef } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { PAINT_REGION_CODE } from '../data/demoCode';

const SCENE_W = 600;
const SCENE_H = 400;

const PAINT_OPTIONS = [
  {
    id: 'body-bg',
    label: 'Change body background',
    description: 'Repaints the entire viewport',
    pipeline: ['layout', 'paint', 'composite'],
    rect: { top: 0, left: 0, width: 1, height: 1 },
    area: SCENE_W * SCENE_H,
    property: 'backgroundColor',
    targetLabel: 'Full page',
    cost: 'expensive',
    apply: (sceneEl) => { sceneEl.style.backgroundColor = '#1e293b'; },
    reset: (sceneEl) => { sceneEl.style.backgroundColor = ''; },
  },
  {
    id: 'header-bg',
    label: 'Change header background',
    description: 'Repaints only the header strip (~15% of page)',
    rect: { top: 0, left: 0, width: 1, height: 0.15 },
    area: Math.round(SCENE_W * SCENE_H * 0.15),
    pipeline: ['paint', 'composite'],
    property: 'backgroundColor (header)',
    targetLabel: 'Header bar',
    cost: 'medium',
    apply: (sceneEl, headerEl) => { if (headerEl) headerEl.style.backgroundColor = '#0f172a'; },
    reset: (sceneEl, headerEl) => { if (headerEl) headerEl.style.backgroundColor = ''; },
  },
  {
    id: 'text-color',
    label: 'Change paragraph color',
    description: 'Repaints a small text region (~5% of page)',
    rect: { top: 0.25, left: 0.05, width: 0.6, height: 0.08 },
    area: Math.round(SCENE_W * 0.6 * SCENE_H * 0.08),
    pipeline: ['paint', 'composite'],
    property: 'color (paragraph)',
    targetLabel: 'One paragraph',
    cost: 'medium',
    apply: (sceneEl, headerEl, paraEl) => { if (paraEl) paraEl.style.color = '#22d3ee'; },
    reset: (sceneEl, headerEl, paraEl) => { if (paraEl) paraEl.style.color = ''; },
  },
  {
    id: 'box-shadow',
    label: 'Change card box-shadow',
    description: 'Repaints card + shadow blur radius (extended region)',
    rect: { top: 0.35, left: 0.05, width: 0.5, height: 0.3 },
    area: Math.round(SCENE_W * 0.6 * SCENE_H * 0.4),
    pipeline: ['paint', 'composite'],
    property: 'box-shadow (card)',
    targetLabel: 'Card + shadow region',
    cost: 'medium',
    apply: (sceneEl, headerEl, paraEl, cardEl) => { if (cardEl) cardEl.style.boxShadow = '0 0 40px rgba(244,63,94,0.6)'; },
    reset: (sceneEl, headerEl, paraEl, cardEl) => { if (cardEl) cardEl.style.boxShadow = ''; },
  },
  {
    id: 'transform',
    label: 'Animate card with transform',
    description: 'Zero pixels repainted — composite only!',
    rect: null,
    area: 0,
    pipeline: ['composite'],
    property: 'transform',
    targetLabel: 'None (composite only)',
    cost: 'cheap',
    apply: (sceneEl, headerEl, paraEl, cardEl) => { if (cardEl) cardEl.style.transform = 'translateX(20px) scale(1.02)'; },
    reset: (sceneEl, headerEl, paraEl, cardEl) => { if (cardEl) cardEl.style.transform = ''; },
  },
];

export default function PaintRegionDemo() {
  const [selected, setSelected] = useState(null);
  const [flashKey, setFlashKey] = useState(0);
  const [lastArea, setLastArea] = useState(null);
  const sceneRef = useRef(null);
  const headerRef = useRef(null);
  const paraRef = useRef(null);
  const cardRef = useRef(null);

  const selectedOpt = PAINT_OPTIONS.find(o => o.id === selected) ?? null;

  function trigger(opt) {
    setSelected(opt.id);
    setFlashKey(k => k + 1);
    setLastArea(opt.area);
    opt.apply(sceneRef.current, headerRef.current, paraRef.current, cardRef.current);
    setTimeout(() => {
      opt.reset(sceneRef.current, headerRef.current, paraRef.current, cardRef.current);
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes paintFlash {
          0%   { opacity: 1; }
          70%  { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Header card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-900/40 text-amber-400 text-xs font-bold px-2 py-0.5 rounded">Demo 4</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Paint Region</h2>
        <p className="text-sm text-gray-400">
          The cost of a paint pass scales with the area it covers. Smaller invalidation rectangles = faster paint. Composite-only changes (transform, opacity on promoted elements) invalidate zero pixels.
        </p>
      </div>

      {/* Scene card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-gray-500 uppercase mb-3">Page preview (click a property below)</div>

        <div
          ref={sceneRef}
          className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
          style={{ height: '280px' }}
        >
          {/* Header */}
          <div ref={headerRef} className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="text-xs text-gray-500 ml-2">fake-browser.app</span>
          </div>

          {/* Content */}
          <div className="p-4">
            <div ref={paraRef} className="text-gray-400 text-sm mb-4 leading-relaxed">
              The rendering pipeline processes your CSS changes. Paint cost scales with the area of the invalidation rectangle.
            </div>

            {/* Card */}
            <div ref={cardRef} className="bg-gray-800 rounded-lg p-3 border border-gray-700 inline-block">
              <div className="text-xs text-gray-400">Card element</div>
              <div className="flex gap-2 mt-2">
                <div className="w-8 h-8 bg-amber-500/60 rounded" />
                <div className="w-8 h-8 bg-blue-500/60 rounded" />
                <div className="w-8 h-8 bg-green-500/60 rounded" />
              </div>
            </div>
          </div>

          {/* Paint flash overlay */}
          {selectedOpt?.rect && (
            <div
              key={`flash-${flashKey}`}
              className="absolute pointer-events-none"
              style={{
                top: `${selectedOpt.rect.top * 100}%`,
                left: `${selectedOpt.rect.left * 100}%`,
                width: `${selectedOpt.rect.width * 100}%`,
                height: `${selectedOpt.rect.height * 100}%`,
                backgroundColor: 'rgba(74, 222, 128, 0.35)',
                border: '2px solid rgba(74, 222, 128, 0.8)',
                animation: 'paintFlash 1000ms ease-out forwards',
              }}
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-3 text-sm">
          <div>
            <span className="text-gray-500">Last paint area: </span>
            <span className={`font-mono font-bold ${lastArea === 0 ? 'text-green-400' : lastArea > 100000 ? 'text-red-400' : 'text-yellow-400'}`}>
              {lastArea === null ? '—' : lastArea === 0 ? '0 px (no paint!)' : `${lastArea.toLocaleString()} px`}
            </span>
          </div>
          {lastArea !== null && lastArea > 0 && (
            <div className="text-xs text-gray-600">
              {((lastArea / (SCENE_W * SCENE_H)) * 100).toFixed(0)}% of scene
            </div>
          )}
        </div>
      </div>

      {/* Property picker card */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="text-xs text-gray-500 uppercase mb-3">Choose a property change to trigger</div>
        <div className="space-y-2">
          {PAINT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => trigger(opt)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selected === opt.id
                  ? 'border-amber-500 bg-amber-900/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">{opt.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  opt.cost === 'cheap' ? 'bg-green-900/40 text-green-400' :
                  opt.cost === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-red-900/40 text-red-400'
                }`}>{opt.cost}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <span>Pipeline: </span>
                {opt.pipeline.map(stage => (
                  <span key={stage} className={`px-1 rounded text-xs ${
                    stage === 'layout' ? 'bg-red-950/60 text-red-400' :
                    stage === 'paint' ? 'bg-yellow-950/60 text-yellow-400' :
                    'bg-green-950/60 text-green-400'
                  }`}>{stage}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Key insight callout */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 text-sm text-gray-300">
        <p className="mb-2">
          Paint cost scales directly with the area being repainted. Changing <code className="text-amber-400">background-color</code> on <code className="text-amber-400">&lt;body&gt;</code> repaints every pixel in the viewport — millions of pixels at HD resolution. Changing <code className="text-amber-400">color</code> on a single paragraph repaints a few thousand pixels. <strong>Composite-only changes</strong> — <code className="text-amber-400">transform</code> and <code className="text-amber-400">opacity</code> on promoted elements — invalidate <strong>zero pixels</strong> because the GPU re-composites existing rasters without touching the pixel buffer.
        </p>
        <p>
          Enable "Paint flashing" in Chrome DevTools (&#8942; &rarr; More tools &rarr; Rendering &rarr; Paint flashing) to see this in your own app.
        </p>
      </div>

      <CodeBlock code={PAINT_REGION_CODE} />
    </div>
  );
}
