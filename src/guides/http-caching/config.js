import CacheControlBuilderDemo from './demos/CacheControlBuilderDemo';
import ETagFlowDemo from './demos/ETagFlowDemo';
import SwrTimelineDemo from './demos/SwrTimelineDemo';
import SwStrategyDemo from './demos/SwStrategyDemo';

export default {
  id: 'http-caching',
  label: 'HTTP Caching',
  description: 'Cache-Control, ETags, stale-while-revalidate, service worker strategies. Half of all "why is my site slow" issues live here.',
  icon: '🗄️',
  color: 'teal',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching',
  sections: [
    { id: 'cache-control', label: 'Cache-Control Builder',   component: CacheControlBuilderDemo },
    { id: 'etag',          label: 'ETag / 304 Flow',         component: ETagFlowDemo },
    { id: 'swr',           label: 'Stale-While-Revalidate',  component: SwrTimelineDemo },
    { id: 'sw-strategy',   label: 'SW Strategy Picker',      component: SwStrategyDemo },
  ],
};
