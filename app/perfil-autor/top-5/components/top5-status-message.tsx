import { messageStyle } from "../lib/top5-search-feedback-styles";

type Top5StatusMessageProps = {
  mensagem: string;
};

export function Top5StatusMessage({
  mensagem,
}: Top5StatusMessageProps) {
  return (
    <p role="status" aria-live="polite" style={messageStyle}>
      {mensagem}
    </p>
  );
}
