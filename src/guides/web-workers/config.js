import MainThreadFreezeDemo from './demos/MainThreadFreezeDemo';
import TransferableDemo from './demos/TransferableDemo';

export default {
  id: 'web-workers',
  label: 'Web Workers',
  description: 'Move heavy computation off the main thread to keep animations smooth and UIs responsive.',
  icon: '🧵',
  color: 'cyan',
  docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
  sections: [
    { id: 'main-thread-freeze', label: 'Main Thread Freeze',   component: MainThreadFreezeDemo },
    { id: 'transferable',       label: 'Transferable Objects', component: TransferableDemo },
  ],
};
