import { supabase } from "../../../lib/supabase/client";
import {
  normalizarRegistrosSupabaseGenericos,
  obterTextoRegistro,
} from "./seguindo-record-utils";
import type { RegistroSupabaseGenerico } from "./seguindo-record-utils";
import {
  criarHandleUsuarioSeguindo,
  obterAvatarProfileSeguindo,
  obterBioProfileSeguindo,
  obterNomeProfileSeguindo,
} from "./seguindo-profile-utils";
import { idUsuarioSupabaseValido } from "./seguindo-route-utils";

export async function carregarIdsSolicitacoesEnviadasSupabase(userId: string) {
  const userIdLimpo = userId.trim();

  if (!idUsuarioSupabaseValido(userIdLimpo)) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from("solicitacoes_seguidores")
      .select("destinatario_id")
      .eq("solicitante_id", userIdLimpo)
      .limit(240);

    if (error || !Array.isArray(data)) {
      return [] as string[];
    }

    return Array.from(
      new Set(
        normalizarRegistrosSupabaseGenericos(data)
          .map((registro) => obterTextoRegistro(registro, "destinatario_id"))
          .filter((destinatarioId) => idUsuarioSupabaseValido(destinatarioId)),
      ),
    );
  } catch {
    return [] as string[];
  }
}

type UsuarioSocialSeguindo = {
  id: string;
  nome: string;
  handle: string;
  bio: string;
  avatar: string;
  criadoEm: string;
};

export async function carregarUsuariosSeguidosSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSocialSeguindo[];
  }

  try {
    const { data: seguindoData, error: seguindoError } = await supabase
      .from("seguindo_usuarios")
      .select("seguido_id, criado_em")
      .eq("seguidor_id", userId)
      .order("criado_em", { ascending: false })
      .limit(120);

    if (seguindoError || !Array.isArray(seguindoData)) {
      return [] as UsuarioSocialSeguindo[];
    }

    const registrosSeguindo = normalizarRegistrosSupabaseGenericos(seguindoData);
    const usuariosIds = Array.from(
      new Set(
        registrosSeguindo
          .map((registro) => obterTextoRegistro(registro, "seguido_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId),
      ),
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSocialSeguindo[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,user_id,nome,avatar_url")
        .in("user_id", usuariosIds)
        .limit(120);

      if (Array.isArray(profilesData)) {
        normalizarRegistrosSupabaseGenericos(profilesData).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId),
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select("id,user_id,nome,avatar_url")
          .in("id", usuariosSemProfile)
          .limit(120);

        if (Array.isArray(profilesDataPorId)) {
          normalizarRegistrosSupabaseGenericos(profilesDataPorId).forEach(
            (profile) => {
              const profileUserId =
                obterTextoRegistro(profile, "user_id") ||
                obterTextoRegistro(profile, "id");

              if (profileUserId) {
                profilesPorUsuario.set(profileUserId, profile);
              }
            },
          );
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguindo
      .map((registro) => {
        const seguidoId = obterTextoRegistro(registro, "seguido_id");

        if (!idUsuarioSupabaseValido(seguidoId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidoId);
        const nome = obterNomeProfileSeguindo(profile) || "Usuário";
        const handleSalvo =
          obterTextoRegistro(profile || {}, "username") ||
          obterTextoRegistro(profile || {}, "nome_usuario") ||
          obterTextoRegistro(profile || {}, "apelido");
        const handle = criarHandleUsuarioSeguindo(
          nome,
          handleSalvo,
          seguidoId,
        );
        const bio =
          obterBioProfileSeguindo(profile) ||
          "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidoId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSocialSeguindo;
      })
      .filter(
        (usuario): usuario is UsuarioSocialSeguindo => Boolean(usuario),
      );
  } catch (error) {
    console.warn("Não consegui carregar usuários seguidos:", error);
    return [] as UsuarioSocialSeguindo[];
  }
}

export async function carregarUsuariosSeguidoresSupabase(userId: string) {
  if (!userId) {
    return [] as UsuarioSocialSeguindo[];
  }

  try {
    const { data: seguidoresData, error: seguidoresError } = await supabase
      .from("seguindo_usuarios")
      .select("seguidor_id, criado_em")
      .eq("seguido_id", userId)
      .order("criado_em", { ascending: false })
      .limit(120);

    if (seguidoresError || !Array.isArray(seguidoresData)) {
      return [] as UsuarioSocialSeguindo[];
    }

    const registrosSeguidores =
      normalizarRegistrosSupabaseGenericos(seguidoresData);
    const usuariosIds = Array.from(
      new Set(
        registrosSeguidores
          .map((registro) => obterTextoRegistro(registro, "seguidor_id"))
          .filter((id) => idUsuarioSupabaseValido(id) && id !== userId),
      ),
    );

    if (usuariosIds.length === 0) {
      return [] as UsuarioSocialSeguindo[];
    }

    const profilesPorUsuario = new Map<string, RegistroSupabaseGenerico>();

    try {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,user_id,nome,avatar_url")
        .in("user_id", usuariosIds)
        .limit(120);

      if (Array.isArray(profilesData)) {
        normalizarRegistrosSupabaseGenericos(profilesData).forEach((profile) => {
          const profileUserId = obterTextoRegistro(profile, "user_id");

          if (profileUserId) {
            profilesPorUsuario.set(profileUserId, profile);
          }
        });
      }
    } catch {
      // Algumas bases antigas usam id no lugar de user_id. O fallback vem abaixo.
    }

    const usuariosSemProfile = usuariosIds.filter(
      (usuarioId) => !profilesPorUsuario.has(usuarioId),
    );

    if (usuariosSemProfile.length > 0) {
      try {
        const { data: profilesDataPorId } = await supabase
          .from("profiles")
          .select("id,user_id,nome,avatar_url")
          .in("id", usuariosSemProfile)
          .limit(120);

        if (Array.isArray(profilesDataPorId)) {
          normalizarRegistrosSupabaseGenericos(profilesDataPorId).forEach(
            (profile) => {
              const profileUserId =
                obterTextoRegistro(profile, "user_id") ||
                obterTextoRegistro(profile, "id");

              if (profileUserId) {
                profilesPorUsuario.set(profileUserId, profile);
              }
            },
          );
        }
      } catch {
        // Profiles é complementar; a página segue com nome padrão se falhar.
      }
    }

    return registrosSeguidores
      .map((registro) => {
        const seguidorId = obterTextoRegistro(registro, "seguidor_id");

        if (!idUsuarioSupabaseValido(seguidorId)) {
          return null;
        }

        const profile = profilesPorUsuario.get(seguidorId);
        const nome = obterNomeProfileSeguindo(profile) || "Usuário";
        const handleSalvo =
          obterTextoRegistro(profile || {}, "username") ||
          obterTextoRegistro(profile || {}, "nome_usuario") ||
          obterTextoRegistro(profile || {}, "apelido");
        const handle = criarHandleUsuarioSeguindo(
          nome,
          handleSalvo,
          seguidorId,
        );
        const bio =
          obterBioProfileSeguindo(profile) ||
          "Perfil de leitor no Historietas.";
        const avatar = obterAvatarProfileSeguindo(profile);

        return {
          id: seguidorId,
          nome: nome.slice(0, 80),
          handle,
          bio: bio.slice(0, 140),
          avatar,
          criadoEm: obterTextoRegistro(registro, "criado_em"),
        } satisfies UsuarioSocialSeguindo;
      })
      .filter(
        (usuario): usuario is UsuarioSocialSeguindo => Boolean(usuario),
      );
  } catch (error) {
    console.warn("Não consegui carregar seguidores:", error);
    return [] as UsuarioSocialSeguindo[];
  }
}
