export const ENTRY_PROPERTIES_CODE = `// ResizeObserver fires with entry objects describing the new size.
// Use borderBoxSize for layout, contentBoxSize for content area.

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;

    // contentRect: excludes padding and border
    console.log('content area:', width, 'x', height);

    // borderBoxSize: includes padding + border (logical sizing)
    if (entry.borderBoxSize?.length > 0) {
      const { inlineSize, blockSize } = entry.borderBoxSize[0];
      console.log('border box:', inlineSize, 'x', blockSize);
    }
  }
});

observer.observe(document.querySelector('.my-element'));

// Always disconnect to avoid memory leaks
// observer.disconnect();`;

export const CONTAINER_AWARE_CODE = `// Container-aware component using ResizeObserver.
// The layout adapts to the component's container width — not the viewport.

function useContainerWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return width;
}

function ProductCard({ containerRef }) {
  const width = useContainerWidth(containerRef);
  const layout = width < 280 ? 'narrow' : width < 420 ? 'medium' : 'wide';

  return (
    <div data-layout={layout} className={\`card card--\${layout}\`}>
      {/* layout changes based on container width, not viewport */}
    </div>
  );
}`;

export const VS_RESIZE_CODE = `// window resize fires only for viewport changes.
// ResizeObserver fires for ANY element size change.

// BAD: misses element resizes not caused by window resize
window.addEventListener('resize', () => {
  const width = element.getBoundingClientRect().width;
  updateLayout(width); // won't fire if a parent container changes size
});

// GOOD: fires whenever the element itself changes size
const observer = new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  updateLayout(width); // fires for any size change, regardless of cause
});
observer.observe(element);`;

export const DEBOUNCE_CODE = `// ResizeObserver can fire on every pixel change during a resize.
// Debounce expensive recalculations.

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const expensiveLayout = debounce((entries) => {
  for (const entry of entries) {
    recalculateLayout(entry.contentRect); // only runs after resize settles
  }
}, 100);

const observer = new ResizeObserver(expensiveLayout);
observer.observe(element);

// Note: as of 2024, most browsers call ResizeObserver callbacks
// before paint, throttled to once per frame — so debouncing is
// mainly needed if your callback itself is expensive.`;
