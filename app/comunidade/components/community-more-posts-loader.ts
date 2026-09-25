type CarregarMaisPostsComunidadeParams = {
  carregandoFeed: boolean;
  carregandoMaisPostsComunidade: boolean;
  temMaisPostsComunidade: boolean;
  paginaFeedComunidade: number;
  carregarPostsComunidadeDaPagina: (
    mostrarCarregamento: boolean,
    pagina: number,
  ) => Promise<void>;
};

export async function carregarMaisPostsComunidade({
  carregandoFeed,
  carregandoMaisPostsComunidade,
  temMaisPostsComunidade,
  paginaFeedComunidade,
  carregarPostsComunidadeDaPagina,
}: CarregarMaisPostsComunidadeParams) {
  if (carregandoFeed || carregandoMaisPostsComunidade || !temMaisPostsComunidade) {
    return;
  }

  await carregarPostsComunidadeDaPagina(false, paginaFeedComunidade + 1);
}
