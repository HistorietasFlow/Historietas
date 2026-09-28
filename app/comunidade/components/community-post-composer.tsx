import type { FormEventHandler, RefObject } from "react";
import type { CategoriaComunidade } from "./community-category";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import type { SugestaoPublicacaoComunidade } from "./community-publication-suggestion";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import { CommunitySheetHandle } from "./community-sheet-handle";
import { CommunityPostComposerOverlay } from "./community-post-composer-overlay";
import { CommunityPostComposerBackdrop } from "./community-post-composer-backdrop";
import { CommunityPostComposerPanel } from "./community-post-composer-panel";
import { CommunityPostComposerHeader } from "./community-post-composer-header";
import { CommunityPostComposerForm } from "./community-post-composer-form";
import { CommunityPostComposerFields } from "./community-post-composer-fields";
import { CommunityPostComposerClassificationFields } from "./community-post-composer-classification-fields";
import { CommunityPostComposerRelatedFields } from "./community-post-composer-related-fields";
import { CommunityPostComposerPublicationField } from "./community-post-composer-publication-field";
import { CommunityPostComposerErrorMessage } from "./community-post-composer-error-message";
import { CommunityPostComposerActions } from "./community-post-composer-actions";

type ClassificacaoCommunityPostComposer = {
  categoriaPost: CategoriaComunidade;
  tipoPublicacaoPost: TipoPublicacaoComunidade;
  visibilidadePost: VisibilidadePostComunidade;
  onAlterarCategoria: (categoria: CategoriaComunidade) => void;
  onAlterarTipoPublicacao: (tipo: TipoPublicacaoComunidade) => void;
  onAlterarVisibilidade: (visibilidade: string) => void;
};

type CamposRelacionadosCommunityPostComposer = {
  obraRelacionadaBusca: string;
  capituloRelacionadoPost: string;
  sugestoesObrasAbertas: boolean;
  sugestoesObrasRelacionadasVisiveis: ObraRelacionadaSugestao[];
  obraRelacionadaRef: RefObject<HTMLInputElement | null>;
  onAlterarObraRelacionada: (valor: string) => void;
  onFocarObraRelacionada: () => void;
  onDesfocarObraRelacionada: () => void;
  onSelecionarObraRelacionada: (obra: ObraRelacionadaSugestao) => void;
  onAlterarCapituloRelacionado: (valor: string) => void;
};

type PublicacaoCommunityPostComposer = {
  textoPostRef: RefObject<HTMLTextAreaElement | null>;
  onPrepararEnquete: () => void;
  onAplicarSugestao: (sugestao: SugestaoPublicacaoComunidade) => void;
};

type CommunityPostComposerProps = {
  desktop: boolean;
  publicandoPost: boolean;
  erro: string;
  temSpoilerPost: boolean;
  classificacao: ClassificacaoCommunityPostComposer;
  camposRelacionados: CamposRelacionadosCommunityPostComposer;
  publicacao: PublicacaoCommunityPostComposer;
  onFechar: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onAlternarSpoiler: () => void;
};

export function CommunityPostComposer({
  desktop,
  publicandoPost,
  erro,
  temSpoilerPost,
  classificacao,
  camposRelacionados,
  publicacao,
  onFechar,
  onSubmit,
  onAlternarSpoiler,
}: CommunityPostComposerProps) {
  return (
    <CommunityPostComposerOverlay>
      <CommunityPostComposerBackdrop onClick={onFechar} />

      <CommunityPostComposerPanel desktop={desktop}>
        <CommunitySheetHandle />

        <CommunityPostComposerHeader>
          Nova publicação
        </CommunityPostComposerHeader>

        <CommunityPostComposerForm onSubmit={onSubmit}>
          <CommunityPostComposerFields desktop={desktop}>
            <CommunityPostComposerClassificationFields
              publicandoPost={publicandoPost}
              categoriaPost={classificacao.categoriaPost}
              tipoPublicacaoPost={classificacao.tipoPublicacaoPost}
              visibilidadePost={classificacao.visibilidadePost}
              onAlterarCategoria={classificacao.onAlterarCategoria}
              onAlterarTipoPublicacao={classificacao.onAlterarTipoPublicacao}
              onAlterarVisibilidade={classificacao.onAlterarVisibilidade}
            />

            <CommunityPostComposerRelatedFields
              publicandoPost={publicandoPost}
              obraRelacionadaBusca={camposRelacionados.obraRelacionadaBusca}
              capituloRelacionadoPost={
                camposRelacionados.capituloRelacionadoPost
              }
              sugestoesObrasAbertas={
                camposRelacionados.sugestoesObrasAbertas
              }
              sugestoesObrasRelacionadasVisiveis={
                camposRelacionados.sugestoesObrasRelacionadasVisiveis
              }
              obraRelacionadaRef={camposRelacionados.obraRelacionadaRef}
              onAlterarObraRelacionada={
                camposRelacionados.onAlterarObraRelacionada
              }
              onFocarObraRelacionada={
                camposRelacionados.onFocarObraRelacionada
              }
              onDesfocarObraRelacionada={
                camposRelacionados.onDesfocarObraRelacionada
              }
              onSelecionarObraRelacionada={
                camposRelacionados.onSelecionarObraRelacionada
              }
              onAlterarCapituloRelacionado={
                camposRelacionados.onAlterarCapituloRelacionado
              }
            />
          </CommunityPostComposerFields>

          <CommunityPostComposerPublicationField
            publicandoPost={publicandoPost}
            textoPostRef={publicacao.textoPostRef}
            onPrepararEnquete={publicacao.onPrepararEnquete}
            onAplicarSugestao={publicacao.onAplicarSugestao}
          />

          {erro && (
            <CommunityPostComposerErrorMessage>
              {erro}
            </CommunityPostComposerErrorMessage>
          )}

          <CommunityPostComposerActions
            publicandoPost={publicandoPost}
            temSpoilerPost={temSpoilerPost}
            onAlternarSpoiler={onAlternarSpoiler}
          />
        </CommunityPostComposerForm>
      </CommunityPostComposerPanel>
    </CommunityPostComposerOverlay>
  );
}
