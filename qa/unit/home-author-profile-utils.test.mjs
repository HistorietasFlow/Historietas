import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-author-profile-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const cardAutor = readFileSync(
  new URL("../../components/HomeAuthorCard.tsx", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    'import { formatarGeneroHome } from "./home-metadata-utils";\n',
    `const formatarGeneroHome = (genero) => {
  const generoLimpo = genero.trim();
  return generoLimpo || "Não informado";
};
`,
  )
  .replace(
    'import { normalizarTexto } from "../../lib/utils";\n',
    `const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .trim();
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarBioAutorPadrao,
  criarIniciaisAutor,
  encontrarPerfilAutor,
  normalizarChaveAutor,
  normalizarPerfilAutorSalvo,
  normalizarPerfisAutoresSalvos,
  normalizarPerfilSupabaseHome,
  obterValorTextoPerfilHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const perfil = (overrides = {}) => ({
  avatar: "avatar.png",
  avatarNome: "avatar",
  bio: "Biografia",
  ...overrides,
});

const perfilSupabase = (overrides = {}) => ({
  avatar_url: "avatar.png",
  bio: "Bio principal",
  id: "id-autor",
  nome: "Ana Souza",
  sobre_bio: "Sobre autora",
  user_id: "user-autor",
  ...overrides,
});

test("home-author-profile-utils normaliza chaves e iniciais de autores", () => {
  assert.equal(normalizarChaveAutor("  José   da  Silva  "), "jose da silva");
  assert.equal(criarIniciaisAutor("   "), "H");
  assert.equal(criarIniciaisAutor("ana"), "A");
  assert.equal(criarIniciaisAutor("Ana Souza"), "AS");
  assert.equal(criarIniciaisAutor("Ana Beatriz Souza"), "AB");
});

test("home-author-profile-utils normaliza perfis salvos e mapas inválidos", () => {
  assert.equal(normalizarPerfilAutorSalvo(null), null);
  assert.equal(normalizarPerfilAutorSalvo([]), null);
  assert.deepEqual(normalizarPerfilAutorSalvo(perfil({ avatar: 1, avatarNome: null })), {
    avatar: "",
    avatarNome: "",
    bio: "Biografia",
  });
  assert.deepEqual(normalizarPerfisAutoresSalvos(null), {});
  assert.deepEqual(normalizarPerfisAutoresSalvos([]), {});
  assert.deepEqual(normalizarPerfisAutoresSalvos({
    ana: perfil(),
    invalido: [],
    bruno: perfil({ bio: "Bio Bruno" }),
  }), {
    ana: perfil(),
    bruno: perfil({ bio: "Bio Bruno" }),
  });
});

test("home-author-profile-utils preserva prioridade e fallback ao encontrar perfil", () => {
  const porChaveNormalizada = perfil({ bio: "Normalizada" });
  const porChaveSimples = perfil({ bio: "Simples" });
  const porChaveOriginal = perfil({ bio: "Original" });
  const porBuscaNasEntradas = perfil({ bio: "Entradas" });

  assert.equal(
    encontrarPerfilAutor({
      "jose silva": porChaveNormalizada,
      "josé silva": porChaveSimples,
      " José Silva ": porChaveOriginal,
      "José  da  Silva": porBuscaNasEntradas,
    }, "José Silva"),
    porChaveNormalizada,
  );
  assert.equal(
    encontrarPerfilAutor({ "josé silva": porChaveSimples }, "José Silva"),
    porChaveSimples,
  );
  assert.equal(
    encontrarPerfilAutor({ " José Silva ": porChaveOriginal }, " José Silva "),
    porChaveOriginal,
  );
  assert.equal(
    encontrarPerfilAutor({ "José  da  Silva": porBuscaNasEntradas }, "Jose da Silva"),
    porBuscaNasEntradas,
  );
  assert.equal(encontrarPerfilAutor({}, "Ausente"), null);
});

test("home-author-profile-utils preserva bio padrão e primeiro texto válido", () => {
  assert.equal(criarBioAutorPadrao(["Fantasia"]), "Autor de fantasia na Historietas.");
  assert.equal(criarBioAutorPadrao([]), "Autor de histórias na Historietas.");
  assert.equal(obterValorTextoPerfilHome("  ", null, " Ana ", "Bia"), "Ana");
  assert.equal(obterValorTextoPerfilHome("", "   ", null), "");
});

test("home-author-profile-utils normaliza perfil Supabase e fallbacks", () => {
  assert.deepEqual(normalizarPerfilSupabaseHome(perfilSupabase()), {
    userId: "user-autor",
    nome: "Ana Souza",
    avatar: "avatar.png",
    bio: "Bio principal",
  });
  assert.deepEqual(normalizarPerfilSupabaseHome(perfilSupabase({
    user_id: "  ",
    id: " id-alternativo ",
    bio: "",
  })), {
    userId: "id-alternativo",
    nome: "Ana Souza",
    avatar: "avatar.png",
    bio: "Sobre autora",
  });
  assert.equal(normalizarPerfilSupabaseHome(perfilSupabase({ user_id: "", id: "" })), null);
  assert.equal(normalizarPerfilSupabaseHome(perfilSupabase({ nome: "  " })), null);
});

test("home-author-profile-utils estabelece a fronteira pura dos perfis de autor", () => {
  assert.match(modulo, /import \{ normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/);
  assert.match(modulo, /import \{ formatarGeneroHome \} from "\.\/home-metadata-utils";/);
  for (const nomeFuncao of [
    "normalizarChaveAutor",
    "criarIniciaisAutor",
    "normalizarPerfilAutorSalvo",
    "normalizarPerfisAutoresSalvos",
    "encontrarPerfilAutor",
    "criarBioAutorPadrao",
    "obterValorTextoPerfilHome",
    "normalizarPerfilSupabaseHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.doesNotMatch(pagina, /from "\.\/lib\/home-author-profile-utils";/);
  assert.match(
    cardAutor,
    /import \{ criarIniciaisAutor \} from "\.\.\/app\/lib\/home-author-profile-utils";/,
  );
  assert.match(cardAutor, /criarIniciaisAutor\(autor\.nome\)/);
  assert.match(modulo, /normalizarTexto\(nome\)\.replace\(\/\\s\+\/g, " "\)\.trim\(\)/);
  assert.match(modulo, /generos\[0\] \|\| "histórias"/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
