import { idObraSupabaseValido } from "../../../lib/utils";

export type TentativaCriacaoCapitulo = {
  versao: 1;
  id: string;
  obraId: string;
  userId: string;
  titulo: string;
  texto: string;
  ordem: number;
  criadoEm: string;
  tituloRascunho: string;
  textoRascunho: string;
  fase: "rascunho" | "incerta" | "confirmada" | "concluida" | "rejeitada" | "liberada";
};

function prefixoTentativa(userId: string, obraId: string) {
  return `historietas-adicionar-capitulo-tentativa:v1:${userId}:${obraId}:`;
}

function validarTentativa(valor: string, userId: string, obraId: string) {
  const item = JSON.parse(valor) as TentativaCriacaoCapitulo;
  if (!item || item.versao !== 1 || item.userId !== userId || item.obraId !== obraId ||
    !idObraSupabaseValido(item.id) || typeof item.titulo !== "string" ||
    typeof item.texto !== "string" || typeof item.tituloRascunho !== "string" ||
    typeof item.textoRascunho !== "string" || typeof item.criadoEm !== "string" ||
    !Number.isInteger(item.ordem) || item.ordem < 1 ||
    !["rascunho", "incerta", "confirmada", "concluida", "rejeitada", "liberada"].includes(item.fase)) {
    throw new Error("O registro da tentativa não pôde ser lido. Preserve o texto e confira a obra no Painel do Autor.");
  }
  return item;
}

export function lerTentativaPorId(userId: string, obraId: string, id: string) {
  const valor = localStorage.getItem(prefixoTentativa(userId, obraId) + id);
  if (!valor) return null;
  const item = validarTentativa(valor, userId, obraId);
  if (item.id !== id) throw new Error("O registro da tentativa não corresponde ao ID esperado.");
  return item;
}

export function listarTentativasCriacao(userId: string, obraId: string) {
  const prefixo = prefixoTentativa(userId, obraId);
  const tentativas: TentativaCriacaoCapitulo[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const chave = localStorage.key(index);
    if (!chave?.startsWith(prefixo)) continue;
    const valor = localStorage.getItem(chave);
    if (valor) {
      const item = validarTentativa(valor, userId, obraId);
      if (chave !== prefixo + item.id) throw new Error("O registro da tentativa não corresponde ao ID esperado.");
      tentativas.push(item);
    }
  }
  const prioridade = { incerta: 0, confirmada: 0, concluida: 1, rascunho: 2, rejeitada: 2, liberada: 3 };
  return tentativas.sort((a, b) => prioridade[a.fase] - prioridade[b.fase] || b.criadoEm.localeCompare(a.criadoEm));
}

export function lerTentativaCriacao(userId: string, obraId: string) {
  return listarTentativasCriacao(userId, obraId)[0] ?? null;
}

export function salvarTentativaCriacao(tentativa: TentativaCriacaoCapitulo) {
  const chave = prefixoTentativa(tentativa.userId, tentativa.obraId) + tentativa.id;
  const valor = JSON.stringify(tentativa);
  localStorage.setItem(chave, valor);
  if (localStorage.getItem(chave) !== valor) {
    throw new Error("Não foi possível guardar a tentativa de criação neste navegador.");
  }
}

export function compactarTentativasEncerradas(userId: string, obraId: string, preservarId: string) {
  const nova = lerTentativaPorId(userId, obraId, preservarId);
  for (const item of listarTentativasCriacao(userId, obraId)) {
    const rascunhoProtegido = !item.textoRascunho.trim() ||
      (item.tituloRascunho === nova?.tituloRascunho && item.textoRascunho === nova?.textoRascunho);
    if (item.id !== preservarId && rascunhoProtegido && (item.fase === "rascunho" || item.fase === "rejeitada" || item.fase === "liberada")) {
      // Só compacta após um novo snapshot completo estar durável. Nunca toca
      // nos textos de tentativas incertas/confirmadas ou ainda sem liberação.
      salvarTentativaCriacao({ ...item, fase: "liberada", texto: "", tituloRascunho: "", textoRascunho: "" });
    }
  }
}

export function tentativaBloqueiaInsert(tentativa: TentativaCriacaoCapitulo | null) {
  return Boolean(tentativa && tentativa.fase !== "rascunho" && tentativa.fase !== "rejeitada" && tentativa.fase !== "liberada");
}

export function rejeicaoInsertComprovada(erro: { code?: string } | null) {
  // Erros de representação/HTTP/transporte não provam rollback do INSERT.
  return /^(22|23|42|44|P0)[A-Z0-9]{3}$/.test(erro?.code || "");
}

export function confirmarCapituloCriado(dados: unknown, tentativa: TentativaCriacaoCapitulo) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return null;
  const row = dados as Record<string, unknown>;
  if (row.id !== tentativa.id || row.obra_id !== tentativa.obraId ||
    row.user_id !== tentativa.userId || row.titulo !== tentativa.titulo ||
    row.texto !== tentativa.texto || row.ordem !== tentativa.ordem ||
    row.publicado !== true || row.tipo_conteudo !== "texto" ||
    typeof row.criado_em !== "string" || !Number.isFinite(Date.parse(row.criado_em))) return null;
  return {
    id: tentativa.id, titulo: tentativa.titulo, texto: tentativa.texto,
    ordem: tentativa.ordem, publicado: true, criadoEm: row.criado_em,
    curtiu: false, salvo: false, comentario: "", lido: false, lidoEm: "",
  };
}

export const CAMPOS_CONFIRMACAO_CAPITULO =
  "id,obra_id,user_id,titulo,texto,ordem,publicado,tipo_conteudo,criado_em";
export const AVISO_CRIACAO_INCERTA =
  "A criação ainda não foi confirmada. Seu texto foi preservado. Use Verificar criação; não tente criar novamente nem repita o envio em outra aba.";
export const AVISO_CONTEXTO_ALTERADO =
  "A conta ou a obra mudou. Reabra esta página pelo Painel do Autor. A tentativa enviada foi preservada para a conta original.";
