import { supabase } from "../../../../lib/supabase/client";
import { erroOpcionalIgnoravel } from "../lib/admin-comunidade-error-utils";
import { criarMapaNomesPerfisModeracao } from "../lib/admin-comunidade-profile-utils";
import { criarHrefPerfilDenunciado } from "../lib/admin-comunidade-route-utils";
import {
  normalizarStatusPerfil,
  type StatusDenunciaPerfil,
} from "../lib/admin-comunidade-status-utils";

export type DenunciaPerfil = {
  id: string;
  denuncianteId: string;
  denunciadoId: string;
  perfilNome: string;
  perfilUrl: string;
  motivo: string;
  descricao: string;
  status: StatusDenunciaPerfil;
  criadoEm: string;
  atualizadoEm: string;
};

export type DenunciaPerfilComContexto = DenunciaPerfil & {
  denuncianteNome: string;
  denunciadoNome: string;
  perfilHref: string;
};

export async function buscarDenunciasPerfisModeracao() {
  const { data: denunciasResposta, error: denunciasErro } = await supabase
    .from("denuncias_perfis")
    .select(
      "id, denunciante_id, denunciado_id, perfil_nome, perfil_url, motivo, descricao, status, criado_em, atualizado_em"
    )
    .order("criado_em", { ascending: false })
    .limit(200);

  if (denunciasErro) {
    if (erroOpcionalIgnoravel(denunciasErro)) {
      return [];
    }

    throw denunciasErro;
  }

  const denunciasMapeadas: DenunciaPerfil[] = (
    denunciasResposta || []
  ).map((denuncia) => ({
    id: String(denuncia.id || ""),
    denuncianteId: String(denuncia.denunciante_id || ""),
    denunciadoId: String(denuncia.denunciado_id || ""),
    perfilNome: String(denuncia.perfil_nome || ""),
    perfilUrl: String(denuncia.perfil_url || ""),
    motivo: String(denuncia.motivo || "outro"),
    descricao: String(denuncia.descricao || ""),
    status: normalizarStatusPerfil(denuncia.status),
    criadoEm: String(denuncia.criado_em || ""),
    atualizadoEm: String(denuncia.atualizado_em || denuncia.criado_em || ""),
  }));

  const perfilIds = Array.from(
    new Set(
      denunciasMapeadas
        .flatMap((denuncia) => [
          denuncia.denuncianteId,
          denuncia.denunciadoId,
        ])
        .filter(Boolean)
    )
  );

  const [perfisPorUserIdResposta, perfisPorIdResposta] = await Promise.all([
    perfilIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, user_id, nome")
          .in("user_id", perfilIds)
          .limit(1000)
      : Promise.resolve({ data: [], error: null }),
    perfilIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, user_id, nome")
          .in("id", perfilIds)
          .limit(1000)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const perfis = [
    ...(perfisPorUserIdResposta.error
      ? []
      : (perfisPorUserIdResposta.data || [])),
    ...(perfisPorIdResposta.error ? [] : (perfisPorIdResposta.data || [])),
  ];

  const nomesPorId = criarMapaNomesPerfisModeracao(perfis);

  return denunciasMapeadas.map((denuncia) => ({
    ...denuncia,
    denuncianteNome: nomesPorId.get(denuncia.denuncianteId) || "Usuário",
    denunciadoNome:
      denuncia.perfilNome ||
      nomesPorId.get(denuncia.denunciadoId) ||
      "Usuário denunciado",
    perfilHref: criarHrefPerfilDenunciado(denuncia),
  }));
}
