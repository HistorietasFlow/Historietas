import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-about-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo(maxSobreBio = 12) {
  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { SOBRE_BIO_MAX_LENGTH } from "../constants";',
        `const SOBRE_BIO_MAX_LENGTH = ${maxSobreBio};`,
      )
      .replace('import type { PerfilAutorSalvo } from "../types";\n', ""),
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

function criarAcoes(modulo, overrides = {}) {
  const salvos = [];
  const perfilSalvoAutor = {
    avatar: "avatar-salvo",
    avatarNome: "avatar.png",
    bio: "bio antiga",
    sobreBio: "sobre antiga",
    mostrarDestaques: true,
    ...overrides.perfilSalvoAutor,
  };

  return {
    ...modulo.usePerfilAutorAboutActions({
      avatarAutor: overrides.avatarAutor ?? "avatar-atual",
      perfilSalvoAutor,
      bioAutorPersonalizada: overrides.bioAutorPersonalizada ?? "bio atual",
      bioSobrePersonalizada:
        overrides.bioSobrePersonalizada ?? "sobre atual",
      salvarPerfilAutor(perfil) {
        salvos.push(perfil);
      },
    }),
    salvos,
  };
}

test("atualiza a bio Sobre preservando os demais campos e o limite", async () => {
  const modulo = await carregarModulo(8);
  const acoes = criarAcoes(modulo);

  acoes.atualizarBioSobreAutor("1234567890");

  assert.deepEqual(acoes.salvos, [{
    avatar: "avatar-atual",
    avatarNome: "avatar.png",
    bio: "bio atual",
    sobreBio: "12345678",
    mostrarDestaques: true,
  }]);
});

test("alterna destaques preservando avatar, bio e Sobre atuais", async () => {
  const modulo = await carregarModulo();
  const acoes = criarAcoes(modulo, {
    perfilSalvoAutor: { mostrarDestaques: false },
  });

  acoes.alternarDestaquesPerfil();

  assert.deepEqual(acoes.salvos, [{
    avatar: "avatar-atual",
    avatarNome: "avatar.png",
    bio: "bio atual",
    sobreBio: "sobre atual",
    mostrarDestaques: true,
  }]);
});

test("Perfil de Autor delega as ações da seção Sobre para o hook", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorAboutActions \} from "\.\/hooks\/use-perfil-autor-about-actions";/,
  );
  assert.match(
    pagina,
    /const \{ atualizarBioSobreAutor, alternarDestaquesPerfil \} =[\s\S]*?usePerfilAutorAboutActions\(\{[\s\S]*?avatarAutor,[\s\S]*?perfilSalvoAutor,[\s\S]*?bioAutorPersonalizada,[\s\S]*?bioSobrePersonalizada,[\s\S]*?salvarPerfilAutor,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /function atualizarBioSobreAutor\(/);
  assert.doesNotMatch(pagina, /function alternarDestaquesPerfil\(/);
  assert.match(source, /novaBioSobre\.slice\(0, SOBRE_BIO_MAX_LENGTH\)/);
  assert.match(
    source,
    /mostrarDestaques: !perfilSalvoAutor\.mostrarDestaques/,
  );
  assert.doesNotMatch(source, /supabase|useEffect|localStorage/);
});
