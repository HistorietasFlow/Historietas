import { obterDadosNotificacoesPerfilAutor } from "./profile-display-utils";

export function obterEstadoVisualNotificacoesPerfilAutor({
  notificacoesNaoLidasPerfil,
  notificacoesNaoLidasContexto,
}: {
  notificacoesNaoLidasPerfil: number | null;
  notificacoesNaoLidasContexto: number;
}) {
  const notificacoesNaoLidas =
    notificacoesNaoLidasPerfil ?? notificacoesNaoLidasContexto;
  const {
    notificacoesNaoLidasFormatadas,
    ariaLabelNotificacoes,
    ariaLabelBadgeNotificacoes,
    temNotificacoesNaoLidas,
  } = obterDadosNotificacoesPerfilAutor(notificacoesNaoLidas);

  return {
    notificacoesNaoLidas,
    notificacoesNaoLidasFormatadas,
    ariaLabelNotificacoes,
    ariaLabelBadgeNotificacoes,
    temNotificacoesNaoLidas,
  };
}
