export type TipoAlvoDenuncia =
  | "post"
  | "comentario"
  | "comentario_capitulo"
  | "obra"
  | "capitulo"
  | "comentario_obra"
  | "diario_anotacao"
  | "comentario_diario";

export const MOTIVOS_DENUNCIA_PERFIL_LABEL: Record<string, string> = {
  spam: "Spam",
  ofensivo: "Conteúdo ofensivo",
  perfil_falso: "Perfil falso",
  assedio: "Assédio",
  improprio: "Conteúdo impróprio",
  outro: "Outro",
};

export function formatarMotivoDenunciaPerfil(motivo: string) {
  return MOTIVOS_DENUNCIA_PERFIL_LABEL[motivo] || motivo || "Denúncia de perfil";
}

export const MOTIVOS_DENUNCIA_CONTEUDO_LABEL: Record<string, string> = {
  conteudo_inadequado: "Conteúdo inadequado",
  spam: "Spam",
  assedio: "Assédio",
  odio_discriminacao: "Ódio ou discriminação",
  ameaca_violencia: "Ameaça ou violência",
  conteudo_sexual: "Conteúdo sexual impróprio",
  risco_menor: "Risco envolvendo menor",
  plagio_direitos_autorais: "Plágio ou direitos autorais",
  informacoes_pessoais: "Informações pessoais expostas",
  fraude: "Fraude ou golpe",
  outro: "Outro",
};

export function formatarMotivoDenunciaConteudo(motivo: string) {
  const motivoLimpo = motivo.trim();

  return (
    MOTIVOS_DENUNCIA_CONTEUDO_LABEL[motivoLimpo] ||
    motivoLimpo ||
    "Conteúdo inadequado"
  );
}

export function normalizarTipoAlvo(valor: unknown): TipoAlvoDenuncia {
  const tiposValidos = new Set<TipoAlvoDenuncia>([
    "post",
    "comentario",
    "comentario_capitulo",
    "obra",
    "capitulo",
    "comentario_obra",
    "diario_anotacao",
    "comentario_diario",
  ]);

  return tiposValidos.has(valor as TipoAlvoDenuncia)
    ? (valor as TipoAlvoDenuncia)
    : "post";
}

export function rotuloTipoAlvoDenuncia(tipo: TipoAlvoDenuncia) {
  const rotulos: Record<TipoAlvoDenuncia, string> = {
    post: "Publicação",
    comentario: "Comentário",
    comentario_capitulo: "Comentário de capítulo",
    obra: "Obra",
    capitulo: "Capítulo",
    comentario_obra: "Comentário da obra",
    diario_anotacao: "Anotação do Diário",
    comentario_diario: "Comentário do Diário",
  };

  return rotulos[tipo];
}

export function rotuloRemocaoAlvoDenuncia(tipo: TipoAlvoDenuncia) {
  const rotulos: Record<TipoAlvoDenuncia, string> = {
    post: "Remover publicação",
    comentario: "Remover comentário",
    comentario_capitulo: "Remover comentário do capítulo",
    obra: "Remover obra",
    capitulo: "Remover capítulo",
    comentario_obra: "Remover comentário da obra",
    diario_anotacao: "Remover anotação do Diário",
    comentario_diario: "Remover comentário do Diário",
  };

  return rotulos[tipo];
}

export function rotuloSucessoRemocaoAlvo(tipo: TipoAlvoDenuncia) {
  const rotulos: Record<TipoAlvoDenuncia, string> = {
    post: "Publicação removida",
    comentario: "Comentário removido",
    comentario_capitulo: "Comentário do capítulo removido",
    obra: "Obra removida",
    capitulo: "Capítulo removido",
    comentario_obra: "Comentário da obra removido",
    diario_anotacao: "Anotação do Diário removida",
    comentario_diario: "Comentário do Diário removido",
  };

  return rotulos[tipo];
}
