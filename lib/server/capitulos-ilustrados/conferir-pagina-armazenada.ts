import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Somente do recibo PRIVADO, carregado por um executor interno confiavel.
 * Nunca construir este contrato com body/headers/hash fornecidos pelo navegador.
 */
export type ReciboPrivadoPagina = Readonly<{
  tentativaId: string; reservaId: string; usuarioId: string; sessaoId: string;
  capituloId: string; versaoEsperada: number; storagePath: string;
  objetoId: string; objetoVersao: string; sha256: string;
  tamanhoBytes: number; largura: number; altura: number; mimeType: string;
}>;
export type InformacaoObjetoPagina = Readonly<{
  id: string; version: string; name: string; bucketId: string;
  size: number; contentType: string;
}>;
/** Leitor autenticado da Storage API, SEM transformacoes/cache e que respeite
 * AbortSignal. O decoder deve ser validarImagemPagina (2A), nunca metadata HTTP.
 * Nenhuma dependencia permite escrever, assinar, remover ou alterar o ledger.
 */
export type FonteConferenciaPagina = {
  informar(caminho: string, signal: AbortSignal): Promise<InformacaoObjetoPagina | null>;
  baixar(caminho: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>>;
  validar(bytes: Uint8Array): Promise<{ mimeType: string; largura: number; altura: number }>;
};

type Estado = "conferido_sem_terminalidade" | "recibo_invalido" | "nao_observado" |
  "divergente" | "objeto_alterado" | "inconclusivo" | "ocupado";
const MAX_BYTES = 2 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let conferenciasAtivas = 0;

function resultado(estado: Estado) {
  return Object.freeze({ estado, evidencia: "observacao_sem_terminalidade" as const,
    terminalidadeComprovada: false as const, publicacaoHabilitada: false as const,
    limpezaHabilitada: false as const, liberacaoCotaHabilitada: false as const });
}

function reciboValido(r: ReciboPrivadoPagina) {
  const extensoes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extensao = Object.hasOwn(extensoes, r.mimeType) ? extensoes[r.mimeType] : undefined;
  return [r.tentativaId, r.reservaId, r.usuarioId, r.sessaoId, r.capituloId, r.objetoId]
    .every((id) => typeof id === "string" && UUID.test(id)) &&
    Number.isSafeInteger(r.versaoEsperada) && r.versaoEsperada >= 0 &&
    typeof r.objetoVersao === "string" && r.objetoVersao.length > 0 && r.objetoVersao.length <= 128 &&
    typeof r.sha256 === "string" && /^[0-9a-f]{64}$/.test(r.sha256) && extensao &&
    r.storagePath === `${r.usuarioId}/capitulos/${r.capituloId}/${r.reservaId}.${extensao}` &&
    Number.isInteger(r.tamanhoBytes) && r.tamanhoBytes > 0 && r.tamanhoBytes <= MAX_BYTES &&
    Number.isInteger(r.largura) && r.largura > 0 && r.largura <= 2048 &&
    Number.isInteger(r.altura) && r.altura > 0 && r.altura <= 4096 && r.largura * r.altura <= 8_000_000;
}

function corresponde(info: InformacaoObjetoPagina, r: ReciboPrivadoPagina) {
  return info.bucketId === "arquivos-obras" && info.name === r.storagePath &&
    info.id === r.objetoId && info.version === r.objetoVersao &&
    info.size === r.tamanhoBytes && info.contentType === r.mimeType;
}

function abortavel<T>(acao: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abortar = () => reject(new Error("conferencia_interrompida"));
    signal.addEventListener("abort", abortar, { once: true });
    Promise.resolve().then(() => { signal.throwIfAborted(); return acao(); }).then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abortar);
    });
  });
}

async function lerBytes(stream: ReadableStream<Uint8Array>, tamanho: number, signal: AbortSignal) {
  const reader = stream.getReader();
  const bytes = Buffer.alloc(tamanho);
  const hash = createHash("sha256");
  let total = 0;
  let partes = 0;
  try {
    while (true) {
      const { done, value } = await abortavel(() => reader.read(), signal);
      if (done) break;
      if (!(value instanceof Uint8Array) || ++partes > 4096 || value.byteLength > tamanho - total) {
        return null;
      }
      bytes.set(value, total);
      hash.update(bytes.subarray(total, total + value.byteLength));
      total += value.byteLength;
    }
    return total === tamanho ? { bytes, sha256: hash.digest() } : null;
  } finally {
    // Cancelar leitura NAO cancela escritores. Nunca deriva terminalidade disso.
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Conferencia pontual, sem consumidor/endpoint de producao nesta fase.
 * Mesmo um match NAO autoriza publicar, limpar, liberar cota ou encerrar a
 * tentativa. Nao revalida sessao/propriedade atual: isso continua no gate SQL.
 * Repetir so observa novamente; nao reenvia upload e nao produz DML/recibos novos.
 */
export async function conferirPaginaArmazenada(
  reciboPrivado: ReciboPrivadoPagina, fonte: FonteConferenciaPagina, signalExterno?: AbortSignal,
) {
  // Snapshot antes do primeiro await: nem o chamador pode trocar o alvo no meio.
  const r = Object.freeze({ ...reciboPrivado });
  if (!reciboValido(r)) return resultado("recibo_invalido");
  if (conferenciasAtivas >= 2) return resultado("ocupado");
  conferenciasAtivas++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const signal = signalExterno ? AbortSignal.any([controller.signal, signalExterno]) : controller.signal;
  try {
    const antes = await abortavel(() => fonte.informar(r.storagePath, signal), signal);
    if (!antes) return resultado("nao_observado");
    if (!corresponde(antes, r)) return resultado("divergente");
    const stream = await abortavel(() => fonte.baixar(r.storagePath, signal), signal);
    const lido = await lerBytes(stream, r.tamanhoBytes, signal);
    if (!lido || !timingSafeEqual(lido.sha256, Buffer.from(r.sha256, "hex"))) return resultado("divergente");
    const imagem = await abortavel(() => fonte.validar(lido.bytes), signal);
    if (imagem.mimeType !== r.mimeType || imagem.largura !== r.largura || imagem.altura !== r.altura) {
      return resultado("divergente");
    }
    // A 2A pode re-encodar JPEG/WebP. Comparar o HASH DOS BYTES BAIXADOS,
    // nunca o hash de uma segunda codificacao retornada pelo decoder.
    const depois = await abortavel(() => fonte.informar(r.storagePath, signal), signal);
    if (!depois || !corresponde(depois, r)) return resultado("objeto_alterado");
    signal.throwIfAborted();
    return resultado("conferido_sem_terminalidade");
  } catch {
    // Falta de permissao, timeout, stream parcial e falha de decoder nao provam ausencia.
    return resultado("inconclusivo");
  } finally {
    clearTimeout(timer);
    controller.abort();
    conferenciasAtivas--;
  }
}
