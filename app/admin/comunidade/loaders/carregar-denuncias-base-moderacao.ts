import { supabase } from "../../../../lib/supabase/client";
import {
  formatarMotivoDenunciaConteudo,
  normalizarTipoAlvo,
  type TipoAlvoDenuncia,
} from "../lib/admin-comunidade-report-label-utils";
import {
  normalizarStatus,
  type StatusDenuncia,
} from "../lib/admin-comunidade-status-utils";

export type DenunciaComunidade = {
  id: string;
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  alvoAutorId: string;
  denuncianteId: string;
  motivo: string;
  detalhe: string;
  status: StatusDenuncia;
  arquivada: boolean;
  observacaoAdmin: string;
  analisadoPor: string | null;
  analisadoEm: string | null;
  criadoEm: string;
};

export async function buscarDenunciasBaseModeracao() {
  const { data: denunciasResposta, error: denunciasErro } = await supabase
    .from("comunidade_denuncias")
    .select(
      "id, alvo_tipo, alvo_id, alvo_autor_id, denunciante_id, motivo, detalhe, status, arquivada, observacao_admin, analisado_por, analisado_em, criado_em"
    )
    .order("criado_em", { ascending: false })
    .limit(200);

  if (denunciasErro) {
    throw denunciasErro;
  }

  return (denunciasResposta || []).map((denuncia) => ({
    id: String(denuncia.id || ""),
    alvoTipo: normalizarTipoAlvo(denuncia.alvo_tipo),
    alvoId: String(denuncia.alvo_id || ""),
    alvoAutorId: String(denuncia.alvo_autor_id || ""),
    denuncianteId: String(denuncia.denunciante_id || ""),
    motivo: formatarMotivoDenunciaConteudo(
      String(denuncia.motivo || "Conteúdo inadequado")
    ),
    detalhe: String(denuncia.detalhe || ""),
    status: normalizarStatus(denuncia.status),
    arquivada: Boolean(denuncia.arquivada),
    observacaoAdmin: String(denuncia.observacao_admin || ""),
    analisadoPor: denuncia.analisado_por
      ? String(denuncia.analisado_por)
      : null,
    analisadoEm: denuncia.analisado_em
      ? String(denuncia.analisado_em)
      : null,
    criadoEm: String(denuncia.criado_em || ""),
  }));
}
