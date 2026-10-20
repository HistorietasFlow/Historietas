import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const emptyState = readFileSync(new URL("../../app/seguindo/components/seguindo-empty-state.tsx", import.meta.url), "utf8");
const sectionHeader = readFileSync(new URL("../../app/seguindo/components/seguindo-section-header.tsx", import.meta.url), "utf8");

test("Seguindo delega estados vazios e cabeçalhos de seção visuais", () => {
  assert.match(page, /import \{ SeguindoEmptyState \} from "\.\/components\/seguindo-empty-state";/);
  assert.match(page, /import \{ SeguindoSectionHeader \} from "\.\/components\/seguindo-section-header";/);
  assert.equal((page.match(/<SeguindoEmptyState>/g) || []).length, 3);
  assert.equal((page.match(/<SeguindoSectionHeader/g) || []).length, 3);
  assert.match(emptyState, /^"use client";/);
  assert.match(emptyState, /margin: "10px 0 0"/);
  assert.match(emptyState, /color: "#FFFFFF"/);
  assert.match(emptyState, /textAlign: "center"/);
  assert.doesNotMatch(emptyState, /supabase|localStorage|useEffect|useState/);
  assert.match(sectionHeader, /^"use client";/);
  assert.match(sectionHeader, /isDesktop \? desktopSectionHeaderStyle : sectionHeaderStyle/);
  assert.match(sectionHeader, /isDesktop \? desktopSectionTitleStyle : sectionTitleStyle/);
  assert.match(sectionHeader, /isDesktop \? desktopSectionCounterStyle : sectionCounterStyle/);
  assert.doesNotMatch(sectionHeader, /supabase|localStorage|useEffect|useState/);
});
