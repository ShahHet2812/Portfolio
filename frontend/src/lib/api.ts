/**
 * Base URL for the API, with any trailing slash normalised away so paths can be
 * joined safely.
 *
 * Defaults to the same-origin "/api" prefix, which is where the Cloudflare
 * Worker mounts the API alongside the static site. Set VITE_API_URL to point
 * somewhere else — e.g. a separately running `wrangler dev`.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const apiUrl = (path: string) => `${API_BASE}/${path.replace(/^\/+/, '')}`;
