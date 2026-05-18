export const TASK_QUEUE_CODE = `// The event loop processes tasks in this priority order:
// 1. Current synchronous code (call stack)
// 2. All microtasks (Promise.then, queueMicrotask, MutationObserver)
// 3. Next macrotask (setTimeout, setInterval, I/O, UI events)

console.log('1 - sync');

setTimeout(() => console.log('4 - macrotask'), 0);

Promise.resolve()
  .then(() => console.log('3 - microtask'))
  .then(() => console.log('3b - still microtask'));

queueMicrotask(() => console.log('2 - microtask (queueMicrotask)'));

// Output: 1 -> 2 -> 3 -> 3b -> 4`;

export const EXECUTION_ORDER_CODE = `// async/await is syntactic sugar over Promises.
// 'await' suspends the function and schedules the rest as a microtask.

async function fetchData() {
  console.log('fetchData start'); // sync, runs immediately
  const data = await Promise.resolve({ value: 42 }); // suspends here
  console.log('fetchData resumed', data); // microtask, runs after caller
  return data;
}

console.log('before call');
fetchData();
console.log('after call'); // runs before fetchData resumes!

// Output:
// before call
// fetchData start
// after call          <- sync code finishes first
// fetchData resumed   <- then microtasks run`;

export const RAF_CODE = `// Use requestAnimationFrame for animations -- it syncs to the display.
// Avoid setTimeout(fn, 0) for visual updates.

function animate(timestamp) {
  // timestamp is DOMHighResTimeStamp from the browser
  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Update your animation based on elapsed time, not frame count
  position += speed * (elapsed / 1000); // pixels per second
  element.style.transform = \`translateX(\${position}px)\`;

  if (position < maxPosition) {
    requestAnimationFrame(animate); // schedule next frame
  }
}

let lastTimestamp = performance.now();
requestAnimationFrame(animate);

// For cleanup (e.g., React useEffect):
// const id = requestAnimationFrame(animate);
// return () => cancelAnimationFrame(id);`;

export const MICROTASK_CODE = `// Microtasks run to completion before the browser can paint.
// Scheduling too many microtasks blocks rendering.

// BAD: recursive microtask scheduling -- starves the UI
function badLoop(count) {
  if (count <= 0) return;
  queueMicrotask(() => {
    doWork();
    badLoop(count - 1); // schedules another microtask immediately
  });
}

// GOOD: break work into macrotasks so the browser can paint between chunks
function goodLoop(count) {
  if (count <= 0) return;
  setTimeout(() => {       // macrotask -- browser can render before this runs
    doWork();
    goodLoop(count - 1);
  }, 0);
}

// BETTER: use scheduler.postTask() or requestIdleCallback for background work
if ('scheduler' in window) {
  scheduler.postTask(() => doWork(), { priority: 'background' });
}`;
