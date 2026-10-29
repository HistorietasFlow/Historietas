import { loginNoticeStyle } from "../lib/explorar-layout-styles";

type ExplorarLoginNoticeProps = { mensagem: string };

export function ExplorarLoginNotice({ mensagem }: ExplorarLoginNoticeProps) {
  return <span style={loginNoticeStyle}>{mensagem}</span>;
}
