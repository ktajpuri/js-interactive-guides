import { useState, useContext, createContext, useRef, memo } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { CONTEXT_CASCADE_CODE } from '../data/demoCode';

// Mode A — single context (the bug)
const SingleCtx = createContext({ count: 0, theme: 'dark', user: 'Alice' });

// Mode B — split contexts (the fix)
const CountCtx = createContext(0);
const ThemeCtx = createContext('dark');
const UserCtx  = createContext('Alice');

// ── Individual consumer components for Mode A ─────────────────────────────

const SingleCtxConsumer = memo(function SingleCtxConsumer({ name, reads, field }) {
  const ctx = useContext(SingleCtx);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const flashKey = renderCountRef.current;


  return (
    <div className="relative rounded-lg border border-gray-700 bg-gray-800 p-2 text-xs">
      <div key={flashKey} className="ctx-flash absolute inset-0 rounded-lg bg-sky-400/40 pointer-events-none" />
      <div className="relative">
        <span className="font-mono text-gray-300 text-xs font-bold">{name}</span>
        <span className="text-sky-400 text-xs ml-1">({reads})</span>
        <div className="text-gray-500 text-xs">val: <span className="text-amber-400 font-mono">{String(ctx[field])}</span></div>
        <div className="text-sky-400 font-mono text-xs">×{renderCountRef.current}</div>
      </div>
    </div>
  );
});

// ── Individual consumer components for Mode B ─────────────────────────────

const CountCtxConsumer = memo(function CountCtxConsumer({ name }) {
  const count = useContext(CountCtx);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const flashKey = renderCountRef.current;


  return (
    <div className="relative rounded-lg border border-gray-700 bg-gray-800 p-2 text-xs">
      <div key={flashKey} className="ctx-flash absolute inset-0 rounded-lg bg-sky-400/40 pointer-events-none" />
      <div className="relative">
        <span className="font-mono text-gray-300 text-xs font-bold">{name}</span>
        <span className="text-sky-400 text-xs ml-1">(count)</span>
        <div className="text-gray-500 text-xs">val: <span className="text-amber-400 font-mono">{count}</span></div>
        <div className="text-sky-400 font-mono text-xs">×{renderCountRef.current}</div>
      </div>
    </div>
  );
});

const ThemeCtxConsumer = memo(function ThemeCtxConsumer({ name }) {
  const theme = useContext(ThemeCtx);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const flashKey = renderCountRef.current;


  return (
    <div className="relative rounded-lg border border-gray-700 bg-gray-800 p-2 text-xs">
      <div key={flashKey} className="ctx-flash absolute inset-0 rounded-lg bg-sky-400/40 pointer-events-none" />
      <div className="relative">
        <span className="font-mono text-gray-300 text-xs font-bold">{name}</span>
        <span className="text-sky-400 text-xs ml-1">(theme)</span>
        <div className="text-gray-500 text-xs">val: <span className="text-amber-400 font-mono">{theme}</span></div>
        <div className="text-sky-400 font-mono text-xs">×{renderCountRef.current}</div>
      </div>
    </div>
  );
});

const UserCtxConsumer = memo(function UserCtxConsumer({ name }) {
  const user = useContext(UserCtx);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const flashKey = renderCountRef.current;


  return (
    <div className="relative rounded-lg border border-gray-700 bg-gray-800 p-2 text-xs">
      <div key={flashKey} className="ctx-flash absolute inset-0 rounded-lg bg-sky-400/40 pointer-events-none" />
      <div className="relative">
        <span className="font-mono text-gray-300 text-xs font-bold">{name}</span>
        <span className="text-sky-400 text-xs ml-1">(user)</span>
        <div className="text-gray-500 text-xs">val: <span className="text-amber-400 font-mono">{user}</span></div>
        <div className="text-sky-400 font-mono text-xs">×{renderCountRef.current}</div>
      </div>
    </div>
  );
});

// ── Consumer definitions ──────────────────────────────────────────────────

const CONSUMERS = [
  { name: 'CountBadge',   reads: 'count', field: 'count' },
  { name: 'CountDisplay', reads: 'count', field: 'count' },
  { name: 'ThemeToggle',  reads: 'theme', field: 'theme' },
  { name: 'ThemeIcon',    reads: 'theme', field: 'theme' },
  { name: 'UserAvatar',   reads: 'user',  field: 'user'  },
  { name: 'UserGreeting', reads: 'user',  field: 'user'  },
  { name: 'UserBadge',    reads: 'user',  field: 'user'  },
  { name: 'NavCount',     reads: 'count', field: 'count' },
  { name: 'FooterTheme',  reads: 'theme', field: 'theme' },
  { name: 'SidebarUser',  reads: 'user',  field: 'user'  },
];

const USERS = ['Alice', 'Bob', 'Carol', 'Dave'];

// ── Main demo ─────────────────────────────────────────────────────────────

export default function ContextCascadeDemo() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState('Alice');
  const [mode, setMode] = useState('A');

  function handleToggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  function handleRenameUser() {
    setUser(u => {
      const idx = USERS.indexOf(u);
      return USERS[(idx + 1) % USERS.length];
    });
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes nodeFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .ctx-flash { animation: nodeFlash 500ms ease-out forwards; }
      `}</style>

      {/* 1 — Header */}
      <div>
        <span className="bg-sky-900/40 text-sky-400 text-xs font-bold px-2 py-0.5 rounded">Demo 3</span>
        <h2 className="mt-2 text-xl font-bold text-white">Context Cascade</h2>
        <p className="mt-1 text-sm text-gray-400">
          Updating one field in a shared context re-renders ALL consumers — even those that don't read that field.
          Split contexts by update frequency to avoid cascade.
        </p>
      </div>

      {/* 2 — Mode picker + controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        {/* Mode buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setMode('A')}
            className={`px-3 py-1.5 text-sm rounded border font-medium transition-colors ${
              mode === 'A'
                ? 'bg-red-900/40 border-red-600 text-red-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            Mode A: Single Context 🚨
          </button>
          <button
            onClick={() => setMode('B')}
            className={`px-3 py-1.5 text-sm rounded border font-medium transition-colors ${
              mode === 'B'
                ? 'bg-green-900/40 border-green-600 text-green-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            Mode B: Split Contexts ✓
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-3 py-1.5 text-sm rounded border font-medium transition-colors border-sky-700 text-sky-400 hover:bg-sky-900/30"
          >
            Increment count
          </button>
          <button
            onClick={handleToggleTheme}
            className="px-3 py-1.5 text-sm rounded border font-medium transition-colors border-purple-700 text-purple-400 hover:bg-purple-900/30"
          >
            Toggle theme
          </button>
          <button
            onClick={handleRenameUser}
            className="px-3 py-1.5 text-sm rounded border font-medium transition-colors border-amber-700 text-amber-400 hover:bg-amber-900/30"
          >
            Rename user
          </button>
        </div>

        {/* Current values */}
        <p className="text-xs font-mono text-gray-400">
          count: {count} | theme: {theme} | user: {user}
        </p>
      </div>

      {/* 3 — Consumer grid */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">
          {mode === 'A'
            ? '🚨 Single context — all 10 consumers re-render'
            : '✓ Split contexts — only relevant consumers re-render'}
        </h3>

        {mode === 'A' ? (
          <SingleCtx.Provider value={{ count, theme, user }}>
            <div className="grid grid-cols-2 gap-2">
              {CONSUMERS.map(c => (
                <SingleCtxConsumer
                  key={c.name}
                  name={c.name}
                  reads={c.reads}
                  field={c.field}
                />
              ))}
            </div>
          </SingleCtx.Provider>
        ) : (
          <CountCtx.Provider value={count}>
            <ThemeCtx.Provider value={theme}>
              <UserCtx.Provider value={user}>
                <div className="grid grid-cols-2 gap-2">
                  <CountCtxConsumer name="CountBadge" />
                  <CountCtxConsumer name="CountDisplay" />
                  <CountCtxConsumer name="NavCount" />
                  <ThemeCtxConsumer name="ThemeToggle" />
                  <ThemeCtxConsumer name="ThemeIcon" />
                  <ThemeCtxConsumer name="FooterTheme" />
                  <UserCtxConsumer name="UserAvatar" />
                  <UserCtxConsumer name="UserGreeting" />
                  <UserCtxConsumer name="UserBadge" />
                  <UserCtxConsumer name="SidebarUser" />
                </div>
              </UserCtx.Provider>
            </ThemeCtx.Provider>
          </CountCtx.Provider>
        )}

        <p className="text-xs text-gray-500">
          Click 'Increment count' — watch which cards flash. In Mode A: all 10. In Mode B: only count consumers.
        </p>
      </div>

      {/* 4 — Key insight callout */}
      <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-4 text-sm text-gray-300">
        <code>useContext</code> subscribes to the <strong>entire context value</strong>. When the value object
        changes — even just one field — every consumer re-renders. In Mode A, clicking "Increment count"
        re-renders all 10 cards because <code>{`{ count, theme, user }`}</code> is a new object. In Mode B,
        only the 3 count consumers flash because they're subscribed to a separate context.{' '}
        <strong>Split contexts by update frequency</strong>: high-frequency data (counters, cursor position)
        in their own context, low-frequency data (user profile, theme) in another.
      </div>

      {/* 5 — Code block */}
      <CodeBlock code={CONTEXT_CASCADE_CODE} />
    </div>
  );
}
