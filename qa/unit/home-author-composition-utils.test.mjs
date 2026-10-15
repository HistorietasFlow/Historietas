import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-author-composition-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const moduloExecutavel = modulo
  .replace(
    `import {
  criarBioAutorPadrao,
  encontrarPerfilAutor,
  normalizarChaveAutor,
} from "./home-author-profile-utils";\n`,
    `const normalizarChaveAutor = (nome) => String(nome || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/\\s+/g, " ")
  .trim();
const encontrarPerfilAutor = (perfis, nome) => perfis[normalizarChaveAutor(nome)] || null;
const criarBioAutorPadrao = (generos) => "Autor de " + String(generos[0] || "histórias").toLowerCase() + " na Historietas.";
`,
  )
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    'const formatarGeneroHome = (genero) => genero.trim() || "Não informado";\n',
  )
  .replace(
    'import { criarHrefPerfilAutorHome } from "./home-route-utils";\n',
    `const criarHrefPerfilAutorHome = (nome, autorId = "") => {
  const parametros = new URLSearchParams();
  if (nome.trim()) parametros.set("autor", nome.trim());
  if (autorId.trim()) {
    parametros.set("autorId", autorId.trim());
    parametros.set("userId", autorId.trim());
  }
  const query = parametros.toString();
  return query ? "/perfil-autor?" + query : "/perfil-autor";
};
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarAutorHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-author-composition-utils preserva perfil salvo, gêneros e totais", () => {
  const autor = criarAutorHome(
    " Ana Souza ",
    " user-ana ",
    ["Fantasia", "", "Fantasia", "Romance", "Terror"],
    3,
    8,
    21,
    13,
    {
      "ana souza": { avatar: " avatar.png ", avatarNome: "", bio: " Bio salva " },
    },
  );

  assert.deepEqual(autor, {
    chave: "user-ana",
    nome: "Ana Souza",
    autorId: "user-ana",
    avatar: "avatar.png",
    bio: "Bio salva",
    totalObras: 3,
    totalCapitulos: 8,
    totalCurtidas: 21,
    totalComentarios: 13,
    generos: ["Fantasia", "Romance"],
    href: "/perfil-autor?autor=Ana+Souza&autorId=user-ana&userId=user-ana",
  });
});

test("home-author-composition-utils preserva fallback de nome, bio, avatar e href", () => {
  const autor = criarAutorHome("   ", "", [], 0, 0, 0, 0, {});

  assert.equal(autor.chave, "");
  assert.equal(autor.nome, "Autor não informado");
  assert.equal(autor.autorId, "");
  assert.equal(autor.avatar, "");
  assert.equal(autor.bio, "Autor de histórias na Historietas.");
  assert.deepEqual(autor.generos, []);
  assert.equal(autor.href, "/perfil-autor");
});

test("home-author-composition-utils estabelece a fronteira pura da composição", () => {
  assert.match(modulo, /import \{[\s\S]*?criarBioAutorPadrao,[\s\S]*?encontrarPerfilAutor,[\s\S]*?normalizarChaveAutor,[\s\S]*?\} from "\.\/home-author-profile-utils";/);
  assert.match(modulo, /import \{ formatarGeneroHome \} from "\.\/home-metadata-utils";/);
  assert.match(modulo, /import \{ criarHrefPerfilAutorHome \} from "\.\/home-route-utils";/);
  assert.match(modulo, /export function criarAutorHome\b/);
  assert.doesNotMatch(pagina, /function criarAutorHome\b/);
  assert.match(pagina, /from "\.\/lib\/home-author-composition-utils";/);
  assert.match(modulo, /Array\.from\(\s*new Set\(/);
  assert.match(modulo, /generosUnicos\.slice\(0, 2\)/);
  assert.match(modulo, /nomeAutor\.trim\(\) \|\| "Autor não informado"/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
