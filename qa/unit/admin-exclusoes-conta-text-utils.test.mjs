import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/lib/admin-exclusoes-conta-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

test("traduzir preserva a prioridade PT, EN e ES", () => {
  const texto = { pt: "Português", en: "English", es: "Español" };

  assert.equal(utils.traduzir(texto, "pt-BR"), "Português");
  assert.equal(utils.traduzir(texto, "en"), "English");
  assert.equal(utils.traduzir(texto, "es"), "Español");
});

test("rótulos de status e origem preservam todos os textos", () => {
  assert.deepEqual(utils.STATUS_LABEL, {
    pendente: { pt: "Pendente", en: "Pending", es: "Pendiente" },
    verificando: {
      pt: "Verificando identidade",
      en: "Verifying identity",
      es: "Verificando identidad",
    },
    concluida: { pt: "Concluída", en: "Completed", es: "Completada" },
    recusada: { pt: "Recusada", en: "Rejected", es: "Rechazada" },
    cancelada: { pt: "Cancelada", en: "Canceled", es: "Cancelada" },
  });
  assert.deepEqual(utils.ORIGEM_LABEL, {
    pagina_publica: {
      pt: "Página pública",
      en: "Public page",
      es: "Página pública",
    },
    suporte: { pt: "Suporte", en: "Support", es: "Soporte" },
    administracao: {
      pt: "Administração",
      en: "Administration",
      es: "Administración",
    },
  });
});

test("corStatus e origemTraduzida preservam os fallbacks atuais", () => {
  assert.equal(utils.corStatus("pendente"), "#F59E0B");
  assert.equal(utils.corStatus("verificando"), "#60A5FA");
  assert.equal(utils.corStatus("concluida"), "#4ADE80");
  assert.equal(utils.corStatus("recusada"), "#FB7185");
  assert.equal(utils.corStatus("cancelada"), "#A1A1AA");

  assert.equal(
    utils.origemTraduzida("pagina_publica", "en"),
    "Public page",
  );
  assert.equal(utils.origemTraduzida("origem personalizada", "pt-BR"), "origem personalizada");
  assert.equal(utils.origemTraduzida("", "pt-BR"), "—");
  assert.equal(utils.origemTraduzida(" pagina_publica ", "pt-BR"), " pagina_publica ");
});

test("Admin Exclusões de Conta delega somente textos e helpers de apresentação", () => {
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-exclusoes-conta-text-utils";/,
  );
  for (const nome of [
    "STATUS_LABEL",
    "traduzir",
    "corStatus",
    "origemTraduzida",
    "TextoTraduzido",
  ]) {
    assert.match(pageSource, new RegExp(`\\b${nome}\\b`));
  }
  assert.doesNotMatch(pageSource, /type TextoTraduzido\s*=/);
  assert.doesNotMatch(pageSource, /const STATUS_LABEL\s*=/);
  assert.doesNotMatch(pageSource, /const ORIGEM_LABEL\s*=/);
  assert.doesNotMatch(pageSource, /function traduzir\(/);
  assert.doesNotMatch(pageSource, /function corStatus\(/);
  assert.doesNotMatch(pageSource, /function origemTraduzida\(/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|useCallback|fetch\(|supabase|router|localStorage|sessionStorage|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
  );
});
