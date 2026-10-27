import { normalizarTexto } from "../../../../lib/utils";
import {
  formatarMotivoDenunciaPerfil,
} from "./admin-comunidade-report-label-utils";
import type {
  StatusDenuncia,
  StatusDenunciaPerfil,
} from "./admin-comunidade-status-utils";

export type StatusFiltroDenuncia =
  | StatusDenuncia
  | "todas"
  | "arquivadas";

type DenunciaModeracaoFiltravel = {
  arquivada: boolean;
  status: StatusDenuncia;
  motivo: string;
  detalhe: string;
  denuncianteNome: string;
  alvoTipo: string;
  alvoResumo: string;
  alvoAutor: string;
  alvoAutorId: string;
  alvoPostId: string;
  alvoCategoria?: string;
  alvoTipoPublicacao?: string;
  alvoTemSpoiler?: boolean;
  alvoObra?: string;
  alvoCapituloTitulo?: string;
  alvoCapituloId?: string;
  alvoObraId?: string;
  alvoObraSlug?: string;
  alvoPerfilUserId?: string;
  alvoAnotacaoId?: string;
};

type DenunciaPerfilFiltravel = {
  status: StatusDenunciaPerfil;
  motivo: string;
  descricao: string;
  denuncianteNome: string;
  denunciadoNome: string;
  denunciadoId: string;
  perfilUrl: string;
};

export function obterDenunciasAtivas<
  T extends { arquivada: boolean },
>(denuncias: readonly T[]) {
  return denuncias.filter((denuncia) => !denuncia.arquivada);
}

export function filtrarDenunciasModeracao<
  T extends DenunciaModeracaoFiltravel,
>(
  denuncias: readonly T[],
  statusFiltro: StatusFiltroDenuncia,
  busca: string,
) {
  const buscaNormalizada = normalizarTexto(busca);

  return denuncias.filter((denuncia) => {
    const arquivada = denuncia.arquivada;

    if (statusFiltro === "arquivadas") {
      if (!arquivada) {
        return false;
      }
    } else {
      if (arquivada) {
        return false;
      }

      const statusCombina =
        statusFiltro === "todas" || denuncia.status === statusFiltro;

      if (!statusCombina) {
        return false;
      }
    }

    if (!buscaNormalizada) {
      return true;
    }

    const conteudoBusca = normalizarTexto(
      [
        denuncia.motivo,
        denuncia.detalhe,
        denuncia.status,
        denuncia.denuncianteNome,
        denuncia.alvoTipo,
        denuncia.alvoResumo,
        denuncia.alvoAutor,
        denuncia.alvoAutorId,
        denuncia.alvoPostId,
        denuncia.alvoCategoria || "",
        denuncia.alvoTipoPublicacao || "",
        denuncia.alvoTemSpoiler ? "spoiler contem spoiler" : "",
        denuncia.alvoObra || "",
        denuncia.alvoCapituloTitulo || "",
        denuncia.alvoCapituloId || "",
        denuncia.alvoObraId || "",
        denuncia.alvoObraSlug || "",
        denuncia.alvoPerfilUserId || "",
        denuncia.alvoAnotacaoId || "",
        arquivada ? "arquivada ocultada painel" : "",
      ].join(" ")
    );

    return conteudoBusca.includes(buscaNormalizada);
  });
}

export function filtrarDenunciasPerfisModeracao<
  T extends DenunciaPerfilFiltravel,
>(
  denunciasPerfis: readonly T[],
  statusFiltro: StatusFiltroDenuncia,
  busca: string,
) {
  const buscaNormalizada = normalizarTexto(busca);
  const statusPerfilCorrespondente: StatusDenunciaPerfil | null =
    statusFiltro === "pendente"
      ? "pendente"
      : statusFiltro === "em_analise"
        ? "analisada"
        : statusFiltro === "resolvida"
          ? "resolvida"
          : statusFiltro === "rejeitada"
            ? "ignorada"
            : null;

  if (statusFiltro === "arquivadas") {
    return [];
  }

  return denunciasPerfis.filter((denuncia) => {
    if (
      statusPerfilCorrespondente &&
      denuncia.status !== statusPerfilCorrespondente
    ) {
      return false;
    }

    if (!buscaNormalizada) {
      return true;
    }

    const conteudoBusca = normalizarTexto(
      [
        "perfil usuario denuncia",
        denuncia.motivo,
        formatarMotivoDenunciaPerfil(denuncia.motivo),
        denuncia.descricao,
        denuncia.status,
        denuncia.denuncianteNome,
        denuncia.denunciadoNome,
        denuncia.denunciadoId,
        denuncia.perfilUrl,
      ].join(" ")
    );

    return conteudoBusca.includes(buscaNormalizada);
  });
}
