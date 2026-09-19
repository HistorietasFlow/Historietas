import type { ChangeEventHandler } from "react";

import { profileAboutTextareaStyle } from "../styles";

type ProfileAboutTextareaProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder: string;
  maxLength: number;
};

export function ProfileAboutTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
}: ProfileAboutTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label="Sinopse do Sobre"
      style={profileAboutTextareaStyle}
    />
  );
}
