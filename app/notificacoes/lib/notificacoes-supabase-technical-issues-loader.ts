import { supabase } from "../../../lib/supabase/client";
import { dataNotificacao } from "./notificacoes-filter-utils";
import { pegarTexto } from "./notificacoes-data-normalizers";
import type { NotificacaoLocal } from "./notificacoes-models";
import { obterStatusProblemaTecnicoNotificacao } from "./notificacoes-status-text-utils";

export async function carregarNotificacoesProblemasTecnicosSupabase(
  userId: string,
  notificacoesLidasIds: string[]
): Promise<NotificacaoLocal[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc(
      "listar_meus_problemas_tecnicos",
      {
        p_limite: 80,
      }
    );

    if (error || !Array.isArray(data)) {
      return [];
    }

    const idsLidos = new Set(notificacoesLidasIds);
    const notificacoesCriadas: NotificacaoLocal[] = [];

    data.forEach((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const problemaId =
        pegarTexto(registro.problema_id) || pegarTexto(registro.id);
      const status = pegarTexto(
        registro.status ?? registro.problema_status
      );
      const statusNotificacao =
        obterStatusProblemaTecnicoNotificacao(status);

      if (!problemaId || !statusNotificacao) {
        return;
      }

      const tituloChamado = pegarTexto(
        registro.titulo,
        "Problema técnico"
      ).slice(0, 120);
      const id = `problema-tecnico-${problemaId}-${status}`;

      notificacoesCriadas.push({
        id,
        obraId: "",
        capituloId: "",
        link: "/ajuda#problema-tecnico",
        titulo: statusNotificacao.titulo,
        mensagem: `Seu chamado técnico "${tituloChamado}" foi atualizado para ${statusNotificacao.texto}.`,
        tipo: "problema-tecnico",
        lida: idsLidos.has(id),
        criadaEm: pegarTexto(
          registro.atualizado_em ??
            registro.analisado_em ??
            registro.criado_em,
          new Date().toISOString()
        ),
        autorId: "",
        autorNome: "Suporte técnico",
        autorAvatar: "",
      });
    });

    return notificacoesCriadas.sort(
      (a, b) => dataNotificacao(b) - dataNotificacao(a)
    );
  } catch {
    return [];
  }
}
