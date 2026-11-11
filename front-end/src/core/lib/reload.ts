const RELOAD_PARAM = "_r";

function destination(path?: string) {
  const next = path
    ? new URL(path, window.location.origin)
    : new URL(window.location.href);
  if (next.origin !== window.location.origin) return path ?? next.toString();
  next.searchParams.set(RELOAD_PARAM, String(Date.now()));
  return `${next.pathname}${next.search}${next.hash}`;
}

/**
 * Full document load after a server action.
 * A same-tick `location.reload()` is cancelled by the App Router transition,
 * so the navigation is deferred and the URL changes enough to force a new load.
 */
export function reloadPage(path?: string) {
  const target = destination(path);
  window.setTimeout(() => {
    window.location.replace(target);
  }, 100);
}

/** Drop the cache-busting query after the new document has loaded. */
export function stripReloadParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RELOAD_PARAM)) return;
  url.searchParams.delete(RELOAD_PARAM);
  const clean = `${url.pathname}${url.search}${url.hash}`;
  History.prototype.replaceState.call(window.history, window.history.state, "", clean || "/");
}
