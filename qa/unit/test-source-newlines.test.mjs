import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  normalizarQuebrasLinhaFonteTeste,
} from "../scripts/test-source-newlines.mjs";

test("normaliza CRLF e CR isolado antes das transformações dos testes", () => {
  assert.equal(
    normalizarQuebrasLinhaFonteTeste("primeira\r\nsegunda\rterceira\n"),
    "primeira\nsegunda\nterceira\n",
  );
});

test("preload normaliza leituras UTF-8 sem alterar leituras em Buffer", () => {
  const diretorio = mkdtempSync(join(tmpdir(), "historietas-fontes-"));
  const arquivo = join(diretorio, "fonte.ts");

  try {
    writeFileSync(arquivo, "linha 1\r\nlinha 2\r", "utf8");

    assert.equal(readFileSync(arquivo, "utf8"), "linha 1\nlinha 2\n");
    assert.ok(Buffer.isBuffer(readFileSync(arquivo)));
  } finally {
    rmSync(diretorio, { recursive: true, force: true });
  }
});
