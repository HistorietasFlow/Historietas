import { SAFE_FLOW_MARKER, sanitizeSafeFlowDiagnostic } from "../scripts/playwright-safe-flow-schema.mjs";

const ENDPOINT_BY_PATH = new Map([
  ["/api/leitura-publica", "public-reader"],
  ["/rest/v1/rpc/obter_metricas_conteudos", "content-metrics"],
  ["/rest/v1/rpc/salvar_progresso_leitura", "reading-progress"],
  ["/auth/v1/token", "auth-token"],
  ["/auth/v1/user", "auth-user"],
  ["/rest/v1/obras", "works"],
  ["/rest/v1/capitulos", "chapters"],
  ["/rest/v1/profiles_publicos", "profiles"],
  ["/rest/v1/profiles", "profiles"],
  ["/rest/v1/favoritos", "favorites"],
  ["/rest/v1/permissoes_listas", "permissions"],
]);

function endpointOf(url) {
  try { return ENDPOINT_BY_PATH.get(new URL(url).pathname) ?? null; } catch { return null; }
}

function routeOf(url) {
  try {
    const path = new URL(url).pathname;
    if (path === "/") return "home";
    if (path === "/perfil-autor") return "library";
    if (/^\/obra\/[^/]+\/capitulo\/[^/]+$/.test(path)) return "reader";
    if (path === "/login") return "login";
    if (path === "/editar-obra") return "editor";
    if (path === "/listas") return "lists";
    if (path.startsWith("/obra/")) return "public-work";
  } catch {}
  return "other";
}

function networkKey(endpoint, method) { return `${endpoint}:${method}`; }

// Compare only in memory. Never return IDs, query strings or body fields.
export function readerPayloadMatch(request, endpoint, target) {
  if (!target || !["public-reader", "content-metrics"].includes(endpoint)) return null;
  try {
    if (endpoint === "public-reader") {
      const params = new URL(request.url()).searchParams;
      return params.get("slug") === target.slug && params.get("numero") === "1" ? "matched" : "other";
    }
    const body = request.postDataJSON();
    // Same target predicate as the specs, including optional empty work IDs.
    return (body?.p_obra_ids || []).length === 0 &&
      (body?.p_capitulo_ids || []).includes(target.chapterId) ? "matched" : "other";
  } catch { return "unavailable"; }
}

export function observeSafeFlow(page, scenario, {readerTarget, device} = {}) {
  const network = new Map();
  const snapshots = [];

  const entryFor = request => {
    const endpoint = endpointOf(request.url());
    const method = request.method();
    if (!endpoint || !["GET", "POST", "PATCH", "DELETE"].includes(method)) return null;
    const payloadMatch = readerPayloadMatch(request, endpoint, readerTarget);
    const key = `${networkKey(endpoint, method)}:${payloadMatch || ""}`;
    if (!network.has(key)) network.set(key, { endpoint, method, ...(payloadMatch ? {payloadMatch} : {}), requestCount: 0, failedCount: 0, statuses: new Map() });
    return network.get(key);
  };
  const onRequest = request => { const entry = entryFor(request); if (entry) entry.requestCount++; };
  const onResponse = response => {
    const entry = entryFor(response.request());
    if (entry) entry.statuses.set(response.status(), (entry.statuses.get(response.status()) ?? 0) + 1);
  };
  const onRequestFailed = request => { const entry = entryFor(request); if (entry) entry.failedCount++; };
  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  return {
    async capture(phase, { authState = "unknown", rendered = {} } = {}) {
      let readyState = "unavailable";
      try { readyState = await page.evaluate(() => document.readyState); } catch {}
      const renderedStates = [];
      for (const [state, locator] of Object.entries(rendered)) {
        let count = 0;
        try { count = await locator.count(); } catch {}
        renderedStates.push({ state, count });
      }
      snapshots.push({ phase, route: routeOf(page.url()), readyState, authState, rendered: renderedStates });
    },
    emit() {
      try {
        const result = sanitizeSafeFlowDiagnostic({
          scenario,
          device,
          network: [...network.values()].map(entry => ({
            ...entry,
            statuses: [...entry.statuses].map(([code, count]) => ({ code, count })),
          })),
          snapshots,
        });
        if (result) process.stdout.write(`${SAFE_FLOW_MARKER}${JSON.stringify(result)}\n`);
      } catch {}
    },
    dispose() {
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
    },
  };
}
