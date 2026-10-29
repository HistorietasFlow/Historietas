import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = new URL(
  "../../app/perfil-autor/top-5/lib/top5-user-name.ts",
  import.meta.url,
);
const pagePath = new URL(
  "../../app/perfil-autor/top-5/page.tsx",
  import.meta.url,
);

function carregarHelper(source) {
  const executavel = source
    .replace(/\r\n/g, "\n")
    .replace(
      'import { pegarTexto } from "./top5-work-normalizers";\n',
      `function pegarTexto(valor) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}
`,
    )
    .replace(
      "export function obterNomeInicialUsuarioTop5(\n  nome: unknown,\n  name: unknown,\n  email: unknown,\n) {",
      "function obterNomeInicialUsuarioTop5(nome, name, email) {",
    );

  return new Function(
    `${executavel}\nreturn { obterNomeInicialUsuarioTop5 };`,
  )().obterNomeInicialUsuarioTop5;
}

test("Top 5 delega a composição pura do nome inicial do usuário", async () => {
  const [helper, page] = await Promise.all([
    readFile(helperPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const obterNomeInicialUsuarioTop5 = carregarHelper(helper);

  assert.match(
    helper,
    /import \{ pegarTexto \} from "\.\/top5-work-normalizers";/,
  );
  assert.match(helper, /export function obterNomeInicialUsuarioTop5/);
  assert.match(
    helper,
    /pegarTexto\(nome\) \|\|\s*pegarTexto\(name\) \|\|\s*pegarTexto\(email\) \|\|\s*"Usuário"/,
  );

  assert.equal(
    obterNomeInicialUsuarioTop5(" Nome principal ", "Segundo nome", "email@exemplo.com"),
    "Nome principal",
  );
  assert.equal(
    obterNomeInicialUsuarioTop5("   ", " Nome alternativo ", "email@exemplo.com"),
    "Nome alternativo",
  );
  assert.equal(
    obterNomeInicialUsuarioTop5("", "", " email@exemplo.com "),
    "email@exemplo.com",
  );
  assert.equal(obterNomeInicialUsuarioTop5("", "", ""), "Usuário");
  assert.equal(obterNomeInicialUsuarioTop5(null, undefined, 42), "Usuário");

  assert.match(
    page,
    /import \{ obterNomeInicialUsuarioTop5 \} from "\.\/lib\/top5-user-name";/,
  );
  assert.doesNotMatch(
    page,
    /import \{ pegarTexto \} from "\.\/lib\/top5-work-normalizers";/,
  );
  assert.doesNotMatch(page, /pegarTexto\(authData\.user/);
  assert.match(
    page,
    /let nomeUsuario = obterNomeInicialUsuarioTop5\(\s*authData\.user\?\.user_metadata\?\.nome,\s*authData\.user\?\.user_metadata\?\.name,\s*authData\.user\?\.email,\s*\);/,
  );

  const userId = page.indexOf('const userId = authData.user?.id || "";');
  const nomeInicial = page.indexOf("let nomeUsuario = obterNomeInicialUsuarioTop5(");
  const carregamentoPerfil = page.indexOf(
    "nomeUsuario = await carregarNomePerfilTop5",
  );
  const primeiroCancelamento = page.indexOf("if (cancelado)");
  const segundoCancelamento = page.indexOf(
    "if (cancelado)",
    primeiroCancelamento + 1,
  );

  assert.ok(userId < nomeInicial);
  assert.ok(nomeInicial < carregamentoPerfil);
  assert.ok(primeiroCancelamento < carregamentoPerfil);
  assert.ok(carregamentoPerfil < segundoCancelamento);
  assert.match(
    page,
    /nomeUsuario = await carregarNomePerfilTop5\(\s*userId,\s*nomeUsuario,\s*\);/,
  );
  assert.match(page, /removerIdSelecionadoTop5\(/);
  assert.match(page, /moverIdSelecionadoTop5\(/);
  assert.match(page, /alternarIdSelecionadoTop5\(/);

  for (const forbidden of [
    "react",
    "useEffect",
    "supabase",
    "auth",
    "useRouter",
    "localStorage",
    "setMensagem",
    "style={",
    "<div",
  ]) {
    assert.doesNotMatch(
      helper,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
