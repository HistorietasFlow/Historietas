import type { Dispatch, RefObject, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { obterCaminhoObjetoStorage } from "../../../lib/storageUploads";
import {
  AUTHOR_PROFILE_STORAGE_KEY,
  AVATAR_STORAGE_BUCKET,
  BIO_MAX_LENGTH,
  STORAGE_KEY,
} from "../constants";
import type {
  AutorPerfil,
  ObraLocal,
  ObraSalva,
  PerfilAutorSalvo,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
} from "../types";
import {
  execucaoCarregamentoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "../lib/profile-auth-identity";
import { normalizarUsernamePerfilAutor } from "../lib/profile-formatters";
import {
  normalizarObra,
  obraPertenceAoUsuarioPerfilAutor,
} from "../lib/work-normalizers";
import {
  carregarJsonUsuarioPerfilAutor,
  salvarJsonUsuarioPerfilAutor,
} from "../lib/profile-local-storage-utils";
import { enviarAvatarPerfilUsuarioSupabase } from "../lib/profile-avatar-upload";
import { salvarPerfilUsuarioSupabase } from "../lib/profile-profile-persistence";
import { sincronizarNomeAutorObrasSupabase } from "../lib/profile-author-works-sync";

export function usePerfilAutorProfileEditorSaveActions({
  identidadeAutenticadaPerfilRef,
  perfilParaMostrar,
  usuarioIdLogado,
  podeEditarPerfil,
  nomePerfilEditor,
  usernamePerfilEditor,
  perfilUsuarioRemotoAtivo,
  avatarPerfilEditor,
  avatarArquivoPerfilEditor,
  avatarNomePerfilEditor,
  bioPerfilEditor,
  bioSobrePersonalizada,
  perfilSalvoAutor,
  perfisAutoresSalvos,
  autorChavePerfil,
  avatarInputRef,
  setMensagemAcao,
  setSalvandoEditorPerfil,
  setPerfisAutoresSalvos,
  setPerfilUsuarioRemoto,
  setObras,
  setAvatarPerfilEditor,
  setAvatarArquivoPerfilEditor,
  setEditorPerfilAberto,
}: {
  identidadeAutenticadaPerfilRef: {
    current: IdentidadeAutenticadaPerfilAutor;
  };
  perfilParaMostrar: AutorPerfil | null;
  usuarioIdLogado: string;
  podeEditarPerfil: boolean;
  nomePerfilEditor: string;
  usernamePerfilEditor: string;
  perfilUsuarioRemotoAtivo: PerfilUsuarioRemoto | null;
  avatarPerfilEditor: string;
  avatarArquivoPerfilEditor: File | null;
  avatarNomePerfilEditor: string;
  bioPerfilEditor: string;
  bioSobrePersonalizada: string;
  perfilSalvoAutor: PerfilAutorSalvo;
  perfisAutoresSalvos: PerfisAutoresSalvos;
  autorChavePerfil: string;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  setMensagemAcao: (mensagem: string) => void;
  setSalvandoEditorPerfil: Dispatch<SetStateAction<boolean>>;
  setPerfisAutoresSalvos: Dispatch<SetStateAction<PerfisAutoresSalvos>>;
  setPerfilUsuarioRemoto: Dispatch<
    SetStateAction<PerfilUsuarioRemoto | null>
  >;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setAvatarPerfilEditor: Dispatch<SetStateAction<string>>;
  setAvatarArquivoPerfilEditor: Dispatch<SetStateAction<File | null>>;
  setEditorPerfilAberto: Dispatch<SetStateAction<boolean>>;
}) {
  async function salvarEdicaoPerfilAutor() {
    const perfilUserId = perfilParaMostrar?.autorId.trim() || "";
    const usuarioIdAtual = usuarioIdLogado.trim();
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;
    const usuarioIdEsperado = identidadeEsperada.usuarioId.trim();

    function salvamentoEditorPerfilAindaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    if (!salvamentoEditorPerfilAindaAtual()) {
      return;
    }

    if (
      !podeEditarPerfil ||
      !perfilParaMostrar ||
      !perfilUserId ||
      !usuarioIdAtual ||
      !usuarioIdEsperado ||
      usuarioIdEsperado.toLowerCase() !== usuarioIdAtual.toLowerCase() ||
      perfilUserId.toLowerCase() !== usuarioIdEsperado.toLowerCase() ||
      perfilUserId.toLowerCase() !== usuarioIdAtual.toLowerCase()
    ) {
      setMensagemAcao("Não foi possível confirmar este perfil para edição.");
      return;
    }

    const nomeFinal = nomePerfilEditor
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
    const usernameDigitado = usernamePerfilEditor.trim();
    const usernameFinal = usernameDigitado
      ? normalizarUsernamePerfilAutor(usernameDigitado)
      : "";

    if (nomeFinal.length < 3) {
      setMensagemAcao("O nome do perfil precisa ter pelo menos 3 caracteres.");
      return;
    }

    if (usernameDigitado && usernameFinal.length < 3) {
      setMensagemAcao("O @username precisa ter pelo menos 3 caracteres.");
      return;
    }

    setSalvandoEditorPerfil(true);
    setMensagemAcao("Salvando perfil...");

    const avatarRemotoAnteriorBruto =
      perfilUsuarioRemotoAtivo?.avatar.trim() || "";
    const avatarRemotoAnterior =
      avatarRemotoAnteriorBruto.startsWith("data:") ||
      avatarRemotoAnteriorBruto.startsWith("blob:")
        ? ""
        : avatarRemotoAnteriorBruto;
    const caminhoAvatarAnterior = obterCaminhoObjetoStorage(
      "avatars",
      avatarRemotoAnterior,
    );
    let avatarFinal = avatarPerfilEditor;
    let avatarRemotoFinal =
      avatarFinal.startsWith("data:") || avatarFinal.startsWith("blob:")
        ? avatarRemotoAnterior
        : avatarFinal;
    let caminhoAvatarNovo = "";
    let avisoAvatar = "";

    if (avatarArquivoPerfilEditor) {
      const resultadoUpload = await enviarAvatarPerfilUsuarioSupabase({
        userId: perfilUserId,
        arquivo: avatarArquivoPerfilEditor,
      });

      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      if (resultadoUpload.ok && resultadoUpload.url) {
        avatarFinal = resultadoUpload.url;
        avatarRemotoFinal = resultadoUpload.url;
        caminhoAvatarNovo = resultadoUpload.caminho;
      } else {
        avisoAvatar =
          ` A imagem ficou salva neste aparelho, mas não foi enviada ao Storage: ${resultadoUpload.erro}`;
      }
    } else if (!avatarFinal.trim()) {
      avatarRemotoFinal = "";
    }

    const perfilFinal: PerfilAutorSalvo = {
      avatar: avatarFinal,
      avatarNome: avatarFinal ? avatarNomePerfilEditor : "",
      bio: bioPerfilEditor.slice(0, BIO_MAX_LENGTH),
      sobreBio: bioSobrePersonalizada,
      mostrarDestaques: perfilSalvoAutor.mostrarDestaques,
    };

    if (!salvamentoEditorPerfilAindaAtual()) {
      return;
    }

    const resultadoPerfil = await salvarPerfilUsuarioSupabase({
      userId: perfilUserId,
      nome: nomeFinal,
      perfil: {
        ...perfilFinal,
        avatar: avatarRemotoFinal,
      },
      username: usernameFinal || null,
    });

    if (!salvamentoEditorPerfilAindaAtual()) {
      return;
    }

    if (!resultadoPerfil.ok) {
      const erroPerfil = resultadoPerfil.erro.toLowerCase();

      if (
        erroPerfil.includes("profiles_username_unique") ||
        erroPerfil.includes("duplicate key") ||
        erroPerfil.includes("unique")
      ) {
        setMensagemAcao("Esse @username já está em uso.");
        setSalvandoEditorPerfil(false);
        return;
      }
    }

    let avisoMetadadosAuth = "";

    if (resultadoPerfil.ok) {
      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      const { error: erroMetadadosAuth } = await supabase.auth.updateUser({
        data: {
          nome: nomeFinal,
          username: usernameFinal || null,
          avatar_url: avatarRemotoFinal || null,
          avatar: avatarRemotoFinal || null,
        },
      });

      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      if (erroMetadadosAuth) {
        avisoMetadadosAuth =
          " Não consegui sincronizar os metadados da autenticação agora.";
        console.warn(
          "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
          erroMetadadosAuth.message,
        );
      }
    }

    const deveRemoverAvatarAnterior =
      resultadoPerfil.ok &&
      Boolean(caminhoAvatarAnterior) &&
      (
        !avatarRemotoFinal ||
        (Boolean(caminhoAvatarNovo) &&
          caminhoAvatarNovo !== caminhoAvatarAnterior)
      );

    if (deveRemoverAvatarAnterior) {
      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      const { error: erroRemoverAvatarAnterior } = await supabase.storage
        .from(AVATAR_STORAGE_BUCKET)
        .remove([caminhoAvatarAnterior]);

      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      if (erroRemoverAvatarAnterior) {
        avisoAvatar +=
          " Não consegui remover o avatar anterior do Storage agora.";
        console.warn(
          "O perfil foi salvo, mas o avatar anterior não foi removido:",
          erroRemoverAvatarAnterior.message,
        );
      }
    }

    let resultadoObras = { ok: false, erro: "" };

    if (resultadoPerfil.ok) {
      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }

      resultadoObras = await sincronizarNomeAutorObrasSupabase(
        perfilUserId,
        nomeFinal,
      );

      if (!salvamentoEditorPerfilAindaAtual()) {
        return;
      }
    }

    if (!salvamentoEditorPerfilAindaAtual()) {
      return;
    }

    const novosPerfis = {
      ...perfisAutoresSalvos,
      [autorChavePerfil]: perfilFinal,
    };

    salvarJsonUsuarioPerfilAutor(
      AUTHOR_PROFILE_STORAGE_KEY,
      usuarioIdAtual,
      novosPerfis,
    );
    setPerfisAutoresSalvos(novosPerfis);

    setPerfilUsuarioRemoto({
      userId: perfilUserId,
      nome: nomeFinal,
      username: usernameFinal,
      avatar: avatarRemotoFinal,
      bio: perfilFinal.bio,
      sobreBio: perfilFinal.sobreBio,
      criadoEm: perfilUsuarioRemotoAtivo?.criadoEm || "",
    });

    setObras((obrasAtuais) =>
      obrasAtuais.map((obra) =>
        obraPertenceAoUsuarioPerfilAutor(obra, perfilUserId)
          ? { ...obra, autor: nomeFinal }
          : obra,
      ),
    );

    try {
      const obrasSalvasJson = carregarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        perfilUserId,
      );
      const obrasSalvasNormalizadas = Array.isArray(obrasSalvasJson)
        ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
            normalizarObra(obra, index),
          )
        : [];
      const obrasLocaisAtualizadas = obrasSalvasNormalizadas.map((obra) =>
        obraPertenceAoUsuarioPerfilAutor(obra, perfilUserId)
          ? { ...obra, autor: nomeFinal }
          : obra,
      );

      salvarJsonUsuarioPerfilAutor(
        STORAGE_KEY,
        perfilUserId,
        obrasLocaisAtualizadas,
      );
    } catch {
      // O perfil continua atualizado em memória se o armazenamento local falhar.
    }

    setAvatarPerfilEditor(avatarFinal);
    setAvatarArquivoPerfilEditor(null);
    setEditorPerfilAberto(false);
    setSalvandoEditorPerfil(false);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }

    if (!resultadoPerfil.ok) {
      setMensagemAcao(
        `Perfil salvo neste aparelho. Supabase: ${resultadoPerfil.erro}${avisoAvatar}`,
      );
      return;
    }

    if (!resultadoObras.ok) {
      setMensagemAcao(
        `Perfil atualizado. Não consegui sincronizar o nome nas obras.${avisoAvatar}${avisoMetadadosAuth}`,
      );
      return;
    }

    setMensagemAcao(
      `Perfil atualizado.${avisoAvatar}${avisoMetadadosAuth}`,
    );
  }

  return { salvarEdicaoPerfilAutor };
}
