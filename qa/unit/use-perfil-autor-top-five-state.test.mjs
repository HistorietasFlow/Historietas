import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-top-five-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza estados e toggle semantico de Top Five e Destaques", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorTopFiveState\(\)/);
  assert.match(hook, /topFiveObraIds, setTopFiveObraIds\] = useState<string\[\]>\(\[\]\)/);
  assert.match(hook, /topFiveCurtidasTotal, setTopFiveCurtidasTotal\] = useState\(0\)/);
  assert.match(hook, /topFiveCurtidoPorMim, setTopFiveCurtidoPorMim\] = useState\(false\)/);
  assert.match(hook, /topFiveCurtidaSalvando, setTopFiveCurtidaSalvando\] = useState\(false\)/);
  assert.match(hook, /mostrarDestaquesVisitante, setMostrarDestaquesVisitante\][\s\S]*?useState\(false\)/);
  assert.match(hook, /function alternarMostrarDestaquesVisitante\(\)/);
  assert.match(hook, /setMostrarDestaquesVisitante\(\(valorAtual\) => !valorAtual\)/);
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega o estado e preserva os consumidores atuais de Top Five", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorTopFiveState \} from "\.\/hooks\/use-perfil-autor-top-five-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorTopFiveState\(\);/);

  for (const estadoLocal of [
    "const [topFiveObraIds, setTopFiveObraIds]",
    "const [topFiveCurtidasTotal, setTopFiveCurtidasTotal]",
    "const [topFiveCurtidoPorMim, setTopFiveCurtidoPorMim]",
    "const [topFiveCurtidaSalvando, setTopFiveCurtidaSalvando]",
    "const [mostrarDestaquesVisitante, setMostrarDestaquesVisitante]",
    "setMostrarDestaquesVisitante((valorAtual) => !valorAtual)",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorTopFiveStorageSync({",
    "usePerfilAutorTopFiveLikesSync({",
    "usePerfilAutorTopFiveLikeActions({",
    "usePerfilAutorAuthIdentitySync({",
    "usePerfilAutorProfileLoadSync({",
    "obterEstadoVisualDestaquesPerfilAutor({",
    "<ProfileHighlightsLikeButton",
    "<ProfileHero",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /onToggleVisitorHighlights=\{alternarMostrarDestaquesVisitante\}/,
  );
});
