export function criarLinksComunidadePerfilAutor(nomeAutor: string) {
  const busca = encodeURIComponent(nomeAutor || "");
  const geral = busca ? `/comunidade?busca=${busca}` : "/comunidade";

  return {
    geral,
    teorias: busca ? `${geral}&tipo=Teoria` : "/comunidade?tipo=Teoria",
    reviews: busca ? `${geral}&tipo=Review` : "/comunidade?tipo=Review",
  };
}
