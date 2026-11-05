import assert from "node:assert/strict";
import test from "node:test";
import { hasUseClientDirective } from "../scripts/static-audit-use-client-utils.mjs";

test("aceita BOM, whitespace e comentarios antes da diretiva", () => {
  assert.equal(hasUseClientDirective('"use client";'), true);
  assert.equal(hasUseClientDirective("'use client' ;"), true);
  assert.equal(
    hasUseClientDirective(
      '\uFEFF \r\n// comentario inicial\r\n/* outro comentario */\n"use client"\t;',
    ),
    true,
  );
  assert.equal(
    hasUseClientDirective('/* primeiro *//* segundo */"use client";'),
    true,
  );
});

test("rejeita diretiva ausente ou fora do inicio permitido", () => {
  assert.equal(hasUseClientDirective('const valor = 1;\n"use client";'), false);
  assert.equal(hasUseClientDirective('/* sem fechamento\n"use client";'), false);
  assert.equal(hasUseClientDirective('// sem quebra "use client";'), false);
  assert.equal(hasUseClientDirective('"use client"'), false);
  assert.equal(hasUseClientDirective('"use server";'), false);
});

test(
  "processa entrada grande e adversarial sem backtracking",
  { timeout: 1_000 },
  () => {
    const adversarial = `/*${"*//*".repeat(250_000)}x`;

    assert.equal(hasUseClientDirective(adversarial), false);
  },
);

test("preserva o limite de dois mil caracteres do static audit", () => {
  assert.equal(hasUseClientDirective(`${" ".repeat(1_999)}"use client";`), false);
  assert.equal(hasUseClientDirective(`${" ".repeat(1_987)}"use client";`), true);
});
