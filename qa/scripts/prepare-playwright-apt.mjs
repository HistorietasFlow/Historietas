import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// GitHub's Ubuntu 24.04 mirror list. Keep the two upstream HTTPS archives,
// avoiding the repeatedly unavailable Azure DNS without changing APT trust.
const azure = "http://azure.archive.ubuntu.com/ubuntu/\tpriority:1";
const upstream = [
  "https://archive.ubuntu.com/ubuntu/\tpriority:2",
  "https://security.ubuntu.com/ubuntu/\tpriority:3",
];

export function prepareMirrors(source) {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const entries = lines.filter((line) => line.trim() && !line.startsWith("#"));
  const allowed = new Set([azure, ...upstream]);
  if (entries.some((line) => !allowed.has(line)) ||
      new Set(entries).size !== entries.length ||
      upstream.some((line) => !entries.includes(line))) {
    throw new Error("Unexpected Ubuntu runner mirror list; refusing to change APT sources");
  }
  return lines.filter((line) => line !== azure).join("\n");
}

export async function main(args) {
  const [input, output] = args;
  if (args.length !== 2 || !path.isAbsolute(input) || !path.isAbsolute(output) ||
      path.resolve(input) === path.resolve(output)) {
    throw new Error("Expected separate absolute input/output mirror-list paths");
  }
  const prepared = prepareMirrors(await readFile(input, "utf8"));
  await writeFile(output, prepared, { flag: "wx", mode: 0o600 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
