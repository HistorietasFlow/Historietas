import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-feed-pagination-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado principal do feed e paginação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ PostComunidade \} from "\.\.\/components\/community-post-model";/,
  );
  assert.match(hook, /export function useComunidadeFeedPaginationState\(\)/);
  assert.match(
    hook,
    /posts, setPosts\] = useState<PostComunidade\[\]>\(\[\]\)/,
  );
  assert.match(
    hook,
    /carregandoFeed, setCarregandoFeed\] = useState\(true\)/,
  );
  assert.match(
    hook,
    /paginaFeedComunidade, setPaginaFeedComunidade\] = useState\(0\)/,
  );
  assert.match(
    hook,
    /temMaisPostsComunidade, setTemMaisPostsComunidade\] = useState\(false\)/,
  );
  assert.match(
    hook,
    /carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade\][\s\S]*?useState\(false\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva os lifecycles e consumidores do feed", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeFeedPaginationState \} from "\.\/hooks\/use-comunidade-feed-pagination-state";/,
  );
  assert.match(pagina, /\} = useComunidadeFeedPaginationState\(\);/);

  for (const estadoLocal of [
    "const [posts, setPosts]",
    "const [carregandoFeed, setCarregandoFeed]",
    "const [paginaFeedComunidade, setPaginaFeedComunidade]",
    "const [temMaisPostsComunidade, setTemMaisPostsComunidade]",
    "const [carregandoMaisPostsComunidade, setCarregandoMaisPostsComunidade]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setPosts,[\s\S]*?setCarregandoFeed,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeFeedLifecycle\(\{[\s\S]*?carregandoFeed,[\s\S]*?carregandoMaisPostsComunidade,[\s\S]*?temMaisPostsComunidade,[\s\S]*?paginaFeedComunidade,[\s\S]*?setPosts,[\s\S]*?setTemMaisPostsComunidade,[\s\S]*?setPaginaFeedComunidade,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useComunidadePollVotesSync\(\{[\s\S]*?posts,/);
  assert.match(pagina, /useComunidadeRelatedWorkDiarySync\(\{[\s\S]*?posts,/);
  assert.match(pagina, /useComunidadeInitialUrlNavigation\(\{[\s\S]*?posts,/);
  assert.match(pagina, /obterPostsVisiveisComunidade\(\{[\s\S]*?posts,/);
  assert.match(pagina, /<CommunityFeedCenterComposition[\s\S]*?feedProps=\{\{[\s\S]*?postsVisiveis,/);
});
