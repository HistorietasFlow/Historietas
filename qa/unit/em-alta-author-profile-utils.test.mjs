import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-author-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const loader = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-author-profile-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const executavel = modulo.replace(
  'import type { SupabaseProfileAutorRankingRow } from "./em-alta-models";\n',
  "",
);
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("obterNomeProfileAutorRanking preserva trim e fallbacks", () => {
  assert.equal(utils.obterNomeProfileAutorRanking({ nome: " Ana " }), "Ana");
  assert.equal(utils.obterNomeProfileAutorRanking({ nome: "" }), "");
  assert.equal(utils.obterNomeProfileAutorRanking({ nome: "   " }), "");
  assert.equal(utils.obterNomeProfileAutorRanking(null), "");
  assert.equal(utils.obterNomeProfileAutorRanking(undefined), "");
  assert.equal(utils.obterNomeProfileAutorRanking({ nome: 42 }), "");
});

test("obterAvatarProfileAutorRanking preserva trim e fallbacks", () => {
  assert.equal(
    utils.obterAvatarProfileAutorRanking({ avatar_url: " https://avatar " }),
    "https://avatar",
  );
  assert.equal(utils.obterAvatarProfileAutorRanking({ avatar_url: "" }), "");
  assert.equal(utils.obterAvatarProfileAutorRanking(null), "");
  assert.equal(utils.obterAvatarProfileAutorRanking({ avatar_url: 42 }), "");
});

test("adicionarProfileAutorRankingNoMapa preserva aliases, ordem e referência", () => {
  const mapa = new Map();
  const profile = { user_id: " usuario ", id: " perfil ", nome: "Ana" };
  const chamadas = [];
  const setOriginal = mapa.set.bind(mapa);
  mapa.set = (chave, valor) => {
    chamadas.push(chave);
    return setOriginal(chave, valor);
  };

  utils.adicionarProfileAutorRankingNoMapa(mapa, profile);

  assert.deepEqual(chamadas, ["usuario", "perfil"]);
  assert.equal(mapa.get("usuario"), profile);
  assert.equal(mapa.get("perfil"), profile);
});

test("adicionarProfileAutorRankingNoMapa ignora chaves inválidas", () => {
  const mapa = new Map();
  utils.adicionarProfileAutorRankingNoMapa(mapa, {
    user_id: "   ",
    id: 42,
  });
  assert.equal(mapa.size, 0);

  const apenasUserId = { user_id: " usuario ", id: null };
  utils.adicionarProfileAutorRankingNoMapa(mapa, apenasUserId);
  assert.equal(mapa.get("usuario"), apenasUserId);
});

test("Em Alta delega helpers de profile e o loader dedicado indexa profiles", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?obterAvatarProfileAutorRanking,[\s\S]*?obterNomeProfileAutorRanking,[\s\S]*?\} from "\.\/lib\/em-alta-author-profile-utils";/,
  );
  assert.match(
    pagina,
    /import \{ carregarProfilesAutoresRanking \} from "\.\/lib\/em-alta-author-profile-loader";/,
  );
  assert.match(
    loader,
    /adicionarProfileAutorRankingNoMapa\(profilesPorUsuario, profile\)/,
  );

  for (const nome of [
    "obterNomeProfileAutorRanking",
    "obterAvatarProfileAutorRanking",
    "adicionarProfileAutorRankingNoMapa",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nome}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\b`));
  }
  assert.doesNotMatch(pagina, /async function carregarProfilesAutoresRanking\b/);

  assert.ok(
    modulo.indexOf("const userId =") < modulo.indexOf("const id ="),
    "user_id é processado antes de id",
  );

  for (const proibido of [
    /react/i,
    /\buse[A-Z]\w*\b/,
    /supabase\/client/,
    /\.from\(/,
    /\.select\(/,
    /\bauth\b/i,
    /localStorage/,
    /\bwindow\b/,
    /\bdocument\b/,
    /<[A-Z][\w.]*\s+[\w-]+=/,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
});
