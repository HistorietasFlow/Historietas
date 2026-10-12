import { SOBRE_BIO_MAX_LENGTH } from "../constants";
import type {
  AlvoDenunciaConteudoPerfil,
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


export function obterDadosDenunciaConteudoPerfilAutor(
  alvo: AlvoDenunciaConteudoPerfil,
) {
  return {
    alvoTipo: alvo?.alvoTipo || "post",
    alvoId: alvo?.alvoId || "",
    alvoTitulo: alvo?.alvoTitulo || "Conteúdo",
  };
}


export function obterDadosDenunciaPerfilAutor(
  perfilParaMostrar: Pick<AutorPerfil, "autorId" | "nome"> | null,
) {
  const alvoId = perfilParaMostrar?.autorId || "";

  return {
    alvoId,
    alvoTitulo: perfilParaMostrar?.nome || "Perfil",
    alvoUrl: alvoId
      ? `/perfil-autor?userId=${encodeURIComponent(alvoId)}`
      : "",
  };
}


export function obterAriaLabelCopiarUsernamePerfilAutor(
  autorHandlePerfil: string,
) {
  return `Copiar ${autorHandlePerfil}`;
}


export function obterAriaLabelBadgeNotificacoesPerfilAutor(
  notificacoesNaoLidas: number,
) {
  return `${formatarContagemNotificacoesPerfilAutor(notificacoesNaoLidas)} notificações não lidas`;
}


export function obterAriaLabelNotificacoesPerfilAutor(
  notificacoesNaoLidas: number,
) {
  return notificacoesNaoLidas > 0
    ? `Notificações: ${notificacoesNaoLidas} não lidas`
    : "Notificações";
}


export function formatarContagemNotificacoesPerfilAutor(
  notificacoesNaoLidas: number,
) {
  return notificacoesNaoLidas > 99 ? "99+" : String(notificacoesNaoLidas);
}


export function obterRotuloAcaoBloqueioPerfilAutor({
  bloqueadoPorMim,
  salvando,
}: {
  bloqueadoPorMim: boolean;
  salvando: boolean;
}) {
  if (salvando) {
    return bloqueadoPorMim ? "Desbloqueando..." : "Bloqueando...";
  }

  return bloqueadoPorMim ? "Desbloquear usuário" : "Bloquear usuário";
}


export function obterRotuloVisibilidadeUsernamePerfilAutor(
  usernameVisivel: boolean,
) {
  return usernameVisivel ? "Esconder username" : "Mostrar username";
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
