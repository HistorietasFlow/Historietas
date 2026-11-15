import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { SAFE_FLOW_MARKER, sanitizeSafeFlowDiagnostic } from "../scripts/playwright-safe-flow-schema.mjs";
import { observeSafeFlow } from "../tests/playwright-safe-flow-diagnostics.mjs";

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
