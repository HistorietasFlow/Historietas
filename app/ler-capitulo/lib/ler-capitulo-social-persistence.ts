import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { CapituloLocal, ObraLocal } from "./ler-capitulo-work-normalization";

type TipoNotificacaoInteracaoCapitulo =
  | "curtida-capitulo"
  | "comentario-capitulo"
  | "curtida-comentario-capitulo";

type TipoAtividadeDiarioLeitor =
  | "comecou_ler"
  | "leu_capitulo"
  | "concluiu_obra"
  | "favoritou_obra"
  | "salvou_obra";

type VisibilidadeDiarioLeitor = "publico" | "parcial" | "privado";

export async function marcarNotificacaoCapituloComoLidaSupabase(
  userId: string,
  obraId: string,
  capituloId: string
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capituloIdLimpo = capituloId.trim();

  if (!userIdLimpo || !obraIdLimpo || !capituloIdLimpo) {
    return;
  }

  try {
    await supabase
      .from("notificacoes")
      .update({
        lida: true,
      })
      .eq("user_id", userIdLimpo)
      .eq("obra_id", obraIdLimpo)
      .eq("capitulo_id", capituloIdLimpo);
  } catch {
    // A leitura continua mesmo se a notificação remota não atualizar.
  }
}

export function criarRegistrarNotificacaoInteracaoCapituloSupabase(
  criarHrefLeituraCapituloLeitor: (obra: Pick<ObraLocal, "id" | "slug" | "titulo" | "publicado" | "capitulos">, capituloId: string) => string
) {
  return async function registrarNotificacaoInteracaoCapituloSupabase({
    tipo,
    obra,
    capitulo,
    comentarioId,
    titulo,
    mensagem,
    link,
  }: {
    tipo: TipoNotificacaoInteracaoCapitulo;
    obra: ObraLocal | null;
    capitulo: CapituloLocal | null;
    comentarioId?: string;
    titulo: string;
    mensagem: string;
    link: string;
  }) {
    const obraId = obra?.id?.trim() || "";
    const capituloId = capitulo?.id?.trim() || "";
    // O RPC exige um UUID mesmo para curtidas de capítulo. Nesse tipo de evento,
    // o banco ignora p_comentario_id, então o capítulo serve como UUID neutro.
    const comentarioIdRpc = comentarioId?.trim() || capituloId;
    const tituloLimpo = titulo.trim();
    const mensagemLimpa = mensagem.trim();
    const linkLimpo = link.trim();

    if (!idObraSupabaseValido(obraId) || !idObraSupabaseValido(capituloId)) {
      return false;
    }

    try {
      const { error } = await supabase.rpc(
        "criar_notificacao_interacao_capitulo",
        {
          p_capitulo_id: capituloId,
          p_comentario_id: comentarioIdRpc,
          p_tipo: tipo,
          p_titulo: tituloLimpo,
          p_mensagem: mensagemLimpa,
          p_link: linkLimpo || (obra ? criarHrefLeituraCapituloLeitor(obra, capituloId) : "/notificacoes"),
        }
      );

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.warn("Não consegui criar notificação da interação do capítulo:", error);
      return false;
    }
  };
}

export async function registrarAtividadeDiarioLeitor({
  userId,
  tipo,
  obra,
  capituloId,
  visibilidade,
  texto,
  metadata = {},
}: {
  userId: string;
  tipo: TipoAtividadeDiarioLeitor;
  obra: ObraLocal;
  capituloId?: string;
  visibilidade: VisibilidadeDiarioLeitor;
  texto?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!userId || !idObraSupabaseValido(obra.id)) {
    return false;
  }

  const capituloIdSeguro =
    capituloId && idObraSupabaseValido(capituloId) ? capituloId : null;

  try {
    const { error } = await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obra.id,
      capitulo_id: capituloIdSeguro,
      texto: texto?.trim() || null,
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        obra_slug: obra.slug,
        autor: obra.autor,
        capitulo_id_original: capituloId || "",
        ...metadata,
      },
    });

    return !error;
  } catch {
    // O Diário é camada social. A leitura nunca deve travar se o log falhar.
    return false;
  }
}
