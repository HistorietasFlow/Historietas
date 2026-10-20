import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const helpers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-status-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(helpers, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterRotuloTipoAnotacaoDiarioNotificacao,
  obterStatusProblemaTecnicoNotificacao,
  obterTextoStatusDenunciaComunidadeNotificacao,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("preserva os textos dos status de denúncia e chamados técnicos", () => {
  assert.equal(obterTextoStatusDenunciaComunidadeNotificacao("resolvida"), "resolvida");
  assert.equal(obterTextoStatusDenunciaComunidadeNotificacao("rejeitada"), "rejeitada");
  assert.equal(obterTextoStatusDenunciaComunidadeNotificacao("em_analise"), "em análise");

  assert.deepEqual(obterStatusProblemaTecnicoNotificacao("em_analise"), {
    titulo: "Problema técnico em análise",
    texto: "em análise",
  });
  assert.deepEqual(obterStatusProblemaTecnicoNotificacao("aguardando_usuario"), {
    titulo: "Problema técnico aguardando informações",
    texto: "aguardando informações",
  });
  assert.deepEqual(obterStatusProblemaTecnicoNotificacao("resolvido"), {
    titulo: "Problema técnico resolvido",
    texto: "resolvido",
  });
  assert.deepEqual(obterStatusProblemaTecnicoNotificacao("fechado"), {
    titulo: "Problema técnico fechado",
    texto: "fechado",
  });
  assert.equal(obterStatusProblemaTecnicoNotificacao("desconhecido"), null);
});

test("preserva os rótulos de anotações do Diário e o fallback", () => {
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("lendo"), "leitura");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("quero_ler"), "Quero ler");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("favorita"), "favorita");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("concluida"), "obra concluída");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("avaliacao"), "avaliação");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("review"), "review");
  assert.equal(obterRotuloTipoAnotacaoDiarioNotificacao("outro"), "anotação");
});

test("a página delega a apresentação dos status aos helpers puros", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-status-text-utils"/);
  assert.match(pagina, /obterTextoStatusDenunciaComunidadeNotificacao\(status\)/);
  assert.match(pagina, /obterStatusProblemaTecnicoNotificacao\(status\)/);
  assert.match(pagina, /obterRotuloTipoAnotacaoDiarioNotificacao\(/);
  assert.doesNotMatch(pagina, /function obterStatusProblemaTecnicoNotificacao/);
  assert.doesNotMatch(pagina, /function obterRotuloTipoAnotacaoDiarioNotificacao/);
  assert.doesNotMatch(helpers, /React|use[A-Z]|supabase|localStorage/);
});
