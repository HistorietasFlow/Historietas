import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const loaderPath = new URL(
  "../../app/admin/comunidade/loaders/carregar-denuncias-contexto-moderacao.ts",
  import.meta.url,
);
const loader = readFileSync(loaderPath, "utf8");
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-initial-data.ts",
    import.meta.url,
  ),
  "utf8",
);

test("loader de denúncias com contexto preserva a cadeia de carregamento", () => {
  assert.equal(existsSync(loaderPath), true);
  assert.match(
    loader,
    /export async function carregarDenunciasComContextoModeracao\(\): Promise<[\s\S]*?DenunciaComContexto\[\]/,
  );

  const etapas = [
    "buscarDenunciasBaseModeracao",
    "agruparIdsAlvosDenunciados",
    "buscarAlvosPrimariosModeracao",
    "buscarAnotacoesDiarioContextoModeracao",
    "buscarCapitulosContextoModeracao",
    "buscarObrasContextoModeracao",
    "buscarPerfisContextoModeracao",
    "criarMapasContextoModeracao",
    "montarDenunciasComContextoModeracao",
  ];

  let indiceAnterior = -1;
  for (const etapa of etapas) {
    assert.match(loader, new RegExp(`import[\\s\\S]*?${etapa}`));
    const indiceAtual = loader.indexOf(`${etapa}(`);
    assert.ok(indiceAtual > indiceAnterior, `${etapa} mantém a ordem da cadeia`);
    indiceAnterior = indiceAtual;
  }

  assert.match(loader, /const denunciasMapeadas =\s*await buscarDenunciasBaseModeracao\(\);/);
  assert.match(loader, /agruparIdsAlvosDenunciados\(\s*denunciasMapeadas\s*\)/);
  assert.match(loader, /await buscarAlvosPrimariosModeracao\(\{[\s\S]*?postIds,[\s\S]*?comentarioIds,[\s\S]*?comentarioCapituloIds,[\s\S]*?comentarioObraIds,[\s\S]*?comentarioDiarioIds,/);
  assert.match(loader, /await buscarAnotacoesDiarioContextoModeracao\(\{[\s\S]*?diarioAnotacaoIds,[\s\S]*?comentariosDiario,/);
  assert.match(loader, /await buscarCapitulosContextoModeracao\(\{[\s\S]*?capituloIdsDenunciados,[\s\S]*?comentariosCapitulos,/);
  assert.match(loader, /await buscarObrasContextoModeracao\(\{[\s\S]*?obraIdsDenunciadas,[\s\S]*?capitulos,[\s\S]*?comentariosObras,[\s\S]*?diarioAnotacoes,/);
  assert.match(loader, /await buscarPerfisContextoModeracao\(\{[\s\S]*?denunciasMapeadas,[\s\S]*?comentariosCapitulos,[\s\S]*?comentariosObras,[\s\S]*?comentariosDiario,[\s\S]*?diarioAnotacoes,[\s\S]*?capitulos,[\s\S]*?obras,/);
  assert.match(loader, /criarMapasContextoModeracao\(\{[\s\S]*?perfis,[\s\S]*?posts,[\s\S]*?comentarios,[\s\S]*?comentariosCapitulos,[\s\S]*?comentariosObras,[\s\S]*?comentariosDiario,[\s\S]*?diarioAnotacoes,[\s\S]*?capitulos,[\s\S]*?obras,/);
  assert.match(loader, /montarDenunciasComContextoModeracao\(\{[\s\S]*?denunciasMapeadas,[\s\S]*?perfisPorId,[\s\S]*?postsPorId,[\s\S]*?comentariosPorId,[\s\S]*?comentariosCapitulosPorId,[\s\S]*?comentariosObrasPorId,[\s\S]*?comentariosDiarioPorId,[\s\S]*?diarioAnotacoesPorId,[\s\S]*?capitulosPorId,[\s\S]*?obrasPorId,/);
  assert.match(loader, /return denunciasComContexto;/);
  assert.doesNotMatch(
    loader,
    /useState|useEffect|useMemo|router|set[A-Z][A-Za-z]+\(|(?:^|\n)\s*<[A-Za-z]/,
  );
});

test("Admin Comunidade mantém a orquestração de estado na página", () => {
  assert.match(
    hook,
    /import \{ carregarDenunciasComContextoModeracao \} from "\.\.\/loaders\/carregar-denuncias-contexto-moderacao";/,
  );
  assert.match(
    hook,
    /async function carregarDenuncias\(\) \{[\s\S]*?setErro\(""\);[\s\S]*?const denunciasComContexto =[\s\S]*?await carregarDenunciasComContextoModeracao\(\);[\s\S]*?setDenuncias\(denunciasComContexto\);[\s\S]*?sincronizarObservacoesModeracao\([\s\S]*?denunciasComContexto/,
  );
  assert.doesNotMatch(page, /buscarDenunciasBaseModeracao/);
  assert.doesNotMatch(page, /agruparIdsAlvosDenunciados/);
  assert.doesNotMatch(page, /buscarAlvosPrimariosModeracao/);
  assert.doesNotMatch(page, /buscarAnotacoesDiarioContextoModeracao/);
  assert.doesNotMatch(page, /buscarCapitulosContextoModeracao/);
  assert.doesNotMatch(page, /buscarObrasContextoModeracao/);
  assert.doesNotMatch(page, /buscarPerfisContextoModeracao/);
  assert.doesNotMatch(page, /criarMapasContextoModeracao/);
  assert.doesNotMatch(page, /montarDenunciasComContextoModeracao/);
  assert.match(page, /useAdminComunidadeInitialData\(/);
});
