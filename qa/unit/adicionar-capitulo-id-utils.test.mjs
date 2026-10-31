import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const idUtilsSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-id-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const createActionSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloCreateAction.ts",
    import.meta.url,
  ),
  "utf8",
);
const notificationSource = readFileSync(
  new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-notification-utils.ts", import.meta.url),
  "utf8",
);
const idUtilsJavascript = typescript.transpileModule(idUtilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { criarId, gerarUuidFallbackAdicionarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(idUtilsJavascript).toString("base64")}`,
);

function comCrypto(crypto, executar) {
  const descriptorAnterior = Object.getOwnPropertyDescriptor(globalThis, "crypto");

  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: crypto,
  });

  try {
    executar();
  } finally {
    if (descriptorAnterior) {
      Object.defineProperty(globalThis, "crypto", descriptorAnterior);
    } else {
      delete globalThis.crypto;
    }
  }
}

function comMathRandom(random, executar) {
  const randomAnterior = Math.random;
  Math.random = random;

  try {
    executar();
  } finally {
    Math.random = randomAnterior;
  }
}

test("criarId prioriza crypto.randomUUID quando disponível", () => {
  let getRandomValuesChamado = false;

  comCrypto(
    {
      randomUUID() {
        return "uuid-da-web-crypto";
      },
      getRandomValues() {
        getRandomValuesChamado = true;
      },
    },
    () => {
      assert.equal(criarId(), "uuid-da-web-crypto");
    },
  );

  assert.equal(getRandomValuesChamado, false);
});

test("fallback de UUID usa getRandomValues, versão 4 e variante RFC", () => {
  let tamanhoDosBytes = 0;

  comCrypto(
    {
      getRandomValues(bytes) {
        tamanhoDosBytes = bytes.length;

        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = index;
        }
      },
    },
    () => {
      assert.equal(
        gerarUuidFallbackAdicionarCapitulo(),
        "00010203-0405-4607-8809-0a0b0c0d0e0f",
      );
      assert.match(
        criarId(),
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    },
  );

  assert.equal(tamanhoDosBytes, 16);
});

test("fallback de UUID usa Math.random quando getRandomValues não existe", () => {
  let chamadas = 0;

  comCrypto({}, () => {
    comMathRandom(() => {
      chamadas += 1;
      return 0.5;
    }, () => {
      assert.equal(
        gerarUuidFallbackAdicionarCapitulo(),
        "80808080-8080-4080-8080-808080808080",
      );
    });
  });

  assert.equal(chamadas, 16);
});

test("Adicionar Capítulo delega somente a geração de IDs ao módulo extraído", () => {
  assert.match(
    createActionSource,
    /import \{ criarId \} from "\.\.\/lib\/adicionar-capitulo-id-utils";/,
  );
  assert.doesNotMatch(pageSource, /function gerarUuidFallbackAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function criarId\(/);
  assert.equal((pageSource.match(/\bid:\s*criarId\(\)/g) || []).length, 0);
  assert.equal((createActionSource.match(/\bid:\s*criarId\(\)/g) || []).length, 1);
  assert.equal((notificationSource.match(/\bid:\s*criarId\(\)/g) || []).length, 1);
  assert.match(notificationSource, /import \{ criarId \} from "\.\/adicionar-capitulo-id-utils";/);
  assert.match(idUtilsSource, /new Uint8Array\(16\)/);
  assert.match(idUtilsSource, /globalThis/);
  assert.match(idUtilsSource, /cryptoGlobal\.randomUUID/);
  assert.match(idUtilsSource, /cryptoGlobal\.getRandomValues/);
  assert.match(idUtilsSource, /Math\.floor\(Math\.random\(\) \* 256\)/);
  assert.match(idUtilsSource, /\(bytes\[6\] & 0x0f\) \| 0x40/);
  assert.match(idUtilsSource, /\(bytes\[8\] & 0x3f\) \| 0x80/);
  assert.doesNotMatch(idUtilsSource, /supabase|localStorage|useState|useEffect|<\w+/i);
});
