import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-auth-identity-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("lifecycle de identidade da obra pertence ao hook dedicado", () => {
  assert.match(hook, /export function useObraAuthIdentityLifecycle/);
  assert.match(hook, /const \[usuarioIdLogado, setUsuarioIdLogado\] = useState\(""\);/);
  assert.match(
    hook,
    /const \[autenticacaoCarregada, setAutenticacaoCarregada\] = useState\(false\);/,
  );
  assert.match(hook, /useRef<IdentidadeAutenticadaObra>\(\{/);
  assert.match(hook, /const versaoConsultaAutenticacaoObraRef = useRef\(0\);/);
  assert.match(
    paginaObra,
    /useObraAuthIdentityLifecycle\(\{\s*onIdentidadeMudou: limparEstadoContaAnterior,\s*\}\)/,
  );
  assert.doesNotMatch(paginaObra, /supabase\.auth\.onAuthStateChange/);
});

test("hook preserva consulta versionada, evento de auth e cleanup", () => {
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /execucaoAutenticacaoObraEstaAtual\(/);
  assert.match(hook, /supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{/);
  assert.match(
    hook,
    /versaoConsultaAutenticacaoObraRef\.current \+= 1;\s*aplicarIdentidadeAutenticada\(session\?\.user\?\.id \|\| ""\);/,
  );
  assert.match(
    hook,
    /componenteAtivo = false;\s*versaoConsultaAutenticacaoObraRef\.current \+= 1;\s*subscription\.unsubscribe\(\);/,
  );
});

test("reset da conta anterior continua sincronizado com mudanca real de identidade", () => {
  const indiceMudou = hook.indexOf("if (resultado.mudou) {");
  const indiceAtualizarRef = hook.indexOf(
    "identidadeAutenticadaObraRef.current = resultado.identidade;",
    indiceMudou,
  );
  const indiceReset = hook.indexOf("onIdentidadeMudou();", indiceMudou);
  const indiceUsuario = hook.indexOf(
    "setUsuarioIdLogado(resultado.identidade.usuarioId);",
    indiceMudou,
  );

  assert.ok(indiceMudou >= 0);
  assert.ok(indiceAtualizarRef > indiceMudou);
  assert.ok(indiceReset > indiceAtualizarRef);
  assert.ok(indiceUsuario > indiceReset);
});
