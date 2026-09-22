import type { CSSProperties } from "react";

export function getCommunityPostComposerRelatedChapterInputStyle(
  relatedWorkSelected: boolean,
): CSSProperties {
  return {
    opacity: relatedWorkSelected ? 1 : 0.58,
    cursor: relatedWorkSelected ? "text" : "not-allowed",
  };
}
