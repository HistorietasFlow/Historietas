import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-display-utils.ts", import.meta.url),
  "utf8",
);

globalThis.__profileDisplayDependencies = {
  criarBioAutor(perfil) {
    return `Bio padrão de ${perfil.nome}`;
  },
  criarHandlePerfilAutor(nome, autorId, username) {
    return username ? `@${username}` : `@${nome.toLowerCase()}-${autorId}`;
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      'import { criarHandlePerfilAutor } from "./profile-formatters";',
      "const { criarHandlePerfilAutor } = globalThis.__profileDisplayDependencies;",
    )
    .replace(
      'import { criarBioAutor } from "./work-normalizers";',
      "const { criarBioAutor } = globalThis.__profileDisplayDependencies;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const { obterDadosExibicaoPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function perfil(autorId = "user-a", nome = "Ana") {
  return {
    autorId,
    nome,
    obras: [],
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: 0,
  };
}

test("prioriza dados locais salvos sobre perfil remoto", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "USER-A",
      nome: "Ana",
      username: "ana.remota",
      avatar: "avatar-remoto",
      bio: "Bio remota",
      sobreBio: "Sobre remoto",
      criadoEm: "",
    },
    perfisAutoresSalvos: {
      "user-a": {
        avatar: "avatar-local",
        avatarNome: "avatar.png",
        bio: "Bio local",
        sobreBio: "Sobre local",
        mostrarDestaques: true,
      },
    },
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.perfilUsuarioRemotoAtivo.username, "ana.remota");
  assert.equal(resultado.bioAutorPersonalizada, "Bio local");
  assert.equal(resultado.bioSobrePersonalizada, "Sobre local");
  assert.equal(resultado.bioSobreAutor, "Sobre local");
  assert.equal(resultado.avatarAutor, "avatar-local");
  assert.equal(resultado.autorHandlePerfil, "@ana.remota");
});

test("usa perfil remoto quando não há personalização local", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "user-a",
      nome: "Ana",
      username: "ana",
      avatar: "avatar-remoto",
      bio: "Bio remota",
      sobreBio: "Sobre remoto",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.bioAutorPersonalizada, "Bio remota");
  assert.equal(resultado.bioSobrePersonalizada, "Sobre remoto");
  assert.equal(resultado.avatarAutor, "avatar-remoto");
  assert.equal(resultado.autorHandlePerfil, "@ana");
});

test("ignora perfil remoto de outro usuário e usa fallbacks", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil("user-a", "Ana"),
    perfilUsuarioRemoto: {
      userId: "user-b",
      nome: "Bia",
      username: "bia",
      avatar: "avatar-b",
      bio: "Bio B",
      sobreBio: "Sobre B",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.perfilUsuarioRemotoAtivo, null);
  assert.equal(resultado.bioAutorPersonalizada, "");
  assert.equal(resultado.bioAutor, "Bio padrão de Ana");
  assert.equal(resultado.bioSobreAutor, "Bio padrão de Ana");
  assert.equal(resultado.avatarAutor, "");
  assert.equal(resultado.autorHandlePerfil, "@ana-user-a");
});

test("preserva detecção da bio padrão do leitor e fallback sem perfil", () => {
  const padrao = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "user-a",
      nome: "Ana",
      username: "",
      avatar: "",
      bio: "",
      sobreBio: "Perfil de leitor no Historietas.",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });
  assert.equal(padrao.bioSobreAutorEhPadrao, true);

  const vazio = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: null,
    perfilUsuarioRemoto: null,
    perfisAutoresSalvos: {},
    autorChavePerfil: "",
    autorNormalizadoParaSeguir: "",
  });
  assert.equal(vazio.bioAutor, "");
  assert.equal(vazio.bioSobreAutor, "");
  assert.equal(vazio.avatarAutor, "");
  assert.equal(vazio.autorHandlePerfil, "@autor.historietas");
});
