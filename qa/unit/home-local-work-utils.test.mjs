import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-local-work-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const javascriptModulo = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  contarComentariosObraLocal,
  contarCurtidasObraLocal,
  obterTotalComentariosObraHome,
  obterTotalCurtidasObraHome,
  obraTemArquivoAnexado,
  obraTemConteudoPublicoHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

const criarCapitulo = (overrides = {}) => ({
  comentario: "",
  curtiu: false,
  ...overrides,
});

const criarObra = (overrides = {}) => ({
  capitulos: [],
  totalComentarios: 0,
  totalCurtidas: 0,
  ...overrides,
});

test("home-local-work-utils preserva curtidas locais e totais", () => {
  assert.equal(contarCurtidasObraLocal(criarObra()), 0);
  assert.equal(
    contarCurtidasObraLocal(criarObra({
      capitulos: [criarCapitulo({ curtiu: true }), criarCapitulo()],
    })),
    1,
  );
  assert.equal(
    obterTotalCurtidasObraHome(criarObra({
      capitulos: [criarCapitulo({ curtiu: true })],
      totalCurtidas: 4,
    })),
    4,
  );
  assert.equal(
    obterTotalCurtidasObraHome(criarObra({
      capitulos: [criarCapitulo({ curtiu: true }), criarCapitulo({ curtiu: true })],
      totalCurtidas: 1,
    })),
    2,
  );
});

test("home-local-work-utils preserva trim dos comentarios e totais", () => {
  const obraComComentarios = criarObra({
    capitulos: [
      criarCapitulo({ comentario: "" }),
      criarCapitulo({ comentario: "   " }),
      criarCapitulo({ comentario: "comentario valido" }),
    ],
  });

  assert.equal(contarComentariosObraLocal(obraComComentarios), 1);
  assert.equal(
    obterTotalComentariosObraHome({ ...obraComComentarios, totalComentarios: 4 }),
    4,
  );
  assert.equal(
    obterTotalComentariosObraHome({
      ...obraComComentarios,
      capitulos: [
        criarCapitulo({ comentario: "um" }),
        criarCapitulo({ comentario: "dois" }),
      ],
      totalComentarios: 1,
    }),
    2,
  );
});

test("home-local-work-utils preserva a validacao de arquivo anexado", () => {
  assert.equal(obraTemArquivoAnexado(criarObra()), false);
  assert.equal(obraTemArquivoAnexado(criarObra({ arquivoObra: [] })), false);
  assert.equal(obraTemArquivoAnexado(criarObra({ arquivoObra: "invalido" })), false);
  assert.equal(obraTemArquivoAnexado(criarObra({ arquivoObra: {} })), false);
  assert.equal(
    obraTemArquivoAnexado(criarObra({ arquivoObra: { nome: "  ", conteudo: "conteudo" } })),
    false,
  );
  assert.equal(
    obraTemArquivoAnexado(criarObra({ arquivoObra: { nome: "obra.txt", conteudo: "  " } })),
    false,
  );
  assert.equal(
    obraTemArquivoAnexado(criarObra({ arquivoObra: { nome: "obra.txt", conteudo: "conteudo" } })),
    true,
  );
});

test("home-local-work-utils preserva a regra de conteudo publico", () => {
  assert.equal(obraTemConteudoPublicoHome(criarObra()), false);
  assert.equal(
    obraTemConteudoPublicoHome(criarObra({ capitulos: [criarCapitulo()] })),
    true,
  );
  assert.equal(
    obraTemConteudoPublicoHome(criarObra({
      arquivoObra: { nome: "obra.txt", conteudo: "conteudo" },
    })),
    true,
  );
});

test("home-local-work-utils estabelece a fronteira pura de metricas locais", () => {
  for (const nomeFuncao of [
    "contarCurtidasObraLocal",
    "contarComentariosObraLocal",
    "obterTotalCurtidasObraHome",
    "obterTotalComentariosObraHome",
    "obraTemArquivoAnexado",
    "obraTemConteudoPublicoHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }

  assert.match(pagina, /from "\.\/lib\/home-local-work-utils";/);
  assert.match(modulo, /capitulo\.comentario\.trim\(\)/);
  assert.match(modulo, /Math\.max\(obra\.totalCurtidas \|\| 0, contarCurtidasObraLocal\(obra\)\)/);
  assert.match(modulo, /Math\.max\(obra\.totalComentarios \|\| 0, contarComentariosObraLocal\(obra\)\)/);
  assert.match(modulo, /obra\.capitulos\.length > 0 \|\| obraTemArquivoAnexado\(obra\)/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
