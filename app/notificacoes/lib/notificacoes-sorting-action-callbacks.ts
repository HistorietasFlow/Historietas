type CriarAcoesPainelOrdenacaoNotificacoesParams = {
  marcarTodasComoLidas: () => void;
  marcarFiltradasComoLidas: () => void;
  limparLidas: () => void;
  limparTodas: () => void;
  setMostrarPainelOrdenacao: (mostrar: boolean) => void;
};

export function criarAcoesPainelOrdenacaoNotificacoes({
  marcarTodasComoLidas,
  marcarFiltradasComoLidas,
  limparLidas,
  limparTodas,
  setMostrarPainelOrdenacao,
}: CriarAcoesPainelOrdenacaoNotificacoesParams) {
  function onMarcarTodasComoLidas() {
    marcarTodasComoLidas();
    setMostrarPainelOrdenacao(false);
  }

  function onMarcarFiltradasComoLidas() {
    marcarFiltradasComoLidas();
    setMostrarPainelOrdenacao(false);
  }

  function onLimparLidas() {
    limparLidas();
    setMostrarPainelOrdenacao(false);
  }

  function onLimparTodas() {
    limparTodas();
    setMostrarPainelOrdenacao(false);
  }

  return {
    onMarcarTodasComoLidas,
    onMarcarFiltradasComoLidas,
    onLimparLidas,
    onLimparTodas,
  };
}
