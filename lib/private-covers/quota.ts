// A reconciliation model, not an admission check or authoritative SQL ledger.
// The future private bucket name below is provisional; no bucket is created.
const MAX_BYTES = {
  avatars: 1048576,
  "capas-obras": 2097152,
  "capas-obras-privadas": 2097152,
  "arquivos-obras": 5242880,
} as const;

export type CoverQuotaEntry = Readonly<{
  bucket: keyof typeof MAX_BYTES;
  path: string;
  ownerId: string;
  bytes: number | null;
}>;

// Include physical objects AND all outstanding holds, including uncertain IO.
// Expiry/logout/cascade are not permission to omit a retained hold.
export function accountCoverQuota(input: {
  complete: boolean;
  objects: readonly CoverQuotaEntry[];
  holds: readonly CoverQuotaEntry[];
}, ownerId: string) {
  if (!input.complete || !ownerId) throw new Error("incomplete_quota_inventory");
  const charges = new Map<string, CoverQuotaEntry & { bytes: number }>();
  for (const item of [...input.objects, ...input.holds]) {
    if (!Object.hasOwn(MAX_BYTES, item.bucket) || !item.path || !item.ownerId
      || (item.bytes !== null && (!Number.isSafeInteger(item.bytes) || item.bytes < 0))) {
      throw new Error("invalid_quota_entry");
    }
    const bytes = item.bytes ?? MAX_BYTES[item.bucket];
    const key = JSON.stringify([item.bucket, item.path]);
    const previous = charges.get(key);
    if (previous && previous.ownerId !== item.ownerId) throw new Error("ambiguous_quota_owner");
    charges.set(key, { ...item, bytes: Math.max(bytes, previous?.bytes ?? 0) });
  }
  let globalBytes = 0;
  let userBytes = 0;
  let userObjects = 0;
  const userFamilies = { avatars: 0, covers: 0, files: 0 };
  for (const item of charges.values()) {
    globalBytes += item.bytes;
    if (item.ownerId !== ownerId) continue;
    userBytes += item.bytes;
    userObjects++;
    userFamilies[item.bucket === "avatars" ? "avatars"
      : item.bucket === "arquivos-obras" ? "files" : "covers"]++;
  }
  if (!Number.isSafeInteger(globalBytes)) throw new Error("quota_overflow");
  return {
    globalBytes, globalObjects: charges.size, userBytes, userObjects, userFamilies,
    withinLimits: globalBytes <= 700 * 1048576 && charges.size <= 5000
      && userBytes <= 100 * 1048576 && userObjects <= 100
      && userFamilies.avatars <= 5 && userFamilies.covers <= 60 && userFamilies.files <= 30,
  };
}
