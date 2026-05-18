export const WORKER_BASICS_CODE = `// Create a worker from a blob URL (no separate file needed)
const workerCode = \`
  self.onmessage = ({ data: { n } }) => {
    // Heavy computation — runs on a separate thread
    const sieve = new Uint8Array(n + 1);
    for (let i = 2; i * i <= n; i++) {
      if (!sieve[i]) {
        for (let j = i * i; j <= n; j += i) sieve[j] = 1;
      }
    }
    const count = sieve.slice(2).filter(v => v === 0).length;
    self.postMessage({ count });
  };
\`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));

// Send work to the worker
worker.postMessage({ n: 5_000_000 });

// Receive results without blocking
worker.onmessage = ({ data }) => {
  console.log('Primes found:', data.count); // 348,513
};

// Clean up
worker.terminate();`;

export const TRANSFERABLE_CODE = `// Transferable objects: zero-copy transfer of ArrayBuffers
// Normal postMessage: copies data (O(n) time + memory)
const bigArray = new Float32Array(10_000_000);
worker.postMessage({ data: bigArray }); // copies ~40 MB!

// With transfer: ownership moves to worker (O(1), zero copy)
worker.postMessage({ data: bigArray }, [bigArray.buffer]);
// bigArray.buffer.byteLength === 0 here — ownership transferred

// Worker sends result back with transfer too
self.onmessage = ({ data }) => {
  const result = processData(data.data); // Float32Array
  self.postMessage({ result }, [result.buffer]); // transfer back
};`;
