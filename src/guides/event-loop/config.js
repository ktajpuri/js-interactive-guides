import TaskQueueDemo from './demos/TaskQueueDemo';
import ExecutionOrderDemo from './demos/ExecutionOrderDemo';
import RafVsSetTimeoutDemo from './demos/RafVsSetTimeoutDemo';
import MicrotaskStarvationDemo from './demos/MicrotaskStarvationDemo';

export default {
  id: 'event-loop',
  label: 'Event Loop',
  description: 'Visualize how JavaScript schedules and executes tasks, microtasks, and animation frames.',
  icon: '⚙',
  color: 'orange',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide',
  sections: [
    { id: 'task-queue',            label: 'Task Queue Visualizer',    component: TaskQueueDemo },
    { id: 'execution-order',       label: 'Execution Order Explorer', component: ExecutionOrderDemo },
    { id: 'raf-vs-settimeout',     label: 'rAF vs setTimeout',        component: RafVsSetTimeoutDemo },
    { id: 'microtask-starvation',  label: 'Microtask Starvation',     component: MicrotaskStarvationDemo },
  ],
};
