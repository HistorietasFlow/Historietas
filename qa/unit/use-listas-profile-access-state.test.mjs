import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-profile-access-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const loader = ler("../../app/listas/hooks/use-listas-page-data-loader.ts");
const annotationActions = ler(
  "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
);
const interactionActions = ler(
  "../../app/listas/hooks/use-listas-diary-interaction-actions.ts",
);
const commentsRenderer = ler(
  "../../app/listas/hooks/use-listas-diary-comments-renderer.tsx",
);
const profileRenderer = ler(
  "../../app/listas/hooks/use-listas-profile-item-renderer.tsx",
);

test("hook centraliza somente o estado de acesso e privacidade do perfil de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /preferenciasPrivacidadePadrao/);
  assert.match(hook, /EstadoRelacionamentoPerfil/);
  assert.match(hook, /PreferenciasPrivacidadeHistorietas/);
  assert.match(hook, /export function useListasProfileAccessState\(\)/);
  assert.match(
    hook,
    /preferenciasPerfil, setPreferenciasPerfil\]\s*=\s*useState<PreferenciasPrivacidadeHistorietas>\(preferenciasPrivacidadePadrao\)/,
  );
  assert.match(
    hook,
    /relacionamentoPerfil, setRelacionamentoPerfil\]\s*=\s*useState<EstadoRelacionamentoPerfil>\("nenhum"\)/,
  );
  assert.doesNotMatch(
    hook,
    /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</,
  );
});

test("Listas delega os estados e preserva loader, permissões e consumidores", () => {
  assert.match(
    pagina,
    /import \{ useListasProfileAccessState \} from "\.\/hooks\/use-listas-profile-access-state";/,
  );
  assert.match(pagina, /\} = useListasProfileAccessState\(\);/);
  assert.equal(
    pagina.includes("const [preferenciasPerfil, setPreferenciasPerfil]"),
    false,
  );
  assert.equal(
    pagina.includes("const [relacionamentoPerfil, setRelacionamentoPerfil]"),
    false,
  );
  assert.match(
    pagina,
    /useListasPageDataLoader\(\{[\s\S]*?setPreferenciasPerfil,[\s\S]*?setRelacionamentoPerfil,/,
  );
  assert.match(
    pagina,
    /useListasDiaryAnnotationActions\(\{[\s\S]*?preferenciasPerfil,/,
  );
  assert.match(
    pagina,
    /useListasDiaryInteractionActions\(\{[\s\S]*?preferenciasPerfil,[\s\S]*?relacionamentoPerfil,/,
  );
  assert.match(
    pagina,
    /obterPermissoesAnotacaoListas\(\{[\s\S]*?relacionamentoPerfil,[\s\S]*?quemPodeComentarDiario: preferenciasPerfil\.quemPodeComentarDiario,/,
  );
  assert.match(
    pagina,
    /useListasDiaryCommentsRenderer\(\{[\s\S]*?preferenciasPerfil,[\s\S]*?relacionamentoPerfil,/,
  );
  assert.match(loader, /carregarPreferenciasPrivacidade/);
  assert.match(loader, /carregarEstadoRelacionamentoPerfil/);
  assert.match(loader, /proprioPerfil/);
  assert.match(annotationActions, /preferenciasPerfil/);
  assert.match(interactionActions, /preferenciasPerfil/);
  assert.match(interactionActions, /relacionamentoPerfil/);
  assert.match(commentsRenderer, /preferenciasPerfil/);
  assert.match(commentsRenderer, /relacionamentoPerfil/);
  assert.match(profileRenderer, /preferenciasPerfil/);
  assert.match(profileRenderer, /relacionamentoPerfil/);
});
