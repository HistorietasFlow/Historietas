import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-social-persistence.ts");
const rotaCapitulo = ler("../../app/ler-capitulo/lib/ler-capitulo-chapter-route.ts");
const mockada = fonte
  .replace('import { supabase } from "../../../lib/supabase/client";', 'const supabase = { from: (...args) => globalThis.__socialLeitor.supabase.from(...args), rpc: (...args) => globalThis.__socialLeitor.supabase.rpc(...args) };')
  .replace('import { idObraSupabaseValido } from "../../../lib/utils";', 'const idObraSupabaseValido = (...args) => globalThis.__socialLeitor.idValido(...args);');
const js = typescript.transpileModule(mockada, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const carregar = () => import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const obra = { id: "obra", titulo: "Título", slug: "slug", autor: "Autor", publicado: true, capitulos: [] };
const capitulo = { id: "capitulo" };
const dadosNotificacao = {
  tipo: "curtida-capitulo", obra, capitulo, titulo: " Título ", mensagem: " Mensagem ", link: " /destino ",
};

test("os três corpos e tipos sociais preservam os contratos e a navegação permanece na página", () => {
  const contratos = {
    marcarNotificacaoCapituloComoLidaSupabase: "ed0dd33c1106d30a792da0cf9580448ff66cd9b7ea3930966aa47f92b0661364",
    registrarNotificacaoInteracaoCapituloSupabase: "d2b31fdc95b5b8843480471e524a8eb24a2279001418e4e9781e44805dffaae0",
    registrarAtividadeDiarioLeitor: "c24e0b9732d2f6e2eb1ca0e4e1cadfb0d68a07aba1dd6a17bf07feb648193153",
  };
  for (const [nome, hash] of Object.entries(contratos)) {
    const direta = fonte.match(new RegExp(`^export async function ${nome}\\([\\s\\S]*?^\\}(?=\\n|$)`, "m"))?.[0]?.replace(/^export /, "");
    const injetada = fonte.match(new RegExp(`^  return async function ${nome}\\([\\s\\S]*?^  \\};`, "m"))?.[0]
      ?.replace(/^  /gm, "").replace(/^return /, "").replace(/;$/, "");
    const corpo = direta || injetada;
    assert.ok(corpo, nome);
    assert.equal(createHash("sha256").update(corpo).digest("hex"), hash, nome);
    assert.doesNotMatch(pagina, new RegExp(`async function ${nome}\\(`));
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(fonte, /type TipoNotificacaoInteracaoCapitulo =[\s\S]*?"curtida-capitulo"[\s\S]*?"comentario-capitulo"[\s\S]*?"curtida-comentario-capitulo"/);
  assert.match(fonte, /type TipoAtividadeDiarioLeitor =[\s\S]*?"comecou_ler"[\s\S]*?"leu_capitulo"[\s\S]*?"concluiu_obra"[\s\S]*?"favoritou_obra"[\s\S]*?"salvou_obra"/);
  assert.match(fonte, /type VisibilidadeDiarioLeitor = "publico" \| "parcial" \| "privado"/);
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefLeituraCapituloLeitor,[\s\S]*?\} from "\.\/lib\/ler-capitulo-chapter-route";/,
  );
  assert.doesNotMatch(pagina, /function criarHrefLeituraCapituloLeitor\(/);
  assert.match(rotaCapitulo, /export function criarHrefLeituraCapituloLeitor\(/);
  assert.match(pagina, /criarRegistrarNotificacaoInteracaoCapituloSupabase\(criarHrefLeituraCapituloLeitor\)/);
  assert.match(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.doesNotMatch(fonte, /function (?:criarHrefLeituraCapituloLeitor|salvarComentarioCapituloSupabase)\(/);
});

async function cenario(opcoes, teste) {
  const eventos = [];
  const avisos = [];
  const warnOriginal = console.warn;
  const supabase = {
    from(tabela) {
      eventos.push(["from", tabela]);
      const builder = {
        update(dados) { eventos.push(["update", dados]); return builder; },
        eq(campo, valor) { eventos.push(["eq", campo, valor]); return builder; },
        then(resolve, reject) {
          return (opcoes.updateFalha ? Promise.reject(new Error("update")) : Promise.resolve({ error: opcoes.updateErro || null })).then(resolve, reject);
        },
        async insert(dados) {
          eventos.push(["insert", dados]);
          if (opcoes.insertFalha) throw new Error("insert");
          return { error: opcoes.insertErro || null };
        },
      };
      return builder;
    },
    async rpc(nome, dados) {
      eventos.push(["rpc", nome, dados]);
      if (opcoes.rpcFalha) throw new Error("rpc");
      return { error: opcoes.rpcErro || null };
    },
  };
  globalThis.__socialLeitor = { supabase, idValido: (id) => id === "obra" || id === "capitulo" || id === "comentario" };
  console.warn = (...args) => avisos.push(args);
  try {
    const modulo = await carregar();
    const notificar = modulo.criarRegistrarNotificacaoInteracaoCapituloSupabase((obraRota, id) => {
      eventos.push(["rota", obraRota, id]);
      return "/rota-original";
    });
    await teste({ modulo, notificar, eventos, avisos });
  } finally {
    console.warn = warnOriginal;
    delete globalThis.__socialLeitor;
  }
}

test("marca notificação com filtros trimados, guards e falhas não bloqueantes", async () => {
  await cenario({}, async ({ modulo, eventos }) => {
    for (const args of [[" ", "obra", "capitulo"], ["usuario", " ", "capitulo"], ["usuario", "obra", " "]]) {
      assert.equal(await modulo.marcarNotificacaoCapituloComoLidaSupabase(...args), undefined);
    }
    assert.deepEqual(eventos, []);
    await modulo.marcarNotificacaoCapituloComoLidaSupabase(" usuario ", " obra ", " capitulo ");
    assert.deepEqual(eventos, [["from", "notificacoes"], ["update", { lida: true }], ["eq", "user_id", "usuario"], ["eq", "obra_id", "obra"], ["eq", "capitulo_id", "capitulo"]]);
  });
  await cenario({ updateFalha: true }, async ({ modulo, avisos }) => {
    assert.equal(await modulo.marcarNotificacaoCapituloComoLidaSupabase("usuario", "obra", "capitulo"), undefined);
    assert.deepEqual(avisos, []);
  });
});

test("notificação preserva RPC, UUID neutro, textos e tipos", async () => {
  for (const tipo of ["curtida-capitulo", "comentario-capitulo", "curtida-comentario-capitulo"]) {
    await cenario({}, async ({ notificar, eventos }) => {
      assert.equal(await notificar({ ...dadosNotificacao, tipo, comentarioId: " comentario " }), true);
      assert.deepEqual(eventos, [["rpc", "criar_notificacao_interacao_capitulo", {
        p_capitulo_id: "capitulo", p_comentario_id: "comentario", p_tipo: tipo,
        p_titulo: "Título", p_mensagem: "Mensagem", p_link: "/destino",
      }]]);
    });
  }
  await cenario({}, async ({ notificar, eventos }) => {
    assert.equal(await notificar({ ...dadosNotificacao, obra: { ...obra, id: " obra " }, capitulo: { id: " capitulo " }, comentarioId: " ", link: " " }), true);
    assert.deepEqual(eventos, [["rota", { ...obra, id: " obra " }, "capitulo"], ["rpc", "criar_notificacao_interacao_capitulo", {
      p_capitulo_id: "capitulo", p_comentario_id: "capitulo", p_tipo: "curtida-capitulo",
      p_titulo: "Título", p_mensagem: "Mensagem", p_link: "/rota-original",
    }]]);
  });
});

test("notificação rejeita alvos inválidos e retorna falso com warning na falha da RPC", async () => {
  await cenario({}, async ({ notificar, eventos }) => {
    for (const entrada of [{ obra: null }, { obra: { ...obra, id: "invalido" } }, { capitulo: null }, { capitulo: { id: "invalido" } }]) {
      assert.equal(await notificar({ ...dadosNotificacao, ...entrada }), false);
    }
    assert.deepEqual(eventos, []);
  });
  for (const opcoes of [{ rpcFalha: true }, { rpcErro: new Error("rpc") }]) {
    await cenario(opcoes, async ({ notificar, avisos }) => {
      assert.equal(await notificar(dadosNotificacao), false);
      assert.equal(avisos[0][0], "Não consegui criar notificação da interação do capítulo:");
    });
  }
});

test("Diário preserva payload, metadata, guards e fallbacks sem bloquear a leitura", async () => {
  await cenario({}, async ({ modulo, eventos }) => {
    assert.equal(await modulo.registrarAtividadeDiarioLeitor({ userId: "", tipo: "comecou_ler", obra, visibilidade: "parcial" }), false);
    assert.equal(await modulo.registrarAtividadeDiarioLeitor({ userId: "usuario", tipo: "comecou_ler", obra: { ...obra, id: "inválida" }, visibilidade: "parcial" }), false);
    assert.deepEqual(eventos, []);
    assert.equal(await modulo.registrarAtividadeDiarioLeitor({ userId: " usuario ", tipo: "leu_capitulo", obra, capituloId: "capitulo", visibilidade: "publico", texto: " leu ", metadata: { origem: "leitor", autor: "sobrescrito" } }), true);
    assert.deepEqual(eventos, [["from", "diario_atividades"], ["insert", {
      user_id: " usuario ", tipo: "leu_capitulo", obra_id: "obra", capitulo_id: "capitulo", texto: "leu", visibilidade: "publico",
      metadata: { obra_titulo: "Título", obra_slug: "slug", autor: "sobrescrito", capitulo_id_original: "capitulo", origem: "leitor" },
    }]]);
  });
  await cenario({}, async ({ modulo, eventos }) => {
    assert.equal(await modulo.registrarAtividadeDiarioLeitor({ userId: " ", tipo: "salvou_obra", obra, capituloId: "invalido", visibilidade: "privado", texto: " " }), true);
    assert.equal(eventos[1][1].capitulo_id, null);
    assert.equal(eventos[1][1].texto, null);
    assert.equal(eventos[1][1].user_id, " ");
    assert.equal(eventos[1][1].metadata.capitulo_id_original, "invalido");
  });
  for (const opcoes of [{ insertFalha: true }, { insertErro: new Error("insert") }]) {
    await cenario(opcoes, async ({ modulo, avisos }) => {
      assert.equal(await modulo.registrarAtividadeDiarioLeitor({ userId: "usuario", tipo: "favoritou_obra", obra, visibilidade: "parcial" }), false);
      assert.deepEqual(avisos, []);
    });
  }
});
