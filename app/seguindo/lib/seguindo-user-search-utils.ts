import { normalizarTexto } from "../../../lib/utils";
import { supabase } from "../../../lib/supabase/client";
import {
  criarHandleUsuarioSeguindo,
  obterAvatarProfileSeguindo,
  obterBioProfileSeguindo,
  obterNomeProfileSeguindo,
} from "./seguindo-profile-utils";
import {
  normalizarRegistrosSupabaseGenericos,
  obterTextoRegistro,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";
import { idUsuarioSupabaseValido } from "./seguindo-route-utils";

type UsuarioBuscaSeguindo = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

function normalizarUsuarioBuscaSeguindo(
  profile: RegistroSupabaseGenerico,
): UsuarioBuscaSeguindo | null {
  const id =
    obterTextoRegistro(profile, "user_id") ||
    obterTextoRegistro(profile, "id");
  const nome = obterNomeProfileSeguindo(profile);

  if (!idUsuarioSupabaseValido(id) || !nome) {
    return null;
  }

  const handleSalvo =
    obterTextoRegistro(profile, "username") ||
    obterTextoRegistro(profile, "nome_usuario") ||
    obterTextoRegistro(profile, "apelido");

  return {
    id,
    nome: nome.slice(0, 80),
    handle: criarHandleUsuarioSeguindo(nome, handleSalvo, id),
    bio: (
      obterBioProfileSeguindo(profile) ||
      "Perfil de leitor no Historietas."
    ).slice(0, 140),
    avatar: obterAvatarProfileSeguindo(profile),
    criadoEm: "",
  };
}

export async function buscarUsuariosParaSeguirSupabase(termo: string) {
  const termoLimpo = termo.trim().replace(/^@+/, "").slice(0, 80);

  if (termoLimpo.length < 2) {
    return [] as UsuarioBuscaSeguindo[];
  }

  const termoSeguro = termoLimpo.replace(/[%_]/g, "");
  const padraoBusca = `%${termoSeguro}%`;
  const consultas = [
    {
      coluna: "nome",
      campos: "id,user_id,nome,avatar_url",
    },
    {
      coluna: "username",
      campos: "id,user_id,nome,avatar_url,username",
    },
    {
      coluna: "nome_usuario",
      campos: "id,user_id,nome,avatar_url,nome_usuario",
    },
  ] as const;

  const resultados = await Promise.all(
    consultas.map(async ({ coluna, campos }) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .ilike(coluna, padraoBusca)
          .limit(20);

        if (error || !Array.isArray(data)) {
          return [] as RegistroSupabaseGenerico[];
        }

        return normalizarRegistrosSupabaseGenericos(data);
      } catch {
        return [] as RegistroSupabaseGenerico[];
      }
    }),
  );

  const usuariosPorId = new Map<string, UsuarioBuscaSeguindo>();

  resultados.flat().forEach((profile) => {
    const usuarioEncontrado = normalizarUsuarioBuscaSeguindo(profile);

    if (usuarioEncontrado) {
      usuariosPorId.set(usuarioEncontrado.id, usuarioEncontrado);
    }
  });

  const termoNormalizado = normalizarTexto(termoLimpo);

  return Array.from(usuariosPorId.values())
    .filter((usuarioEncontrado) => {
      const textoUsuario = normalizarTexto(
        [
          usuarioEncontrado.nome,
          usuarioEncontrado.handle,
          usuarioEncontrado.bio,
        ].join(" "),
      );

      return textoUsuario.includes(termoNormalizado);
    })
    .sort((usuarioA, usuarioB) => {
      const textoA = normalizarTexto(`${usuarioA.nome} ${usuarioA.handle}`);
      const textoB = normalizarTexto(`${usuarioB.nome} ${usuarioB.handle}`);
      const iniciaA = textoA.startsWith(termoNormalizado);
      const iniciaB = textoB.startsWith(termoNormalizado);

      if (iniciaA !== iniciaB) {
        return iniciaA ? -1 : 1;
      }

      return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
    })
    .slice(0, 12);
}
