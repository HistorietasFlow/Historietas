import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerFieldsProps = {
  children: ReactNode;
  desktop: boolean;
};

export function CommunityPostComposerFields({
  children,
  desktop,
}: CommunityPostComposerFieldsProps) {
  return (
    <div
      style={
        desktop
          ? postComposerFieldsGridStyle
          : postComposerFieldsStackStyle
      }
    >
      {children}
    </div>
  );
}

const postComposerFieldsStackStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const postComposerFieldsGridStyle: CSSProperties = {
  ...postComposerFieldsStackStyle,
  gridTemplateColumns: "150px 190px minmax(0, 1fr)",
};
