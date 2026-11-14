import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";

type ObraParaDiarioEditarCapitulo = {
  id: string;
  titulo: string;
  slug: string;
  publicado: boolean;
};

export async function registrarDiarioEdicaoCapitulo({
  userId,
  obra,
  capituloId,
  tituloCapitulo,
  numeroCapitulo,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraParaDiarioEditarCapitulo;
  capituloId: string;
  tituloCapitulo: string;
  numeroCapitulo: number;
  atualizadoEm: string;
}) {
  const usuarioId = userId.trim();

  if (
    !usuarioId ||
    !idObraSupabaseValido(obra.id) ||
    !idObraSupabaseValido(capituloId)
  ) {
    return;
  }

  const hrefCapitulo = criarHrefLeituraCapitulo(
    obra,
    capituloId,
    numeroCapitulo
  );
  const visibilidade = obra.publicado ? "publico" : "privado";

  try {
    const payload = {
      user_id: usuarioId,
      tipo: "editou_capitulo",
      obra_id: obra.id,
      capitulo_id: capituloId,
      texto: "",
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        titulo_obra: obra.titulo,
        capitulo_titulo: tituloCapitulo,
        numero_capitulo: numeroCapitulo,
        href: hrefCapitulo,
      },
      criado_em: atualizadoEm,
      atualizado_em: atualizadoEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    // A compatibilidade sem metadata só é segura quando o servidor comprova
    // que a coluna foi rejeitada. Transporte incerto pode ocorrer após commit.
    if (error.code !== "42703" && error.code !== "PGRST204") throw error;

    const { error: erroFallback } = await supabase.from("diario_atividades").insert({
      user_id: usuarioId,
      tipo: "editou_capitulo",
      obra_id: obra.id,
      capitulo_id: capituloId,
      texto: "",
      visibilidade,
      criado_em: atualizadoEm,
    });
    if (erroFallback) throw erroFallback;
  } catch (error) {
    console.warn("Não consegui registrar a edição do capítulo no Diário:", error);
  }
}
