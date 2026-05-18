import HeapMonitorDemo from './demos/HeapMonitorDemo';
import DetachedDOMDemo from './demos/DetachedDOMDemo';
import WeakMapDemo from './demos/WeakMapDemo';
import GCInActionDemo from './demos/GCInActionDemo';

export default {
  id: 'memory-gc',
  label: 'Memory & GC',
  description: 'See heap allocation, leaks, and garbage collection happen in real time. Most leaks are invisible — these demos make them visible.',
  icon: '🧠',
  color: 'rose',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management',
  sections: [
    { id: 'heap-monitor', label: 'Heap Monitor',           component: HeapMonitorDemo },
    { id: 'detached-dom', label: 'Detached DOM Leak',      component: DetachedDOMDemo },
    { id: 'weakmap',      label: 'WeakMap vs Map',         component: WeakMapDemo },
    { id: 'gc-in-action', label: 'GC in Action (WeakRef)', component: GCInActionDemo },
  ],
};
