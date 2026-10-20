import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modelos = readFileSync(
  new URL("../../app/notificacoes/lib/notificacoes-models.ts", import.meta.url),
  "utf8",
);
const storageUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizadores = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-local-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

const normalizadoresExecutaveis = normalizadores
  .replace(
    'import { criarSlugBase } from "../../../lib/utils";',
    [
      'const criarSlugBase = (texto) => String(texto)',
      '  .trim()',
      '  .toLowerCase()',
      '  .replace(/[^a-z0-9]+/g, "-")',
      '  .replace(/(^-|-$)/g, "");',
    ].join("\n"),
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/notificacoes-text-utils";/,
    [
      'const corrigirTextoQuebrado = (texto) => String(texto).replace(/ /g, "");',
      'const limparTextoExibicao = (texto) => corrigirTextoQuebrado(texto).trim();',
    ].join("\n"),
  )
  .replace(/import type \{[\s\S]*?\} from "\.\/notificacoes-models";/, "");
const normalizadoresJavascript = typescript.transpileModule(
  normalizadoresExecutaveis,
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  calcularProgressoLeitura,
  normalizarCapitulo,
  normalizarNotificacao,
  normalizarObra,
  normalizarTipoNotificacao,
} = await import(
  `data:text/javascript;base64,${Buffer.from(normalizadoresJavascript).toString("base64")}`,
);

test("modelos preservam os contratos locais de obra, capitulo e notificacao", () => {
  for (const tipo of ["CapituloLocal", "ObraLocal", "NotificacaoLocal"]) {
    assert.match(modelos, new RegExp(`export type ${tipo} =`));
  }

  for (const campo of [
    "id: string;",
    "titulo: string;",
    "capitulos: CapituloLocal[];",
    "progressoLeitura: number;",
    "solicitacaoId?: string;",
  ]) {
    assert.ok(modelos.includes(campo), `campo ausente: ${campo}`);
  }

  for (const tipo of [
    "novo-capitulo",
    "comentario-obra",
    "curtida-comentario-capitulo",
    "atividade-comunidade",
    "problema-tecnico",
  ]) {
    assert.ok(modelos.includes(`| "${tipo}"`), `tipo ausente: ${tipo}`);
  }
});

test("storage preserva chaves, isolamento por usuario, SSR e fallback silencioso", () => {
  for (const chave of [
    'CHAVE_OBRAS = "historietas-obras"',
    'CHAVE_NOTIFICACOES = "historietas-notificacoes"',
    'CHAVE_OBRAS_SEGUIDAS = "historietas-obras-seguidas"',
    'CHAVE_NOTIFICACOES_APAGADAS = "historietas-notificacoes-apagadas"',
  ]) {
    assert.ok(storageUtils.includes(chave), `chave ausente: ${chave}`);
  }

  for (const helper of [
    "criarStorageKeyUsuarioNotificacoes",
    "lerStorageUsuarioNotificacoes",
    "salvarJsonStorageUsuarioNotificacoes",
  ]) {
    assert.match(storageUtils, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(storageUtils, /const userIdLimpo = userId\.trim\(\);/);
  assert.match(storageUtils, /return userIdLimpo \? \`\$\{chave\}:\$\{userIdLimpo\}\` : "";/);
  assert.match(storageUtils, /typeof window === "undefined" \|\| !userIdLimpo/);
  assert.match(storageUtils, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(storageUtils, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.match(storageUtils, /try \{[\s\S]*?\} catch \{/);
  assert.doesNotMatch(storageUtils, /supabase|useEffect|useState|from "react"/i);
});

test("normalizadores preservam progresso, defaults, aliases e fallback", () => {
  assert.equal(calcularProgressoLeitura([]), 0);
  assert.equal(
    calcularProgressoLeitura([
      { lido: true },
      { lido: false },
      { lido: true },
    ]),
    67,
  );

  const capitulo = normalizarCapitulo({}, 2);
  assert.equal(capitulo.id, "capitulo-3");
  assert.equal(capitulo.titulo, "Cap\u00edtulo sem t\u00edtulo");
  assert.equal(capitulo.lido, false);

  const obra = normalizarObra(
    {
      titulo: " Aurora ",
      capitulos: [{ id: "lido", titulo: "Um", lido: true }],
    },
    0,
  );
  assert.equal(obra.slug, "aurora");
  assert.equal(obra.link, "/obra/aurora");
  assert.equal(obra.progressoLeitura, 100);
  assert.deepEqual(obra.tags, ["sem tags"]);

  assert.equal(normalizarTipoNotificacao("capitulo novo"), "novo-capitulo");
  assert.equal(
    normalizarTipoNotificacao("comentario publicacao comunidade"),
    "comentario-comunidade",
  );
  assert.equal(normalizarTipoNotificacao("inexistente"), "atividade-comunidade");

  const notificacao = normalizarNotificacao(
    { solicitacao_id: " solicitacao-1 ", tipo: "review" },
    1,
  );
  assert.equal(notificacao.id, "notificacao-2");
  assert.equal(notificacao.tipo, "review-comunidade");
  assert.equal(notificacao.solicitacaoId, "solicitacao-1");

  assert.match(normalizadores, /new Set<NotificacaoLocal\["tipo"\]>\(/);
  assert.match(normalizadores, /return "atividade-comunidade";/);
  assert.doesNotMatch(normalizadores, /supabase|localStorage|useEffect|useState|from "react"/i);
});

test("pagina importa as fronteiras locais e nao retem implementacoes duplicadas", () => {
  assert.match(pagina, /from "\.\/lib\/notificacoes-local-normalizers";/);
  assert.match(pagina, /from "\.\/lib\/notificacoes-storage-utils";/);
  assert.match(pagina, /from "\.\/lib\/notificacoes-models";/);

  for (const declaracao of [
    "type CapituloLocal =",
    "type ObraLocal =",
    "type NotificacaoLocal =",
    "function criarStorageKeyUsuarioNotificacoes(",
    "function lerStorageUsuarioNotificacoes(",
    "function salvarJsonStorageUsuarioNotificacoes(",
    "function normalizarNotificacao(",
    "function normalizarObra(",
  ]) {
    assert.doesNotMatch(
      pagina,
      new RegExp(declaracao.replace(/[()*+?.^$|[\]{}\\]/g, "\\$&")),
    );
  }
});
