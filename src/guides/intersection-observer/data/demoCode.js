export const ENTRY_PROPERTIES_CODE = `const observer = new IntersectionObserver(([entry]) => {
  // entry.isIntersecting — boolean, true when element overlaps root
  console.log('isIntersecting:', entry.isIntersecting);

  // entry.intersectionRatio — 0.0 to 1.0, how much is visible
  console.log('intersectionRatio:', entry.intersectionRatio.toFixed(2));

  // entry.boundingClientRect — DOMRect of the target element
  console.log('boundingClientRect:', entry.boundingClientRect);

  // entry.intersectionRect — DOMRect of the visible portion
  console.log('intersectionRect:', entry.intersectionRect);

  // entry.rootBounds — DOMRect of the root (null for viewport)
  console.log('rootBounds:', entry.rootBounds);

  // entry.time — DOMHighResTimeStamp when the change occurred
  console.log('time:', entry.time.toFixed(1) + 'ms');

  // entry.target — the observed DOM element
  console.log('target:', entry.target);
}, {
  threshold: Array.from({ length: 101 }, (_, i) => i / 100),
});

observer.observe(document.querySelector('#target'));`;

export const THRESHOLD_CODE = `// Single threshold — fires when 50% of element is visible
const observer = new IntersectionObserver(callback, {
  threshold: 0.5,
});

// Multiple thresholds — fires at each boundary crossing
const observer = new IntersectionObserver(callback, {
  threshold: [0, 0.25, 0.5, 0.75, 1],
});

// The callback receives the entry that crossed the threshold
function callback([entry]) {
  console.log(
    'Crossed threshold!',
    'ratio:', entry.intersectionRatio.toFixed(2),
    'isIntersecting:', entry.isIntersecting,
  );
}`;

export const ROOT_MARGIN_CODE = `// rootMargin expands (+) or shrinks (-) the root boundary
// Syntax mirrors CSS margin: top right bottom left

// Trigger 100px BEFORE element enters viewport (pre-loading)
const observer = new IntersectionObserver(callback, {
  rootMargin: '0px 0px -100px 0px',
});

// Trigger when element is 200px away from entering (eager)
const observer = new IntersectionObserver(callback, {
  rootMargin: '200px 0px 200px 0px',
});

// Create a "center-only" zone — element must be 20% in
const observer = new IntersectionObserver(callback, {
  rootMargin: '-20% 0px -20% 0px',
});`;

export const LAZY_LOADING_CODE = `function LazyImage({ src, alt }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(entry.target); // stop watching once triggered
      }
    }, { rootMargin: '100px' }); // start loading 100px early

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible && (
        <img src={src} alt={alt} onLoad={() => setLoaded(true)} />
      )}
    </div>
  );
}`;

export const SCROLL_ANIMATIONS_CODE = `function AnimatedCard({ index, staggerMs, animationType }) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasAnimated(true);
        observer.unobserve(entry.target); // animate only once
      }
    }, { threshold: 0.2 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const style = {
    transitionDelay: \`\${index * staggerMs}ms\`,
    opacity: hasAnimated ? 1 : 0,
    transform: hasAnimated ? 'none' : getInitialTransform(animationType),
  };

  return <div ref={ref} style={style} className="transition-all duration-700">...</div>;
}`;

export const INFINITE_SCROLL_CODE = `function InfiniteScrollList() {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [items, setItems] = useState(generateItems(10));

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isLoadingRef.current) {
        isLoadingRef.current = true;
        // Simulate API fetch
        setTimeout(() => {
          setItems(prev => [...prev, ...generateItems(10)]);
          isLoadingRef.current = false;
        }, 800);
      }
    }, {
      root: containerRef.current,  // scoped to scroll container!
      rootMargin: '0px 0px 150px 0px', // pre-fetch before visible
    });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ height: '400px', overflowY: 'auto' }}>
      {items.map(item => <Item key={item.id} {...item} />)}
      <div ref={sentinelRef} /> {/* invisible sentinel */}
    </div>
  );
}`;

export const CUSTOM_ROOT_CODE = `// The root option scopes the observer to any scrollable ancestor
// Default (null) = the browser viewport

const scrollContainerRef = useRef(null);
const itemRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    console.log('Visible within container:', entry.isIntersecting);
  }, {
    root: scrollContainerRef.current, // observe relative to THIS element
    threshold: 0.5,
  });

  if (itemRef.current) observer.observe(itemRef.current);
  return () => observer.disconnect();
}, []);

// The item is only "intersecting" when visible within its container,
// not just anywhere in the viewport.`;

export const SCROLL_SPY_CODE = `// Track which section is most visible and highlight it in the nav
function useScrollSpy(sectionRefs) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ratioMap = useRef(new Map());

  useEffect(() => {
    const observers = sectionRefs.map((ref, index) => {
      const observer = new IntersectionObserver(([entry]) => {
        ratioMap.current.set(index, entry.intersectionRatio);
        // Pick the section with the highest intersection ratio
        let maxIdx = 0, maxRatio = -1;
        ratioMap.current.forEach((ratio, idx) => {
          if (ratio > maxRatio) { maxRatio = ratio; maxIdx = idx; }
        });
        setActiveIndex(maxIdx);
      }, {
        threshold: Array.from({ length: 11 }, (_, i) => i / 10),
        rootMargin: '-20% 0px -70% 0px', // active zone = top 10% band
      });
      if (ref.current) observer.observe(ref.current);
      return observer;
    });

    return () => observers.forEach(o => o.disconnect());
  }, [sectionRefs.length]);

  return activeIndex;
}`;

export const WINDOWING_CODE = `const ITEM_HEIGHT = 48;
const OVERSCAN = 3;

// Hook: calculates which indices are currently visible
function useVirtualList(containerRef, totalCount) {
  const [range, setRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;

      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
      const end = Math.min(
        totalCount,
        Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
      );
      setRange({ start, end });
    };

    update(); // run once on mount
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [containerRef, totalCount]);

  return range;
}

// Usage: virtual list container
function VirtualList({ totalCount }) {
  const containerRef = useRef(null);
  const { start, end } = useVirtualList(containerRef, totalCount);

  return (
    // Fixed-height scrollable container
    <div ref={containerRef} style={{ height: 400, overflowY: 'auto' }}>

      {/* Spacer — full logical height keeps scrollbar accurate */}
      <div style={{ height: totalCount * ITEM_HEIGHT, position: 'relative' }}>

        {/* Only render the visible window (~20 items) */}
        {Array.from({ length: end - start }, (_, i) => start + i).map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * ITEM_HEIGHT, // place at correct scroll position
              height: ITEM_HEIGHT,
              left: 0,
              right: 0,
            }}
          >
            Item #{index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}`;
