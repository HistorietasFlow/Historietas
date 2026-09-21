import type {
  CSSProperties,
  FormEventHandler,
  ReactNode,
} from "react";

type CommunityPostComposerFormProps = {
  children: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function CommunityPostComposerForm({
  children,
  onSubmit,
}: CommunityPostComposerFormProps) {
  return (
    <form onSubmit={onSubmit} style={postComposerFormStyle}>
      {children}
    </form>
  );
}

const postComposerFormStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "0 12px",
  WebkitOverflowScrolling: "touch",
};
