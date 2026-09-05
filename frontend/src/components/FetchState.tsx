import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FetchStatus } from '../hooks/useCollection';

interface FetchStateProps {
  status: FetchStatus;
  count: number;
  /** Plural noun used in the status line, e.g. "projects". */
  label: string;
}

/** Renders loading / error / empty output as shell feedback. Returns null once data exists. */
const FetchState: React.FC<FetchStateProps> = ({ status, count, label }) => {
  if (status === 'loading') {
    return (
      <div className="term t-faint">
        <span className="spinner me-2" />
        fetching {label}…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="term-alert term-alert--err">
        <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
        <span>
          error: could not reach the API — {label} unavailable right now.
          <br />
          <span className="t-dim">Please try again in a moment.</span>
        </span>
      </div>
    );
  }

  if (count === 0) {
    return <div className="term t-faint">no {label} found</div>;
  }

  return null;
};

export default FetchState;
