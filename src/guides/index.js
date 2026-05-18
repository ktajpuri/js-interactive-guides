import intersectionObserverConfig from './intersection-observer/config';
import webVitalsConfig from './web-vitals/config';
import eventLoopConfig from './event-loop/config';
import resizeObserverConfig from './resize-observer/config';
import webWorkersConfig from './web-workers/config';
import memoryGcConfig from './memory-gc/config';
import renderingPipelineConfig from './rendering-pipeline/config';

export const GUIDES = [
  intersectionObserverConfig,
  webVitalsConfig,
  eventLoopConfig,
  resizeObserverConfig,
  webWorkersConfig,
  memoryGcConfig,
  renderingPipelineConfig,
];
