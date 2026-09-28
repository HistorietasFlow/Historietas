import type { CategoriaComunidade } from "./community-category";
import { CATEGORIAS_COMUNIDADE } from "./community-categories";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import { VISIBILIDADES_POST_COMUNIDADE } from "./community-post-visibility-options";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import { TIPOS_PUBLICACAO_COMUNIDADE } from "./community-publication-types";
import { CommunityPostComposerField } from "./community-post-composer-field";
import { CommunityPostComposerFieldLabel } from "./community-post-composer-field-label";
import { CommunityPostComposerSelect } from "./community-post-composer-select";

type CommunityPostComposerClassificationFieldsProps = {
  publicandoPost: boolean;
  categoriaPost: CategoriaComunidade;
  tipoPublicacaoPost: TipoPublicacaoComunidade;
  visibilidadePost: VisibilidadePostComunidade;
  onAlterarCategoria: (categoria: CategoriaComunidade) => void;
  onAlterarTipoPublicacao: (tipo: TipoPublicacaoComunidade) => void;
  onAlterarVisibilidade: (visibilidade: string) => void;
};

export function CommunityPostComposerClassificationFields({
  publicandoPost,
  categoriaPost,
  tipoPublicacaoPost,
  visibilidadePost,
  onAlterarCategoria,
  onAlterarTipoPublicacao,
  onAlterarVisibilidade,
}: CommunityPostComposerClassificationFieldsProps) {
  return (
    <>
      <CommunityPostComposerField>
        <CommunityPostComposerFieldLabel>Categoria</CommunityPostComposerFieldLabel>

        <CommunityPostComposerSelect
          disabled={publicandoPost}
          value={categoriaPost}
          onChange={(event) =>
            onAlterarCategoria(event.target.value as CategoriaComunidade)
          }
        >
          {CATEGORIAS_COMUNIDADE.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </CommunityPostComposerSelect>
      </CommunityPostComposerField>

      <CommunityPostComposerField>
        <CommunityPostComposerFieldLabel>Tipo</CommunityPostComposerFieldLabel>

        <CommunityPostComposerSelect
          disabled={publicandoPost}
          value={tipoPublicacaoPost}
          onChange={(event) =>
            onAlterarTipoPublicacao(event.target.value as TipoPublicacaoComunidade)
          }
        >
          {TIPOS_PUBLICACAO_COMUNIDADE.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </CommunityPostComposerSelect>
      </CommunityPostComposerField>

      <CommunityPostComposerField>
        <CommunityPostComposerFieldLabel>Quem pode ver esta publicação?</CommunityPostComposerFieldLabel>

        <CommunityPostComposerSelect
          disabled={publicandoPost}
          value={visibilidadePost}
          onChange={(event) => onAlterarVisibilidade(event.target.value)}
        >
          {VISIBILIDADES_POST_COMUNIDADE.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </CommunityPostComposerSelect>
      </CommunityPostComposerField>
    </>
  );
}
