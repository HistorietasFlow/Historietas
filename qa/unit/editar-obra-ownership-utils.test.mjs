import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
import "./editar-obra-profile-loader.test.mjs";

const source = readFileSync(new URL("../../app/editar-obra/lib/editar-obra-ownership-utils.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/editar-obra/page.tsx", import.meta.url), "utf8");
const initialLoadSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/use-editar-obra-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);
const localSelectionSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-selection.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarIdUsuario, usuarioPodeEditarObraLocal } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("normaliza identificador de usuário somente com trim e caixa baixa", () => {
  assert.equal(normalizarIdUsuario("  Usuario@Exemplo.Com  "), "usuario@exemplo.com");
  assert.equal(normalizarIdUsuario(""), "");
});

test("preserva a permissão de edição local por autoria", () => {
  assert.equal(usuarioPodeEditarObraLocal({}, "usuario"), true);
  assert.equal(usuarioPodeEditarObraLocal({ autorId: "usuario" }, "usuario"), true);
  assert.equal(usuarioPodeEditarObraLocal({ autorId: "  UsUaRiO  " }, "usuario"), true);
  assert.equal(usuarioPodeEditarObraLocal({ autorId: "outro" }, "usuario"), false);
  assert.equal(usuarioPodeEditarObraLocal({ autorId: "" }, "usuario"), true);
  assert.equal(usuarioPodeEditarObraLocal({}, ""), false);
});

test("Editar Obra delega somente os helpers puros de propriedade", () => {
  assert.match(
    initialLoadSource,
    /import \{ selecionarObrasLocaisAutorizadasEdicaoObra \} from "\.\.\/lib\/editar-obra-local-selection";/,
  );
  assert.doesNotMatch(
    pageSource,
    /import \{ usuarioPodeEditarObraLocal \} from "\.\/lib\/editar-obra-ownership-utils";/,
  );
  for (const helper of ["normalizarIdUsuario", "usuarioPodeEditarObraLocal"]) {
    assert.doesNotMatch(pageSource, new RegExp(`function ${helper}\\(`));
  }
  assert.match(
    localSelectionSource,
    /import \{ usuarioPodeEditarObraLocal \} from "\.\/editar-obra-ownership-utils";/,
  );
  assert.match(
    localSelectionSource,
    /usuarioPodeEditarObraLocal\(obra, userId\)/,
  );
  assert.match(source, /valor\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /Boolean\(usuarioAtual\) && \(!autorIdObra \|\| autorIdObra === usuarioAtual\)/);
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
