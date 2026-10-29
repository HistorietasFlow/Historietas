import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-profile-name-loader.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

test("Top 5 delega somente o carregamento do nome de perfil", async () => {
  const [loader, page] = await Promise.all([
    readFile(loaderPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(
    loader,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    loader,
    /import \{ pegarTexto \} from "\.\/top5-work-normalizers";/,
  );
  assert.match(loader, /export async function carregarNomePerfilTop5/);
  assert.match(loader, /\.from\("profiles"\)/);
  assert.match(loader, /\.select\("nome"\)/);
  assert.match(loader, /\.eq\("user_id", userId\)/);
  assert.match(loader, /\.limit\(1\)/);
  assert.match(loader, /\.maybeSingle\(\)/);
  assert.match(loader, /if \(!erroPerfilAtual\)/);
  assert.match(loader, /pegarTexto\(perfilAtual\?\.nome\) \|\| nomeAtual/);
  assert.match(loader, /return nomeAtual;/);
  assert.doesNotMatch(loader, /try\s*\{/);
  assert.doesNotMatch(loader, /catch\s*\(/);

  assert.match(
    page,
    /import \{ carregarNomePerfilTop5 \} from "\.\/lib\/top5-profile-name-loader";/,
  );
  assert.doesNotMatch(page, /\.from\("profiles"\)/);
  assert.match(
    page,
    /nomeUsuario = await carregarNomePerfilTop5\(\s*userId,\s*nomeUsuario,\s*\);/,
  );
  assert.match(
    page,
    /import \{ carregarDadosIniciaisTop5 \} from "\.\/lib\/top5-initial-data-loader";/,
  );
  assert.match(page, /await carregarDadosIniciaisTop5\(\)/);
  assert.match(
    page,
    /let nomeUsuario = obterNomeInicialUsuarioTop5\(\s*authData\.user\?\.user_metadata\?\.nome,\s*authData\.user\?\.user_metadata\?\.name,\s*authData\.user\?\.email,\s*\);/,
  );

  const primeiroCancelamento = page.indexOf("if (cancelado)");
  const carregamentoPerfil = page.indexOf("nomeUsuario = await carregarNomePerfilTop5");
  const segundoCancelamento = page.indexOf(
    "if (cancelado)",
    primeiroCancelamento + 1,
  );
  assert.ok(primeiroCancelamento < carregamentoPerfil);
  assert.ok(carregamentoPerfil < segundoCancelamento);

  assert.match(page, /setUsuario\(userId \? \{ id: userId, nome: nomeUsuario \} : null\);/);
  assert.match(page, /setObras\(obrasMescladas\);/);
  assert.match(page, /setIdsSelecionados\(idsNormalizados\);/);
  assert.match(page, /removerIdSelecionadoTop5\(/);
  assert.match(page, /moverIdSelecionadoTop5\(/);
  assert.match(page, /alternarIdSelecionadoTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "useState",
    "useRouter",
    "localStorage",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      loader,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
