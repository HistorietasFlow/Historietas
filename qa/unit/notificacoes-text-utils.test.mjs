import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const textoUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-text-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const normalizadores = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-local-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizadoresDados = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-data-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const loaderComunidade = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-community-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const loaderDadosComunidade = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-supabase-community-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const textoUtilsJavascript = typescript.transpileModule(textoUtils, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { corrigirTextoQuebrado, limparTextoExibicao } = await import(
  `data:text/javascript;base64,${Buffer.from(textoUtilsJavascript).toString("base64")}`,
);

function decodificarUmaVez(texto) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    new Uint8Array(
      Array.from(texto, (caractere) => caractere.charCodeAt(0) & 255),
    ),
  );
}

function codificarComoMojibake(texto) {
  return String.fromCharCode(...new TextEncoder().encode(texto));
}

test("corrige mojibake valido e preserva a remocao literal de espacos", () => {
  assert.equal(corrigirTextoQuebrado("texto simples"), "textosimples");
  assert.equal(corrigirTextoQuebrado("Ol\u00c3\u00a1 mundo"), "Ol\u00e1mundo");
  assert.equal(corrigirTextoQuebrado(" texto com espacos "), "textocomespacos");
});

test("corrige no maximo duas passagens", () => {
  const textoComTresCodificacoes = [1, 2, 3].reduce(
    (texto) => codificarComoMojibake(texto),
    "\u00e1",
  );
  const aposDuasPassagens = decodificarUmaVez(
    decodificarUmaVez(textoComTresCodificacoes),
  ).replace(/ /g, "");
  const aposTresPassagens = decodificarUmaVez(aposDuasPassagens).replace(
    / /g,
    "",
  );

  assert.equal(corrigirTextoQuebrado(textoComTresCodificacoes), aposDuasPassagens);
  assert.notEqual(aposDuasPassagens, aposTresPassagens);
});

test("interrompe em falhas de decodificacao e quando o resultado nao muda", () => {
  assert.doesNotThrow(() => corrigirTextoQuebrado("\u00c3"));
  assert.equal(corrigirTextoQuebrado("\u00c3"), "\u00c3");

  const TextDecoderOriginal = globalThis.TextDecoder;
  let decodificacoes = 0;

  globalThis.TextDecoder = class {
    decode() {
      decodificacoes += 1;
      return " ";
    }
  };

  try {
    assert.equal(corrigirTextoQuebrado(" "), "");
    assert.equal(decodificacoes, 1);
  } finally {
    globalThis.TextDecoder = TextDecoderOriginal;
  }
});

test("limparTextoExibicao delega para a correcao e aplica trim", () => {
  assert.match(
    textoUtils,
    /return corrigirTextoQuebrado\(valor\)\.trim\(\);/,
  );
  assert.equal(limparTextoExibicao("  Ol\u00c3\u00a1 mundo  "), "Ol\u00e1mundo");
});

test("fronteiras delegam a correção e a limpeza aos helpers extraídos", () => {
  assert.match(
    normalizadoresDados,
    /import \{ limparTextoExibicao \} from "\.\/notificacoes-text-utils";/,
  );
  assert.match(
    normalizadores,
    /import \{[\s\S]*?corrigirTextoQuebrado,[\s\S]*?limparTextoExibicao,[\s\S]*?\} from "\.\/notificacoes-text-utils";/,
  );
  assert.doesNotMatch(pagina, /function corrigirTextoQuebrado/);
  assert.doesNotMatch(pagina, /function limparTextoExibicao/);
  assert.match(normalizadores, /limparTextoExibicao\(capitulo\.titulo\)/);
  assert.match(normalizadores, /corrigirTextoQuebrado\(capitulo\.texto\)/);
  assert.match(normalizadoresDados, /return limparTextoExibicao\(texto\);/);
  assert.match(
    loaderDadosComunidade,
    /import \{[\s\S]*?pegarTexto,[\s\S]*?\} from "\.\/notificacoes-data-normalizers";/,
  );
  assert.doesNotMatch(
    loaderComunidade,
    /import \{[\s\S]*?pegarTexto,[\s\S]*?\} from "\.\/notificacoes-data-normalizers";/,
  );
});
