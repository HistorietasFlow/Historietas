import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-report-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo({
  autorValido = true,
  conteudoValido = true,
} = {}) {
  globalThis.__profileReportActionsDependencies = {
    idAutorSupabaseValido() {
      return autorValido;
    },
    idObraSupabaseValido() {
      return conteudoValido;
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { idObraSupabaseValido } from "../../../lib/utils";',
        "const idObraSupabaseValido = globalThis.__profileReportActionsDependencies.idObraSupabaseValido;",
      )
      .replace(
        'import { idAutorSupabaseValido } from "../lib/profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profileReportActionsDependencies.idAutorSupabaseValido;",
      ),
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
    podeEditarPerfil = false,
    perfilParaMostrar = { autorId: " autor-1 " },
  } = {},
) {
  const mensagens = [];
  const menus = [];
  const denunciasPerfil = [];
  const menusObra = [];
  const alvos = [];

  return {
    ...modulo.usePerfilAutorReportActions({
      podeEditarPerfil,
      perfilParaMostrar,
      setMensagemAcao(valor) {
        mensagens.push(valor);
      },
      setMenuPerfilAberto(valor) {
        menus.push(valor);
      },
      setDenunciaPerfilAberta(valor) {
        denunciasPerfil.push(valor);
      },
      setObraMenuAbertoId(valor) {
        menusObra.push(valor);
      },
      setAlvoDenunciaConteudoPerfil(valor) {
        alvos.push(valor);
      },
    }),
    mensagens,
    menus,
    denunciasPerfil,
    menusObra,
    alvos,
  };
}

test("abre denúncia de perfil válido preservando a ordem dos estados", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.abrirDenunciaPerfil();

  assert.deepEqual(acoes.menus, [false]);
  assert.deepEqual(acoes.mensagens, [""]);
  assert.deepEqual(acoes.denunciasPerfil, [true]);
});

test("bloqueia denúncia do próprio perfil e rejeita autor inválido", async () => {
  const modulo = await carregarModulo({ autorValido: false });

  const proprio = criarAcoes(modulo, { podeEditarPerfil: true });
  proprio.abrirDenunciaPerfil();
  assert.deepEqual(proprio.mensagens, []);
  assert.deepEqual(proprio.denunciasPerfil, []);

  const invalido = criarAcoes(modulo);
  invalido.abrirDenunciaPerfil();
  assert.deepEqual(invalido.mensagens, [
    "Não foi possível identificar este perfil.",
  ]);
  assert.deepEqual(invalido.denunciasPerfil, []);
});

test("abre denúncia de conteúdo normalizando id e título", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.abrirDenunciaConteudoPerfil("obra", " obra-1 ", "  Minha Obra  ");

  assert.deepEqual(acoes.menusObra, [""]);
  assert.deepEqual(acoes.mensagens, [""]);
  assert.deepEqual(acoes.alvos, [{
    alvoTipo: "obra",
    alvoId: "obra-1",
    alvoTitulo: "Minha Obra",
  }]);
});

test("usa título padrão e rejeita conteúdo inválido", async () => {
  const valido = await carregarModulo();
  const acoesValidas = criarAcoes(valido);
  acoesValidas.abrirDenunciaConteudoPerfil("post", " post-1 ", "   ");
  assert.equal(acoesValidas.alvos[0].alvoTitulo, "Conteúdo");

  const invalido = await carregarModulo({ conteudoValido: false });
  const acoesInvalidas = criarAcoes(invalido);
  acoesInvalidas.abrirDenunciaConteudoPerfil("post", "post-x", "Post");
  assert.deepEqual(acoesInvalidas.mensagens, [
    "Não foi possível identificar este conteúdo.",
  ]);
  assert.deepEqual(acoesInvalidas.alvos, []);
});

test("Perfil de Autor delega as ações de denúncia para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorReportActions \} from "\.\/hooks\/use-perfil-autor-report-actions";/,
  );
  assert.match(
    pagina,
    /const \{ abrirDenunciaPerfil, abrirDenunciaConteudoPerfil \} =[\s\S]*?usePerfilAutorReportActions\(\{/,
  );
  assert.doesNotMatch(pagina, /function abrirDenunciaPerfil\(/);
  assert.doesNotMatch(pagina, /function abrirDenunciaConteudoPerfil\(/);
  assert.match(source, /setDenunciaPerfilAberta\(true\)/);
  assert.match(source, /setAlvoDenunciaConteudoPerfil\(\{/);
  assert.doesNotMatch(source, /supabase|useEffect|localStorage/);
});
