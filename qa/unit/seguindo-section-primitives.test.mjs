import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const pageContent = readFileSync(new URL("../../app/seguindo/components/seguindo-page-content.tsx", import.meta.url), "utf8");
const worksSection = readFileSync(new URL("../../app/seguindo/components/seguindo-works-section.tsx", import.meta.url), "utf8");
const peopleSections = readFileSync(new URL("../../app/seguindo/components/seguindo-people-sections.tsx", import.meta.url), "utf8");
const emptyState = readFileSync(new URL("../../app/seguindo/components/seguindo-empty-state.tsx", import.meta.url), "utf8");
const sectionHeader = readFileSync(new URL("../../app/seguindo/components/seguindo-section-header.tsx", import.meta.url), "utf8");

test("Seguindo delega estados vazios e cabeçalhos de seção visuais", () => {
  assert.match(page, /import \{ SeguindoPageContent \} from "\.\/components\/seguindo-page-content";/);
  assert.match(pageContent, /import \{ SeguindoEmptyState \} from "\.\/seguindo-empty-state";/);
  assert.match(pageContent, /import \{ SeguindoWorksSection \} from "\.\/seguindo-works-section";/);
  assert.match(pageContent, /import \{ SeguindoPeopleSections \} from "\.\/seguindo-people-sections";/);
  assert.equal((pageContent.match(/<SeguindoEmptyState>/g) || []).length, 2);
  assert.match(worksSection, /import \{ SeguindoEmptyState \} from "\.\/seguindo-empty-state";/);
  assert.match(peopleSections, /import \{ SeguindoSectionHeader \} from "\.\/seguindo-section-header";/);
  assert.equal((peopleSections.match(/<SeguindoSectionHeader/g) || []).length, 3);
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
