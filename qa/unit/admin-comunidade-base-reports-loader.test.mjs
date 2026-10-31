import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-denuncias-base-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);
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
const contextoLoader = readFileSync(
  new URL(
    "../../app/admin/comunidade/loaders/carregar-denuncias-contexto-moderacao.ts",
    import.meta.url,
  ),
  "utf8",
);

test("loader base preserva query, erro e normalização das denúncias", () => {
  assert.match(source, /from\("comunidade_denuncias"\)/);
  assert.match(source, /"id, alvo_tipo, alvo_id, alvo_autor_id, denunciante_id, motivo, detalhe, status, arquivada, observacao_admin, analisado_por, analisado_em, criado_em"/);
  assert.match(source, /order\("criado_em", \{ ascending: false \}\)/);
  assert.match(source, /limit\(200\)/);
  assert.match(source, /throw denunciasErro/);
  assert.match(source, /denunciasResposta \|\| \[\]/);
  assert.match(source, /normalizarTipoAlvo\(denuncia\.alvo_tipo\)/);
  assert.match(source, /formatarMotivoDenunciaConteudo\([\s\S]*?"Conteúdo inadequado"/);
  assert.match(source, /normalizarStatus\(denuncia\.status\)/);
  assert.match(source, /arquivada: Boolean\(denuncia\.arquivada\)/);
  assert.match(source, /analisadoPor: denuncia\.analisado_por[\s\S]*?: null/);
  assert.match(source, /analisadoEm: denuncia\.analisado_em[\s\S]*?: null/);
  assert.doesNotMatch(source, /useState|useEffect|useMemo|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});

test("Admin Comunidade mantém contexto e setters na página", () => {
  assert.match(hook, /setErro\(""/);
  assert.match(hook, /await carregarDenunciasComContextoModeracao\(\)/);
  assert.match(contextoLoader, /const denunciasMapeadas =\s*await buscarDenunciasBaseModeracao\(\)/);
  assert.match(contextoLoader, /agruparIdsAlvosDenunciados\(denunciasMapeadas\)/);
  assert.match(contextoLoader, /buscarAlvosPrimariosModeracao\(/);
  assert.match(hook, /setDenuncias\(denunciasComContexto\)/);
  assert.match(hook, /setObservacoes\(/);
  assert.match(page, /useAdminComunidadeInitialData\(/);
});
