import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerPath = new URL(
  "../../app/em-breve/components/em-breve-header.tsx",
  import.meta.url,
);
const pagePath = new URL("../../app/em-breve/page.tsx", import.meta.url);

test("Em Breve delega somente o header visual ao componente dedicado", async () => {
  const header = await readFile(headerPath, "utf8");
  const page = await readFile(pagePath, "utf8");

  assert.match(header, /import Link from "next\/link"/);
  for (const style of [
    "titleHeaderStyle",
    "titleLinkStyle",
    "titleTextStyle",
    "desktopTitleHeaderStyle",
    "desktopNotificationButtonStyle",
    "desktopNotificationBadgeStyle",
    "desktopTitleLinkStyle",
    "desktopTitleTextStyle",
  ]) {
    assert.ok(header.includes(style), `mantem ${style}`);
  }
  assert.match(header, /export function EmBreveHeader/);
  assert.match(header, /desktopLayout/);
  assert.match(header, /notificacoesNaoLidas/);
  assert.match(header, /href="\/"/);
  assert.match(header, /aria-label="Voltar para a Home"/);
  assert.match(header, /historietas-theme-title/);
  assert.match(header, /EM BREVE/);
  assert.match(header, /href="\/notificacoes"/);
  assert.match(header, /notificacoesNaoLidas > 0/);
  assert.match(header, /Notificações:/);
  assert.match(header, /não lidas/);
  assert.match(header, /notificacoesNaoLidas > 99/);
  assert.match(header, /"99\+"/);

  assert.match(
    page,
    /import \{ EmBreveHeader \} from "\.\/components\/em-breve-header"/,
  );
  assert.match(page, /<EmBreveHeader/);
  assert.match(page, /desktopLayout=\{desktopLayout\}/);
  assert.match(page, /notificacoesNaoLidas=\{notificacoesNaoLidas\}/);
  assert.doesNotMatch(page, /<header/);
  for (const style of [
    "titleHeaderStyle",
    "titleLinkStyle",
    "titleTextStyle",
    "desktopTitleHeaderStyle",
    "desktopNotificationButtonStyle",
    "desktopNotificationBadgeStyle",
    "desktopTitleLinkStyle",
    "desktopTitleTextStyle",
  ]) {
    assert.ok(!page.includes(style), `remove ${style} da pagina`);
  }
  assert.match(page, /import Link from "next\/link"/);
  assert.match(page, /useNotificacoes/);
  assert.match(
    page,
    /const \{ notificacoesNaoLidas \} = useNotificacoes\(\);/,
  );
  assert.doesNotMatch(
    header,
    /supabase|auth|router|localStorage|useEffect|useState|MutationObserver|\.(?:insert|update|delete|upsert)\(/,
  );
});
