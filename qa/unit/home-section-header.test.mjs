import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeSectionHeader.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

test("HomeSectionHeader preserva a apresentacao e o contrato de props", () => {
  assert.match(componente, /export default function HomeSectionHeader/);
  assert.match(componente, /title: string;/);
  assert.match(componente, /subtitle\?: string;/);
  assert.match(componente, /<h2 style=\{sectionTitleStyle\}>\{title\}<\/h2>/);
  assert.doesNotMatch(componente, /\{subtitle\}/);
  assert.doesNotMatch(componente, /<p/);
  assert.doesNotMatch(componente, /useState|useEffect/);
  assert.match(
    componente,
    /const sectionHeaderStyle: CSSProperties = \{\s*display: "grid",\s*gridTemplateColumns: "minmax\(0, 1fr\)",\s*justifyItems: "center",\s*gap: "6px",\s*marginBottom: "14px",\s*maxWidth: "100%",\s*minWidth: 0,\s*textAlign: "center",\s*\};/,
  );
  assert.match(
    componente,
    /const sectionTitleStyle: CSSProperties = \{\s*margin: 0,\s*color: "#FFFFFF",\s*fontSize: "clamp\(24px, 4vw, 30px\)",\s*lineHeight: 1\.05,\s*fontFamily:\s*'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',\s*fontWeight: 900,\s*letterSpacing: "-0\.035em",\s*maxWidth: "100%",\s*textAlign: "center",\s*overflowWrap: "anywhere",\s*wordBreak: "break-word",\s*\};/,
  );
});

test("Home delega os 18 cabecalhos sem alterar os estilos compartilhados", () => {
  assert.match(
    pagina,
    /import HomeSectionHeader from "\.\.\/components\/HomeSectionHeader";/,
  );
  assert.doesNotMatch(pagina, /function SectionHeader\(/);
  assert.equal((pagina.match(/<HomeSectionHeader\b/g) || []).length, 18);
  assert.equal((pagina.match(/<HomeSectionHeader[\s\S]*?\/>/g) || []).length, 18);
  assert.match(pagina, /subtitle="Continue do ponto em que parou\."/);
  assert.match(pagina, /const listaPageTitleTypographyStyle: CSSProperties/);
  assert.match(pagina, /const safeTextStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const sectionHeaderStyle: CSSProperties/);
  assert.doesNotMatch(pagina, /const sectionTitleStyle: CSSProperties/);
});
