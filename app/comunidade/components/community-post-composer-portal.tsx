import { createPortal } from "react-dom";
import type { ComponentProps } from "react";
import { CommunityPostComposer } from "./community-post-composer";
import type { UsuarioComunidade } from "./community-user";

type CommunityPostComposerPortalProps = {
  composerAberto: boolean;
  usuario: UsuarioComunidade | null;
  composerProps: ComponentProps<typeof CommunityPostComposer>;
};

export function CommunityPostComposerPortal({
  composerAberto,
  usuario,
  composerProps,
}: CommunityPostComposerPortalProps) {
  return composerAberto && usuario && typeof document !== "undefined"
    ? createPortal(<CommunityPostComposer {...composerProps} />, document.body)
    : null;
}
