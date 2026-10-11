export function criarBuscaComunidadePerfilAutor(nomeAutor: string) {
  return encodeURIComponent(nomeAutor || "");
}

function criarLinkTipoComunidadePerfilAutor({
  geral,
  busca,
  tipo,
}: {
  geral: string;
  busca: string;
  tipo: "Teoria" | "Review";
}) {
  return busca ? `${geral}&tipo=${tipo}` : `/comunidade?tipo=${tipo}`;
}

export function criarLinksComunidadePerfilAutor(nomeAutor: string) {
  const busca = criarBuscaComunidadePerfilAutor(nomeAutor);
  const geral = busca ? `/comunidade?busca=${busca}` : "/comunidade";

  return {
    geral,
    teorias: criarLinkTipoComunidadePerfilAutor({
      geral,
      busca,
      tipo: "Teoria",
    }),
    reviews: criarLinkTipoComunidadePerfilAutor({
      geral,
      busca,
      tipo: "Review",
    }),
  };
}
