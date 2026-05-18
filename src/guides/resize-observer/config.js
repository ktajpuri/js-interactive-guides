import EntryPropertiesDemo from './demos/EntryPropertiesDemo';
import ContainerAwareDemo from './demos/ContainerAwareDemo';
import VsWindowResizeDemo from './demos/VsWindowResizeDemo';
import DebouncePatternDemo from './demos/DebouncePatternDemo';

export default {
  id: 'resize-observer',
  label: 'ResizeObserver',
  description: 'Detect element size changes efficiently without polling or window resize events.',
  icon: '↔',
  color: 'purple',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver',
  sections: [
    { id: 'entry-properties', label: 'Entry Properties Explorer',  component: EntryPropertiesDemo },
    { id: 'container-aware',  label: 'Container-Aware Component',  component: ContainerAwareDemo },
    { id: 'vs-window-resize', label: 'vs window resize event',     component: VsWindowResizeDemo },
    { id: 'debounce-pattern', label: 'Debounce Pattern',           component: DebouncePatternDemo },
  ],
};
