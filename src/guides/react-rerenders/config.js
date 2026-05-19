import RenderTreeDemo from './demos/RenderTreeDemo';
import MemoUsefulnessDemo from './demos/MemoUsefulnessDemo';
import ContextCascadeDemo from './demos/ContextCascadeDemo';
import StaleClosureDemo from './demos/StaleClosureDemo';

export default {
  id: 'react-rerenders',
  label: 'React Re-renders',
  description: 'Why every component re-renders, when memo actually helps, why context melts your tree, and the stale-closure footgun.',
  icon: '⚛️',
  color: 'sky',
  docsUrl: 'https://react.dev/learn/render-and-commit',
  sections: [
    { id: 'render-tree',     label: 'Re-render Tree Visualizer', component: RenderTreeDemo },
    { id: 'memo',            label: 'When useMemo Helps',        component: MemoUsefulnessDemo },
    { id: 'context-cascade', label: 'Context Cascade',           component: ContextCascadeDemo },
    { id: 'stale-closure',   label: 'Stale Closure Lab',         component: StaleClosureDemo },
  ],
};
