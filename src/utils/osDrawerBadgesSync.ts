/**
 * Sync OSDrawer badges when content runs inside an iframe (Flyover mode).
 * The drawer and badges live in the parent window; mutations run in the iframe.
 * Posting this message tells the parent to refetch badge counts.
 */

export const OS_DRAWER_REFRESH_BADGES = 'os-drawer-refresh-badges';

/**
 * Call after any mutation that affects badge counts (orders, appointments, quotes, etc.).
 * - In main window: no-op (invalidation is already done by the caller).
 * - In iframe: notifies parent so it invalidates its badge query and counts update.
 */
export function notifyOSDrawerRefreshBadges(): void {
  if (typeof window === 'undefined') return;
  if (window !== window.parent) {
    try {
      window.parent.postMessage({ type: OS_DRAWER_REFRESH_BADGES }, window.location.origin);
    } catch {
      // cross-origin or unavailable
    }
  }
}
