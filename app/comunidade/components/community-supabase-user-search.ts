import { supabase } from "../../../lib/supabase/client";
import { normalizarTexto } from "../../../lib/utils";
import type { PerfilComunidadeRow } from "./community-supabase-profile-row";
import type { UsuarioBuscaComunidade } from "./community-user";
import { normalizarUsuarioBuscaComunidade } from "./community-search-user-normalizer";

export async function buscarUsuariosComunidadeSupabase(termo: string) {
  const termoLimpo = termo.trim().replace(/^@+/, "").slice(0, 80);

  if (termoLimpo.length < 2) {
    return [] as UsuarioBuscaComunidade[];
  }

  const padrao = `%${termoLimpo.replace(/[%_]/g, "")}%`;
  const consultas = [
    {
      coluna: "nome",
      select: "id,user_id,nome,avatar_url",
    },
    {
      coluna: "username",
      select: "id,user_id,nome,avatar_url,username",
    },
  ] as const;

  const respostas = await Promise.all(
    consultas.map(async ({ coluna, select }) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(select)
          .ilike(coluna, padrao)
          .limit(20);

        if (error || !Array.isArray(data)) {
          return [] as PerfilComunidadeRow[];
        }

        return data as unknown as PerfilComunidadeRow[];
      } catch {
        return [] as PerfilComunidadeRow[];
      }
    })
  );

  const usuariosPorId = new Map<string, UsuarioBuscaComunidade>();

  respostas.flat().forEach((profile) => {
    const usuarioBusca = normalizarUsuarioBuscaComunidade(profile);

    if (usuarioBusca) {
      usuariosPorId.set(usuarioBusca.id, usuarioBusca);
    }
  });

  const termoNormalizado = normalizarTexto(termoLimpo);

  return Array.from(usuariosPorId.values())
    .filter((usuarioBusca) => {
      const textoBusca = normalizarTexto(
        [usuarioBusca.nome, usuarioBusca.username].filter(Boolean).join(" ")
      );

      return textoBusca.includes(termoNormalizado);
    })
    .sort((usuarioA, usuarioB) => {
      const nomeA = normalizarTexto(usuarioA.nome);
      const nomeB = normalizarTexto(usuarioB.nome);
      const usernameA = normalizarTexto(usuarioA.username);
      const usernameB = normalizarTexto(usuarioB.username);
      const prefixoA =
        nomeA.startsWith(termoNormalizado) ||
        usernameA.startsWith(termoNormalizado);
      const prefixoB =
        nomeB.startsWith(termoNormalizado) ||
        usernameB.startsWith(termoNormalizado);

      if (prefixoA !== prefixoB) {
        return prefixoA ? -1 : 1;
      }

      return usuarioA.nome.localeCompare(usuarioB.nome, "pt-BR");
    })
    .slice(0, 12);
}
