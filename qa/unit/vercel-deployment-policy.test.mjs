import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const vercelConfig = JSON.parse(
  await readFile(new URL("../../vercel.json", import.meta.url), "utf8"),
);

test("mantém deploy automático somente para a main", () => {
  assert.equal(
    vercelConfig.$schema,
    "https://openapi.vercel.sh/vercel.json",
  );
  assert.deepEqual(vercelConfig.git?.deploymentEnabled, {
    "*": false,
    main: true,
  });
});
