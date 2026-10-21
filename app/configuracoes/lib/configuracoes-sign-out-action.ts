type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

type MostrarMensagemAcaoConfiguracoes = (
  tipo: "sucesso" | "erro" | "aviso",
  texto: string,
) => void;

export async function sairDaContaConfiguracoes({
  limparMensagem,
  encerrarSessao,
  redirecionarLogin,
  atualizarRota,
  mostrarMensagemAcao,
  traduzirTexto,
}: {
  limparMensagem: () => void;
  encerrarSessao: () => Promise<{ error: unknown }>;
  redirecionarLogin: () => void;
  atualizarRota: () => void;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
}) {
  limparMensagem();

  try {
    const { error } = await encerrarSessao();

    if (error) {
      mostrarMensagemAcao(
        "erro",
        traduzirTexto(
          "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
          "Could not sign out right now. Please try again.",
          "No se pudo cerrar la sesi\u00f3n ahora. Int\u00e9ntalo de nuevo.",
        ),
      );
      return;
    }

    redirecionarLogin();
    atualizarRota();
  } catch {
    mostrarMensagemAcao(
      "erro",
      traduzirTexto(
        "N\u00e3o foi poss\u00edvel sair da conta agora. Tente novamente.",
        "Could not sign out right now. Please try again.",
        "No se pudo cerrar la sesi\u00f3n ahora. Int\u00e9ntalo de nuevo.",
      ),
    );
  }
}
