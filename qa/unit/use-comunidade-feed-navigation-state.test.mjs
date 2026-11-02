import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-feed-navigation-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado de filtros e navegação do feed", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /export function useComunidadeFeedNavigationState\(\)/);
  assert.match(
    hook,
    /categoriaAtiva, setCategoriaAtiva\] = useState<[\s\S]*?CategoriaComunidade \| "Todos"[\s\S]*?>\("Todos"\)/,
  );
  assert.match(
    hook,
    /tipoPublicacaoAtiva, setTipoPublicacaoAtiva\][\s\S]*?useState<TipoPublicacaoFiltro>\("Todos"\)/,
  );
  assert.match(hook, /obraRelacionadaFiltro, setObraRelacionadaFiltro\] = useState\(""\)/);
  assert.match(
    hook,
    /grupoPublicacaoObra, setGrupoPublicacaoObra\][\s\S]*?useState<GrupoPublicacaoObra>\(""\)/,
  );
  assert.match(hook, /termoBusca, setTermoBusca\] = useState\(""\)/);
  assert.match(
    hook,
    /ordenacaoAtiva, setOrdenacaoAtiva\][\s\S]*?useState<OrdenacaoComunidade>\("Recentes"\)/,
  );
  assert.match(
    hook,
    /abaFeedAtiva, setAbaFeedAtiva\][\s\S]*?useState<AbaFeedComunidade>\("Para você"\)/,
  );
  assert.match(
    hook,
    /mostrarApenasSalvos, setMostrarApenasSalvos\] = useState\(false\)/,
  );
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega o estado e preserva lifecycles, busca adiada e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeFeedNavigationState \} from "\.\/hooks\/use-comunidade-feed-navigation-state";/,
  );
  assert.match(pagina, /\} = useComunidadeFeedNavigationState\(\);/);

  for (const estadoLocal of [
    "const [categoriaAtiva, setCategoriaAtiva]",
    "const [tipoPublicacaoAtiva, setTipoPublicacaoAtiva]",
    "const [obraRelacionadaFiltro, setObraRelacionadaFiltro]",
    "const [grupoPublicacaoObra, setGrupoPublicacaoObra]",
    "const [termoBusca, setTermoBusca]",
    "const [ordenacaoAtiva, setOrdenacaoAtiva]",
    "const [abaFeedAtiva, setAbaFeedAtiva]",
    "const [mostrarApenasSalvos, setMostrarApenasSalvos]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(pagina, /const termoBuscaAdiado = useDeferredValue\(termoBusca\);/);
  assert.match(
    pagina,
    /useComunidadeInitialUrlNavigation\(\{[\s\S]*?setTermoBusca,[\s\S]*?setObraRelacionadaFiltro,[\s\S]*?setGrupoPublicacaoObra,[\s\S]*?setTipoPublicacaoAtiva,[\s\S]*?setAbaFeedAtiva,[\s\S]*?setMostrarApenasSalvos,[\s\S]*?setOrdenacaoAtiva,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeFeedLifecycle\(\{[\s\S]*?obraRelacionadaFiltro,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useComunidadeUserSearchSync\(\{[\s\S]*?termoBuscaAdiado,/);
  assert.match(pagina, /obterPostsVisiveisComunidade\(\{[\s\S]*?categoriaAtiva,[\s\S]*?ordenacaoAtiva,/);
  assert.match(pagina, /selecionarAbaFeedComunidade\(\{/);
  assert.match(pagina, /limparFiltrosComunidade\(\{/);
  assert.match(pagina, /selecionarOrdenacaoRecentesComunidade\(\{/);
  assert.match(pagina, /selecionarOrdenacaoEmAltaComunidade\(\{/);
  assert.match(pagina, /selecionarOrdenacaoMaisComentadasComunidade\(\{/);
});
