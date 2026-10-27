import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/components/admin-comunidade-profile-report-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("cartão de denúncia de perfil preserva os contratos visuais e de ação", () => {
  assert.match(
    componentSource,
    /export function AdminComunidadeProfileReportCard\(/,
  );
  assert.match(componentSource, /<article style=\{reportCardStyle\}>/);
  assert.match(componentSource, /STATUS_DENUNCIAS_PERFIS\.map\(/);
  assert.match(componentSource, /STATUS_PERFIL_LABEL\[denuncia\.status\]/);
  assert.match(
    componentSource,
    /formatarMotivoDenunciaPerfil\(denuncia\.motivo\)/,
  );
  assert.match(
    componentSource,
    /href=\{denuncia\.perfilHref\}/,
  );
  assert.match(
    componentSource,
    /totalReincidencias > 1/,
  );
  assert.match(componentSource, /Sem descrição adicional\./);
  assert.match(
    componentSource,
    /denuncia\.atualizadoEm !== denuncia\.criadoEm/,
  );
  assert.match(
    componentSource,
    /onAtualizarStatus\(denuncia\.id, "analisada"\)/,
  );
  assert.match(
    componentSource,
    /onRemoverDenunciaResolvida\(denuncia\.id\)/,
  );
  assert.match(
    componentSource,
    /onFecharMenu\(\);\s*onAtualizarStatus\(denuncia\.id, status\);/,
  );
});

test("página delega apenas o artigo do cartão de denúncia de perfil", () => {
  const inicioListaPerfis = pageSource.indexOf(
    "denunciasPerfisFiltradas.map((denuncia) => {",
  );
  const fimListaPerfis = pageSource.indexOf(
    "\n          </section>",
    inicioListaPerfis,
  );
  const listaPerfisSource = pageSource.slice(
    inicioListaPerfis,
    fimListaPerfis,
  );

  assert.match(
    pageSource,
    /import \{ AdminComunidadeProfileReportCard \} from "\.\/components\/admin-comunidade-profile-report-card";/,
  );
  assert.match(
    pageSource,
    /denunciasPerfisFiltradas\.map\(\(denuncia\) => \{[\s\S]*?const totalReincidencias[\s\S]*?<AdminComunidadeProfileReportCard/,
  );
  assert.match(
    pageSource,
    /reincidenciasPorUsuario\[denuncia\.denunciadoId\] \|\| 0/,
  );
  assert.match(
    pageSource,
    /onAtualizarStatus=\{\(denunciaId, status\) =>\s*void atualizarStatusDenunciaPerfil\(denunciaId, status\)/,
  );
  assert.match(
    pageSource,
    /onRemoverDenunciaResolvida=\{\(denunciaId\) =>\s*void removerDenunciaPerfilResolvida\(denunciaId\)/,
  );
  assert.doesNotMatch(
    listaPerfisSource,
    /<article key=\{denuncia\.id\}/,
  );
});

test("cartão não concentra dependências de infraestrutura", () => {
  assert.doesNotMatch(
    componentSource,
    /from\s+["']react["']|useState|useEffect|supabase|localStorage|router/i,
  );
});
