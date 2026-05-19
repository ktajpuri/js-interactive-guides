import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { RENDER_TREE_CODE } from '../data/demoCode';

// ─── Flash keyframe ───────────────────────────────────────────────────────────

const FLASH_STYLE = `
  @keyframes nodeFlash {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  .node-flash { animation: nodeFlash 500ms ease-out forwards; }
`;

// ─── Shared render-flash hook (inlined for self-containment) ──────────────────

function useRenderFlash() {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    setFlashKey(k => k + 1);
  }); // no deps — runs after every render

  return { renderCount: renderCountRef.current, flashKey };
}

// ─── NodeCard UI primitive ─────────────────────────────────────────────────────

function NodeCard({ name, flashKey, renderCount, dimmed, children }) {
  return (
    <div
      className={
        dimmed
          ? 'relative rounded-lg border-2 p-2 transition-colors border-gray-800 bg-gray-950'
          : 'relative rounded-lg border-2 p-2 transition-colors border-gray-700 bg-gray-900'
      }
    >
      <div
        key={flashKey}
        className="node-flash absolute inset-0 rounded-md bg-sky-400/50 pointer-events-none"
      />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-mono text-gray-300">{name}</span>
        <span className="text-xs font-mono text-sky-400 font-bold">×{renderCount}</span>
      </div>
      {children && (
        <div className="mt-2 pl-3 border-l border-gray-700 space-y-2">{children}</div>
      )}
    </div>
  );
}

// ─── Tree node components (module-level, never recreated) ─────────────────────

// Item1
function Item1Node() {
  const { renderCount, flashKey } = useRenderFlash();
  return <NodeCard name="Item1" flashKey={flashKey} renderCount={renderCount} />;
}
const Item1Memo = React.memo(Item1Node);

// Item2
function Item2Node() {
  const { renderCount, flashKey } = useRenderFlash();
  return <NodeCard name="Item2" flashKey={flashKey} renderCount={renderCount} />;
}
const Item2Memo = React.memo(Item2Node);

// List — accepts `data` to demonstrate memo-defeating inline props
function ListNode({ data, memoEnabled }) {
  const { renderCount, flashKey } = useRenderFlash();
  const Item1 = memoEnabled.item1 ? Item1Memo : Item1Node;
  const Item2 = memoEnabled.item2 ? Item2Memo : Item2Node;
  return (
    <NodeCard name="List" flashKey={flashKey} renderCount={renderCount}>
      <Item1 />
      <Item2 />
    </NodeCard>
  );
}
const ListMemo = React.memo(ListNode);

// Footer
function FooterNode() {
  const { renderCount, flashKey } = useRenderFlash();
  return <NodeCard name="Footer" flashKey={flashKey} renderCount={renderCount} />;
}
const FooterMemo = React.memo(FooterNode);

// Main — renders List + Footer
function MainNode({ data, memoEnabled, useInlineProps, tick }) {
  const { renderCount, flashKey } = useRenderFlash();
  const List   = memoEnabled.list   ? ListMemo   : ListNode;
  const Footer = memoEnabled.footer ? FooterMemo : FooterNode;

  // Stable ref — only changes when tick changes
  const stableData = useMemo(() => ({ value: tick }), [tick]);
  // Inline object — new ref on every render (defeats memo)
  const inlineData = { value: tick };

  return (
    <NodeCard name="Main" flashKey={flashKey} renderCount={renderCount}>
      <List
        data={useInlineProps ? inlineData : stableData}
        memoEnabled={memoEnabled}
      />
      <Footer />
    </NodeCard>
  );
}
const MainMemo = React.memo(MainNode);

// Header
function HeaderNode() {
  const { renderCount, flashKey } = useRenderFlash();
  return <NodeCard name="Header" flashKey={flashKey} renderCount={renderCount} />;
}
const HeaderMemo = React.memo(HeaderNode);

// ─── App subtree (the visualized tree root) ───────────────────────────────────

function AppTree({ tick, memoEnabled, useInlineProps }) {
  const { renderCount, flashKey } = useRenderFlash();
  const Header = memoEnabled.header ? HeaderMemo : HeaderNode;
  const Main   = memoEnabled.main   ? MainMemo   : MainNode;

  return (
    <NodeCard name="App" flashKey={flashKey} renderCount={renderCount}>
      <Header />
      <Main
        tick={tick}
        memoEnabled={memoEnabled}
        useInlineProps={useInlineProps}
      />
    </NodeCard>
  );
}

// ─── Memo toggle button ───────────────────────────────────────────────────────

function MemoToggle({ label, enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={
        enabled
          ? 'px-3 py-1.5 text-xs rounded border font-medium transition-colors bg-sky-900/40 border-sky-600 text-sky-400'
          : 'px-3 py-1.5 text-xs rounded border font-medium transition-colors bg-gray-800 border-gray-700 text-gray-500'
      }
    >
      {label}
      <span className="ml-1.5 font-mono">{enabled ? 'ON' : 'OFF'}</span>
    </button>
  );
}

// ─── Main demo component ──────────────────────────────────────────────────────

const DEFAULT_MEMO = {
  header: false,
  main:   false,
  list:   false,
  footer: false,
  item1:  false,
  item2:  false,
};

const NODE_LABELS = [
  { key: 'header', label: 'Header' },
  { key: 'main',   label: 'Main'   },
  { key: 'list',   label: 'List'   },
  { key: 'footer', label: 'Footer' },
  { key: 'item1',  label: 'Item1'  },
  { key: 'item2',  label: 'Item2'  },
];

export default function RenderTreeDemo() {
  const [tick,         setTick]         = useState(0);
  const [memoEnabled,  setMemoEnabled]  = useState(DEFAULT_MEMO);
  const [useInlineProps, setUseInlineProps] = useState(true);
  const [treeKey,      setTreeKey]      = useState(0);

  function toggleMemo(nodeKey) {
    setMemoEnabled(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  }

  function resetTree() {
    setTreeKey(k => k + 1);
    setTick(0);
    setMemoEnabled(DEFAULT_MEMO);
    setUseInlineProps(true);
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6 pb-16">
      <style>{FLASH_STYLE}</style>

      {/* ── Header ── */}
      <header>
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="bg-sky-900/40 text-sky-400 text-xs font-bold px-2 py-0.5 rounded border border-sky-800/50">
            Demo 1
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">Re-render Tree Visualizer</h1>
        <p className="text-gray-400 mt-2 leading-relaxed">
          Every React component flashes green when it re-renders. Trigger a root
          state update and watch the cascade. Toggle{' '}
          <code className="text-sky-400 text-xs">React.memo</code> on individual
          nodes to block the cascade.
        </p>
      </header>

      {/* ── Controls ── */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Controls
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Trigger button */}
          <button
            onClick={() => setTick(t => t + 1)}
            className="bg-sky-600 text-white hover:bg-sky-500 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Trigger root re-render
          </button>

          {/* Reset button */}
          <button
            onClick={resetTree}
            className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            Reset render counts
          </button>
        </div>

        {/* Inline props toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useInlineProps}
            onChange={e => setUseInlineProps(e.target.checked)}
            className="accent-sky-500"
          />
          Pass inline{' '}
          <code className="text-sky-400 text-xs">
            {'data={{ value: tick }}'}
          </code>{' '}
          to List (defeats memo even when enabled)
        </label>
      </div>

      {/* ── Memo toggles ── */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          React.memo status
        </h2>
        <div className="flex flex-wrap gap-2">
          {NODE_LABELS.map(({ key, label }) => (
            <MemoToggle
              key={key}
              label={label}
              enabled={memoEnabled[key]}
              onToggle={() => toggleMemo(key)}
            />
          ))}
        </div>
      </div>

      {/* ── Tree visualization ── */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Component tree
          </h2>
          <span className="text-xs font-mono text-gray-600">
            tick: {tick}
          </span>
        </div>

        {/* Tree width constrained so nesting is readable */}
        <div className="max-w-sm" key={treeKey}>
          <AppTree
            tick={tick}
            memoEnabled={memoEnabled}
            useInlineProps={useInlineProps}
          />
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Each node shows its independent render count (×N). Flash = re-render just happened.
        </p>
      </div>

      {/* ── Key insight callout ── */}
      <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-4 text-sm text-gray-300 leading-relaxed">
        By default, every parent re-render cascades to every child — watch all
        nodes flash on each click.{' '}
        <code className="text-sky-400 text-xs">React.memo</code> halts the
        cascade when <strong className="text-white">props are referentially equal</strong>.
        But pass{' '}
        <code className="text-sky-400 text-xs">{'data={{ value: tick }}'}</code>{' '}
        inline and memo is defeated — a new <code className="text-sky-400 text-xs">{'{}'}</code>{' '}
        object is created on every parent render, so the equality check always
        fails. Uncheck "inline props" to give List a stable reference via{' '}
        <code className="text-sky-400 text-xs">useMemo</code> and watch the
        cascade stop.
      </div>

      {/* ── Code block ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Key patterns
        </h2>
        <CodeBlock code={RENDER_TREE_CODE} />
      </div>
    </section>
  );
}
