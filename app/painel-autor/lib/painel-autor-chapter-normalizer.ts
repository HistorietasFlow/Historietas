type CapituloSalvoPainel = Record<string, unknown> & {
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
};

type CapituloNormalizadoPainel = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado: boolean | undefined;
};

export function normalizarCapitulo(
  capitulo: CapituloSalvoPainel,
  capituloIndex: number,
  obraIndex: number
): CapituloNormalizadoPainel {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : `Capítulo ${capituloIndex + 1}`,
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
  };
}
