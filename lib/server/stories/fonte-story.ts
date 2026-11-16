import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Mesmos bytes da Geist Regular distribuída pelo Next travado no lockfile.
 * Caminho estático para o file tracing; sem download nem fallback tipográfico. */
export async function carregarGeistStory(): Promise<ArrayBuffer> {
  const bytes = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));
  return Uint8Array.from(bytes).buffer;
}
