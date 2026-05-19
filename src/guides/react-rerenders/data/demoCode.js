export const RENDER_TREE_CODE = `// React re-renders a component when:
//   1. Its own state changes (useState setter)
//   2. Its parent re-renders (cascades down — by default!)
//   3. A context it consumes changes value
//
// React.memo halts the cascade IF the new props are referentially equal.
// Inline objects ({} every render) and inline functions defeat memo.

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Inc</button>
      <Child data={{ value: count }} />  {/* {} is new every render — memo useless */}
    </>
  );
}

const Child = React.memo(function Child({ data }) {
  return <div>{data.value}</div>;
});

// Fix: stable reference via useMemo
const stableData = useMemo(() => ({ value: count }), [count]);
<Child data={stableData} />`;

export const MEMO_CODE = `// useMemo: caches a value across renders. Worth it ONLY when:
//   1. The computation is genuinely expensive, OR
//   2. The result is passed as a prop to a memoized child (referential equality)
//
// Otherwise, useMemo adds overhead (dep comparison + cache lookup) for no win.

// GOOD: expensive computation
const sorted = useMemo(
  () => bigArray.sort((a, b) => a.score - b.score),
  [bigArray]
);

// USELESS: cheap computation
const doubled = useMemo(() => count * 2, [count]); // just write \`count * 2\`

// useCallback is useMemo for functions. Same rules.
// useCallback(fn, [deps]) ≡ useMemo(() => fn, [deps])

const handleClick = useCallback(() => {
  doThing(value);
}, [value]);`;

export const CONTEXT_CASCADE_CODE = `// Context re-renders EVERY consumer when its value changes,
// regardless of whether they read the changed field.

const AppContext = createContext({ user: null, theme: 'dark', count: 0 });

function App() {
  const [count, setCount] = useState(0);
  // 🚨 New object every render → every consumer re-renders every time
  return (
    <AppContext.Provider value={{ user, theme, count }}>
      ...
    </AppContext.Provider>
  );
}

// Fix 1: split contexts by update frequency
const UserContext  = createContext(null);   // rarely changes
const ThemeContext = createContext('dark'); // rarely changes
const CountContext = createContext(0);      // changes often
// Components consume only the contexts they need.

// Fix 2: stable value via useMemo
const value = useMemo(() => ({ user, theme, count }), [user, theme, count]);
// (Still re-renders all consumers when ANY field changes — but at least
// not on parent re-renders that don't change those fields.)`;

export const STALE_CLOSURE_CODE = `// The most common React bug: a closure captures a stale value.

function BrokenCounter() {
  const [count, setCount] = useState(0);
  // 🚨 BUG: every scheduled setCount captures count=0 → final value is 1, not 10
  const incTenTimes = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => setCount(count + 1), 0);
    }
  };
  return <button onClick={incTenTimes}>+10</button>;
}

// Fix: functional updater receives the LATEST state
function FixedCounter() {
  const [count, setCount] = useState(0);
  const incTenTimes = () => {
    for (let i = 0; i < 10; i++) {
      setCount(c => c + 1);   // ✅ each setter sees the previous result
    }
  };
  return <button onClick={incTenTimes}>+10</button>;
}

// useEffect stale closure:
function BrokenLogger({ value }) {
  useEffect(() => {
    const id = setInterval(() => console.log(value), 1000);
    return () => clearInterval(id);
  }, []); // 🚨 missing 'value' dep — interval always logs initial value forever
}

// Fix: use a ref that you keep updated:
function FixedLogger({ value }) {
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => {
    const id = setInterval(() => console.log(valueRef.current), 1000);
    return () => clearInterval(id);
  }, []);
}`;
