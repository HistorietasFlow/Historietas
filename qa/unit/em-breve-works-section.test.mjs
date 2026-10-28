import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../../app/em-breve/components/em-breve-works-section.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente a seção visual de obras ao componente dedicado", async () => {
  const [component, page] = await Promise.all([
    readFile(componentPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(component, /import Link from "next\/link";/);
  assert.match(component, /type ObraEmBreveCard/);
  assert.match(component, /listaTemObraEmBreve/);
  assert.match(component, /criarLinkCardEmBreve/);
  assert.match(component, /obterIconeTematicaEmBreve/);
  assert.match(component, /export function EmBreveWorksSection/);
  for (const prop of [
    "obras",
    "obrasSalvasNormalizadas",
    "desktopLayout",
    "avisoAcesso",
    "obraProcessandoId",
    "salvarLancamento",
  ]) {
    assert.match(component, new RegExp(prop));
  }
  assert.match(component, /obras\.map\(\(obra\) =>/);
  assert.match(component, /listaTemObraEmBreve\(obra, obrasSalvasNormalizadas\)/);
  assert.match(component, /criarLinkCardEmBreve\(obra\)/);
  assert.match(component, /criarCoverCardEmBreveStyle\(obra, desktopLayout\)/);
  assert.match(component, /obterIconeTematicaEmBreve\(obra\.genero\)/);
  assert.match(component, /onClick=\{\(\) => salvarLancamento\(obra\)\}/);
  assert.match(component, /disabled=\{Boolean\(obraProcessandoId\)\}/);
  assert.match(component, /aria-pressed/);
  assert.match(component, /aria-busy/);
  for (const text of [
    "Por",
    "AVISO ATIVADO",
    "LANÇAMENTO REAL SEM CONTEÚDO",
    "Você será avisado quando a leitura for liberada.",
    "Esta obra existe, mas ainda não tem capítulo ou arquivo publicado.",
    "Salvando...",
    "✓ Aviso ativo",
    "Avisar",
  ]) {
    assert.match(component, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(
    page,
    /import \{ EmBreveWorksSection \} from "\.\/components\/em-breve-works-section";/,
  );
  assert.match(page, /<EmBreveWorksSection/);
  for (const prop of [
    "obras={outrasObrasEmBreve}",
    "obrasSalvasNormalizadas={obrasSalvasNormalizadas}",
    "desktopLayout={desktopLayout}",
    "avisoAcesso={avisoAcesso}",
    "obraProcessandoId={obraProcessandoId}",
    "salvarLancamento={salvarLancamento}",
  ]) {
    assert.ok(page.includes(prop));
  }
  assert.match(page, /async function salvarLancamento\(obra: ObraEmBreveCard\)/);
  assert.match(page, /listaTemObraEmBreve/);
  assert.match(page, /type ObraEmBreveCard/);
  assert.doesNotMatch(page, /import Link from "next\/link";/);
  assert.doesNotMatch(page, /criarLinkCardEmBreve/);
  assert.doesNotMatch(page, /obterIconeTematicaEmBreve/);

  assert.doesNotMatch(
    component,
    /supabase|auth|router|localStorage|useEffect|useState|MutationObserver|\.(?:insert|update|delete|upsert)\(/,
  );
});
