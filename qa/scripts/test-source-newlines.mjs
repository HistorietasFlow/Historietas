import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const readFileSyncOriginal = fs.readFileSync;

export function normalizarQuebrasLinhaFonteTeste(conteudo) {
  return conteudo.replace(/\r\n?/g, "\n");
}

fs.readFileSync = function readFileSyncNormalizado(...argumentos) {
  const conteudo = readFileSyncOriginal.apply(this, argumentos);

  return typeof conteudo === "string"
    ? normalizarQuebrasLinhaFonteTeste(conteudo)
    : conteudo;
};

syncBuiltinESMExports();
