import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { appendFile, chmod, mkdir, mkdtemp, open, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// Digests/asset IDs from the official release APIs, not from a mirror or cache.
export const tools = Object.freeze({
  k6: Object.freeze({
    repository: "grafana/k6", version: "2.3.0", asset: "579287772",
    archive: "k6-v2.3.0-linux-amd64.tar.gz", member: "k6-v2.3.0-linux-amd64/k6",
    size: 30847764,
    sha256: "39c3117b6af817592dcd0ce4242105c0a7af10948c2a425306f0be8f7a8a8ab1",
    versionArgument: "version",
  }),
  gitleaks: Object.freeze({
    repository: "gitleaks/gitleaks", version: "8.30.1", asset: "378332058",
    archive: "gitleaks_8.30.1_linux_x64.tar.gz", member: "gitleaks",
    size: 8230402,
    sha256: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
    versionArgument: "version",
  }),
});

class IntegrityError extends Error {}

export async function verifyArchive(file, tool) {
  if ((await stat(file)).size !== tool.size) throw new IntegrityError("Archive size mismatch");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  if (hash.digest("hex") !== tool.sha256) throw new IntegrityError("Archive SHA-256 mismatch");
}

export async function ensureArchive(tool, directory, fetchImpl = fetch) {
  await mkdir(directory, { recursive: true });
  const archive = path.join(directory, tool.archive);
  try {
    await verifyArchive(archive, tool);
    return archive; // Every cache hit is verified, never treated as executable proof.
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const sources = [
    [`https://api.github.com/repos/${tool.repository}/releases/assets/${tool.asset}`, "application/octet-stream"],
    [`https://github.com/${tool.repository}/releases/download/v${tool.version}/${tool.archive}`, "application/octet-stream"],
  ];
  for (const [index, [url, accept]] of sources.entries()) {
    const temporary = await mkdtemp(path.join(directory, ".download-"));
    const partial = path.join(temporary, tool.archive);
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: accept, "User-Agent": "Historietas-CI" },
        signal: AbortSignal.timeout(30_000),
        redirect: "follow",
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Official release returned HTTP ${response.status}`);
      }
      const file = await open(partial, "wx");
      try {
        let bytes = 0;
        for await (const chunk of response.body) {
          bytes += chunk.length;
          if (bytes > tool.size) throw new IntegrityError("Archive exceeds pinned size");
          await file.writeFile(chunk);
        }
      } finally {
        await file.close();
      }
      await verifyArchive(partial, tool);
      await rename(partial, archive); // Only verified bytes enter the cache.
      return archive;
    } catch (error) {
      // Integrity errors fail closed; only transport/HTTP errors try the other official route.
      if (error instanceof IntegrityError || index === sources.length - 1) throw error;
      console.warn("Official download unavailable; trying the alternate official release route.");
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
}

async function main() {
  const [name, directory, option] = process.argv.slice(2);
  const tool = Object.hasOwn(tools, name ?? "") ? tools[name] : undefined;
  if (!tool || !directory || !path.isAbsolute(directory) ||
      (option && option !== "--download-only")) {
    throw new Error("Usage: install-ci-tool.mjs <k6|gitleaks> <absolute-cache-directory> [--download-only]");
  }
  if (option !== "--download-only" && (process.platform !== "linux" || process.arch !== "x64")) {
    throw new Error("Pinned binaries require Linux x64");
  }
  const archive = await ensureArchive(tool, directory);
  if (option === "--download-only") {
    console.log(`${name} ${tool.version}: official archive SHA-256 verified`);
    return;
  }
  const destination = await mkdtemp(path.join(tmpdir(), `historietas-${name}-`));
  execFileSync("tar", ["-xzf", archive, "-C", destination, tool.member]);
  const binary = path.join(destination, tool.member);
  await chmod(binary, 0o755);
  const version = execFileSync(binary, [tool.versionArgument], { encoding: "utf8" }).trim();
  if (!version.split(/\s+/).some((part) => part === tool.version || part === `v${tool.version}`)) {
    throw new Error(`Unexpected ${name} executable version`);
  }
  if (!process.env.GITHUB_PATH) throw new Error("GITHUB_PATH is required for installation");
  await appendFile(process.env.GITHUB_PATH, `${path.dirname(binary)}\n`);
  console.log(version);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
