import type { CSSProperties, ReactNode } from "react";

type CommunityLoadingContainerProps = {
  children: ReactNode;
  style: CSSProperties;
};

export function CommunityLoadingContainer({
  children,
  style,
}: CommunityLoadingContainerProps) {
  return (
    <main style={style} aria-busy="true">
      {children}
    </main>
  );
}
