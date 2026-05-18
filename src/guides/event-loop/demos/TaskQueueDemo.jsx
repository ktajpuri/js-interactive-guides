import { useState, useRef, useCallback } from 'react';
import { CodeBlock } from '../../../components/Layout/CodeBlock';
import { TASK_QUEUE_CODE } from '../data/demoCode';

const TYPE_STYLES = {
  sync:      { dot: 'bg-gray-400',   badge: 'bg-gray-800 text-gray-300',  label: 'SYNC' },
  microtask: { dot: 'bg-blue-400',   badge: 'bg-blue-900/50 text-blue-300', label: 'MICRO' },
  macrotask: { dot: 'bg-orange-400', badge: 'bg-orange-900/50 text-orange-300', label: 'MACRO' },
};

function QueueCard({ item }) {
  const s = TYPE_STYLES[item.type];
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      <span className="text-gray-200 flex-1 font-mono text-xs">{item.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${s.badge}`}>{s.label}</span>
    </div>
  );
}

function QueueColumn({ title, items, colorClass, emptyText }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${colorClass}`}>{title}</div>
      <div className="bg-gray-950 rounded-xl border border-gray-800 p-3 min-h-40 space-y-2">
        {items.length === 0 ? (
          <div className="text-gray-600 text-xs text-center pt-6">{emptyText}</div>
        ) : (
          items.map(item => <QueueCard key={item.id} item={item} />)
        )}
      </div>
      <div className="text-xs text-gray-600 text-center mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function TaskQueueDemo() {
  const [callStack, setCallStack]   = useState([]);
  const [microtasks, setMicrotasks] = useState([]);
  const [macrotasks, setMacrotasks] = useState([]);
  const [executing, setExecuting]   = useState(null);
  const [log, setLog]               = useState([]);
  const [running, setRunning]       = useState(false);

  const counterRef  = useRef(0);
  const runningRef  = useRef(false);
  const timeoutRef  = useRef(null);

  const nextId = () => ++counterRef.current;

  const addToLog = useCallback((item) => {
    setLog(prev => [{ ...item, ts: Date.now() }, ...prev].slice(0, 30));
  }, []);

  const addMacrotask = () => {
    const id = nextId();
    setMacrotasks(prev => [...prev, { id, name: `setTimeout cb #${id}`, type: 'macrotask' }]);
  };

  const addMicrotask = (kind) => {
    const id = nextId();
    const name = kind === 'promise' ? `Promise.then #${id}` : `queueMicrotask #${id}`;
    setMicrotasks(prev => [...prev, { id, name, type: 'microtask' }]);
  };

  const addSync = () => {
    const id = nextId();
    setCallStack(prev => [...prev, { id, name: `syncFn #${id}`, type: 'sync' }]);
  };

  const doStep = useCallback((cs, mt, mac) => {
    let nextCs = [...cs];
    let nextMt = [...mt];
    let nextMac = [...mac];
    let picked = null;

    if (nextCs.length > 0) {
      picked = nextCs.shift();
      nextCs = nextCs;
    } else if (nextMt.length > 0) {
      picked = nextMt.shift();
      nextMt = nextMt;
    } else if (nextMac.length > 0) {
      picked = nextMac.shift();
      nextMac = nextMac;
    }

    return { picked, nextCs, nextMt, nextMac };
  }, []);

  const step = useCallback(() => {
    setCallStack(cs => {
      setMicrotasks(mt => {
        setMacrotasks(mac => {
          const { picked, nextCs, nextMt, nextMac } = doStep(cs, mt, mac);
          if (!picked) return mac;
          setExecuting(picked);
          addToLog(picked);
          setTimeout(() => setExecuting(null), 350);
          // We need to update all three synchronously, use functional updates
          setCallStack(() => nextCs);
          setMicrotasks(() => nextMt);
          return nextMac;
        });
        return mt; // will be overridden
      });
      return cs; // will be overridden
    });
  }, [doStep, addToLog]);

  // Simpler direct step using refs to current state
  const stepDirect = useCallback(() => {
    setCallStack(cs => {
      setMicrotasks(mt => {
        setMacrotasks(mac => {
          if (cs.length === 0 && mt.length === 0 && mac.length === 0) return mac;
          let nextCs = [...cs], nextMt = [...mt], nextMac = [...mac];
          let picked = null;
          if (nextCs.length > 0)      { picked = nextCs.shift(); }
          else if (nextMt.length > 0) { picked = nextMt.shift(); }
          else if (nextMac.length > 0){ picked = nextMac.shift(); }
          if (!picked) return mac;
          setExecuting(picked);
          addToLog(picked);
          setTimeout(() => setExecuting(null), 350);
          setCallStack(() => nextCs);
          setMicrotasks(() => nextMt);
          return nextMac;
        });
        return mt;
      });
      return cs;
    });
  }, [addToLog]);

  const isEmpty = useCallback((cs, mt, mac) => cs.length === 0 && mt.length === 0 && mac.length === 0, []);

  const runAll = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    const tick = () => {
      setCallStack(cs => {
        setMicrotasks(mt => {
          setMacrotasks(mac => {
            if (isEmpty(cs, mt, mac) || !runningRef.current) {
              runningRef.current = false;
              setRunning(false);
              return mac;
            }
            let nextCs = [...cs], nextMt = [...mt], nextMac = [...mac];
            let picked = null;
            if (nextCs.length > 0)       { picked = nextCs.shift(); }
            else if (nextMt.length > 0)  { picked = nextMt.shift(); }
            else if (nextMac.length > 0) { picked = nextMac.shift(); }
            if (!picked) { runningRef.current = false; setRunning(false); return mac; }
            setExecuting(picked);
            addToLog(picked);
            setTimeout(() => setExecuting(null), 350);
            setCallStack(() => nextCs);
            setMicrotasks(() => nextMt);
            timeoutRef.current = setTimeout(tick, 500);
            return nextMac;
          });
          return mt;
        });
        return cs;
      });
    };

    timeoutRef.current = setTimeout(tick, 100);
  }, [isEmpty, addToLog]);

  const stopRunning = () => {
    runningRef.current = false;
    setRunning(false);
    clearTimeout(timeoutRef.current);
  };

  const reset = () => {
    stopRunning();
    setCallStack([]);
    setMicrotasks([]);
    setMacrotasks([]);
    setExecuting(null);
    setLog([]);
    counterRef.current = 0;
  };

  const hasItems = callStack.length > 0 || microtasks.length > 0 || macrotasks.length > 0;

  return (
    <section className="max-w-4xl mx-auto space-y-8 pb-16">
      <header>
        <div className="inline-flex items-center gap-2 bg-orange-900/30 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-orange-800/50">Demo 1</div>
        <h1 className="text-3xl font-bold text-white">Task Queue Visualizer</h1>
        <p className="text-gray-400 mt-3 leading-relaxed">
          Microtasks (<span className="text-blue-400 font-mono text-sm">Promise.then</span>, <span className="text-blue-400 font-mono text-sm">queueMicrotask</span>) drain completely before the next macrotask (<span className="text-orange-400 font-mono text-sm">setTimeout</span>) runs. The call stack empties first, then all microtasks, then the next macrotask.
        </p>
      </header>

      {/* Controls */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Enqueue Items</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={addSync} disabled={running}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            + Sync function
          </button>
          <button onClick={() => addMicrotask('promise')} disabled={running}
            className="px-4 py-2 bg-blue-900/60 hover:bg-blue-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-blue-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            + Promise.then
          </button>
          <button onClick={() => addMicrotask('queue')} disabled={running}
            className="px-4 py-2 bg-blue-900/60 hover:bg-blue-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-blue-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            + queueMicrotask
          </button>
          <button onClick={addMacrotask} disabled={running}
            className="px-4 py-2 bg-orange-900/60 hover:bg-orange-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-orange-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            + setTimeout callback
          </button>
        </div>

        <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-800">
          <button onClick={stepDirect} disabled={running || !hasItems}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            Step
          </button>
          {!running ? (
            <button onClick={runAll} disabled={!hasItems}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Run All
            </button>
          ) : (
            <button onClick={stopRunning}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
              Pause
            </button>
          )}
          <button onClick={reset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20">
            Reset
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Sync (call stack)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Microtask</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> Macrotask</span>
      </div>

      {/* Currently Executing */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Currently Executing</div>
        {executing ? (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-sm animate-pulse">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_STYLES[executing.type].dot}`} />
            <span className="text-white font-mono text-xs font-semibold">{executing.name}</span>
            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-semibold ${TYPE_STYLES[executing.type].badge}`}>
              {TYPE_STYLES[executing.type].label}
            </span>
          </div>
        ) : (
          <div className="text-gray-600 text-xs">{hasItems ? 'Press Step or Run All to begin' : 'Nothing executing — queues are empty'}</div>
        )}
      </div>

      {/* Queues */}
      <div className="flex gap-4">
        <QueueColumn title="Call Stack" items={callStack} colorClass="text-gray-400" emptyText="Empty" />
        <QueueColumn title="Microtask Queue" items={microtasks} colorClass="text-blue-400" emptyText="Empty" />
        <QueueColumn title="Macrotask Queue" items={macrotasks} colorClass="text-orange-400" emptyText="Empty" />
      </div>

      {/* Execution order rule */}
      <div className="bg-gray-900 rounded-xl p-4 border border-orange-800/30">
        <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Execution Priority Rule</div>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded font-mono text-xs">Call Stack</span>
          <span className="text-gray-600">drains first, then</span>
          <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded font-mono text-xs">ALL Microtasks</span>
          <span className="text-gray-600">drain, then</span>
          <span className="bg-orange-900/40 text-orange-300 px-2 py-1 rounded font-mono text-xs">ONE Macrotask</span>
          <span className="text-gray-600">runs, then repeat.</span>
        </div>
      </div>

      {/* Output Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Output Log</div>
          <div className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto">
            {log.map((item, i) => (
              <div key={item.id + '-' + i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_STYLES[item.type].dot}`} />
                <span className="text-gray-300">{item.name}</span>
                <span className={`ml-auto text-xs px-1 py-0.5 rounded ${TYPE_STYLES[item.type].badge}`}>{TYPE_STYLES[item.type].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Real-world Code</h2>
        <CodeBlock code={TASK_QUEUE_CODE} />
      </div>
    </section>
  );
}
