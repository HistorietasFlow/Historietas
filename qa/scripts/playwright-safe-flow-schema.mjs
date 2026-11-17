export const SAFE_FLOW_MARKER = "HISTORIETAS_QA_SAFE_FLOW ";

const SCENARIOS = new Set(["editorial-status", "listas-identity", "canonical-reader-progress", "reading-progress-cross-device", "login-flaky"]);
const ENDPOINTS = new Set(["auth-token", "auth-user", "works", "chapters", "profiles", "favorites", "permissions", "public-reader", "content-metrics", "reading-progress"]);
const METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
const ROUTES = new Set(["login", "editor", "lists", "public-work", "reader", "home", "library", "other"]);
const READY_STATES = new Set(["loading", "interactive", "complete", "unavailable"]);
const AUTH_STATES = new Set(["unknown", "transition", "authenticated", "anonymous"]);
const RENDERED_STATES = new Set([
  "loading", "editor-enabled", "updated", "public-confirmed", "private", "target", "previous", "organizing", "error", "continue",
]);
const READER_PHASES = new Set(["start", "navigation", "identity-ready", "mark-read", "sync-read", "home", "library", "unmark-read", "sync-unread", "final"]);
const PHASES = {
  "canonical-reader-progress": READER_PHASES,
  "reading-progress-cross-device": READER_PHASES,
  "editorial-status": new Set(["start", "after-login", "editor-navigation", "editor-ready", "save-confirmed", "public-confirmed", "final"]),
  "listas-identity": new Set(["start", "account-a-ready", "signed-out", "account-b-authenticated", "route-b", "favorites", "final"]),
  "login-flaky": new Set(["failure"]),
};

function boundedInteger(value, maximum = 1_000_000) {
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

function allowed(value, values, fallback) {
  return values.has(value) ? value : fallback;
}

export function sanitizeSafeFlowDiagnostic(input) {
  if (input?.scenario === "ajuda-support-form") {
    const { device, counts } = input;
    if (device !== "desktop" && device !== "mobile") return null;
    const keys = ["forms", "visibleForms", "titles", "visibleTitles"];
    const valid = keys.every(key => Number.isSafeInteger(counts?.[key]) &&
      counts[key] >= 0 && counts[key] <= 10_000) &&
      counts.visibleForms <= counts.forms && counts.visibleTitles <= counts.titles;
    return {
      schemaVersion: 1,
      scenario: "ajuda-support-form",
      device,
      counts: valid ? Object.fromEntries(keys.map(key => [key, counts[key]])) : null,
    };
  }
  const scenario = allowed(input?.scenario, SCENARIOS, "unknown");
  if (scenario === "unknown") return null;

  const network = [];
  for (const entry of Array.isArray(input?.network) ? input.network.slice(0, 32) : []) {
    const endpoint = allowed(entry?.endpoint, ENDPOINTS, "unknown");
    const method = allowed(entry?.method, METHODS, "unknown");
    if (endpoint === "unknown" || method === "unknown") continue;
    const statuses = [];
    for (const status of Array.isArray(entry?.statuses) ? entry.statuses.slice(0, 16) : []) {
      const code = boundedInteger(status?.code, 599);
      if (code < 100) continue;
      statuses.push({ code, count: boundedInteger(status?.count) });
    }
    network.push({
      endpoint,
      method,
      ...(["matched", "other", "unavailable"].includes(entry?.payloadMatch) && ["public-reader", "content-metrics"].includes(endpoint) ? {payloadMatch: entry.payloadMatch} : {}),
      requestCount: boundedInteger(entry?.requestCount),
      failedCount: boundedInteger(entry?.failedCount),
      statuses,
    });
  }

  const snapshots = [];
  for (const snapshot of Array.isArray(input?.snapshots) ? input.snapshots.slice(0, 16) : []) {
    const phase = allowed(snapshot?.phase, PHASES[scenario], "unknown");
    if (phase === "unknown") continue;
    const rendered = [];
    for (const state of Array.isArray(snapshot?.rendered) ? snapshot.rendered.slice(0, 16) : []) {
      const name = allowed(state?.state, RENDERED_STATES, "unknown");
      if (name !== "unknown") rendered.push({ state: name, count: boundedInteger(state?.count, 10_000) });
    }
    snapshots.push({
      phase,
      route: allowed(snapshot?.route, ROUTES, "other"),
      readyState: allowed(snapshot?.readyState, READY_STATES, "unavailable"),
      authState: allowed(snapshot?.authState, AUTH_STATES, "unknown"),
      rendered,
    });
  }

  return { schemaVersion: 1, scenario, ...(["desktop", "mobile"].includes(input?.device) ? {device: input.device} : {}), network, snapshots };
}
