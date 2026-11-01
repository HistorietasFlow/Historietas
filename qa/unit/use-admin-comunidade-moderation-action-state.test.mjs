import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-moderation-action-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("o hook concentra o estado e as ações semânticas da moderação", () => {
  assert.match(hookSource, /export function useAdminComunidadeModerationActionState\(\)/);

  for (const state of [
    "erro, setErro",
    "sucesso, setSucesso",
    "acaoEmAndamento, setAcaoEmAndamento",
    "menuDenunciaAbertoId, setMenuDenunciaAbertoId",
  ]) {
    assert.match(hookSource, new RegExp(`const \\[${state}\\] = useState\\(\"\"\\);`));
  }

  assert.match(
    hookSource,
    /function alternarMenuDenuncia\(denunciaId: string\) \{\s*setMenuDenunciaAbertoId\(\(denunciaAbertaId\) =>\s*denunciaAbertaId === denunciaId \? "" : denunciaId\s*\);\s*\}/,
  );
  assert.match(
    hookSource,
    /function fecharMenuDenuncia\(\) \{\s*setMenuDenunciaAbertoId\(""\);\s*\}/,
  );

  for (const contract of [
    "erro",
    "setErro",
    "sucesso",
    "setSucesso",
    "acaoEmAndamento",
    "setAcaoEmAndamento",
    "menuDenunciaAbertoId",
    "setMenuDenunciaAbertoId",
    "alternarMenuDenuncia",
    "fecharMenuDenuncia",
  ]) {
    assert.match(hookSource, new RegExp(`\\b${contract}\\b`));
  }
});

test("a página delega o estado e usa as ações semânticas nos cards", () => {
  assert.match(
    pageSource,
    /import \{ useAdminComunidadeModerationActionState \} from "\.\/hooks\/use-admin-comunidade-moderation-action-state";/,
  );
  assert.match(pageSource, /\} = useAdminComunidadeModerationActionState\(\);/);
  assert.doesNotMatch(pageSource, /const \[erro, setErro\] = useState/);
  assert.doesNotMatch(pageSource, /const \[menuDenunciaAbertoId, setMenuDenunciaAbertoId\] = useState/);
  assert.match(pageSource, /onAlternarMenu=\{alternarMenuDenuncia\}/);
  assert.match(pageSource, /onAlternarMenu=\{\(\) => alternarMenuDenuncia\(denuncia\.id\)\}/);
  assert.match(pageSource, /onFecharMenu=\{fecharMenuDenuncia\}/);
});

test("o hook não concentra infraestrutura, effects ou renderização", () => {
  assert.doesNotMatch(
    hookSource,
    /supabase|useEffect|useMemo|useRouter|localStorage|sessionStorage|return\s*\(\s*</,
  );
});
