import { useState, useEffect } from 'react';

const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);

export function useScrollSpy(sectionRefs, options = {}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observers = [];
    const ratioMap = new Map();

    sectionRefs.forEach((ref, index) => {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          ratioMap.set(index, entry.intersectionRatio);
          let maxIndex = 0;
          let maxRatio = -1;
          ratioMap.forEach((ratio, idx) => {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              maxIndex = idx;
            }
          });
          setActiveIndex(maxIndex);
        },
        { threshold: THRESHOLDS, ...options }
      );

      observer.observe(ref.current);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRefs.length, options.rootMargin]);

  return activeIndex;
}
