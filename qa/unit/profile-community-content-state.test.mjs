import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const contentState = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-content-state.tsx",
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
const communityPanel = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-community-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("ProfileCommunityContentState preserva loading, erro, vazio e conteúdo", () => {
  assert.match(
    contentState,
    /import \{ LoadingSpinner \} from "\.\/loading-spinner";/,
  );
  assert.match(
    contentState,
    /import \{ ProfileCommunityNotice \} from "\.\/profile-community-notice";/,
  );
  assert.match(
    contentState,
    /if \(loading\) \{[\s\S]*?<LoadingSpinner label="Carregando publicações da Comunidade" compacto \/>/,
  );
  assert.match(
    contentState,
    /\{persistentContent\}[\s\S]*?\{error \? \([\s\S]*?icon="!"[\s\S]*?title="Comunidade indisponível"[\s\S]*?description=\{error\}/,
  );
  assert.match(
    contentState,
    /\) : empty \? \([\s\S]*?icon="💬"[\s\S]*?title=\{emptyTitle\}[\s\S]*?description=\{emptyDescription\}/,
  );
  assert.match(contentState, /\) : \([\s\S]*?children/);
});

test("ProfileCommunityPanel compõe seção, cabeçalho e estado da Comunidade", () => {
  assert.match(
    communityPanel,
    /import \{ ProfileCommunitySection \} from "\.\/profile-community-section";/,
  );
  assert.match(
    communityPanel,
    /import \{ ProfileCommunityHeader \} from "\.\/profile-community-header";/,
  );
  assert.match(
    communityPanel,
    /import \{ ProfileCommunityContentState \} from "\.\/profile-community-content-state";/,
  );
  assert.match(
    communityPanel,
    /<ProfileCommunitySection isDesktop=\{isDesktop\}>[\s\S]*?<ProfileCommunityHeader title=\{title\} \/>[\s\S]*?<ProfileCommunityContentState[\s\S]*?loading=\{loading\}[\s\S]*?error=\{error\}[\s\S]*?empty=\{empty\}[\s\S]*?emptyTitle=\{emptyTitle\}[\s\S]*?emptyDescription=\{emptyDescription\}[\s\S]*?persistentContent=\{persistentContent\}/,
  );
  assert.match(communityPanel, /\{children\}/);
});

test("página delega a composição externa sem alterar os valores derivados", () => {
  assert.match(
    pagina,
    /import \{ ProfileCommunityPanel \} from "\.\/components\/profile-community-panel";/,
  );
  assert.match(
    pagina,
    /\{comunidadePerfilAtiva && \([\s\S]*?<ProfileCommunityPanel[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?title=\{tituloComunidadePerfil\}[\s\S]*?loading=\{comunidadePerfil\.carregando\}[\s\S]*?error=\{erroComunidadePerfil\}[\s\S]*?empty=\{comunidadeSemPublicacoesRecentes\}[\s\S]*?emptyTitle=\{avisoComunidadeVazia\.title\}[\s\S]*?emptyDescription=\{avisoComunidadeVazia\.description\}[\s\S]*?persistentContent=\{[\s\S]*?<ProfileCommunityStatsGrid/,
  );
  assert.doesNotMatch(pagina, /import \{ ProfileCommunitySection \} from/);
  assert.doesNotMatch(pagina, /import \{ ProfileCommunityHeader \} from/);
  assert.doesNotMatch(pagina, /import \{ ProfileCommunityContentState \} from/);
});

test("ProfileCommunityRecentPostsSection compõe a lista e o map das publicações", () => {
  assert.match(
    recentPostsSection,
    /import \{ ProfileCommunityRecentPostsList \} from "\.\/profile-community-recent-posts-list";/,
  );
  assert.match(
    recentPostsSection,
    /isDesktop: boolean;[\s\S]*?publicacoes: PublicacaoComunidadePerfil\[\];[\s\S]*?renderPost: \(publicacao: PublicacaoComunidadePerfil\) => ReactNode;/,
  );
  assert.match(
    recentPostsSection,
    /<ProfileCommunityRecentPostsList isDesktop=\{isDesktop\}>[\s\S]*?\{publicacoes\.map\(renderPost\)\}/,
  );
  assert.match(
    pagina,
    /<ProfileCommunityRecentPostsSection[\s\S]*?title="Publicações recentes"[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?publicacoes=\{publicacoesRecentesComunidade\}[\s\S]*?renderPost=\{renderizarPublicacaoRecenteComunidade\}/,
  );
});
