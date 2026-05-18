import EntryProperties from './demos/EntryProperties';
import ThresholdVisualizer from './demos/ThresholdVisualizer';
import RootMarginPlayground from './demos/RootMarginPlayground';
import LazyLoadingImages from './demos/LazyLoadingImages';
import ScrollAnimations from './demos/ScrollAnimations';
import InfiniteScroll from './demos/InfiniteScroll';
import CustomRoot from './demos/CustomRoot';
import ScrollSpy from './demos/ScrollSpy';

export default {
  id: 'intersection-observer',
  label: 'Intersection Observer',
  description: 'Learn how the browser detects element visibility and how to react to it efficiently.',
  icon: '👁',
  color: 'blue',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
  sections: [
    { id: 'entry-properties',     label: 'API Basics & Entry Properties',  component: EntryProperties },
    { id: 'threshold-visualizer', label: 'Threshold Visualizer',           component: ThresholdVisualizer },
    { id: 'root-margin',          label: 'rootMargin Playground',          component: RootMarginPlayground },
    { id: 'lazy-loading',         label: 'Lazy Loading Images',            component: LazyLoadingImages },
    { id: 'scroll-animations',    label: 'Scroll-Triggered Animations',    component: ScrollAnimations },
    { id: 'infinite-scroll',      label: 'Infinite Scroll',                component: InfiniteScroll },
    { id: 'custom-root',          label: 'Custom Root Element',            component: CustomRoot },
    { id: 'scroll-spy',           label: 'Scroll Spy',                     component: ScrollSpy },
  ],
};
