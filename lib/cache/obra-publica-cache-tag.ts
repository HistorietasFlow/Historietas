import "server-only";
import { createHash } from "node:crypto";

/** Inclui ausencias: nao depende de descobrir o UUID da obra no loader. */
export function tagObraPublica(slug: string): string {
  return `historietas:obra:${createHash("sha256").update(slug).digest("hex")}`;
}
