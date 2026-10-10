import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-record-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const diaryLoaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const itemUtilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-diary-item-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(
  utilsSource.replace(
    'import { pegarTexto } from "./data-normalizers";',
    `const pegarTexto = (valor, fallback = "") =>
  typeof valor === "string" && valor.trim() ? valor.trim() : fallback;`,
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  criarEstadoDiarioPerfilVazio,
  obterDataRegistroDiario,
  obterVisibilidadeRegistroDiario,
  registroDiarioPodeAparecer,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("obterDataRegistroDiario preserva prioridade e nullish coalescing", () => {
  assert.equal(
    obterDataRegistroDiario({
      atualizado_em: " 2026-10-10 ",
      updated_at: "2026-10-09",
      criado_em: "2026-10-08",
      created_at: "2026-10-07",
    }),
    "2026-10-10",
  );
  assert.equal(
    obterDataRegistroDiario({
      atualizado_em: null,
      updated_at: "2026-10-09",
      criado_em: "2026-10-08",
    }),
    "2026-10-09",
  );
  assert.equal(
    obterDataRegistroDiario({
      atualizado_em: "",
      updated_at: "2026-10-09",
    }),
    "",
  );
  assert.equal(obterDataRegistroDiario({ created_at: "2026-10-07" }), "2026-10-07");
});

test("obterVisibilidadeRegistroDiario preserva valores válidos e fallback", () => {
  assert.equal(obterVisibilidadeRegistroDiario({ visibilidade: "publico" }, "privado"), "publico");
  assert.equal(obterVisibilidadeRegistroDiario({ visibilidade: "parcial" }, "privado"), "parcial");
  assert.equal(obterVisibilidadeRegistroDiario({ visibilidade: "privado" }, "publico"), "privado");
  assert.equal(obterVisibilidadeRegistroDiario({ visibilidade: "restrito" }, "parcial"), "parcial");
  assert.equal(obterVisibilidadeRegistroDiario({ visibilidade: " " }, "publico"), "publico");
});

test("registroDiarioPodeAparecer preserva privacidade, incluirPrivados e fallbacks", () => {
  assert.equal(registroDiarioPodeAparecer({ visibilidade: "publico" }, false, "privado"), true);
  assert.equal(registroDiarioPodeAparecer({ visibilidade: "parcial" }, false, "privado"), true);
  assert.equal(registroDiarioPodeAparecer({ visibilidade: "privado" }, false, "publico"), false);
  assert.equal(registroDiarioPodeAparecer({ visibilidade: "invalido" }, false, "privado"), false);
  assert.equal(registroDiarioPodeAparecer({ visibilidade: "privado" }, true, "publico"), true);
});

test("criarEstadoDiarioPerfilVazio preserva todas as listas vazias e novas referências", () => {
  const estado = criarEstadoDiarioPerfilVazio();
  const novoEstado = criarEstadoDiarioPerfilVazio();

  assert.deepEqual(estado, {
    lendoAgora: [],
    queroLer: [],
    favoritas: [],
    concluidas: [],
    avaliacoes: [],
    reviews: [],
    atividades: [],
  });
  assert.notEqual(estado.lendoAgora, novoEstado.lendoAgora);
});

test("Perfil de Autor delega os helpers de registros do Diário para o carregador", () => {
  assert.match(
    utilsSource,
    /import type \{ DiarioPerfilEstado, VisibilidadeDiarioPerfil \} from "\.\.\/types";/,
  );
  assert.match(utilsSource, /import \{ pegarTexto \} from "\.\/data-normalizers";/);
  assert.match(
    pagina,
    /import \{ criarEstadoDiarioPerfilVazio \} from "\.\/lib\/profile-diary-record-utils";/,
  );
  assert.match(
    diaryLoaderSource,
    /import \{[\s\S]*?obterDataRegistroDiario,[\s\S]*?obterVisibilidadeRegistroDiario,[\s\S]*?registroDiarioPodeAparecer,[\s\S]*?\} from "\.\/profile-diary-record-utils";/,
  );

  for (const helper of [
    "obterDataRegistroDiario",
    "obterVisibilidadeRegistroDiario",
    "registroDiarioPodeAparecer",
    "criarEstadoDiarioPerfilVazio",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    diaryLoaderSource,
    /registroDiarioPodeAparecer\(registro, incluirItensDoDiario, "privado"\)/,
  );
  assert.match(
    itemUtilsSource,
    /export function criarItemAtividadeDiarioPerfil\([\s\S]*?const data = obterDataRegistroDiario\(registro\);/,
  );
  assert.match(
    diaryLoaderSource,
    /criarItemAtividadeDiarioPerfil\(registro, obrasPorId, obrasPorCapituloId\)/,
  );
  assert.match(pagina, /: criarEstadoDiarioPerfilVazio\(\);/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect|localStorage/);
});
