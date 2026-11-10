import "server-only";
import type { Json } from "../../supabase/database.types";

export type EventoCacheCapitulo = {
  id: string; leaseId: string; obraId: string; capituloId: string;
  revisao: number; slug: string | null; slugAtual: string | null; numero: number | null;
};

export function lerEventosCache(valor: Json): EventoCacheCapitulo[] {
  if (!Array.isArray(valor) || valor.length > 5) throw new Error("Outbox invalida.");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return valor.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)
      || ![item.id,item.leaseId,item.obraId,item.capituloId].every((id) => typeof id === "string" && uuid.test(id))
      || typeof item.revisao !== "number" || !Number.isSafeInteger(item.revisao) || item.revisao < 1
      || ![item.slug,item.slugAtual].every((slug) => slug === null || typeof slug === "string")
      || !(item.numero === null || (typeof item.numero === "number" && Number.isInteger(item.numero)))) {
      throw new Error("Evento de cache invalido.");
    }
    return item as EventoCacheCapitulo;
  });
}

/** Solicita no contexto Next; NAO confunde retorno void com conclusao fisica. */
export async function solicitarInvalidacaoCacheCapitulos({ reivindicar, invalidar, registrar }: {
  reivindicar: () => Promise<Json>;
  invalidar: (evento: EventoCacheCapitulo) => void;
  registrar: (evento: EventoCacheCapitulo) => Promise<void>;
}) {
  const lote = await reivindicar();
  if (lote && typeof lote === "object" && !Array.isArray(lote) && Object.keys(lote).length === 1
    && (lote.estado === "orcamento_esgotado" || lote.estado === "orcamento_pausado" || lote.estado === "orcamento_nao_configurado")) {
    return { solicitadas: 0, confirmadas: 0, estado: lote.estado, publicacaoAutomaticaHabilitada: false };
  }
  const eventos = lerEventosCache(lote);
  for (const evento of eventos) {
    invalidar(evento);
    await registrar(evento);
  }
  return { solicitadas: eventos.length, confirmadas: 0, estado: "solicitado_sem_confirmacao" as const,
    publicacaoAutomaticaHabilitada: false };
}
