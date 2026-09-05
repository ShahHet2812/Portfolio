const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = (value: string): { year: number; month: number } | null => {
  const match = /^(\d{4})-(\d{1,2})$/.exec(value?.trim() ?? '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
};

/** "2026-07" → "Jul 2026". Falls back to the raw value if unparseable. */
export const formatMonth = (value: string): string => {
  const parsed = parse(value);
  return parsed ? `${MONTHS[parsed.month - 1]} ${parsed.year}` : value;
};

/**
 * Inclusive duration between two "YYYY-MM" months, e.g. "6 mos", "1 yr 2 mos".
 * Omitting `end` measures up to the current month, so a current role's
 * duration stays accurate without any manual updates.
 */
export const monthSpan = (start: string, end?: string | null): string => {
  const from = parse(start);
  if (!from) return '';

  const now = new Date();
  const to = end ? parse(end) : { year: now.getFullYear(), month: now.getMonth() + 1 };
  if (!to) return '';

  const months = (to.year - from.year) * 12 + (to.month - from.month) + 1;
  if (months < 1) return '';

  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (remainder > 0) parts.push(`${remainder} mo${remainder > 1 ? 's' : ''}`);
  return parts.join(' ');
};
