import { useEffect } from 'react';

export function usePerformanceObserver(type, callback, options = {}) {
  useEffect(() => {
    if (!window.PerformanceObserver) return;
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    if (!supported.includes(type)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    try {
      observer.observe({ type, buffered: true, ...options });
    } catch {
      try { observer.observe({ type, ...options }); } catch { /* unsupported */ }
    }

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
}
