import React from 'react';
import Reveal from './motion/Reveal';

interface SectionHeadingProps {
  /** Two-digit ordinal shown in the leading comment, e.g. "01". */
  index: string;
  /** Shell command rendered as the visible heading. */
  command: string;
  /** Short comment text following the ordinal. */
  comment: string;
  sub?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ index, command, comment, sub }) => (
  <Reveal className="section-head">
    <p className="section-kicker mb-0">
      // {index} — {comment}
    </p>
    <h2 className="section-title">
      <span className="sigil">$</span>
      {command}
    </h2>
    {sub && <p className="section-sub">{sub}</p>}
    <div className="rule" />
  </Reveal>
);

export default SectionHeading;
