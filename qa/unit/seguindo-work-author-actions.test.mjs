import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-work-author-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);

test("hook preserva ações de deixar de seguir obra e autor", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /const novasObrasSeguidas = removerObraDaLista\(obra, obrasSeguidas\);/,
  );
  assert.match(
    hook,
    /salvarJsonStorageUsuarioSeguindo\([\s\S]*?FOLLOW_STORAGE_KEY,[\s\S]*?usuarioLogadoId,[\s\S]*?novasObrasSeguidas/,
  );
  assert.match(
    hook,
    /void sincronizarObraUsuarioSupabase\("seguindo_obras", obra\.id, false\);/,
  );
  assert.match(
    hook,
    /const novosAutoresSeguidos = autoresSeguidos\.filter\([\s\S]*?autor !== autorChave/,
  );
  assert.match(
    hook,
    /salvarJsonStorageUsuarioSeguindo\([\s\S]*?AUTHOR_FOLLOW_STORAGE_KEY,[\s\S]*?usuarioLogadoId,[\s\S]*?novosAutoresSeguidos/,
  );
  assert.match(hook, /setAutoresSeguidos\(novosAutoresSeguidos\);/);
});

test("página delega as ações de obra e autor ao hook", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoWorkAuthorActions \} from "\.\/hooks\/use-seguindo-work-author-actions";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?deixarDeSeguirObra,[\s\S]*?deixarDeSeguirAutor,[\s\S]*?\} = useSeguindoWorkAuthorActions\(\{[\s\S]*?usuarioLogadoId,[\s\S]*?obrasSeguidas,[\s\S]*?autoresSeguidos,[\s\S]*?setObrasSeguidas,[\s\S]*?setAutoresSeguidos,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /function deixarDeSeguirObra\(/);
  assert.doesNotMatch(pagina, /function deixarDeSeguirAutor\(/);
  assert.doesNotMatch(pagina, /sincronizarObraUsuarioSupabase/);
  assert.doesNotMatch(pagina, /salvarJsonStorageUsuarioSeguindo/);
  assert.doesNotMatch(pagina, /FOLLOW_STORAGE_KEY/);
  assert.doesNotMatch(pagina, /AUTHOR_FOLLOW_STORAGE_KEY/);
});
