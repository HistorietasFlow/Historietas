// Provisional application contract. Reconcile with PR 1 before persisting it.
export type PrivateCoverReference = Readonly<{
  kind: "private-cover";
  version: 1;
  workId: string;
  generation: string;
  assetId: string;
}>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PREFIX = "private-cover:v1:";

export function isCoverUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function parsePrivateCoverReference(value: unknown): PrivateCoverReference | null {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return null;
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3 || !parts.every(isCoverUuid)) return null;
  const [workId, generation, assetId] = parts;
  return Object.freeze({ kind: "private-cover", version: 1, workId, generation, assetId });
}

export type CoverSource =
  | { kind: "legacy"; url: string }
  | { kind: "private"; reference: PrivateCoverReference }
  | { kind: "unavailable" };

// No private URL is produced here. Delivery must authorize every request.
// A private discriminator wins even if an old public URL is still cached.
export function selectCoverSource(input: {
  kind: "legacy" | "private";
  reference?: unknown;
  legacyUrl?: string | null;
}): CoverSource {
  if (input.kind === "private") {
    const reference = parsePrivateCoverReference(input.reference);
    return reference ? { kind: "private", reference } : { kind: "unavailable" };
  }
  if (input.kind !== "legacy") return { kind: "unavailable" };
  // A mixed record is not evidence that it is safe to restore a legacy URL.
  if (input.reference !== undefined && input.reference !== null) return { kind: "unavailable" };
  const url = input.legacyUrl || "";
  return /^https?:\/\//i.test(url) ? { kind: "legacy", url } : { kind: "unavailable" };
}
