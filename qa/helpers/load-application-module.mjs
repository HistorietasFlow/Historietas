import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import typescript from "typescript";

// Executa o módulo real da aplicação (inclusive seus imports locais), sem uma
// segunda implementação da regra no teste. Mocks são explícitos por import.
export function loadApplicationModule(path, mocks = {}) {
  const cache = new Map(), requireExternal = createRequire(import.meta.url);
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href);
    const exports = {};
    cache.set(url.href, exports);
    const javascript = typescript.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022, jsx: typescript.JsxEmit.ReactJSX },
    }).outputText;
    new Function("require", "exports", javascript)((name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (!name.startsWith(".")) return requireExternal(name);
      const target = [".ts", ".tsx"].map(ext => new URL(name + ext, url)).find(existsSync);
      assert.ok(target, `Módulo local ausente: ${name}`);
      return load(target);
    }, exports);
    return exports;
  }
  return load(new URL(`../../${path}`, import.meta.url));
}
