// Somente QA: nenhuma interceptacao, credencial, conteudo ou URL no relatorio.
const marker = "HISTORIETAS_QA_WORK ";
const contexts = new Set(["mobile", "desktop", "anonimo"]);
const states = new Set(["ausente", "verificando", "confirmada", "erro", "indisponivel"]);
const readyStates = new Set(["loading", "interactive", "complete"]);
const errorTypes = new Set(["Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError"]);
const resources = new Set(["document", "script", "stylesheet", "image", "font", "fetch", "xhr"]);
const integer = v => Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
function endpoint(request) {
  try {
    const path = new URL(request.url()).pathname;
    if (path === "/api/obra-publica") return "barreira";
    if (path === "/auth/v1/user") return "auth-user";
    if (path.startsWith("/_next/")) return "next-asset";
    if (path.startsWith("/obra/")) return "documento";
  } catch { /* URL malformada nao entra no relatorio. */ }
  return "outro";
}

export async function observarObraPublica(page, context, now = () => performance.now()) {
  if (!contexts.has(context)) throw new Error("Contexto QA invalido.");
  const start = now(), events = [], listeners = [];
  let discarded = 0;
  const record = event => {
    // Cap de memoria diagnostica, NAO limite de operacao/tentativas do produto.
    if (events.length === 120) { events.shift(); discarded++; }
    events.push({ at: integer(now() - start), ...event });
  };
  const on = (name, fn) => { page.on(name, fn); listeners.push([name, fn]); };
  on("request", r => { const path = endpoint(r); if (["barreira", "auth-user"].includes(path)) record({ event: "request", path }); });
  on("response", r => {
    const path = endpoint(r), status = r.status();
    if (!Number.isInteger(status) || status < 100 || status > 599) return;
    if (["barreira", "auth-user", "documento"].includes(path) || status >= 400) record({ event: "response", path, status });
  });
  on("requestfailed", r => {
    const code = r.failure()?.errorText || "";
    record({ event: "requestfailed", path: endpoint(r), resource: resources.has(r.resourceType()) ? r.resourceType() : "outro",
      code: /^net::[A-Z_]{1,50}$/.test(code) ? code : "sanitized" });
  });
  on("pageerror", e => record({ event: "pageerror", type: errorTypes.has(e.name) ? e.name : "outro" }));
  on("domcontentloaded", () => record({ event: "domcontentloaded" }));
  on("load", () => record({ event: "load" }));
  on("console", message => {
    const text = message.text();
    if (!text.startsWith(marker) || text.length > 1024) return;
    try {
      const s = JSON.parse(text.slice(marker.length));
      record({ event: "browser", state: states.has(s.state) ? s.state : "desconhecido",
        ready: readyStates.has(s.ready) ? s.ready : "desconhecido", longTasks: integer(s.longTasks),
        totalLong: integer(s.totalLong), maxLong: integer(s.maxLong) });
    } catch { /* Console e entrada nao confiavel; nao publicar texto livre. */ }
  });
  await page.addInitScript(() => {
    let previous = "", count = 0, total = 0, max = 0;
    try {
      new PerformanceObserver(list => { for (const e of list.getEntries()) { count++; total += e.duration; max = Math.max(max, e.duration); } })
        .observe({ type: "longtask", buffered: true });
    } catch { /* Diagnostico nao exige suporte a long tasks. */ }
    const snapshot = () => {
      const root = document.querySelector('main[data-historietas-obra-dinamica-root="true"]');
      const state = root?.getAttribute("data-public-work-state") || "ausente";
      if (state === previous) return;
      previous = state;
      console.log("HISTORIETAS_QA_WORK " + JSON.stringify({ state, ready: document.readyState,
        longTasks: count, totalLong: Math.round(total), maxLong: Math.round(max) }));
    };
    new MutationObserver(snapshot).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-public-work-state"] });
    document.addEventListener("DOMContentLoaded", snapshot);
  });
  return {
    snapshot: () => ({ versao: 1, context, discarded, events: events.map(e => ({ ...e })) }),
    dispose: () => { for (const [name, fn] of listeners) page.off(name, fn); },
  };
}

export async function anexarDiagnosticosObra(info, diagnostics) {
  try {
    await info.attach("obra-publica-fluxo-sanitizado", { contentType: "application/json",
      body: Buffer.from(JSON.stringify(diagnostics.map(d => d.snapshot()))) });
    return true;
  } catch { return false; } // Preservar a excecao original do teste, nunca mascara-la.
}
