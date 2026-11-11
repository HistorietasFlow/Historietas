import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { load } from "js-yaml";
import { endpoint, waitForServer } from "../scripts/check-playwright-server.mjs";

test("waits only for startup, then validates the local endpoint", async () => {
  let calls = 0;
  let waits = 0;
  await waitForServer(async (url) => {
    assert.equal(url, "http://127.0.0.1:3001/json");
    if (++calls === 1) throw new Error("starting", { cause: { code: "ECONNREFUSED" } });
    return Response.json({ wsEndpointPath: "/" });
  }, async () => { waits++; });
  assert.equal(calls, 2);
  assert.equal(waits, 1);
});

for (const failure of ["HTTP", "endpoint", "JSON", "timeout"]) {
  test(`invalid readiness ${failure} fails immediately without retry`, async () => {
    let calls = 0;
    await assert.rejects(waitForServer(async () => {
      calls++;
      if (failure === "timeout") throw new Error("timeout");
      if (failure === "HTTP") return new Response("Unavailable", { status: 503 });
      if (failure === "JSON") return new Response("invalid");
      return Response.json({ wsEndpointPath: "/unexpected" });
    }, () => assert.fail("Must not retry invalid readiness")));
    assert.equal(calls, 1);
  });
}

test("unavailable server has bounded readiness and never reports success", async () => {
  let calls = 0;
  await assert.rejects(waitForServer(async () => {
    calls++;
    throw new Error("unavailable", { cause: { code: "ECONNREFUSED" } });
  }, async () => {}), /did not start/);
  assert.equal(calls, 40);
});

test("official image matches the locked Playwright and stays immutable/isolated with all test gates", async () => {
  const workflow = load(await readFile(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"));
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  const job = workflow.jobs.tests;
  const version = lock.packages["node_modules/playwright"].version;
  assert.equal(job.env.PLAYWRIGHT_IMAGE, `mcr.microsoft.com/playwright:v${version}-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`);
  const step = job.steps.find((step) => step.id === "playwright-server");
  assert.match(step.run, /--user pwuser/);
  assert.match(step.run, /--cap-drop=ALL --security-opt=no-new-privileges/);
  assert.match(step.run, /--host 127\.0\.0\.1 --port 3001/);
  assert.match(step.run, /dst=\/opt\/qa\/node_modules,readonly/);
  assert.match(step.run, /check-playwright-server\.mjs/);
  assert.ok(!/--privileged|docker\.sock|--env-file|\|\| true|sudo|apt-get/.test(step.run));
  assert.ok(!step["continue-on-error"] && !job["continue-on-error"]);
  assert.ok(job.steps.indexOf(step) < job.steps.findIndex((step) => step.name === "Iniciar ambiente Supabase local descartável"));
  const e2e = job.steps.find((step) => step.run === "npm --prefix qa test");
  assert.equal(e2e.env.PW_TEST_CONNECT_WS_ENDPOINT, endpoint);
  assert.equal(job.steps.find((step) => step.name === "Remover servidor Chromium").if, "${{ always() }}");
  assert.ok(job.steps.some((step) => step.run === "lhci autorun"));
});
