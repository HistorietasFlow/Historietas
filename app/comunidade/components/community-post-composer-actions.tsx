import { CommunityPostComposerActionRow } from "./community-post-composer-action-row";
import { CommunityPostComposerSpoilerButton } from "./community-post-composer-spoiler-button";
import { CommunityPostComposerSpoilerLabel } from "./community-post-composer-spoiler-label";
import { CommunityPostComposerSpoilerIndicator } from "./community-post-composer-spoiler-indicator";
import { CommunityPostComposerPublishButton } from "./community-post-composer-publish-button";

type CommunityPostComposerActionsProps = {
  publicandoPost: boolean;
  temSpoilerPost: boolean;
  onAlternarSpoiler: () => void;
};

export function CommunityPostComposerActions({
  publicandoPost,
  temSpoilerPost,
  onAlternarSpoiler,
}: CommunityPostComposerActionsProps) {
  return (
    <CommunityPostComposerActionRow>
      <CommunityPostComposerSpoilerButton
        active={temSpoilerPost}
        disabled={publicandoPost}
        onClick={onAlternarSpoiler}
      >
        <CommunityPostComposerSpoilerLabel>
          Este post contém spoiler
        </CommunityPostComposerSpoilerLabel>

        <CommunityPostComposerSpoilerIndicator active={temSpoilerPost}>
          {temSpoilerPost ? "✓" : ""}
        </CommunityPostComposerSpoilerIndicator>
      </CommunityPostComposerSpoilerButton>

      <CommunityPostComposerPublishButton disabled={publicandoPost}>
        {publicandoPost ? "Publicando..." : "Publicar"}
      </CommunityPostComposerPublishButton>
    </CommunityPostComposerActionRow>
  );
}
