import PipelineMapDemo from './demos/PipelineMapDemo';
import LayoutThrashingDemo from './demos/LayoutThrashingDemo';
import LayerPromotionDemo from './demos/LayerPromotionDemo';
import PaintRegionDemo from './demos/PaintRegionDemo';

export default {
  id: 'rendering-pipeline',
  label: 'Rendering Pipeline',
  description: 'Reflow, repaint, composite — and how to stop blocking 60fps. Animate the wrong property and the browser does 10× more work.',
  icon: '🎨',
  color: 'amber',
  docsUrl: 'https://web.dev/rendering-performance/',
  sections: [
    { id: 'pipeline-map',     label: 'Pipeline Trigger Map', component: PipelineMapDemo },
    { id: 'layout-thrashing', label: 'Layout Thrashing',     component: LayoutThrashingDemo },
    { id: 'layer-promotion',  label: 'Layer Promotion',      component: LayerPromotionDemo },
    { id: 'paint-region',     label: 'Paint Region',         component: PaintRegionDemo },
  ],
};
