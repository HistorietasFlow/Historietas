import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ensureArchive, tools } from "../scripts/install-ci-tool.mjs";

test("tool versions and official archive digests stay pinned", () => {
  assert.equal(tools.k6.version, "2.3.0");
  assert.equal(tools.k6.sha256, "39c3117b6af817592dcd0ce4242105c0a7af10948c2a425306f0be8f7a8a8ab1");
  assert.equal(tools.gitleaks.version, "8.30.1");
  assert.equal(tools.gitleaks.sha256, "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb");
  assert.ok(Object.isFrozen(tools) && Object.values(tools).every(Object.isFrozen));
});

test("unknown tool cannot supply an arbitrary URL or executable", () => {
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("../scripts/install-ci-tool.mjs", import.meta.url)),
    "untrusted-tool", tmpdir(),
  ], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: install-ci-tool/);
});

const bytes = Buffer.from("verified official binary fixture");
const tool = { ...tools.k6, archive: "test.tar.gz", size: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex") };

async function sandbox(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "historietas-ci-tool-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("cold download uses the official asset API, verifies bytes and cache hit needs no network", async (t) => {
  const directory = await sandbox(t);
  const calls = [];
  const archive = await ensureArchive(tool, directory, async (url, options) => {
    calls.push(url);
    assert.equal(options.headers.Accept, "application/octet-stream");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(bytes);
  });
  assert.deepEqual(await readFile(archive), bytes);
  assert.deepEqual(calls, ["https://api.github.com/repos/grafana/k6/releases/assets/579287772"]);
  await ensureArchive(tool, directory, () => { throw new Error("Cache hit must not fetch"); });
});

for (const failure of ["HTTP 503", "timeout", "connection interrupted"]) {
  test(`${failure} tries only the alternate official route, retaining checksum validation`, async (t) => {
    const directory = await sandbox(t);
    const calls = [];
    await ensureArchive(tool, directory, async (url) => {
      calls.push(url);
      if (calls.length === 1) {
        if (failure === "HTTP 503") return new Response("Unavailable", { status: 503 });
        throw new Error(failure);
      }
      assert.equal(url, "https://github.com/grafana/k6/releases/download/v2.3.0/test.tar.gz");
      return new Response(bytes);
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(await readdir(directory), [tool.archive]);
  });
}

for (const corrupt of [Buffer.alloc(bytes.length, 0), bytes.subarray(1), Buffer.concat([bytes, bytes])]) {
  test(`invalid archive (${corrupt.length} bytes) fails closed without fallback/cache`, async (t) => {
    const directory = await sandbox(t);
    let calls = 0;
    await assert.rejects(ensureArchive(tool, directory, async () => {
      calls++;
      return new Response(corrupt);
    }), /Archive/);
    assert.equal(calls, 1);
    assert.deepEqual(await readdir(directory), []);
  });
}

test("corrupted cache is rejected before extraction, execution or network fallback", async (t) => {
  const directory = await sandbox(t);
  await writeFile(path.join(directory, tool.archive), Buffer.alloc(bytes.length, 0));
  await assert.rejects(ensureArchive(tool, directory, () => {
    assert.fail("Corrupted cache must not be hidden with a fallback");
  }), /SHA-256/);
});

test("both official sources unavailable fail the installation and leave no partial cache", async (t) => {
  const directory = await sandbox(t);
  let calls = 0;
  await assert.rejects(ensureArchive(tool, directory, async () => {
    calls++;
    return new Response("Unavailable", { status: 503 });
  }), /HTTP 503/);
  assert.equal(calls, 2);
  assert.deepEqual(await readdir(directory), []);
});

test("interrupted response stream is discarded before the second source is verified", async (t) => {
  const directory = await sandbox(t);
  let calls = 0;
  await ensureArchive(tool, directory, async () => {
    if (++calls === 1) return new Response(new ReadableStream({
      start(controller) { controller.enqueue(bytes.subarray(0, 4)); controller.error(new Error("connection reset")); },
    }));
    return new Response(bytes);
  });
  assert.equal(calls, 2);
  assert.deepEqual(await readdir(directory), [tool.archive]);
});
