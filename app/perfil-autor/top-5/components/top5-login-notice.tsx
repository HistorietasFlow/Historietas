import Link from "next/link";
import {
  loginButtonStyle,
  noticeStyle,
  noticeTextStyle,
  noticeTitleStyle,
} from "../lib/top5-search-feedback-styles";

export function Top5LoginNotice() {
  return (
    <section style={noticeStyle}>
      <strong style={noticeTitleStyle}>Entre para salvar seu TOP 5</strong>
      <span style={noticeTextStyle}>
        Você pode ver as obras, mas precisa estar logado para salvar suas escolhas.
      </span>
      <Link href="/login?redirectTo=/perfil-autor/top-5" style={loginButtonStyle}>
        Entrar
      </Link>
    </section>
  );
}
