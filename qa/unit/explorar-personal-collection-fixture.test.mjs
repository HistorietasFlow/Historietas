import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("qa/tests/helpers.mjs", "utf8");
const helper = source.match(
  /export async function setVisitorFavoriteByWorkSlug[\s\S]*?(?=\nexport async function openWorkActions)/,
)?.[0] || "";

test("fixture de favoritos usa apenas permissões concedidas e preserva a trava local", () => {
  assert.match(helper, /\.from\("favoritos"\)\.insert\(/);
  assert.doesNotMatch(helper, /\.from\("favoritos"\)\.upsert\(/);
  assert.match(helper, /error\.code === "23505"/);
  assert.match(helper, /hostname !== "127\.0\.0\.1"/);
  assert.match(helper, /hostname !== "localhost"/);
  assert.match(helper, /\.from\("favoritos"\)[\s\S]*?\.delete\(\)/);
});
