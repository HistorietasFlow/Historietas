import type { CSSProperties, ChangeEventHandler } from "react";

type CommunityDesktopSearchInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function CommunityDesktopSearchInput({
  value,
  onChange,
}: CommunityDesktopSearchInputProps) {
  return (
    <input
      aria-label="Buscar publicações ou usuários"
      value={value}
      onChange={onChange}
      placeholder="Buscar publicações ou usuários"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      maxLength={90}
      style={desktopSearchInputStyle}
      type="text"
    />
  );
}

const desktopSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  padding: "0 14px 0 42px",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
};
