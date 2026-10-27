import { supabase } from "../../../../lib/supabase/client";

type DenunciaParaContextoPerfil = {
  denuncianteId: string;
};

type RegistroComUsuarioParaContextoPerfil = {
  user_id: string;
};

type BuscarPerfisContextoModeracaoParams = {
  denunciasMapeadas: DenunciaParaContextoPerfil[];
  comentariosCapitulos: RegistroComUsuarioParaContextoPerfil[];
  comentariosObras: RegistroComUsuarioParaContextoPerfil[];
  comentariosDiario: RegistroComUsuarioParaContextoPerfil[];
  diarioAnotacoes: RegistroComUsuarioParaContextoPerfil[];
  capitulos: RegistroComUsuarioParaContextoPerfil[];
  obras: RegistroComUsuarioParaContextoPerfil[];
};

export async function buscarPerfisContextoModeracao({
  denunciasMapeadas,
  comentariosCapitulos,
  comentariosObras,
  comentariosDiario,
  diarioAnotacoes,
  capitulos,
  obras,
}: BuscarPerfisContextoModeracaoParams) {
  const perfilIds = Array.from(
    new Set(
      [
        ...denunciasMapeadas.map((denuncia) => denuncia.denuncianteId),
        ...comentariosCapitulos.map((comentario) => comentario.user_id),
        ...comentariosObras.map((comentario) => comentario.user_id),
        ...comentariosDiario.map((comentario) => comentario.user_id),
        ...diarioAnotacoes.map((anotacao) => anotacao.user_id),
        ...capitulos.map((capitulo) => capitulo.user_id),
        ...obras.map((obra) => obra.user_id),
      ].filter(Boolean)
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
    ...(perfisPorIdResposta.error
      ? []
      : (perfisPorIdResposta.data || [])),
  ];

  return perfis;
}
