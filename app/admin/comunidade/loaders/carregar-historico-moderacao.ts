import { supabase } from "../../../../lib/supabase/client";
import {
  criarMapaNomesPerfisModeracao,
  type PerfilModeracao,
} from "../lib/admin-comunidade-profile-utils";
import {
  normalizarAcaoHistoricoModeracao,
  normalizarOrigemHistoricoModeracao,
  type AcaoHistoricoModeracao,
  type OrigemHistoricoModeracao,
} from "../lib/admin-comunidade-history-utils";

const LIMITE_PAGINA_HISTORICO = 30;

type HistoricoModeracaoRow = {
  id?: unknown;
  origem?: unknown;
  denuncia_id?: unknown;
  acao?: unknown;
  status_anterior?: unknown;
  status_novo?: unknown;
  observacao_admin?: unknown;
  moderador_id?: unknown;
  criado_em?: unknown;
};

export type EventoHistoricoModeracao = {
  id: string;
  origem: OrigemHistoricoModeracao;
  denunciaId: string;
  acao: AcaoHistoricoModeracao;
  statusAnterior: string | null;
  statusNovo: string | null;
  observacaoAdmin: string;
  moderadorId: string;
  moderadorNome: string;
  criadoEm: string;
};

export type PaginaHistoricoModeracao = {
  eventos: EventoHistoricoModeracao[];
  temMais: boolean;
};

function textoOpcional(valor: unknown) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

async function buscarNomesModeradores(moderadorIds: string[]) {
  if (moderadorIds.length === 0) {
    return new Map<string, string>();
  }

  const [porUserId, porId] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, user_id, nome")
      .in("user_id", moderadorIds)
      .limit(200),
    supabase
      .from("profiles")
      .select("id, user_id, nome")
      .in("id", moderadorIds)
      .limit(200),
  ]);

  const perfis: PerfilModeracao[] = [
    ...(porUserId.error ? [] : (porUserId.data || [])),
    ...(porId.error ? [] : (porId.data || [])),
  ];

  return criarMapaNomesPerfisModeracao(perfis);
}

export async function buscarPaginaHistoricoModeracao(
  pagina: number,
): Promise<PaginaHistoricoModeracao> {
  const paginaSegura = Number.isInteger(pagina) && pagina >= 0 ? pagina : 0;
  const inicio = paginaSegura * LIMITE_PAGINA_HISTORICO;
  const fim = inicio + LIMITE_PAGINA_HISTORICO;
  const { data, error } = await supabase
    .from("moderacao_historico")
    .select(
      "id, origem, denuncia_id, acao, status_anterior, status_novo, observacao_admin, moderador_id, criado_em",
    )
    .order("criado_em", { ascending: false })
    .order("id", { ascending: false })
    .range(inicio, fim);

  if (error) {
    throw error;
  }

  const registros = ((data || []) as HistoricoModeracaoRow[]).slice(
    0,
    LIMITE_PAGINA_HISTORICO,
  );
  const moderadorIds = Array.from(
    new Set(
      registros
        .map((registro) => textoOpcional(registro.moderador_id) || "")
        .filter(Boolean),
    ),
  );
  const nomesModeradores = await buscarNomesModeradores(moderadorIds);

  return {
    eventos: registros.map((registro) => {
      const moderadorId = textoOpcional(registro.moderador_id) || "";

      return {
        id: textoOpcional(registro.id) || "",
        origem: normalizarOrigemHistoricoModeracao(registro.origem),
        denunciaId: textoOpcional(registro.denuncia_id) || "",
        acao: normalizarAcaoHistoricoModeracao(registro.acao),
        statusAnterior: textoOpcional(registro.status_anterior),
        statusNovo: textoOpcional(registro.status_novo),
        observacaoAdmin: textoOpcional(registro.observacao_admin) || "",
        moderadorId,
        moderadorNome: nomesModeradores.get(moderadorId) || "",
        criadoEm: textoOpcional(registro.criado_em) || "",
      };
    }),
    temMais: (data || []).length > LIMITE_PAGINA_HISTORICO,
  };
}
