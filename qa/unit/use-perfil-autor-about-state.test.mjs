import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/perfil-autor/hooks/use-perfil-autor-about-state.ts");
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente o estado e os toggles da secao Sobre", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorAboutState\(\)/);
  assert.match(hook, /editorSobreAberto, setEditorSobreAberto\] = useState\(false\)/);
  assert.match(
    hook,
    /atividadeSobreAberta, setAtividadeSobreAberta\] = useState\(false\)/,
  );
  assert.match(hook, /function alternarEditorSobre\(\)/);
  assert.match(hook, /setEditorSobreAberto\(\(aberto\) => !aberto\)/);
  assert.match(hook, /function alternarAtividadeSobre\(\)/);
  assert.match(
    hook,
    /setAtividadeSobreAberta\(\(valorAtual\) => !valorAtual\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|atualizarBioSobreAutor/);
});

test("pagina delega a UI de Sobre e preserva suas derivacoes e dados", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorAboutState \} from "\.\/hooks\/use-perfil-autor-about-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorAboutState\(\);/);
  assert.equal(pagina.includes("const [editorSobreAberto, setEditorSobreAberto]"), false);
  assert.equal(pagina.includes("const [atividadeSobreAberta, setAtividadeSobreAberta]"), false);

  for (const integracao of [
    "obterEstadoVisualAcessoPerfilAutor({",
    "editorSobreAberto,",
    "editorSobreVisivel",
    "atividadeSobreAberta",
    "atividadesPerfilVisivel",
    "<ProfileAboutSection",
    "atualizarBioSobreAutor(event.target.value)",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(pagina, /onToggleHeroEditor=\{alternarEditorSobre\}/);
  assert.match(pagina, /onToggleRecentActivity=\{alternarAtividadeSobre\}/);
});
