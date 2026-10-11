import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-profile-editor-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo() {
  const javascript = typescript.transpileModule(
    source.replace('import type { RefObject } from "react";\n', ""),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
}

function criarAcoes(
  modulo,
  {
    podeEditarPerfil = true,
    perfilParaMostrar = { nome: "Nome local" },
    perfilUsuarioRemotoAtivo = {
      nome: "Nome remoto",
      username: "autora",
    },
    salvandoEditorPerfil = false,
  } = {},
) {
  const chamadas = [];
  const input = { current: { value: "avatar.png" } };

  return {
    ...modulo.usePerfilAutorProfileEditorActions({
      podeEditarPerfil,
      perfilParaMostrar,
      perfilUsuarioRemotoAtivo,
      bioAutorPersonalizada: "Bio atual",
      avatarAutor: "avatar-atual",
      avatarNomePerfil: "avatar-salvo.png",
      salvandoEditorPerfil,
      avatarInputRef: input,
      setNomePerfilEditor(valor) {
        chamadas.push(["nome", valor]);
      },
      setUsernamePerfilEditor(valor) {
        chamadas.push(["username", valor]);
      },
      setBioPerfilEditor(valor) {
        chamadas.push(["bio", valor]);
      },
      setAvatarPerfilEditor(valor) {
        chamadas.push(["avatar", valor]);
      },
      setAvatarNomePerfilEditor(valor) {
        chamadas.push(["avatarNome", valor]);
      },
      setAvatarArquivoPerfilEditor(valor) {
        chamadas.push(["avatarArquivo", valor]);
      },
      setAvatarErro(valor) {
        chamadas.push(["avatarErro", valor]);
      },
      setMenuPerfilAberto(valor) {
        chamadas.push(["menu", valor]);
      },
      setEditorPerfilAberto(valor) {
        chamadas.push(["editor", valor]);
      },
    }),
    chamadas,
    input,
  };
}

test("abre o editor preenchendo os valores atuais e fechando o menu", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.abrirEditorPerfil();

  assert.deepEqual(acoes.chamadas, [
    ["nome", "Nome remoto"],
    ["username", "autora"],
    ["bio", "Bio atual"],
    ["avatar", "avatar-atual"],
    ["avatarNome", "avatar-salvo.png"],
    ["avatarArquivo", null],
    ["avatarErro", ""],
    ["menu", false],
    ["editor", true],
  ]);
});

test("usa nome local quando o perfil remoto não fornece nome", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    perfilUsuarioRemotoAtivo: { nome: "", username: "" },
  });

  acoes.abrirEditorPerfil();

  assert.deepEqual(acoes.chamadas.slice(0, 2), [
    ["nome", "Nome local"],
    ["username", ""],
  ]);
});

test("não abre o editor sem permissão ou sem perfil", async () => {
  const modulo = await carregarModulo();

  const semPermissao = criarAcoes(modulo, { podeEditarPerfil: false });
  semPermissao.abrirEditorPerfil();
  assert.deepEqual(semPermissao.chamadas, []);

  const semPerfil = criarAcoes(modulo, { perfilParaMostrar: null });
  semPerfil.abrirEditorPerfil();
  assert.deepEqual(semPerfil.chamadas, []);
});

test("fecha o editor e limpa erro/input quando não está salvando", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.fecharEditorPerfil();

  assert.deepEqual(acoes.chamadas, [
    ["editor", false],
    ["avatarErro", ""],
  ]);
  assert.equal(acoes.input.current.value, "");
});

test("não fecha o editor enquanto o salvamento está em andamento", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, { salvandoEditorPerfil: true });

  acoes.fecharEditorPerfil();

  assert.deepEqual(acoes.chamadas, []);
  assert.equal(acoes.input.current.value, "avatar.png");
});

test("Perfil de Autor delega abertura e fechamento do editor para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorProfileEditorActions \} from "\.\/hooks\/use-perfil-autor-profile-editor-actions";/,
  );
  assert.match(
    pagina,
    /const \{ abrirEditorPerfil, fecharEditorPerfil \} =[\s\S]*?usePerfilAutorProfileEditorActions\(\{/,
  );
  assert.doesNotMatch(pagina, /function abrirEditorPerfil\(/);
  assert.doesNotMatch(pagina, /function fecharEditorPerfil\(/);
  assert.match(source, /if \(!podeEditarPerfil \|\| !perfilParaMostrar\)/);
  assert.match(source, /if \(salvandoEditorPerfil\)/);
  assert.doesNotMatch(source, /supabase|useEffect|localStorage/);
});
