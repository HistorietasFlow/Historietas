import { supabase } from "../../../lib/supabase/client";
import {
  criarCaminhoAvatarStorage,
  mensagemAmigavelErroUploadStorage,
  obterCacheControlUploadStorage,
  obterTipoMimeUploadStorage,
  versionarUrlPublicaStorage,
} from "../../../lib/storageUploads";
import { AVATAR_STORAGE_BUCKET } from "../constants";
import { idAutorSupabaseValido } from "./profile-formatters";

export async function enviarAvatarPerfilUsuarioSupabase({
  userId,
  arquivo,
}: {
  userId: string;
  arquivo: File;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return {
      ok: false,
      url: "",
      caminho: "",
      erro: "ID de usuário inválido para enviar avatar.",
    };
  }

  try {
    const contentType = obterTipoMimeUploadStorage("avatars", arquivo);
    const caminho = criarCaminhoAvatarStorage(userIdLimpo, arquivo);

    if (!contentType || !caminho) {
      return {
        ok: false,
        url: "",
        caminho: "",
        erro: "Tipo de imagem não permitido para avatar.",
      };
    }

    const versaoUrl = Date.now();

    const { error } = await supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .upload(caminho, arquivo, {
        cacheControl: obterCacheControlUploadStorage("avatars"),
        contentType,
        upsert: true,
      });

    if (error) {
      return {
        ok: false,
        url: "",
        caminho: "",
        erro: mensagemAmigavelErroUploadStorage(error.message),
      };
    }

    const { data } = supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .getPublicUrl(caminho);

    const publicUrl = versionarUrlPublicaStorage(
      data.publicUrl || "",
      versaoUrl,
    );

    if (!publicUrl) {
      return {
        ok: false,
        url: "",
        caminho: "",
        erro: "Storage não retornou URL pública do avatar.",
      };
    }

    return { ok: true, url: publicUrl, caminho, erro: "" };
  } catch (error) {
    return {
      ok: false,
      url: "",
      caminho: "",
      erro: error instanceof Error ? error.message : "Erro inesperado ao enviar avatar.",
    };
  }
}
