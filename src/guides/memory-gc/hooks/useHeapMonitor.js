import { useState, useEffect, useRef } from 'react';

const SAMPLE_INTERVAL = 100; // ms
const DEFAULT_WINDOW = 600;  // 60s

export function isHeapApiAvailable() {
  return typeof performance !== 'undefined' && 'memory' in performance;
}

export function useHeapMonitor(windowSize = DEFAULT_WINDOW) {
  const [samples, setSamples] = useState([]);
  const [current, setCurrent] = useState(0);
  const [peak, setPeak] = useState(0);
  const bufferRef = useRef([]);
  const peakRef = useRef(0);

  useEffect(() => {
    if (!isHeapApiAvailable()) return;
    const tick = () => {
      const used = performance.memory.usedJSHeapSize;
      bufferRef.current.push(used);
      if (bufferRef.current.length > windowSize) bufferRef.current.shift();
      if (used > peakRef.current) peakRef.current = used;
      setSamples([...bufferRef.current]);
      setCurrent(used);
      setPeak(peakRef.current);
    };
    tick(); // immediate first sample
    const id = setInterval(tick, SAMPLE_INTERVAL);
    return () => clearInterval(id);
  }, [windowSize]);

  const reset = () => {
    bufferRef.current = [];
    peakRef.current = 0;
    setSamples([]);
    setPeak(0);
  };

  return { samples, current, peak, available: isHeapApiAvailable(), reset };
}

export function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
