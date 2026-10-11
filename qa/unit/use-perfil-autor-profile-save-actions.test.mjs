import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-profile-save-actions.ts",
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
  resultadoRemoto = { ok: true, erro: "" },
} = {}) {
  const chamadas = [];

  globalThis.__profileSaveDependencies = {
    salvarJson(chave, userId, valor) {
      chamadas.push(["json", chave, userId, valor]);
    },
    async salvarRemoto(payload) {
      chamadas.push(["remoto", payload]);
      return resultadoRemoto;
    },
  };

  const javascript = typescript.transpileModule(
    source
      .replace(
        /import \{[\s\S]*?AUTHOR_PROFILE_STORAGE_KEY,[\s\S]*?BIO_MAX_LENGTH,[\s\S]*?SOBRE_BIO_MAX_LENGTH,[\s\S]*?\} from "\.\.\/constants";/,
        'const AUTHOR_PROFILE_STORAGE_KEY = "author-profile";\nconst BIO_MAX_LENGTH = 10;\nconst SOBRE_BIO_MAX_LENGTH = 12;',
      )
      .replace(
        'import { salvarJsonUsuarioPerfilAutor } from "../lib/profile-local-storage-utils";',
        "const salvarJsonUsuarioPerfilAutor = globalThis.__profileSaveDependencies.salvarJson;",
      )
      .replace(
        'import { salvarPerfilUsuarioSupabase } from "../lib/profile-profile-persistence";',
        "const salvarPerfilUsuarioSupabase = globalThis.__profileSaveDependencies.salvarRemoto;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas };
}

function criarAcoes(
  modulo,
  {
    autorChavePerfil = "autor-chave",
    usuarioIdLogado = "11111111-1111-4111-8111-111111111111",
    perfilAutorId = "11111111-1111-4111-8111-111111111111",
    podeEditarPerfil = true,
    avatarRemoto = "https://cdn.example/avatar-antigo.png",
  } = {},
) {
  const chamadas = [];
  let perfis = {
    existente: {
      avatar: "",
      avatarNome: "",
      bio: "",
      sobreBio: "",
      mostrarDestaques: false,
    },
  };

  return {
    ...modulo.usePerfilAutorProfileSaveActions({
      autorChavePerfil,
      perfisAutoresSalvos: perfis,
      usuarioIdLogado,
      perfilParaMostrar: {
        autorId: perfilAutorId,
        nome: "Autora",
      },
      podeEditarPerfil,
      perfilUsuarioRemotoAtivo: {
        userId: perfilAutorId,
        nome: "Autora remota",
        username: "autora",
        avatar: avatarRemoto,
        bio: "",
        sobreBio: "",
        criadoEm: "2026-01-01",
      },
      setPerfisAutoresSalvos(valor) {
        perfis = typeof valor === "function" ? valor(perfis) : valor;
        chamadas.push(["perfis", perfis]);
      },
      setPerfilUsuarioRemoto(valor) {
        chamadas.push(["perfil-remoto", valor]);
      },
      setMensagemAcao(valor) {
        chamadas.push(["mensagem", valor]);
      },
    }),
    chamadas,
  };
}

test("normaliza limites e persiste o perfil por usuário", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.salvarPerfilAutor({
    avatar: "https://cdn.example/avatar.png",
    avatarNome: "avatar.png",
    bio: "123456789012345",
    sobreBio: "abcdefghijklmnop",
    mostrarDestaques: true,
  });

  const json = modulo.chamadas.find((chamada) => chamada[0] === "json");
  assert.equal(json[1], "author-profile");
  assert.equal(json[2], "11111111-1111-4111-8111-111111111111");
  assert.equal(json[3]["autor-chave"].bio, "1234567890");
  assert.equal(json[3]["autor-chave"].sobreBio, "abcdefghijkl");
  assert.equal(json[3]["autor-chave"].mostrarDestaques, true);
});

test("avatar local mantém o avatar remoto no Supabase", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo);

  acoes.salvarPerfilAutor({
    avatar: "data:image/png;base64,abc",
    avatarNome: "avatar.png",
    bio: "bio",
    sobreBio: "sobre",
    mostrarDestaques: false,
  });

  await Promise.resolve();

  const remoto = modulo.chamadas.find((chamada) => chamada[0] === "remoto");
  assert.equal(
    remoto[1].perfil.avatar,
    "https://cdn.example/avatar-antigo.png",
  );
  assert.equal(remoto[1].nome, "Autora");
  assert.equal(remoto[1].username, "autora");
});

test("não sincroniza remotamente quando o perfil não pertence ao usuário", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    perfilAutorId: "22222222-2222-4222-8222-222222222222",
  });

  acoes.salvarPerfilAutor({
    avatar: "",
    avatarNome: "",
    bio: "bio",
    sobreBio: "sobre",
    mostrarDestaques: false,
  });

  await Promise.resolve();

  assert.equal(
    modulo.chamadas.some((chamada) => chamada[0] === "remoto"),
    false,
  );
});

test("falha remota mantém fallback local e mostra mensagem", async () => {
  const modulo = await carregarModulo({
    resultadoRemoto: { ok: false, erro: "indisponível" },
  });
  const acoes = criarAcoes(modulo);

  acoes.salvarPerfilAutor({
    avatar: "",
    avatarNome: "",
    bio: "bio",
    sobreBio: "sobre",
    mostrarDestaques: false,
  });

  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(
    acoes.chamadas.find((chamada) => chamada[0] === "mensagem"),
    ["mensagem", "Perfil salvo neste aparelho. Supabase: indisponível"],
  );
});

test("Perfil de Autor delega salvarPerfilAutor para o hook", () => {
  assert.match(pagina, /usePerfilAutorProfileSaveActions/);
  assert.match(
    pagina,
    /const \{ salvarPerfilAutor \} = usePerfilAutorProfileSaveActions\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /function salvarPerfilAutor\(novoPerfil: PerfilAutorSalvo\)/,
  );
  assert.match(source, /salvarJsonUsuarioPerfilAutor\(/);
  assert.match(source, /salvarPerfilUsuarioSupabase\(/);
});
