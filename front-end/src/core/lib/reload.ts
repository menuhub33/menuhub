/** Load the next screen from the server instead of keeping a stale client view. */
export function reloadPage(path?: string) {
  if (path) {
    window.location.assign(path);
    return;
  }
  window.location.reload();
}
