import { useRef } from 'react';

/**
 * Returns { renderCount, flashKey } where flashKey equals renderCount.
 * Use flashKey as a `key` prop on a flash overlay element so React remounts it
 * on every external re-render, replaying its CSS animation — without causing
 * any additional re-renders itself.
 *
 * Example:
 *   const { renderCount, flashKey } = useRenderFlash();
 *   return (
 *     <div className="relative">
 *       <div key={flashKey} className="absolute inset-0 bg-sky-400/30 animate-flash pointer-events-none" />
 *       <span>{renderCount}</span>
 *     </div>
 *   );
 */
export function useRenderFlash() {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  // Using the ref value directly as flashKey avoids the useState/useEffect
  // infinite-loop pattern (setState in no-dep useEffect → re-render → repeat).
  return {
    renderCount: renderCountRef.current,
    flashKey: renderCountRef.current,
  };
}
