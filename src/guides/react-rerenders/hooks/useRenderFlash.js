import { useRef, useEffect, useState } from 'react';

/**
 * Returns { renderCount, flashKey } where flashKey increments on every render.
 * Use flashKey as a `key` prop on a flash overlay element so React remounts it
 * each render, replaying its CSS animation.
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

  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    setFlashKey(k => k + 1);
  }); // no deps → runs after every render

  return {
    renderCount: renderCountRef.current,
    flashKey,
  };
}
