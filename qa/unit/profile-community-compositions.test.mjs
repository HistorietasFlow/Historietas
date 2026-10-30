import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const communityPostRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-community-post-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const statsGrid = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-stats-grid.tsx",
    import.meta.url,
  ),
  "utf8",
);
const postItem = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-post-item.tsx",
    import.meta.url,
  ),
  "utf8",
);
const recentPostsSection = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-recent-posts-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const communityTab = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-tab.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("página mantém derivadas as estatísticas da Comunidade e delega sua composição", () => {
  assert.match(
    pagina,
    /import \{ ProfileCommunityTab \} from "\.\/components\/profile-community-tab";/,
  );
  assert.match(pagina, /<ProfileCommunityTab/);
  for (const valor of [
    /isDesktop=\{isDesktop\}/,
    /href: comunidadeAutorHref,[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.publicacoes,[\s\S]*?value: valoresEstatisticasComunidade\.publicacoes,/,
    /href: comunidadeAutorTeoriasHref,[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.teorias,[\s\S]*?value: valoresEstatisticasComunidade\.teorias,/,
    /href: comunidadeAutorReviewsHref,[\s\S]*?ariaLabel: ariaLabelsEstatisticasComunidade\.reviews,[\s\S]*?value: valoresEstatisticasComunidade\.reviews,/,
  ]) {
    assert.match(pagina, valor);
  }
  assert.match(
    communityTab,
    /import \{ ProfileCommunityStatsGrid \} from "\.\/profile-community-stats-grid";/,
  );
});

test("ProfileCommunityStatsGrid preserva os três cards, textos, links e acessibilidade", () => {
  assert.match(
    statsGrid,
    /import \{ ProfileCommunityStatCard \} from "\.\/profile-community-stat-card";/,
  );
  assert.equal(
    (statsGrid.match(/<ProfileCommunityStatCard/g) || []).length,
    3,
  );
  assert.match(
    statsGrid,
    /href=\{publicacoes\.href\}[\s\S]*?ariaLabel=\{publicacoes\.ariaLabel\}[\s\S]*?value=\{publicacoes\.value\}[\s\S]*?title="PUBLICAÇÕES"[\s\S]*?description="posts do perfil"/,
  );
  assert.match(
    statsGrid,
    /href=\{teorias\.href\}[\s\S]*?ariaLabel=\{teorias\.ariaLabel\}[\s\S]*?value=\{teorias\.value\}[\s\S]*?title="TEORIAS"[\s\S]*?description="discussões"/,
  );
  assert.match(
    statsGrid,
    /href=\{reviews\.href\}[\s\S]*?ariaLabel=\{reviews\.ariaLabel\}[\s\S]*?value=\{reviews\.value\}[\s\S]*?title="REVIEWS"[\s\S]*?description="opiniões"/,
  );
});

test("página mantém dados e callback de denúncia derivados antes de delegar a publicação", () => {
  assert.match(
    pagina,
    /publicacoesRecentes=\{publicacoesRecentesComunidade\}/,
  );
  assert.match(
    recentPostsSection,
    /\{publicacoes\.map\(renderPost\)\}/,
  );
  assert.equal(
    (communityPostRendererSource.match(
      /obterDadosPublicacaoRecenteComunidadePerfilAutor\(/g,
    ) || []).length,
    1,
  );
  assert.match(
    communityPostRendererSource,
    /const renderizarPublicacaoRecenteComunidade = \([\s\S]*?publicacao: PublicacaoComunidadePerfil,[\s\S]*?\) => \{[\s\S]*?const dadosPublicacao =[\s\S]*?obterDadosPublicacaoRecenteComunidadePerfilAutor\([\s\S]*?publicacao,[\s\S]*?\);/,
  );
  assert.match(
    communityPostRendererSource,
    /<ProfileCommunityPostItem[\s\S]*?publicacao=\{publicacao\}[\s\S]*?href=\{dadosPublicacao\.href\}[\s\S]*?ariaLabel=\{dadosPublicacao\.ariaLabel\}[\s\S]*?resumo=\{dadosPublicacao\.resumo\}[\s\S]*?totalOpcoesEnquete=\{[\s\S]*?dadosPublicacao\.totalOpcoesEnquete[\s\S]*?\}[\s\S]*?exibirInfoEnquete=\{[\s\S]*?dadosPublicacao\.exibirInfoEnquete[\s\S]*?\}[\s\S]*?exibirObraRelacionada=\{[\s\S]*?dadosPublicacao\.exibirObraRelacionada[\s\S]*?\}[\s\S]*?paddingBottom=\{[\s\S]*?paddingInferiorPublicacaoComunidade[\s\S]*?\}[\s\S]*?dateLabel=\{dataDiarioPerfilFormatada\([\s\S]*?publicacao\.criadoEm,[\s\S]*?\)\}[\s\S]*?showReportButton=\{perfilVisitante\}[\s\S]*?onReport=\{\(\) =>[\s\S]*?abrirDenunciaConteudoPerfil\([\s\S]*?"post",[\s\S]*?publicacao\.id,[\s\S]*?dadosPublicacao\.resumo/,
  );
  assert.match(
    pagina,
    /import \{ usePerfilAutorCommunityPostRenderer \} from "\.\/hooks\/use-perfil-autor-community-post-renderer";/,
  );
  assert.match(
    pagina,
    /const \{ renderizarPublicacaoRecenteComunidade \} =[\s\S]*?usePerfilAutorCommunityPostRenderer\(\{[\s\S]*?paddingInferiorPublicacaoComunidade,[\s\S]*?perfilVisitante,[\s\S]*?abrirDenunciaConteudoPerfil,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /renderPost=\{renderizarPublicacaoRecenteComunidade\}/,
  );
});

test("ProfileCommunityPostItem preserva link, conteúdo, condições e denúncia", () => {
  for (const component of [
    "ProfileCommunityPostLink",
    "ProfileCommunityPostHeader",
    "ProfileCommunityPostBody",
    "ProfileCommunityPostSummary",
    "ProfileCommunityPostPollInfo",
    "ProfileCommunityPostWork",
    "ProfileCommunityPostReportButton",
  ]) {
    assert.match(postItem, new RegExp(`<${component}`));
  }

  assert.match(
    postItem,
    /href=\{href\}[\s\S]*?paddingBottom=\{paddingBottom\}[\s\S]*?ariaLabel=\{ariaLabel\}/,
  );
  assert.match(
    postItem,
    /typeLabel=\{publicacao\.tipoPublicacao\}[\s\S]*?dateLabel=\{dateLabel\}/,
  );
  assert.match(postItem, /<ProfileCommunityPostSummary>\{resumo\}/);
  assert.match(
    postItem,
    /\{exibirInfoEnquete && \([\s\S]*?<span aria-hidden="true">•<\/span>[\s\S]*?\{totalOpcoesEnquete\}\{" "\}[\s\S]*?opções/,
  );
  assert.match(
    postItem,
    /\{exibirObraRelacionada && \([\s\S]*?<strong data-historietas-user-content="true">[\s\S]*?\{publicacao\.obraRelacionada\}/,
  );
  assert.match(
    postItem,
    /\{showReportButton && \([\s\S]*?<ProfileCommunityPostReportButton onClick=\{onReport\} \/>/,
  );
});

test("as primitives internas da Comunidade não permanecem importadas pela página", () => {
  for (const component of [
    "ProfileCommunityStatCard",
    "ProfileCommunityPostLink",
    "ProfileCommunityPostHeader",
    "ProfileCommunityPostBody",
    "ProfileCommunityPostSummary",
    "ProfileCommunityPostPollInfo",
    "ProfileCommunityPostWork",
    "ProfileCommunityPostReportButton",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`import \\{ ${component} \\} from`),
    );
  }
});
