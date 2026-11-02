import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hookPath = new URL(
  "../../app/perfil-autor/hooks/use-perfil-autor-report-state.ts",
  import.meta.url,
);
const pagePath = new URL("../../app/perfil-autor/page.tsx", import.meta.url);

test("o hook centraliza somente o estado e os fechamentos das denúncias", async () => {
  const source = await readFile(hookPath, "utf8");

  assert.match(source, /^"use client";/);
  assert.match(
    source,
    /import type \{ AlvoDenunciaConteudoPerfil \} from "\.\.\/types";/,
  );
  assert.match(source, /export function usePerfilAutorReportState\(\)/);
  assert.match(source, /useState\(false\)/);
  assert.match(source, /useState<AlvoDenunciaConteudoPerfil>\(null\)/);
  assert.match(
    source,
    /function fecharDenunciaPerfil\(\) \{\s*setDenunciaPerfilAberta\(false\);\s*\}/,
  );
  assert.match(
    source,
    /function fecharDenunciaConteudo\(\) \{\s*setAlvoDenunciaConteudoPerfil\(null\);\s*\}/,
  );
  assert.doesNotMatch(source, /useEffect|supabase|localStorage|router|setMensagemAcao/);
});

test("a pagina delega estado e preserva callbacks de denúncia", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(
    source,
    /import \{ usePerfilAutorReportState \} from "\.\/hooks\/use-perfil-autor-report-state";/,
  );
  assert.match(source, /\} = usePerfilAutorReportState\(\);/);
  assert.doesNotMatch(
    source,
    /const \[denunciaPerfilAberta, setDenunciaPerfilAberta\]/,
  );
  assert.doesNotMatch(source, /useState<AlvoDenunciaConteudoPerfil>\(null\)/);
  assert.match(
    source,
    /usePerfilAutorReportActions\(\{[\s\S]*?setDenunciaPerfilAberta,[\s\S]*?setAlvoDenunciaConteudoPerfil,/,
  );
  assert.match(
    source,
    /obterEstadoVisualDenunciasPerfilAutor\(\{[\s\S]*?alvoDenunciaConteudoPerfil,[\s\S]*?denunciaPerfilAberta,/,
  );
  assert.match(source, /onProfileClose=\{fecharDenunciaPerfil\}/);
  assert.match(
    source,
    /onProfileSent=\{\(\) => \{\s*fecharDenunciaPerfil\(\);\s*setMensagemAcao\("Denúncia enviada para análise\."\);\s*\}\}/,
  );
  assert.match(source, /onContentClose=\{fecharDenunciaConteudo\}/);
  assert.match(
    source,
    /onContentSent=\{\(\) => \{\s*fecharDenunciaConteudo\(\);\s*setMensagemAcao\("Denúncia enviada para análise\."\);\s*\}\}/,
  );
});
