/** Backend origin, trailing slash normalised away so paths can be joined safely. */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export const apiUrl = (path: string) => `${API_BASE}/${path.replace(/^\/+/, '')}`;
