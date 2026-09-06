import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  /** Seconds of delay, used to stagger sibling items. */
  delay?: number;
  /** Starting offset in px. Negative values slide down instead of up. */
  y?: number;
  className?: string;
}

/**
 * Fades and lifts its children into view the first time they're scrolled to.
 * Collapses to a plain wrapper when the user prefers reduced motion.
 */
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 24, className }) => {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
