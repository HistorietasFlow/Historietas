import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/comunidade/page.tsx", "utf8");
const source = readFileSync("app/admin/comunidade/lib/admin-comunidade-route-utils.ts", "utf8");

test("rotas de moderação preservam contratos", () => {
  assert.match(source, /window\.location\.pathname/);
  assert.match(source, /window\.location\.search/);
  assert.match(source, /: "\/admin"/);
  assert.match(source, /startsWith\("\/"\) && !redirectTo\.startsWith\("\/\/"\)/);
  assert.match(source, /perfilUrl\.trim\(\)/);
  assert.match(source, /encodeURIComponent\(denuncia\.denunciadoId\)/);
  assert.match(source, /modo: "perfil"/);
  assert.match(source, /origem: "diario"/);
  assert.match(source, /params\.set\("userId"/);
  assert.match(source, /params\.set\("obraId"/);
  assert.doesNotMatch(page, /function criarLoginHrefAdminModeracao/);
  assert.doesNotMatch(page, /function criarHrefPerfilDenunciado/);
  assert.doesNotMatch(page, /function criarHrefDiarioDenunciado/);
  assert.match(page, /from "\.\/lib\/admin-comunidade-route-utils"/);
  assert.doesNotMatch(source, /useState|useEffect|supabase|localStorage|router|<[A-Z][A-Za-z0-9]*/);
});
