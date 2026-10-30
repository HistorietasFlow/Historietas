import type { TipoAlvoDenuncia } from "../../../components/DenunciaModal";
import { ProfileCommunityPostItem } from "../components/profile-community-post-item";
import { obterDadosPublicacaoRecenteComunidadePerfilAutor } from "../lib/profile-community-publication-utils";
import { dataDiarioPerfilFormatada } from "../lib/profile-diary-local-utils";
import type { PublicacaoComunidadePerfil } from "../types";

export function usePerfilAutorCommunityPostRenderer({
  paddingInferiorPublicacaoComunidade,
  perfilVisitante,
  abrirDenunciaConteudoPerfil,
}: {
  paddingInferiorPublicacaoComunidade: string;
  perfilVisitante: boolean;
  abrirDenunciaConteudoPerfil: (
    alvoTipo: Extract<TipoAlvoDenuncia, "post" | "obra">,
    alvoId: string,
    alvoTitulo: string,
  ) => void;
}) {
  const renderizarPublicacaoRecenteComunidade = (
    publicacao: PublicacaoComunidadePerfil,
  ) => {
    const dadosPublicacao =
      obterDadosPublicacaoRecenteComunidadePerfilAutor(
        publicacao,
      );

    return (
      <ProfileCommunityPostItem
        key={publicacao.id}
        publicacao={publicacao}
        href={dadosPublicacao.href}
        ariaLabel={dadosPublicacao.ariaLabel}
        resumo={dadosPublicacao.resumo}
        totalOpcoesEnquete={
          dadosPublicacao.totalOpcoesEnquete
        }
        exibirInfoEnquete={
          dadosPublicacao.exibirInfoEnquete
        }
        exibirObraRelacionada={
          dadosPublicacao.exibirObraRelacionada
        }
        paddingBottom={
          paddingInferiorPublicacaoComunidade
        }
        dateLabel={dataDiarioPerfilFormatada(
          publicacao.criadoEm,
        )}
        showReportButton={perfilVisitante}
        onReport={() =>
          abrirDenunciaConteudoPerfil(
            "post",
            publicacao.id,
            dadosPublicacao.resumo,
          )
        }
      />
    );
  };

  return { renderizarPublicacaoRecenteComunidade };
}
