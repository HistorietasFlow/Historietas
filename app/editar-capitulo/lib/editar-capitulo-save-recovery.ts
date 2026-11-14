export const uuidDiarioEdicaoValido = (valor: unknown): valor is string =>
  typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
export type IntencaoDiarioEdicao = {
  versao: string;
  estado: "inelegivel" | "pendente" | "incerto" | "confirmado" | "indisponivel" | "conflito";
};
export type ReferenciaTextoCapitulo = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number;
  publicado: boolean;
  atualizado_em: string;
  tipo_conteudo: "texto";
};

export function referenciaTextoCapitulo(valor: unknown): ReferenciaTextoCapitulo | null {
  if (!valor || typeof valor !== "object") return null;
  const row = valor as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.obra_id !== "string" || typeof row.user_id !== "string" ||
      !(row.titulo === null || typeof row.titulo === "string") ||
      !(row.texto === null || typeof row.texto === "string") ||
      typeof row.ordem !== "number" || !Number.isInteger(row.ordem) || row.ordem < 1 ||
      typeof row.publicado !== "boolean" || typeof row.atualizado_em !== "string" || !row.atualizado_em ||
      !/^\d{4}-\d{2}-\d{2}T/.test(row.atualizado_em) || !Number.isFinite(Date.parse(row.atualizado_em)) ||
      row.tipo_conteudo !== "texto") return null;
  // SELECT * permite o rollout sem a coluna nova. Não persistir colunas extras
  // na referência; o token do Diário vem somente do canal do PATCH confirmado.
  return {id: row.id, obra_id: row.obra_id, user_id: row.user_id, titulo: row.titulo, texto: row.texto,
    ordem: row.ordem, publicado: row.publicado, atualizado_em: row.atualizado_em, tipo_conteudo: "texto"};
}

export type RecuperacaoTextoCapitulo = {
  titulo: string;
  texto: string;
  estado: "pronto" | "incerto" | "confirmado";
  referencia: ReferenciaTextoCapitulo | null;
  diario?: IntencaoDiarioEdicao[];
  escritaConfirmada?: boolean;
  local?: { titulo: string; texto: string; ordem?: number; publicado?: boolean };
};

const chaveRecuperacao = (userId: string, obraId: string, capituloId: string) =>
  `historietas-edicao-texto:${userId}:${obraId}:${capituloId}`;

// Cópia privada desta aba; não modifica o formato das obras nem apaga drafts.
export function lerRecuperacaoTexto(userId: string, obraId: string, capituloId: string): RecuperacaoTextoCapitulo | null {
  const raw = sessionStorage.getItem(chaveRecuperacao(userId, obraId, capituloId));
  if (!raw) return null;
  const valor = JSON.parse(raw) as RecuperacaoTextoCapitulo;
  if (typeof valor.titulo !== "string" || typeof valor.texto !== "string" ||
      !["pronto", "incerto", "confirmado"].includes(valor.estado) ||
      (valor.referencia !== null && !referenciaTextoCapitulo(valor.referencia))) {
    throw new Error("Não consegui ler a cópia de recuperação. Preserve seu texto antes de continuar.");
  }
  if (valor.escritaConfirmada !== undefined && (typeof valor.escritaConfirmada !== "boolean" ||
      (valor.escritaConfirmada && !valor.referencia))) {
    throw new Error("A confirmação remota de recuperação está inválida. Preserve seu texto antes de continuar.");
  }
  if (valor.diario !== undefined && (!Array.isArray(valor.diario) || valor.diario.some(item =>
    !item || !uuidDiarioEdicaoValido(item.versao) || !["inelegivel", "pendente", "incerto", "confirmado", "indisponivel", "conflito"].includes(item.estado)) ||
    new Set(valor.diario.map(item => item.versao)).size !== valor.diario.length)) {
    throw new Error("A intenção de Diário está inválida. Preserve a recuperação antes de continuar.");
  }
  if (valor.local && (typeof valor.local.titulo !== "string" || typeof valor.local.texto !== "string" ||
      (valor.local.ordem !== undefined && (!Number.isInteger(valor.local.ordem) || valor.local.ordem < 1)) ||
      (valor.local.publicado !== undefined && typeof valor.local.publicado !== "boolean"))) {
    throw new Error("A referência local de recuperação está inválida. Preserve seu texto antes de continuar.");
  }
  if (valor.referencia && (valor.referencia.user_id !== userId || valor.referencia.obra_id !== obraId || valor.referencia.id !== capituloId)) {
    throw new Error("A cópia de recuperação pertence a outro capítulo ou usuário.");
  }
  return valor;
}

export function guardarRecuperacaoTexto(userId: string, obraId: string, capituloId: string, valor: RecuperacaoTextoCapitulo) {
  // Não substituir silenciosamente uma cópia que não conseguimos interpretar.
  lerRecuperacaoTexto(userId, obraId, capituloId);
  sessionStorage.setItem(chaveRecuperacao(userId, obraId, capituloId), JSON.stringify(valor));
}
