import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export const endpoint = "ws://127.0.0.1:3001/";

// Bounded startup readiness only. Browser/test failures are never retried.
export async function waitForServer(fetchImpl = fetch, sleep = delay) {
  for (let attempt = 0; attempt < 40; attempt++) {
    let response;
    try {
      response = await fetchImpl("http://127.0.0.1:3001/json", {
        signal: AbortSignal.timeout(1000),
      });
    } catch (error) {
      if (error.cause?.code !== "ECONNREFUSED") throw error;
      if (attempt === 39) throw new Error("Playwright server did not start");
      await sleep(250);
      continue;
    }
    assert.equal(response.status, 200, "Playwright readiness HTTP status");
    assert.equal((await response.json()).wsEndpointPath, "/");
    return;
  }
}

export async function main() {
  await waitForServer();
  const { chromium } = await import("playwright");
  const directory = await mkdtemp(path.join(tmpdir(), "historietas-browser-check-"));
  let browser;
  try {
    browser = await chromium.connect(endpoint, { timeout: 10_000 });
    const context = await browser.newContext({ locale: "pt-BR", recordVideo: { dir: directory } });
    const page = await context.newPage();
    await page.setContent('<main lang="pt-BR"><h1>Leitura: ação e coração</h1></main>');
    assert.equal(await page.locator("h1").innerText(), "Leitura: ação e coração");
    assert.ok((await page.screenshot()).length > 0);
    const video = page.video();
    await context.close();
    const recording = path.join(directory, "browser.webm");
    await video.saveAs(recording); // Also checks remote artifact transfer used by the tests.
    assert.ok((await stat(recording)).size > 0);
    console.log(`Chromium ${browser.version()}: launch, rendering, screenshot and video verified`);
  } finally {
    await browser?.close();
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
