import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helper = readFileSync(new URL("../../app/perfil-autor/lib/profile-library-active-items.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/perfil-autor/page.tsx", import.meta.url), "utf8");
const libraryItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-library-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const contentState = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-library-content-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const panel = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-library-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("a página delega seleção de itens da Biblioteca", () => {
  assert.match(pagina, /import \{ selecionarItensBibliotecaPerfil \}/);
  assert.match(
    pagina,
    /const itensBibliotecaAtivos = selecionarItensBibliotecaPerfil\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /const itensBibliotecaAtivos = useMemo/,
  );
  for (const campo of ["aba", "queroLer", "lendoAgora", "favoritas", "concluidas", "salvos", "historico"]) {
    assert.match(pagina, new RegExp(campo + ":"));
  }
});

test("todas as seis abas preservam o array original", () => {
  for (const [aba, retorno] of [
    ["quero-ler", "queroLer"],
    ["lendo-agora", "lendoAgora"],
    ["favoritas", "favoritas"],
    ["concluidas", "concluidas"],
    ["salvos", "salvos"],
    ["historico", "historico"],
  ]) {
    assert.ok(helper.includes('case "' + aba + '":\n      return ' + retorno + ';'), aba);
  }
});

test("aba tudo preserva a ordem original da mesclagem", () => {
  assert.match(helper, /default:\s*return mesclarItensBibliotecaPerfil\(\s*queroLer, lendoAgora, favoritas, concluidas, salvos, historico,/);
});

test("ProfileLibraryContentState preserva loading, vazio e a grade da Biblioteca", () => {
  assert.match(
    contentState,
    /<LoadingSpinner label="Carregando biblioteca" compacto \/>/,
  );
  assert.match(
    contentState,
    /if \(empty\) \{[\s\S]*?<ProfileSectionEmptyState message=\{emptyMessage\} \/>/,
  );
  assert.match(
    contentState,
    /<ProfileWorksGrid isDesktop=\{isDesktop\}>[\s\S]*?\{items\.map\(renderItem\)\}/,
  );
});

test("página mantém as derivações e o callback da Biblioteca antes de delegar a lista", () => {
  assert.match(
    pagina,
    /import \{ ProfileLibraryPanel \} from "\.\/components\/profile-library-panel";/,
  );
  assert.match(
    libraryItemRendererSource,
    /const renderizarItemBiblioteca = \(item: ItemBibliotecaPerfil\) => \{[\s\S]*?obterDadosCardBibliotecaPerfilAutor\([\s\S]*?item,[\s\S]*?totaisInteracoesObras,[\s\S]*?bibliotecaMenuAbertoChave,[\s\S]*?\);/,
  );
  assert.match(
    pagina,
    /import \{ usePerfilAutorLibraryItemRenderer \} from "\.\/hooks\/use-perfil-autor-library-item-renderer";/,
  );
  assert.match(
    pagina,
    /const \{ renderizarItemBiblioteca \} = usePerfilAutorLibraryItemRenderer\(\{[\s\S]*?isDesktop,[\s\S]*?totaisInteracoesObras,[\s\S]*?bibliotecaMenuAbertoChave,[\s\S]*?setBibliotecaMenuAbertoChave,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /<ProfileLibraryPanel[\s\S]*?abaAtiva=\{abaBibliotecaPerfil\}[\s\S]*?onSelect=\{setAbaBibliotecaPerfil\}[\s\S]*?loading=\{diarioPerfilCarregando\}[\s\S]*?empty=\{bibliotecaSemItensAtivosPerfilAutor\([\s\S]*?itensBibliotecaAtivos,[\s\S]*?\)\}[\s\S]*?items=\{itensBibliotecaAtivos\}[\s\S]*?renderItem=\{renderizarItemBiblioteca\}/,
  );
  assert.match(
    panel,
    /<ProfileLibrarySection isDesktop=\{isDesktop\}>[\s\S]*?<LibraryTabs[\s\S]*?abaAtiva=\{abaAtiva\}[\s\S]*?onSelect=\{onSelect\}[\s\S]*?<ProfileLibraryContentState[\s\S]*?loading=\{loading\}[\s\S]*?empty=\{empty\}[\s\S]*?items=\{items\}[\s\S]*?renderItem=\{renderItem\}/,
  );
  assert.doesNotMatch(pagina, /\{itensBibliotecaAtivos\.map\(/);
});
