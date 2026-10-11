import { SOBRE_BIO_MAX_LENGTH } from "../constants";
import type {
  AutorPerfil,
  PerfilAutorSalvo,
  PerfisAutoresSalvos,
  PerfilUsuarioRemoto,
} from "../types";
import {
  criarHandlePerfilAutor,
  formatarEntradaHistorietasPerfilAutor,
} from "./profile-formatters";
import { criarBioAutor } from "./work-normalizers";

const perfilAutorSalvoVazio: PerfilAutorSalvo = {
  avatar: "",
  avatarNome: "",
  bio: "",
  sobreBio: "",
  mostrarDestaques: false,
};

export function obterDadosExibicaoPerfilAutor({
  perfilParaMostrar,
  perfilUsuarioRemoto,
  perfisAutoresSalvos,
  autorChavePerfil,
  autorNormalizadoParaSeguir,
}: {
  perfilParaMostrar: AutorPerfil | null;
  perfilUsuarioRemoto: PerfilUsuarioRemoto | null;
  perfisAutoresSalvos: PerfisAutoresSalvos;
  autorChavePerfil: string;
  autorNormalizadoParaSeguir: string;
}) {
  const perfilSalvoAutor = autorChavePerfil
    ? perfisAutoresSalvos[autorChavePerfil] ||
      perfisAutoresSalvos[autorNormalizadoParaSeguir] ||
      perfilAutorSalvoVazio
    : perfilAutorSalvoVazio;

  const perfilUsuarioRemotoAtivo =
    perfilUsuarioRemoto &&
    perfilParaMostrar &&
    perfilUsuarioRemoto.userId.trim().toLowerCase() ===
      perfilParaMostrar.autorId.trim().toLowerCase()
      ? perfilUsuarioRemoto
      : null;

  const bioPadraoAutor = perfilParaMostrar
    ? criarBioAutor(perfilParaMostrar)
    : "";
  const bioAutorPersonalizada =
    perfilSalvoAutor.bio.trim() || perfilUsuarioRemotoAtivo?.bio.trim() || "";
  const bioAutor = bioAutorPersonalizada || bioPadraoAutor;
  const bioSobrePersonalizada =
    perfilSalvoAutor.sobreBio.trim() ||
    perfilUsuarioRemotoAtivo?.sobreBio.trim() ||
    "";
  const bioSobreAutor = bioSobrePersonalizada || bioAutor;

  return {
    perfilSalvoAutor,
    perfilUsuarioRemotoAtivo,
    bioPadraoAutor,
    bioAutorPersonalizada,
    bioAutor,
    bioSobrePersonalizada,
    bioSobreAutor,
    entradaHistorietasPerfil: formatarEntradaHistorietasPerfilAutor(
      perfilUsuarioRemotoAtivo?.criadoEm || "",
    ),
    caracteresRestantesBioSobre:
      SOBRE_BIO_MAX_LENGTH - bioSobrePersonalizada.length,
    bioSobreAutorEhPadrao:
      bioSobreAutor.trim() === "Perfil de leitor no Historietas.",
    autorHandlePerfil: perfilParaMostrar
      ? criarHandlePerfilAutor(
          perfilParaMostrar.nome,
          perfilParaMostrar.autorId,
          perfilUsuarioRemotoAtivo?.username || "",
        )
      : "@autor.historietas",
    avatarAutor:
      perfilSalvoAutor.avatar || perfilUsuarioRemotoAtivo?.avatar || "",
  };
}


export function obterRotulosAcoesEditorPerfilAutor({
  temAvatar,
  salvando,
}: {
  temAvatar: boolean;
  salvando: boolean;
}) {
  return {
    rotuloAcaoAvatar: temAvatar ? "Trocar imagem" : "Colocar imagem",
    rotuloSalvarEditor: salvando ? "Salvando..." : "Salvar",
  };
}


export function obterBioSobreExibicaoPerfilAutor({
  bioSobreAutor,
  bioSobreAutorEhPadrao,
  traduzirTexto,
}: {
  bioSobreAutor: string;
  bioSobreAutorEhPadrao: boolean;
  traduzirTexto: (texto: string) => string;
}) {
  return {
    bioSobreAutorExibido: bioSobreAutorEhPadrao
      ? traduzirTexto(bioSobreAutor)
      : bioSobreAutor,
    bioSobreAutorUserContent: bioSobreAutorEhPadrao
      ? undefined
      : ("true" as const),
  };
}
