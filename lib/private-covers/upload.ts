import "server-only";
import type {
  PrivateCoverUploadIntent,
  PrivateCoverUploadResult,
} from "./upload-protocol";

// Deliberately no environment flag, SDK, bucket name or runnable ports.
// Activation requires a separate reviewed integration of PR 1 and delivery.
export const PRIVATE_COVER_UPLOADS_ENABLED = false;

export async function uploadPrivateCover(
  intent: PrivateCoverUploadIntent,
): Promise<PrivateCoverUploadResult> {
  return { status: "disabled", key: intent.key };
}
