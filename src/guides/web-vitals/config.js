import LCPDemo from './demos/LCPDemo';
import CLSDemo from './demos/CLSDemo';
import INPDemo from './demos/INPDemo';
import FCPDemo from './demos/FCPDemo';
import TBTDemo from './demos/TBTDemo';
import TTFBDemo from './demos/TTFBDemo';

export default {
  id: 'web-vitals',
  label: 'Web Vitals',
  description: 'Understand Core Web Vitals and see exactly how JavaScript impacts LCP, CLS, INP, FCP, TBT, and TTFB.',
  icon: '⚡',
  color: 'green',
  docsUrl: 'https://web.dev/vitals/',
  sections: [
    { id: 'lcp',  label: 'LCP — Largest Contentful Paint', component: LCPDemo },
    { id: 'cls',  label: 'CLS — Cumulative Layout Shift',  component: CLSDemo },
    { id: 'inp',  label: 'INP — Interaction to Next Paint', component: INPDemo },
    { id: 'fcp',  label: 'FCP — First Contentful Paint',   component: FCPDemo },
    { id: 'tbt',  label: 'TBT — Total Blocking Time',      component: TBTDemo },
    { id: 'ttfb', label: 'TTFB — Time to First Byte',      component: TTFBDemo },
  ],
};
