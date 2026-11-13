import "server-only";
import { isCoverUuid, parsePrivateCoverReference } from "./reference";

export type PrivateCoverUploadIntent = Readonly<{
  key: string;
  workId: string;
  generation: string;
  expectedVersion: string;
}>;

type Reservation = Readonly<{ attemptId: string; reference: string }>;
type CommitResult =
  | { status: "confirmed"; reference: string }
  | { status: "conflict" | "rejected" | "uncertain" };

// These ports have no implementation yet. Only a future authenticated server
// boundary may supply them, after PR 1, delivery and quota fencing are verified.
export type PrivateCoverUploadPorts = {
  isCurrent: () => boolean;
  reserve: (intent: PrivateCoverUploadIntent) => Promise<Reservation | null>;
  store: (reservation: Reservation, file: Blob, options: Readonly<{
    upsert: false;
    cacheControl: "0";
    contentType: string;
  }>) => Promise<"stored" | "rejected" | "uncertain">;
  commit: (intent: PrivateCoverUploadIntent, reservation: Reservation) => Promise<CommitResult>;
};

export type PrivateCoverUploadResult =
  | { status: "confirmed"; key: string; reference: string }
  | { status: "disabled" | "invalid" | "rejected" | "conflict" | "uncertain" | "obsolete"; key: string };

// Internal orchestration only, with explicit dependencies and no SDK/client.
// Never retries, deletes, restores or releases quota on a partial result.
export async function runPrivateCoverUploadProtocol(
  input: PrivateCoverUploadIntent,
  file: Blob,
  ports: PrivateCoverUploadPorts,
): Promise<PrivateCoverUploadResult> {
  const intent = Object.freeze({ ...input });
  const key = intent.key;
  if (![key, intent.workId, intent.generation, intent.expectedVersion].every(isCoverUuid)
    || file.size <= 0 || file.size > 2 * 1024 * 1024
    || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    return { status: "invalid", key };
  }
  if (!ports.isCurrent()) return { status: "obsolete", key };
  try {
    const reserved = await ports.reserve(intent);
    if (!ports.isCurrent()) return { status: "obsolete", key };
    if (!reserved) return { status: "rejected", key };
    const reference = parsePrivateCoverReference(reserved.reference);
    if (!isCoverUuid(reserved.attemptId) || !reference
      || reference.workId !== intent.workId || reference.generation !== intent.generation) {
      return { status: "uncertain", key };
    }
    const reservation = Object.freeze({ ...reserved });
    const stored = await ports.store(reservation, file, Object.freeze({
      upsert: false, cacheControl: "0", contentType: file.type,
    }));
    if (!ports.isCurrent()) return { status: "obsolete", key };
    if (stored === "rejected") return { status: "rejected", key };
    if (stored !== "stored") return { status: "uncertain", key };
    const result = await ports.commit(intent, reservation);
    if (!ports.isCurrent()) return { status: "obsolete", key };
    if (result.status === "confirmed") {
      return result.reference === reservation.reference
        ? { status: "confirmed", key, reference: reservation.reference }
        : { status: "uncertain", key };
    }
    if (result.status === "conflict" || result.status === "rejected") {
      return { status: result.status, key };
    }
    return { status: "uncertain", key };
  } catch {
    // A transport error is not evidence that the operation failed remotely.
    return { status: ports.isCurrent() ? "uncertain" : "obsolete", key };
  }
}
