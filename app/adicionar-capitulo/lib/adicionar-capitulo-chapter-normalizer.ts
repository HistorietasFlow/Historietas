type CapituloParaNormalizarAdicionarCapitulo = {
  id?: unknown;
  titulo?: unknown;
  texto?: unknown;
  curtiu?: unknown;
  salvo?: unknown;
  comentario?: unknown;
  criadoEm?: unknown;
  lido?: unknown;
  lidoEm?: unknown;
  publicado?: unknown;
  ordem?: unknown;
};

export function normalizarCapitulo(
  capitulo: CapituloParaNormalizarAdicionarCapitulo,
  index: number,
) {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : `Capítulo ${index + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado:
      typeof capitulo.publicado === "boolean" ? capitulo.publicado : undefined,
    ordem:
      typeof capitulo.ordem === "number" &&
      Number.isInteger(capitulo.ordem) &&
      capitulo.ordem >= 1
        ? capitulo.ordem
        : index + 1,
  };
}
