import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-rating-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook centraliza somente os estados das avaliações", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /import \{[\s\S]*?avaliacaoAutorVazia,[\s\S]*?avaliacaoDiarioVazia,[\s\S]*?\} from "\.\.\/constants";/,
  );
  assert.match(
    hook,
    /import type \{[\s\S]*?AvaliacaoAutorPublica,[\s\S]*?AvaliacaoDiarioPublica,[\s\S]*?\} from "\.\.\/types";/,
  );
  assert.match(hook, /export function usePerfilAutorRatingState\(\)/);
  assert.match(
    hook,
    /avaliacaoAutor, setAvaliacaoAutor\][\s\S]*?useState<AvaliacaoAutorPublica>\(avaliacaoAutorVazia\)/,
  );
  assert.match(
    hook,
    /avaliacaoDiario, setAvaliacaoDiario\][\s\S]*?useState<AvaliacaoDiarioPublica>\(avaliacaoDiarioVazia\)/,
  );
  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega os estados e preserva os consumidores das avaliações", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorRatingState \} from "\.\/hooks\/use-perfil-autor-rating-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorRatingState\(\);/);

  for (const estadoLocal of [
    "const [avaliacaoAutor, setAvaliacaoAutor]",
    "const [avaliacaoDiario, setAvaliacaoDiario]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorRatingSync({",
    "usePerfilAutorDiaryRatingSync({",
    "usePerfilAutorRatingActions({",
    "usePerfilAutorDiaryRatingActions({",
    "usePerfilAutorAuthIdentitySync({",
    "obterEstadoVisualAvaliacaoPerfilAutor({",
    "<ProfileRatingsPanel",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }

  assert.match(
    pagina,
    /usePerfilAutorRatingSync\(\{[\s\S]*?setAvaliacaoAutor,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorDiaryRatingSync\(\{[\s\S]*?setAvaliacaoDiario,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorRatingActions\(\{[\s\S]*?avaliacaoAutor,[\s\S]*?setAvaliacaoAutor,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /usePerfilAutorDiaryRatingActions\(\{[\s\S]*?avaliacaoDiario,[\s\S]*?setAvaliacaoDiario,[\s\S]*?\}\);/,
  );
});
