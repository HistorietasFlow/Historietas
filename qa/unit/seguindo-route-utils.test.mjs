import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-route-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const followerActions = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-follower-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const userFollowActions = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-user-follow-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const followRequestCard = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-follow-request-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const socialUserCard = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-social-user-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const suggestedUserCard = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-suggested-user-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const {
  criarHrefPerfilAutorSeguindo,
  criarHrefPerfilUsuarioSeguindo,
  criarLoginHrefSeguindo,
  idUsuarioSupabaseValido,
  obterParametrosSociaisSeguindoUrl,
  obterUsuarioObrasSeguidasSeguindo,
} = modulo;

test("validação de ID preserva UUID canônico", () => {
  assert.equal(
    idUsuarioSupabaseValido("123e4567-e89b-12d3-a456-426614174000"),
    true,
  );
  assert.equal(idUsuarioSupabaseValido("usuario-1"), false);
  assert.equal(idUsuarioSupabaseValido(""), false);
});

test("usuário das obras seguidas prioriza perfil social válido", () => {
  const idPerfil = "123e4567-e89b-12d3-a456-426614174000";
  const idLogado = "223e4567-e89b-12d3-a456-426614174000";

  assert.equal(
    obterUsuarioObrasSeguidasSeguindo(`  ${idPerfil}  `, idLogado),
    idPerfil,
  );
  assert.equal(
    obterUsuarioObrasSeguidasSeguindo("perfil-invalido", idLogado),
    idLogado,
  );
  assert.equal(
    obterUsuarioObrasSeguidasSeguindo("", idLogado),
    idLogado,
  );
});

test("login preserva redirect atual e fallback SSR", () => {
  const anteriorWindow = globalThis.window;

  try {
    delete globalThis.window;
    assert.equal(
      criarLoginHrefSeguindo(),
      "/login?redirectTo=%2Fseguindo",
    );

    globalThis.window = {
      location: {
        pathname: "/seguindo",
        search: "?conteudo=pessoas",
      },
    };
    assert.equal(
      criarLoginHrefSeguindo(),
      "/login?redirectTo=%2Fseguindo%3Fconteudo%3Dpessoas",
    );
  } finally {
    globalThis.window = anteriorWindow;
  }
});

test("parâmetros sociais preservam abas, conteúdo, perfil e fallback", () => {
  const anteriorWindow = globalThis.window;
  const id =
    "123e4567-e89b-12d3-a456-426614174000";

  try {
    globalThis.window = {
      location: {
        search:
          `?aba=seguidores&conteudo=pessoas&userId=${id}&autor=Ana%20Silva`,
      },
    };
    assert.deepEqual(
      obterParametrosSociaisSeguindoUrl("usuario-logado"),
      {
        aba: "seguidores",
        perfilId: id,
        perfilNome: "Ana Silva",
        conteudo: "pessoas",
      },
    );

    globalThis.window = {
      location: {
        search: "?aba=seguidores",
      },
    };
    assert.deepEqual(
      obterParametrosSociaisSeguindoUrl(id),
      {
        aba: "seguidores",
        perfilId: id,
        perfilNome: "",
        conteudo: "seguidores",
      },
    );
  } finally {
    globalThis.window = anteriorWindow;
  }
});

test("rotas de perfil preservam parâmetros e fallbacks", () => {
  assert.equal(
    criarHrefPerfilAutorSeguindo(" Ana Silva ", " autor-1 "),
    "/perfil-autor?autor=Ana+Silva&autorId=autor-1",
  );
  assert.equal(
    criarHrefPerfilAutorSeguindo("", ""),
    "/perfil-autor?autor=Autor+n%C3%A3o+informado",
  );
  assert.equal(
    criarHrefPerfilUsuarioSeguindo({
      id: "user-1",
      nome: " Ana Silva ",
    }),
    "/perfil-autor?userId=user-1&autorId=user-1&autor=Ana+Silva",
  );
  assert.equal(
    criarHrefPerfilUsuarioSeguindo({
      id: "user-2",
      nome: "  ",
    }),
    "/perfil-autor?userId=user-2&autorId=user-2&autor=Usu%C3%A1rio",
  );
});

test("página delega rotas e validação ao módulo dedicado", () => {
  assert.match(
    pagina,
    /import \{ criarHrefPerfilAutorSeguindo \} from "\.\/lib\/seguindo-route-utils";/,
  );
  assert.match(
    followerActions,
    /import \{ idUsuarioSupabaseValido \} from "\.\.\/lib\/seguindo-route-utils";/,
  );
  assert.match(
    userFollowActions,
    /import \{ idUsuarioSupabaseValido \} from "\.\.\/lib\/seguindo-route-utils";/,
  );
  for (const card of [
    followRequestCard,
    socialUserCard,
    suggestedUserCard,
  ]) {
    assert.match(
      card,
      /import \{ criarHrefPerfilUsuarioSeguindo \} from "\.\.\/lib\/seguindo-route-utils";/,
    );
    assert.match(card, /criarHrefPerfilUsuarioSeguindo\(/);
  }
  for (const nome of [
    "criarLoginHrefSeguindo",
    "obterParametrosSociaisSeguindoUrl",
    "criarHrefPerfilAutorSeguindo",
    "idUsuarioSupabaseValido",
    "criarHrefPerfilUsuarioSeguindo",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(`function ${nome}\\(`),
    );
  }
});
