import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const hookAutores = ler("../../app/explorar/hooks/use-explorar-author-data.ts");
const loaderRemoto = ler("../../app/explorar/lib/explorar-remote-loader.ts");
const codigo = ler("../../app/explorar/lib/explorar-author-profile-utils.ts");
const compilar = (fonte) =>
  typescript.transpileModule(fonte, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const urlModulo = (fonte) =>
  `data:text/javascript;base64,${Buffer.from(compilar(fonte)).toString("base64")}`;
const utilsUrl = urlModulo(ler("../../lib/utils.ts"));
const traducoesUrl = urlModulo(
  ler("../../app/explorar/lib/explorar-translations.ts")
    .replace("../../../lib/utils", utilsUrl),
);

const dependencia = {
  chamadas: [],
  respostas: [],
  metricas: async () => ({ carregado: false, autores: new Map() }),
  supabase: {
    from(tabela) {
      const chamada = { tabela };
      dependencia.chamadas.push(chamada);
      return {
        select(campos) {
          chamada.campos = campos;
          return {
            or(filtro) {
              chamada.or = filtro;
              return this;
            },
            in(coluna, ids) {
              chamada.coluna = coluna;
              chamada.ids = ids;
              return this;
            },
            async limit(limite) {
              chamada.limite = limite;
              const resposta = dependencia.respostas.shift();
              if (resposta instanceof Error) throw resposta;
              return resposta || { data: null, error: null };
            },
          };
        },
      };
    },
  },
};
globalThis.__explorarAutorTeste = dependencia;
const modulo = await import(urlModulo(
  codigo
    .replace(
      'import { supabase } from "../../../lib/supabase/client";',
      "const supabase = globalThis.__explorarAutorTeste.supabase;",
    )
    .replace(
      'import { carregarMetricasConteudos } from "../../../lib/metricas";',
      "const carregarMetricasConteudos = (...args) => globalThis.__explorarAutorTeste.metricas(...args);",
    )
    .replace("./explorar-translations", traducoesUrl),
));
delete globalThis.__explorarAutorTeste;

const {
  obterNomeProfileExplorar,
  carregarNomesProfilesExplorar,
  aplicarNomesProfilesEmObrasExplorar,
  criarIniciaisAutorExplorar,
  criarBioAutorExplorar,
  formatarMediaAvaliacaoAutorExplorar,
  carregarPerfisAutoresExplorar,
  carregarAvaliacoesAutoresExplorar,
} = modulo;

test("os oito helpers mantêm literalmente os corpos originais", () => {
  const original = codigo.replace(/^export (async )?function /gm, "$1function ");
  const corpo = original.slice(original.indexOf("function obterNomeProfileExplorar(")).trimEnd();
  assert.equal(
    createHash("sha256").update(corpo).digest("hex"),
    "7c10483c0ee7cdfa9dfe1d14f6b35ea1d29c4a24849de2ad69c07b755f25dfc9",
  );
});

async function comDependencias(executar) {
  const anterior = globalThis.__explorarAutorTeste;
  globalThis.__explorarAutorTeste = dependencia;
  dependencia.chamadas = [];
  dependencia.respostas = [];
  dependencia.metricas = async () => ({ carregado: false, autores: new Map() });
  try {
    return await executar();
  } finally {
    if (anterior === undefined) delete globalThis.__explorarAutorTeste;
    else globalThis.__explorarAutorTeste = anterior;
  }
}

test("nomes públicos deduplicam IDs, preservam query e criam aliases", async () => {
  await comDependencias(async () => {
    assert.equal(obterNomeProfileExplorar({ nome: "  Ana  " }), "Ana");
    assert.equal(obterNomeProfileExplorar({ nome: " " }), "");
    assert.equal((await carregarNomesProfilesExplorar(["", " "])).size, 0);
    assert.equal(dependencia.chamadas.length, 0);
    dependencia.respostas.push({ data: [
      { id: " perfil ", user_id: " usuario ", nome: " Ana " },
      { id: "sem-nome", user_id: "outro", nome: " " },
    ], error: null });
    const nomes = await carregarNomesProfilesExplorar([" usuario ", "usuario", "", "perfil"]);
    assert.deepEqual([...nomes.entries()], [["usuario", "Ana"], ["perfil", "Ana"]]);
    assert.deepEqual(dependencia.chamadas, [{
      tabela: "profiles_publicos",
      campos: "id, user_id, nome, avatar_url, bio, sobre_bio",
      or: "user_id.in.(usuario,perfil),id.in.(usuario,perfil)",
      limite: 4,
    }]);
  });
});

test("falhas de nomes retornam mapa vazio e preservam os avisos", async () => {
  await comDependencias(async () => {
    const avisos = [];
    const warnOriginal = console.warn;
    console.warn = (...argumentos) => avisos.push(argumentos);
    try {
      dependencia.respostas.push({ data: null, error: { message: "falha" } }, new Error("rede"));
      assert.equal((await carregarNomesProfilesExplorar(["a"])).size, 0);
      assert.equal((await carregarNomesProfilesExplorar(["b"])).size, 0);
      assert.deepEqual(avisos[0], ["Não consegui carregar profiles no Explorar:", "falha"]);
      assert.equal(avisos[1][0], "Não consegui acessar profiles no Explorar:");
      assert.equal(avisos[1][1].message, "rede");
    } finally {
      console.warn = warnOriginal;
    }
  });
});

test("aplicar nomes preserva obras sem perfil e retorna a lista original para mapa vazio", () => {
  const obras = [{ autor: "Antigo", autorId: " user " }, { autor: "Outro", autorId: "ausente" }];
  assert.equal(aplicarNomesProfilesEmObrasExplorar(obras, new Map()), obras);
  const resultado = aplicarNomesProfilesEmObrasExplorar(obras, new Map([["user", "Ana"]]));
  assert.deepEqual(resultado[0], { autor: "Ana", autorId: " user " });
  assert.equal(resultado[1], obras[1]);
  assert.equal(obras[0].autor, "Antigo");
});

test("iniciais, bios em três idiomas e média preservam fallbacks e locale", () => {
  assert.equal(criarIniciaisAutorExplorar("  ana   maria silva "), "AM");
  assert.equal(criarIniciaisAutorExplorar(" "), "H");
  assert.equal(criarBioAutorExplorar("Ana", [], "pt-BR"), "Ana publica histórias na Historietas.");
  assert.equal(criarBioAutorExplorar("Ana", [], "en"), "Ana publishes stories on Historietas.");
  assert.equal(criarBioAutorExplorar("Ana", [], "es"), "Ana publica historias en Historietas.");
  assert.equal(criarBioAutorExplorar("Ana", ["Fantasia", "Aventura", "Drama"], "pt-BR"), "Autor de fantasia e aventura na Historietas.");
  assert.equal(criarBioAutorExplorar("Ana", ["Fantasia", "Aventura", "Drama"], "en"), "Author of fantasy and adventure on Historietas.");
  assert.equal(criarBioAutorExplorar("Ana", ["Fantasia", "Aventura", "Drama"], "es"), "Autor de fantasía y aventura en Historietas.");
  assert.equal(criarBioAutorExplorar("Autor não informado", [], "en"), "Author not provided publishes stories on Historietas.");
  assert.equal(criarBioAutorExplorar("Autor não informado", [], "es"), "Autor no informado publica historias en Historietas.");
  assert.equal(criarBioAutorExplorar("Autor não informado", [], "pt-BR"), "Autor não informado publica histórias na Historietas.");
  assert.equal(formatarMediaAvaliacaoAutorExplorar(undefined), "—");
  assert.equal(formatarMediaAvaliacaoAutorExplorar({ media: NaN, total: 1 }), "—");
  assert.equal(formatarMediaAvaliacaoAutorExplorar({ media: 4, total: 0 }), "—");
  assert.equal(formatarMediaAvaliacaoAutorExplorar({ media: 4.25, total: 2 }, "pt-BR"), "4,3");
  assert.equal(formatarMediaAvaliacaoAutorExplorar({ media: 4.25, total: 2 }, "en"), "4.3");
  assert.equal(formatarMediaAvaliacaoAutorExplorar({ media: 4.25, total: 2 }, "es"), "4,3");
});

test("perfis consultam user_id e id independentemente, mantêm aliases e limitam bio", async () => {
  await comDependencias(async () => {
    assert.deepEqual(await carregarPerfisAutoresExplorar([" ", ""]), {});
    assert.equal(dependencia.chamadas.length, 0);
    dependencia.respostas.push(
      { data: [{ id: " perfil ", user_id: " usuario ", nome: " Ana ", avatar_url: " foto ", bio: " ", sobre_bio: " x ".repeat(150) }] },
      { data: [{ id: "outro", user_id: null, nome: null, avatar_url: null, bio: null, sobre_bio: null }] },
    );
    const perfis = await carregarPerfisAutoresExplorar([" usuario ", "usuario", " perfil ", ""]);
    assert.deepEqual(dependencia.chamadas.map(({ coluna, ids, limite }) => ({ coluna, ids, limite })), [
      { coluna: "user_id", ids: ["usuario", "perfil"], limite: 1000 },
      { coluna: "id", ids: ["usuario", "perfil"], limite: 1000 },
    ]);
    for (const consulta of dependencia.chamadas) {
      assert.equal(consulta.tabela, "profiles_publicos");
      assert.equal(consulta.campos, "id, user_id, nome, avatar_url, bio, sobre_bio");
    }
    assert.equal(perfis.usuario, perfis.perfil);
    assert.equal(perfis.usuario.nome, "Ana");
    assert.equal(perfis.usuario.avatar, "foto");
    assert.equal(perfis.usuario.bio.length, 140);
    assert.deepEqual(perfis.outro, { nome: "", avatar: "", bio: "" });
  });
});

test("uma consulta de perfil falha sem impedir a outra e dados inválidos são ignorados", async () => {
  await comDependencias(async () => {
    dependencia.respostas.push(new Error("primeira"), { data: [{ id: "id", user_id: "u", bio: "salva" }] });
    assert.deepEqual(await carregarPerfisAutoresExplorar(["u"]), {
      u: { nome: "", avatar: "", bio: "salva" },
      id: { nome: "", avatar: "", bio: "salva" },
    });
    dependencia.respostas.push({ data: [{ user_id: "u", nome: "Ana" }] }, new Error("segunda"));
    assert.deepEqual(await carregarPerfisAutoresExplorar(["u"]), { u: { nome: "Ana", avatar: "", bio: "" } });
    dependencia.respostas.push({ data: {} }, { data: null });
    assert.deepEqual(await carregarPerfisAutoresExplorar(["u"]), {});
  });
});

test("bio principal tem prioridade e o último perfil repetido mantém os aliases", async () => {
  await comDependencias(async () => {
    dependencia.respostas.push(
      { data: [{ id: "i", user_id: "u", nome: "Primeiro", bio: "original" }] },
      { data: [{ id: "i", user_id: "u", nome: "Segundo", bio: " bio principal ", sobre_bio: "outra bio" }] },
    );
    const perfis = await carregarPerfisAutoresExplorar(["u"]);
    assert.deepEqual(perfis.u, { nome: "Segundo", avatar: "", bio: "bio principal" });
    assert.equal(perfis.u, perfis.i);
  });
});

test("avaliações são deduplicadas e falhas complementares não propagam", async () => {
  await comDependencias(async () => {
    const chamadas = [];
    dependencia.metricas = async (args) => {
      chamadas.push(args);
      return { carregado: true, autores: new Map([
        ["a", { avaliacao: { media: 4.5, total: 2 } }],
        ["b", { avaliacao: { media: 5, total: 0 } }],
      ]) };
    };
    assert.deepEqual(await carregarAvaliacoesAutoresExplorar([" a ", "a", "b", ""]), { a: { media: 4.5, total: 2 } });
    assert.deepEqual(chamadas, [{ autorIds: ["a", "b"] }]);
    assert.deepEqual(await carregarAvaliacoesAutoresExplorar([]), {});
    assert.equal(chamadas.length, 1);
    dependencia.metricas = async () => ({ carregado: false, autores: new Map() });
    assert.deepEqual(await carregarAvaliacoesAutoresExplorar(["a"]), {});
    dependencia.metricas = async () => { throw new Error("falha"); };
    assert.deepEqual(await carregarAvaliacoesAutoresExplorar(["a"]), {});
  });
});

test("a página delega perfis e preserva catálogo, métricas de obras e efeitos", () => {
  for (const nome of Object.keys(modulo)) {
    assert.match(codigo, new RegExp(`export (?:async )?function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`(?:async )?function ${nome}\\(`));
  }
  assert.match(pagina, /from "\.\/lib\/explorar-author-profile-utils"/);
  assert.match(loaderRemoto, /carregarNomesProfilesExplorar\(/);
  assert.match(loaderRemoto, /aplicarNomesProfilesEmObrasExplorar\(/);
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.match(ler("../../app/explorar/hooks/use-explorar-catalog-query.ts"), /carregarObrasPublicadasSupabase\(/);
  assert.match(pagina, /useExplorarAuthorData\(\{/);
  assert.match(hookAutores, /carregarPerfisAutoresExplorar\(autorIds\)/);
  assert.match(hookAutores, /carregarAvaliacoesAutoresExplorar\(autorIds\)/);
  assert.match(loaderRemoto, /carregarMetricasConteudos\(\{ obraIds, capituloIds \}\)/);
  assert.doesNotMatch(codigo, /\b(?:localStorage|useEffect|useState)\b/);
});
