import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-comments-read-loader.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const lifecycle = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-interaction-data.ts");
const storage = ler("../../app/ler-capitulo/lib/ler-capitulo-local-storage.ts");
const commentPersistence = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts");

const fonteMockada = fonte
  .replace('import { supabase } from "../../../lib/supabase/client";', `const supabase = {
  from: (...args) => globalThis.__leitorCommentsRead.supabase.from(...args),
  auth: { getUser: (...args) => globalThis.__leitorCommentsRead.supabase.auth.getUser(...args) },
};`)
  .replace(
    /import \{\s*carregarTodasPaginasPorLotesSupabase,\s*carregarTodasPaginasSupabase,\s*\} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";/,
    `const carregarTodasPaginasPorLotesSupabase = (...args) => globalThis.__leitorCommentsRead.porLotes(...args);
const carregarTodasPaginasSupabase = (...args) => globalThis.__leitorCommentsRead.paginado(...args);`,
  );
const js = typescript.transpileModule(fonteMockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const loader = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function criarCenario({
  comentarios = [],
  perfisUsuario = [],
  perfisId = [],
  curtidas = [],
  usuario = null,
  falhasComentarios = 0,
  falhas = [],
  authFalha = false,
} = {}) {
  const consultas = [];
  const lotes = [];
  let tentativas = 0;
  let authChamadas = 0;
  const supabase = {
    from(tabela) {
      const consulta = { tabela, passos: [] };
      consultas.push(consulta);
      const cadeia = {};
      for (const operacao of ["select", "eq", "in", "order", "range"]) {
        cadeia[operacao] = (...args) => {
          consulta.passos.push([operacao, ...args]);
          return cadeia;
        };
      }
      return cadeia;
    },
    auth: {
      async getUser() {
        authChamadas += 1;
        if (authFalha) throw new Error("auth indisponível");
        return { data: { user: usuario } };
      },
    },
  };
  const dependencias = {
    supabase,
    async paginado({ nomeColecao, buscarPagina }) {
      assert.equal(nomeColecao, "comentários do capítulo");
      await buscarPagina(0, 999);
      tentativas += 1;
      if (tentativas <= falhasComentarios) throw new Error("schema antigo");
      return comentarios;
    },
    async porLotes({ nomeColecao, itens, buscarPaginaLote }) {
      lotes.push({ nomeColecao, itens: [...itens] });
      await buscarPaginaLote(itens, 0, 999);
      if (falhas.includes(nomeColecao)) throw new Error("indisponível");
      if (nomeColecao === "perfis dos comentários por usuário") return perfisUsuario;
      if (nomeColecao === "perfis dos comentários por id") return perfisId;
      if (nomeColecao === "curtidas dos comentários do capítulo") return curtidas;
      throw new Error("coleção inesperada");
    },
  };
  globalThis.__leitorCommentsRead = dependencias;
  return { consultas, lotes, get authChamadas() { return authChamadas; } };
}

const opcoes = (aplicarCurtidasComentariosCapitulosLocais = (comentarios) => comentarios) => ({
  aplicarCurtidasComentariosCapitulosLocais,
  TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas",
});

test("a movimentação preserva literalmente o corpo dos helpers e das consultas", () => {
  const corpo = fonte.slice(fonte.indexOf("export function obterTextoRegistroLeitor("))
    .replace("export function obterTextoRegistroLeitor(", "function obterTextoRegistroLeitor(")
    .replace("export async function carregarPerfilComentarioLeitor(", "async function carregarPerfilComentarioLeitor(")
    .replace(/export async function carregarComentariosCapituloSupabase\(\n  capituloId: string,\n  usuarioLogadoId: string,\n  \{[\s\S]*?TABELA_COMENTARIOS_CAPITULOS_CURTIDAS: "comentarios_capitulos_curtidas";\n  \},\n\)/, "async function carregarComentariosCapituloSupabase(\n  capituloId: string,\n  usuarioLogadoId: string,\n)")
    .trimEnd();
  assert.equal(createHash("sha256").update(corpo).digest("hex"), "42c4e3d4240f6ff33a14f5a6ff87482137cba88eec5117044efaa57a891ddede");
  assert.match(pagina, /import \{[\s\S]*?carregarPerfilComentarioLeitor,[\s\S]*?obterTextoRegistroLeitor,[\s\S]*?type PerfilComentarioLeitor,[\s\S]*?\} from "\.\/lib\/ler-capitulo-comments-read-loader";/);
  assert.match(pagina, /useLerCapituloInteractionData\(\{/);
  assert.match(lifecycle, /import \{ carregarComentariosCapituloSupabase \} from "\.\.\/lib\/ler-capitulo-comments-read-loader";/);
  assert.doesNotMatch(pagina, /(?:async )?function carregarComentariosCapituloSupabase\(/);
  assert.match(lifecycle, /await carregarComentariosCapituloSupabase\(\s*capituloAtual\.id,\s*usuarioIdLogado,\s*\{\s*aplicarCurtidasComentariosCapitulosLocais,\s*TABELA_COMENTARIOS_CAPITULOS_CURTIDAS,/);
  assert.match(lifecycle, /import \{ aplicarCurtidasComentariosCapitulosLocais \} from "\.\.\/lib\/ler-capitulo-local-storage";/);
  assert.match(storage, /export function aplicarCurtidasComentariosCapitulosLocais\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-persistence";/);
  assert.doesNotMatch(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.match(commentPersistence, /export async function salvarComentarioCapituloSupabase\(/);
  assert.doesNotMatch(fonte, /\.(?:insert|update|delete|upsert)\s*\(/);
});

test("identificador vazio não consulta; texto usa os mesmos fallbacks", async () => {
  const cenario = criarCenario();
  assert.deepEqual(await loader.carregarComentariosCapituloSupabase("   ", "u", opcoes()), []);
  assert.deepEqual(await loader.carregarPerfilComentarioLeitor("  "), { userId: "", nome: "Usuário", avatar: "" });
  assert.equal(loader.obterTextoRegistroLeitor({ valor: "  Olá  " }, "valor"), "Olá");
  assert.equal(loader.obterTextoRegistroLeitor({ valor: false }, "valor"), "false");
  assert.equal(loader.obterTextoRegistroLeitor({ valor: null }, "valor"), "");
  assert.equal(cenario.consultas.length, 0);
  assert.equal(cenario.authChamadas, 0);
});

test("lê comentários e perfis paginados, deduplica curtidas e aplica estado local", async () => {
  const cenario = criarCenario({
    comentarios: [
      { id: " c1 ", user_id: " u1 ", comentario: " Olá ", comentario_pai_id: "", atualizado_em: "data-a" },
      { id: "c2", user_id: "u2", comentario: " resposta ", comentario_pai_id: "c1", criado_em: "data-b" },
      { id: "c3", user_id: "u1", comentario: "  " },
      { id: "c4", user_id: "", comentario: "descartado" },
    ],
    perfisUsuario: [{ id: "p1", user_id: "u1", nome: " Ana ", avatar_url: " a.png " }],
    perfisId: [{ id: "u2", nome: " Bia ", avatar_url: "b.png" }],
    curtidas: [
      { comentario_id: "c1", usuario_id: "u2" },
      { comentario_id: "c1", usuario_id: "u2" },
      { comentario_id: "c1", usuario_id: "u3" },
      { comentario_id: "", usuario_id: "u3" },
    ],
    usuario: { id: "u1", user_metadata: { nome: "Alternativo" } },
  });
  let estadoLocal;
  const resultado = await loader.carregarComentariosCapituloSupabase(" cap ", "u1", opcoes((comentarios, userId) => {
    estadoLocal = { comentarios, userId };
    return comentarios;
  }));
  assert.deepEqual(resultado, [
    { id: "c1", userId: "u1", nome: "Ana", avatar: "a.png", texto: "Olá", criadoEm: "data-a", comentarioPaiId: "", meuComentario: true, curtidas: ["u2", "u3"] },
    { id: "c2", userId: "u2", nome: "Bia", avatar: "b.png", texto: "resposta", criadoEm: "data-b", comentarioPaiId: "c1", meuComentario: false, curtidas: [] },
  ]);
  assert.equal(estadoLocal.userId, "u1");
  assert.equal(estadoLocal.comentarios, resultado);
  assert.deepEqual(cenario.lotes[0], { nomeColecao: "perfis dos comentários por usuário", itens: ["u1", "u2"] });
  assert.deepEqual(cenario.lotes[1], { nomeColecao: "perfis dos comentários por id", itens: ["u2"] });
  assert.deepEqual(cenario.lotes.at(-1), { nomeColecao: "curtidas dos comentários do capítulo", itens: ["c1", "c2", "c4"] });
  assert.deepEqual(cenario.consultas[0], {
    tabela: "comentarios_capitulos",
    passos: [
      ["select", "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"],
      ["eq", "capitulo_id", "cap"],
      ["order", "atualizado_em", { ascending: true }],
      ["order", "id", { ascending: true }],
      ["range", 0, 999],
    ],
  });
  assert.ok(cenario.consultas.some((consulta) => consulta.tabela === "comentarios_capitulos_curtidas" && consulta.passos.some((passo) => passo[0] === "in" && passo[1] === "comentario_id")));
});

test("fallbacks de consulta mantêm ordem e falha total retorna lista vazia", async () => {
  const cenario = criarCenario({ falhasComentarios: 3, comentarios: [{ user_id: "u", comentario: "texto" }] });
  const resultado = await loader.carregarComentariosCapituloSupabase("cap", "", opcoes());
  assert.equal(resultado[0].id, "cap-0");
  assert.deepEqual(cenario.consultas.slice(0, 4).map((consulta) => consulta.passos[0][1]), [
    "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em",
    "id,user_id,comentario,comentario_pai_id,criado_em",
    "id,user_id,comentario,atualizado_em,criado_em",
    "id,user_id,comentario,criado_em",
  ]);
  const erro = criarCenario({ falhasComentarios: 4 });
  assert.deepEqual(await loader.carregarComentariosCapituloSupabase("cap", "", opcoes()), []);
  assert.equal(erro.consultas.length, 4);
});

test("falhas de perfil, autenticação e curtidas não impedem comentários", async () => {
  criarCenario({
    comentarios: [{ id: "c", user_id: "u", comentario: "teste" }],
    falhas: ["perfis dos comentários por usuário", "perfis dos comentários por id", "curtidas dos comentários do capítulo"],
    authFalha: true,
  });
  const resultado = await loader.carregarComentariosCapituloSupabase("cap", "u", opcoes());
  assert.equal(resultado[0].nome, "Usuário");
  assert.equal(resultado[0].avatar, "");
  assert.deepEqual(resultado[0].curtidas, []);
});

test("perfil atual respeita prioridade profile, metadata e email", async () => {
  criarCenario({ usuario: { id: "u", user_metadata: { full_name: " Meta ", picture: " img " }, email: "email@teste" } });
  assert.deepEqual(await loader.carregarPerfilComentarioLeitor(" u "), { userId: "u", nome: "Meta", avatar: "img" });
  criarCenario({ usuario: { id: "u", user_metadata: {}, email: "email@teste" } });
  assert.equal((await loader.carregarPerfilComentarioLeitor("u")).nome, "email");
  criarCenario({ perfisUsuario: [{ user_id: "u", nome: " Salvo ", avatar_url: "foto" }], usuario: { id: "u", user_metadata: { nome: "Outro" } } });
  assert.deepEqual(await loader.carregarPerfilComentarioLeitor("u"), { userId: "u", nome: "Salvo", avatar: "foto" });
  criarCenario({ usuario: { id: "outro", user_metadata: { nome: "Não usar" } } });
  assert.equal((await loader.carregarPerfilComentarioLeitor("u")).nome, "Usuário");
});
