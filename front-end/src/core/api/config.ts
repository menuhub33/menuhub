/** Base URL of the Laravel API (server-side only, never exposed to the browser). */
export const API_URL = (process.env.API_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
