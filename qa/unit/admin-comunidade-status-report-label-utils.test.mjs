import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const statusSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-status-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const reportLabelSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-report-label-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);
const contentReportCardSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-content-report-card.tsx",
    import.meta.url,
  ),
  "utf8",
);

function importarModuloTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );
}

const statusUtils = await importarModuloTypescript(statusSource);
const reportLabelUtils = await importarModuloTypescript(reportLabelSource);

test("status de denúncias preservam valores, labels e fallback", () => {
  const statusDenuncias = ["pendente", "em_analise", "resolvida", "rejeitada"];
  const statusPerfis = ["pendente", "analisada", "ignorada", "resolvida"];

  assert.deepEqual(statusUtils.STATUS_DENUNCIAS, statusDenuncias);
  assert.deepEqual(statusUtils.STATUS_DENUNCIAS_PERFIS, statusPerfis);

  for (const status of statusDenuncias) {
    assert.equal(statusUtils.normalizarStatus(status), status);
    assert.equal(typeof statusUtils.STATUS_LABEL[status], "string");
  }

  for (const status of statusPerfis) {
    assert.equal(statusUtils.normalizarStatusPerfil(status), status);
    assert.equal(typeof statusUtils.STATUS_PERFIL_LABEL[status], "string");
  }

  assert.equal(statusUtils.normalizarStatus("arquivada"), "pendente");
  assert.equal(statusUtils.normalizarStatusPerfil("rejeitada"), "pendente");
  assert.deepEqual(statusUtils.STATUS_LABEL, {
    pendente: "Pendente",
    em_analise: "Em análise",
    resolvida: "Resolvida",
    rejeitada: "Rejeitada",
  });
  assert.deepEqual(statusUtils.STATUS_PERFIL_LABEL, {
    pendente: "Pendente",
    analisada: "Analisada",
    ignorada: "Ignorada",
    resolvida: "Resolvida",
  });
});

test("rótulos de denúncias preservam tipos, motivos e fallbacks", () => {
  const tipos = [
    "post",
    "comentario",
    "comentario_capitulo",
    "obra",
    "capitulo",
    "comentario_obra",
    "diario_anotacao",
    "comentario_diario",
  ];

  for (const tipo of tipos) {
    assert.equal(reportLabelUtils.normalizarTipoAlvo(tipo), tipo);
    assert.equal(typeof reportLabelUtils.rotuloTipoAlvoDenuncia(tipo), "string");
    assert.equal(typeof reportLabelUtils.rotuloRemocaoAlvoDenuncia(tipo), "string");
    assert.equal(
      typeof reportLabelUtils.rotuloSucessoRemocaoAlvo(tipo),
      "string",
    );
  }

  assert.equal(reportLabelUtils.normalizarTipoAlvo("perfil"), "post");
  assert.equal(
    reportLabelUtils.formatarMotivoDenunciaPerfil("ofensivo"),
    "Conteúdo ofensivo",
  );
  assert.equal(
    reportLabelUtils.formatarMotivoDenunciaPerfil("personalizado"),
    "personalizado",
  );
  assert.equal(
    reportLabelUtils.formatarMotivoDenunciaPerfil(""), "Denúncia de perfil");
  assert.equal(
    reportLabelUtils.formatarMotivoDenunciaConteudo("  assedio  "),
    "Assédio",
  );
  assert.equal(
    reportLabelUtils.formatarMotivoDenunciaConteudo("  "), "Conteúdo inadequado");
  assert.equal(reportLabelUtils.rotuloTipoAlvoDenuncia("post"), "Publicação");
  assert.equal(
    reportLabelUtils.rotuloRemocaoAlvoDenuncia("capitulo"),
    "Remover capítulo",
  );
  assert.equal(
    reportLabelUtils.rotuloSucessoRemocaoAlvo("diario_anotacao"),
    "Anotação do Diário removida",
  );
  assert.deepEqual(
    tipos.map((tipo) => reportLabelUtils.rotuloTipoAlvoDenuncia(tipo)),
    [
      "Publicação",
      "Comentário",
      "Comentário de capítulo",
      "Obra",
      "Capítulo",
      "Comentário da obra",
      "Anotação do Diário",
      "Comentário do Diário",
    ],
  );
  assert.deepEqual(
    tipos.map((tipo) => reportLabelUtils.rotuloRemocaoAlvoDenuncia(tipo)),
    [
      "Remover publicação",
      "Remover comentário",
      "Remover comentário do capítulo",
      "Remover obra",
      "Remover capítulo",
      "Remover comentário da obra",
      "Remover anotação do Diário",
      "Remover comentário do Diário",
    ],
  );
  assert.deepEqual(
    tipos.map((tipo) => reportLabelUtils.rotuloSucessoRemocaoAlvo(tipo)),
    [
      "Publicação removida",
      "Comentário removido",
      "Comentário do capítulo removido",
      "Obra removida",
      "Capítulo removido",
      "Comentário da obra removido",
      "Anotação do Diário removida",
      "Comentário do Diário removido",
    ],
  );
});

test("Admin Comunidade delega status e rótulos aos módulos puros", () => {
  for (const nome of [
    "STATUS_DENUNCIAS",
    "STATUS_LABEL",
    "STATUS_DENUNCIAS_PERFIS",
    "STATUS_PERFIL_LABEL",
    "normalizarStatus",
    "normalizarStatusPerfil",
    "MOTIVOS_DENUNCIA_PERFIL_LABEL",
    "formatarMotivoDenunciaPerfil",
    "MOTIVOS_DENUNCIA_CONTEUDO_LABEL",
    "formatarMotivoDenunciaConteudo",
    "normalizarTipoAlvo",
    "rotuloTipoAlvoDenuncia",
    "rotuloRemocaoAlvoDenuncia",
    "rotuloSucessoRemocaoAlvo",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`(?:const|function) ${nome}\\b`));
  }

  assert.doesNotMatch(pageSource, /type StatusDenuncia\s*=/);
  assert.doesNotMatch(pageSource, /type StatusDenunciaPerfil\s*=/);
  assert.doesNotMatch(pageSource, /type TipoAlvoDenuncia\s*=/);

  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-status-utils"/);
  assert.match(pageSource, /from "\.\/lib\/admin-comunidade-report-label-utils"/);
  assert.doesNotMatch(pageSource, /type StatusFiltroDenuncia =/);
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-comunidade-filter-utils"/,
  );
  assert.match(pageSource, /normalizarStatus\(denuncia\.status\)/);
  assert.match(pageSource, /normalizarTipoAlvo\(denuncia\.alvo_tipo\)/);
  assert.match(pageSource, /formatarMotivoDenunciaConteudo\(/);
  assert.match(pageSource, /formatarMotivoDenunciaPerfil\(/);
  assert.match(contentReportCardSource, /rotuloTipoAlvoDenuncia\(/);
  assert.match(contentReportCardSource, /rotuloRemocaoAlvoDenuncia\(/);
  assert.match(pageSource, /rotuloSucessoRemocaoAlvo\(/);

  for (const source of [statusSource, reportLabelSource]) {
    assert.doesNotMatch(
      source,
      /from\s+["']react["']|useState|useEffect|supabase|localStorage|router|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
    );
  }
});
