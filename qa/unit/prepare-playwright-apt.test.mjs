import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { main, prepareMirrors } from "../scripts/prepare-playwright-apt.mjs";

const azure = "http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\n";
const upstream = "https://archive.ubuntu.com/ubuntu/\tpriority:2\n" +
  "https://security.ubuntu.com/ubuntu/\tpriority:3\n";

test("removes only Azure, retaining both official HTTPS mirrors and their priorities", () => {
  assert.equal(prepareMirrors(azure + upstream), upstream);
  assert.equal(prepareMirrors(azure + upstream.replaceAll("\n", "\r\n")), upstream);
  assert.equal(prepareMirrors(upstream), upstream); // Already prepared: idempotent.
  assert.equal(prepareMirrors("# runner mirrors\n" + azure + upstream), "# runner mirrors\n" + upstream);
});

for (const source of ["", azure, upstream.replace("https:", "http:"),
  azure + upstream + "https://untrusted.invalid/ubuntu/\tpriority:4\n",
  azure + azure + upstream, upstream.replace("priority:2", "priority:1")]) {
  test(`unknown/incomplete mirror configuration fails closed: ${JSON.stringify(source)}`, () => {
    assert.throws(() => prepareMirrors(source), /Unexpected Ubuntu runner mirror list/);
  });
}

test("CLI preparation preserves input, refuses output overwrite and never creates output on invalid input", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "historietas-apt-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = path.join(directory, "input.txt");
  const output = path.join(directory, "output.txt");
  await writeFile(input, azure + upstream);
  await main([input, output]);
  assert.equal(await readFile(input, "utf8"), azure + upstream);
  assert.equal(await readFile(output, "utf8"), upstream);
  await assert.rejects(main([input, output]), { code: "EEXIST" });
  await assert.rejects(main([input, input]), /separate absolute/);
  await assert.rejects(main([]), /separate absolute/);
  await writeFile(input, "invalid");
  const invalidOutput = path.join(directory, "invalid.txt");
  await assert.rejects(main([input, invalidOutput]), /Unexpected/);
  await assert.rejects(readFile(invalidOutput), { code: "ENOENT" });
});

test("CI keeps complete dependency installation, trust and test gates; browser installation fails early", async () => {
  const { load } = await import("js-yaml");
  const workflow = load(await readFile(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"));
  const job = workflow.jobs.tests;
  assert.equal(job["runs-on"], "ubuntu-24.04");
  const step = job.steps.find((step) => step.name === "Instalar Chromium");
  assert.equal(step["working-directory"], "qa");
  assert.match(step.run, /npm exec -- playwright install --with-deps chromium/);
  assert.ok(!step["continue-on-error"] && !job["continue-on-error"]);
  assert.ok(!/retry|\|\| true|SKIP_VALIDATE_HOST_REQUIREMENTS|allow-unauthenticated|trusted=yes/i.test(step.run));
  assert.ok(job.steps.indexOf(step) < job.steps.findIndex((step) => step.name === "Iniciar ambiente Supabase local descartável"));
  const prepare = job.steps.find((step) => step.name === "Preparar mirrors oficiais para dependências do Chromium");
  assert.match(prepare.run, /test "\$ImageOS" = "ubuntu24"/);
  assert.match(prepare.run, /sudo install -m 0644/);
  assert.ok(!/apt-key|Signed-By|trusted=yes|allow-unauthenticated|Verify-Peer|resolv.conf/.test(prepare.run));
  assert.ok(job.steps.some((step) => step.run === "npm --prefix qa test"));
});
