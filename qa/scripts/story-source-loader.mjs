import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Execução dos próprios fontes no Node, sem build/dev server. Só adaptar contexto
// Next explicitamente no teste; ImageResponse, SDK, fetch e decoder são reais.
export function carregarFonteStory(mocks = {}) {
  const cache = new Map(), require = createRequire(import.meta.url);
  function load(file) {
    const absolute = resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const source = ts.transpileModule(readFileSync(absolute, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    new Function("require", "module", "exports", source)(name => {
      if (name in mocks) return mocks[name];
      if (name === "server-only") return {};
      if (!name.startsWith(".")) return require(name);
      const target = resolve(dirname(absolute), name);
      const candidate = [target, `${target}.ts`, `${target}.tsx`].find(p => existsSync(p));
      if (!candidate) throw Error("Import local inexistente no harness");
      return load(candidate);
    }, mod, mod.exports);
    return mod.exports;
  }
  return load;
}
