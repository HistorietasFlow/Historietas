import type { CSSProperties } from "react";

export type ListasDiaryAnnotationCardStyles = {
  annotation: CSSProperties;
  annotationCommentButton: CSSProperties;
  annotationCommentCount: CSSProperties;
  annotationCommentIcon: CSSProperties;
  annotationHeader: CSSProperties;
  annotationHeaderActions: CSSProperties;
  annotationLikeButton: CSSProperties;
  annotationLikeCount: CSSProperties;
  annotationLikeIcon: CSSProperties;
  annotationText: CSSProperties;
  annotationTitle: CSSProperties;
  annotationTitleGroup: CSSProperties;
  spoiler: CSSProperties;
  spoilerButton: CSSProperties;
  spoilerText: CSSProperties;
};

type ListasDiaryAnnotationCardProps = {
  annotation: string;
  annotationId: string;
  authorName: string;
  canLike: boolean;
  canSeeComments: boolean;
  commentAriaLabel: string;
  commentCount: string;
  containsSpoiler: boolean;
  isLiked: boolean;
  isSavingLike: boolean;
  likeAriaLabel: string;
  likeCount: string;
  onLike: () => void;
  onOpenComments: () => void;
  onSetSpoilerRevealed: (revealed: boolean) => void;
  spoilerRevealed: boolean;
  styles: ListasDiaryAnnotationCardStyles;
  workId: string;
};

export function ListasDiaryAnnotationCard({
  annotation,
  annotationId,
  authorName,
  canLike,
  canSeeComments,
  commentAriaLabel,
  commentCount,
  containsSpoiler,
  isLiked,
  isSavingLike,
  likeAriaLabel,
  likeCount,
  onLike,
  onOpenComments,
  onSetSpoilerRevealed,
  spoilerRevealed,
  styles,
  workId,
}: ListasDiaryAnnotationCardProps) {
  return (
    <div
      id={`anotacao-${workId}`}
      className="historietas-list-annotation"
      style={styles.annotation}
    >
      <div style={styles.annotationHeader}>
        <div style={styles.annotationTitleGroup}>
          <strong style={styles.annotationTitle}>Anotação de {authorName}</strong>
        </div>

        <div style={styles.annotationHeaderActions}>
          {annotationId && canLike && (
            <button
              type="button"
              onClick={onLike}
              disabled={isSavingLike}
              style={{
                ...styles.annotationLikeButton,
                opacity: isSavingLike ? 0.58 : 1,
                cursor: isSavingLike ? "not-allowed" : "pointer",
              }}
              aria-label={likeAriaLabel}
              aria-pressed={isLiked}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  ...styles.annotationLikeIcon,
                  animation: isLiked
                    ? "historietas-list-heart-pop 260ms ease-out"
                    : "none",
                }}
              >
                <path
                  d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
                  fill={
                    isLiked
                      ? "var(--historietas-list-like-active, #EF4444)"
                      : "none"
                  }
                  stroke={
                    isLiked
                      ? "var(--historietas-list-like-active, #EF4444)"
                      : "#FFFFFF"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={styles.annotationLikeCount}>{likeCount}</span>
            </button>
          )}

          {annotationId && canSeeComments && (
            <button
              type="button"
              onClick={onOpenComments}
              style={styles.annotationCommentButton}
              aria-label={commentAriaLabel}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={styles.annotationCommentIcon}
              >
                <path
                  d="M5 5.75h14a2.25 2.25 0 0 1 2.25 2.25v6A2.25 2.25 0 0 1 19 16.25h-6.2L8 20v-3.75H5A2.25 2.25 0 0 1 2.75 14V8A2.25 2.25 0 0 1 5 5.75Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={styles.annotationCommentCount}>{commentCount}</span>
            </button>
          )}
        </div>
      </div>

      {containsSpoiler && !spoilerRevealed ? (
        <div style={styles.spoiler}>
          <span style={styles.spoilerText}>Esta anotação contém spoiler</span>
          <button
            type="button"
            onClick={() => onSetSpoilerRevealed(true)}
            style={styles.spoilerButton}
          >
            Revelar
          </button>
        </div>
      ) : (
        <>
          <p data-historietas-user-content="true" style={styles.annotationText}>
            {annotation}
          </p>

          {containsSpoiler && (
            <button
              type="button"
              onClick={() => onSetSpoilerRevealed(false)}
              style={styles.spoilerButton}
            >
              Ocultar
            </button>
          )}
        </>
      )}
    </div>
  );
}
