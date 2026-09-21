import type { CSSProperties } from "react";

type CommunityCommentHeartIconProps = {
  liked: boolean;
};

export function CommunityCommentHeartIcon({
  liked,
}: CommunityCommentHeartIconProps) {
  const heartColor = "var(--historietas-comunidade-heart, #FFFFFF)";

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        ...commentHeartIconStyle,
        animation: liked
          ? "historietas-comunidade-heart-pop 260ms ease-out"
          : "none",
      }}
    >
      <path
        d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
        fill={liked ? heartColor : "none"}
        stroke={liked ? heartColor : "#FFFFFF"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const commentHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};
