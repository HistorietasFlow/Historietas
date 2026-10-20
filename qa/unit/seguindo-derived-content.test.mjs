import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-derived-content.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Seguindo delega a composição de dados derivados para um hook sem dados remotos", () => {
  assert.match(
    page,
    /import \{ useSeguindoDerivedContent \} from "\.\/hooks\/use-seguindo-derived-content";/,
  );
  assert.match(page, /const \{[\s\S]*?\} = useSeguindoDerivedContent\(\{/);
  assert.match(page, /useSeguindoContentTabNavigation\(/);
  assert.match(page, /useSeguindoUserSearchSync\(/);

  assert.match(hook, /^"use client";/);
  assert.match(hook, /normalizarTexto\(busca\)/);
  assert.match(hook, /obterContextoListaSocial\(usuarioLogadoId, perfilSocialId\)/);
  assert.match(hook, /buscaSugestoesUsuariosEstaAtiva\(/);
  assert.match(hook, /selecionarUsuariosBaseSocial\(/);
  assert.match(hook, /obterRotulosListaSocial\(/);
  assert.match(hook, /obterPermissoesListaSocial\(/);
  assert.match(hook, /useSeguindoVisibleWorks\(obras, obrasSeguidas\)/);
  assert.match(hook, /useSeguindoAuthorsBase\(/);
  assert.match(hook, /useSeguindoFilteredWorks\(/);
  assert.match(hook, /useSeguindoFilteredAuthors\(/);
  assert.match(hook, /useSeguindoFilteredUsers\(/);
  assert.match(hook, /useSeguindoFilteredFollowerRequests\(/);
  assert.match(hook, /calcularTotaisSeguindo\(/);
  assert.match(hook, /obterOpcoesOrdenacaoSeguindo\(abaConteudo\)/);
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|fetch\(/);
});
