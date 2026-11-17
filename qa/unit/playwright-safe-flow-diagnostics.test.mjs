import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { SAFE_FLOW_MARKER, sanitizeSafeFlowDiagnostic } from "../scripts/playwright-safe-flow-schema.mjs";
import { observeSafeFlow, readerPayloadMatch } from "../tests/playwright-safe-flow-diagnostics.mjs";

const secrets = [
  "fixture-password", "Bearer private-token", "session-cookie", "personal-id", "Person Name", "person@example.test", "Private list title",
];

test("safe flow schema keeps only closed enums, HTTP codes, and bounded counts", () => {
  const result = sanitizeSafeFlowDiagnostic({
    scenario: "listas-identity",
    password: secrets[0], token: secrets[1], cookie: secrets[2], userId: secrets[3],
    network: [{
      endpoint: "auth-user", method: "GET", requestCount: 2, failedCount: 0,
      statuses: [{ code: 200, count: 2, body: secrets[4] }], url: `https://example.test/?token=${secrets[1]}`,
    }],
    snapshots: [{
      phase: "route-b", route: "lists", readyState: "complete", authState: "authenticated",
      rendered: [{ state: "target", count: 1, text: secrets[6] }], email: secrets[5],
    }],
  });

  assert.deepEqual(result, {
    schemaVersion: 1,
    scenario: "listas-identity",
    network: [{ endpoint: "auth-user", method: "GET", requestCount: 2, failedCount: 0, statuses: [{ code: 200, count: 2 }] }],
    snapshots: [{
      phase: "route-b", route: "lists", readyState: "complete", authState: "authenticated",
      rendered: [{ state: "target", count: 1 }],
    }],
  });
  const serialized = JSON.stringify(result);
  for (const secret of secrets) assert.ok(!serialized.includes(secret));
});

test("observer emits endpoint categories, status codes, and rendered counts without request data", async () => {
  class FakePage extends EventEmitter {
    url() { return "http://127.0.0.1:3000/listas?usuario=personal-id"; }
    async evaluate() { return "complete"; }
  }
  const page = new FakePage();
  const observer = observeSafeFlow(page, "listas-identity");
  const request = {
    url: () => `http://127.0.0.1:54321/auth/v1/user?token=${encodeURIComponent(secrets[1])}`,
    method: () => "GET",
    headers: () => ({ cookie: secrets[2], authorization: secrets[1] }),
    postData: () => secrets[0],
  };
  page.emit("request", request);
  page.emit("response", { request: () => request, status: () => 200 });
  await observer.capture("route-b", {
    authState: "authenticated",
    rendered: { target: { count: async () => 1, textContent: async () => secrets[6] } },
  });

  let output = "";
  const originalWrite = process.stdout.write;
  process.stdout.write = chunk => { output += chunk; return true; };
  try { observer.emit(); } finally { process.stdout.write = originalWrite; observer.dispose(); }

  assert.ok(output.startsWith(SAFE_FLOW_MARKER));
  const parsed = JSON.parse(output.slice(SAFE_FLOW_MARKER.length));
  assert.equal(parsed.network[0].endpoint, "auth-user");
  assert.deepEqual(parsed.network[0].statuses, [{ code: 200, count: 1 }]);
  assert.deepEqual(parsed.snapshots[0].rendered, [{ state: "target", count: 1 }]);
  for (const secret of secrets) assert.ok(!output.includes(secret));
});

test("unknown scenarios and free-form states are rejected", () => {
  assert.equal(sanitizeSafeFlowDiagnostic({ scenario: secrets[3] }), null);
  const result = sanitizeSafeFlowDiagnostic({
    scenario: "editorial-status",
    network: [{ endpoint: secrets[6], method: "GET", requestCount: 1 }],
    snapshots: [{ phase: secrets[4], route: secrets[5], authState: secrets[1], rendered: [{ state: secrets[6], count: 1 }] }],
  });
  assert.deepEqual(result, { schemaVersion: 1, scenario: "editorial-status", network: [], snapshots: [] });
});

test("reader traces correlate HTTP statuses with payload matching without storing identifiers", async () => {
  class Page extends EventEmitter {
    url() { return "http://127.0.0.1/obra/personal-id/capitulo/1?token=private-token"; }
    async evaluate() { return "complete"; }
  }
  const page = new Page();
  const observer = observeSafeFlow(page, "canonical-reader-progress", {
    readerTarget: {slug: "personal-id", chapterId: "private-chapter"}, device: "mobile",
  });
  const request = (path, body, method = "GET") => ({
    url: () => `http://127.0.0.1${path}`, method: () => method,
    postDataJSON: () => { if (body instanceof Error) throw body; return body; },
    headers: () => { throw Error("headers must not be inspected"); },
  });
  const fixtures = [
    [request("/api/leitura-publica?slug=personal-id&numero=1"), 200],
    [request("/api/leitura-publica?slug=private-other&numero=1"), 503],
    [request("/rest/v1/rpc/obter_metricas_conteudos", {p_obra_ids: [], p_capitulo_ids: ["private-chapter"]}, "POST"), 200],
    [request("/rest/v1/rpc/obter_metricas_conteudos", {p_obra_ids: ["private-work"], p_capitulo_ids: ["private-chapter"]}, "POST"), 200],
    [request("/rest/v1/rpc/obter_metricas_conteudos", Error("private-body"), "POST"), 400],
  ];
  for (const [req, status] of fixtures) {
    page.emit("request", req); page.emit("response", {request: () => req, status: () => status});
  }
  page.emit("requestfailed", fixtures[1][0]);
  await observer.capture("identity-ready", {authState: "authenticated"});
  await observer.capture("final");
  let output = ""; const write = process.stdout.write;
  process.stdout.write = chunk => { output += chunk; return true; };
  try { observer.emit(); } finally { process.stdout.write = write; observer.dispose(); }
  const result = JSON.parse(output.slice(SAFE_FLOW_MARKER.length));
  assert.equal(result.device, "mobile");
  assert.deepEqual(result.network.map(n => [n.endpoint, n.payloadMatch, n.requestCount, n.statuses[0].code]), [
    ["public-reader", "matched", 1, 200], ["public-reader", "other", 1, 503],
    ["content-metrics", "matched", 1, 200], ["content-metrics", "other", 1, 200], ["content-metrics", "unavailable", 1, 400],
  ]);
  assert.equal(result.network[1].failedCount, 1);
  assert.equal(result.snapshots[0].route, "reader");
  assert.equal(result.snapshots.at(-1).phase, "final");
  assert.equal(page.listenerCount("response"), 0);
  for (const secret of ["personal-id", "private-chapter", "private-work", "private-body", "private-other", "private-token"]) assert.ok(!output.includes(secret));
});

test("reader diagnostic extensions keep closed enums and reject free-form payload/device fields", () => {
  const result = sanitizeSafeFlowDiagnostic({scenario: "reading-progress-cross-device", device: "person@example.test",
    network: [{endpoint: "content-metrics", method: "POST", payloadMatch: "private-chapter", body: {token: "secret"}},
      {endpoint: "works", method: "GET", payloadMatch: "matched"}],
    snapshots: [{phase: "library", route: "library"}, {phase: "private-title", route: "reader"}],
  });
  assert.equal("device" in result, false);
  assert.ok(result.network.every(n => !("payloadMatch" in n) && !("body" in n)));
  assert.deepEqual(result.snapshots.map(s => s.phase), ["library"]);
});

test("metrics classification preserves the wait predicate for absent work IDs", () => {
  const target = {slug: "private-slug", chapterId: "private-chapter"};
  const req = body => ({postDataJSON: () => body});
  assert.equal(readerPayloadMatch(req({p_capitulo_ids: [target.chapterId]}), "content-metrics", target), "matched");
  assert.equal(readerPayloadMatch(req(null), "content-metrics", target), "other");
  assert.equal(readerPayloadMatch(req({p_capitulo_ids: {}}), "content-metrics", target), "unavailable");
});


test("flaky de login: guarda somente rede, estados fixos e contagens", () => {
  const segredo = "private-password-session-cookie-user-id";
  const report = sanitizeSafeFlowDiagnostic({
    scenario: "login-flaky", device: "desktop",
    email: segredo, password: segredo, authToken: segredo,
    network: [
      { endpoint: "auth-token", method: "POST", requestCount: 1, failedCount: 0,
        url: "http://127.0.0.1/auth/v1/token?token=" + segredo,
        statuses: [{ code: 200, count: 1, body: segredo }] },
      { endpoint: "profiles", method: "PATCH", requestCount: 1, failedCount: 1,
        statuses: [{ code: 503, count: 1, body: segredo }] },
    ],
    snapshots: [{
      phase: "failure", route: "login", readyState: "complete", authState: "unknown",
      rendered: [{ state: "error", count: 1, text: segredo },
        { state: "loading", count: 0, text: segredo },
        { state: "continue", count: 1, text: segredo }],
    }],
  });
  assert.deepEqual(report, {
    schemaVersion: 1, scenario: "login-flaky", device: "desktop",
    network: [
      { endpoint: "auth-token", method: "POST", requestCount: 1, failedCount: 0,
        statuses: [{ code: 200, count: 1 }] },
      { endpoint: "profiles", method: "PATCH", requestCount: 1, failedCount: 1,
        statuses: [{ code: 503, count: 1 }] },
    ],
    snapshots: [{ phase: "failure", route: "login", readyState: "complete",
      authState: "unknown",
      rendered: [{ state: "error", count: 1 },{ state: "loading", count: 0 },
        { state: "continue", count: 1 }] }],
  });
  assert.ok(!JSON.stringify(report).includes(segredo));
  assert.equal(sanitizeSafeFlowDiagnostic({ scenario: "login-private" }), null);
});
