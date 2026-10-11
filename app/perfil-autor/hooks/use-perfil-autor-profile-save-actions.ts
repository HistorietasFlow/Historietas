import type { Dispatch, SetStateAction } from "react";
import {
  AUTHOR_PROFILE_STORAGE_KEY,
  BIO_MAX_LENGTH,
  SOBRE_BIO_MAX_LENGTH,
} from "../constants";
import type {
  AutorPerfil,
  PerfilAutorSalvo,
  PerfilUsuarioRemoto,
  PerfisAutoresSalvos,
} from "../types";
import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";
import { salvarPerfilUsuarioSupabase } from "../lib/profile-profile-persistence";

export function usePerfilAutorProfileSaveActions({
  autorChavePerfil,
  perfisAutoresSalvos,
  usuarioIdLogado,
  perfilParaMostrar,
  podeEditarPerfil,
  perfilUsuarioRemotoAtivo,
  setPerfisAutoresSalvos,
  setPerfilUsuarioRemoto,
  setMensagemAcao,
}: {
  autorChavePerfil: string;
  perfisAutoresSalvos: PerfisAutoresSalvos;
  usuarioIdLogado: string;
  perfilParaMostrar: AutorPerfil | null;
  podeEditarPerfil: boolean;
  perfilUsuarioRemotoAtivo: PerfilUsuarioRemoto | null;
  setPerfisAutoresSalvos: Dispatch<SetStateAction<PerfisAutoresSalvos>>;
  setPerfilUsuarioRemoto: Dispatch<
    SetStateAction<PerfilUsuarioRemoto | null>
  >;
  setMensagemAcao: (mensagem: string) => void;
}) {
  function salvarPerfilAutor(novoPerfil: PerfilAutorSalvo) {
    if (!autorChavePerfil) {
      return;
    }

    const perfilNormalizado = {
      avatar: novoPerfil.avatar,
      avatarNome: novoPerfil.avatarNome,
      bio: novoPerfil.bio.slice(0, BIO_MAX_LENGTH),
      sobreBio: novoPerfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
      mostrarDestaques: novoPerfil.mostrarDestaques === true,
    };

    const novosPerfis = {
      ...perfisAutoresSalvos,
      [autorChavePerfil]: perfilNormalizado,
    };

    if (usuarioIdLogado.trim()) {
      salvarJsonUsuarioPerfilAutor(
        AUTHOR_PROFILE_STORAGE_KEY,
        usuarioIdLogado,
        novosPerfis,
      );
    }

    setPerfisAutoresSalvos(novosPerfis);

    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";

    if (
      podeEditarPerfil &&
      perfilUserId &&
      usuarioIdLogado &&
      perfilUserId.toLowerCase() === usuarioIdLogado.trim().toLowerCase()
    ) {
      const nomePerfil =
        perfilParaMostrar?.nome ||
        perfilUsuarioRemotoAtivo?.nome ||
        "Usuário";
      const avatarRemoto =
        perfilNormalizado.avatar.startsWith("data:") ||
        perfilNormalizado.avatar.startsWith("blob:")
          ? perfilUsuarioRemotoAtivo?.avatar || ""
          : perfilNormalizado.avatar;
      const perfilRemoto = {
        ...perfilNormalizado,
        avatar: avatarRemoto,
      };

      setPerfilUsuarioRemoto({
        userId: perfilUserId,
        nome: nomePerfil,
        username: perfilUsuarioRemotoAtivo?.username || "",
        avatar: avatarRemoto,
        bio: perfilNormalizado.bio,
        sobreBio: perfilNormalizado.sobreBio,
        criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
      });

      void salvarPerfilUsuarioSupabase({
        userId: perfilUserId,
        nome: nomePerfil,
        perfil: perfilRemoto,
        username: perfilUsuarioRemotoAtivo?.username || undefined,
      }).then((resultado) => {
        if (!resultado.ok && resultado.erro) {
          setMensagemAcao(
            `Perfil salvo neste aparelho. Supabase: ${resultado.erro}`,
          );
        }
      });
    }
  }

  return { salvarPerfilAutor };
}
