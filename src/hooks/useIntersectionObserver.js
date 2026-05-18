import { useState, useEffect } from 'react';

export function useIntersectionObserver(ref, options = {}) {
  const [entry, setEntry] = useState(null);

  const { threshold, root, rootMargin } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, root, rootMargin]);

  return entry;
}
