import React, { useCallback, useRef, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TiltProps {
  children: React.ReactNode;
  /** Maximum rotation in degrees on each axis. */
  max?: number;
  className?: string;
}

/**
 * Tilts its children in 3D toward the pointer.
 *
 * Writes rotation to CSS custom properties inside a rAF so pointermove never
 * triggers a synchronous layout, and owns the transform on its own wrapper so
 * it composes with (rather than fights) the card's existing hover lift.
 */
const Tilt: React.FC<TiltProps> = ({ children, max = 7, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(0);
  const reduced = useReducedMotion();
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => { if (reduced) { cancelAnimationFrame(frame.current); ref.current?.style.setProperty('--rx','0deg'); ref.current?.style.setProperty('--ry','0deg'); } }, [reduced]);

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node || event.pointerType === 'touch') return;

      const { clientX, clientY } = event;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width - 0.5;
        const py = (clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty('--ry', `${px * max * 2}deg`);
        node.style.setProperty('--rx', `${-py * max * 2}deg`);
        node.style.setProperty('--glare-x', `${(px + 0.5) * 100}%`);
        node.style.setProperty('--glare-y', `${(py + 0.5) * 100}%`);
      });
    },
    [max]
  );

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    cancelAnimationFrame(frame.current);
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
  }, []);

  // The wrapper stays in the tree either way so it keeps providing height to
  // stretched cards; only the pointer handlers drop off.
  return (
    <div
      ref={ref}
      className={`tilt ${className ?? ''}`}
      onPointerMove={reduced ? undefined : handleMove}
      onPointerLeave={reduced ? undefined : handleLeave}
    >
      {children}
    </div>
  );
};

export default Tilt;
