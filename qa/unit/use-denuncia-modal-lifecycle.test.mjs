import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const modal = readFileSync(
  new URL("../../components/DenunciaModal.tsx", import.meta.url),
  "utf8",
);
const lifecycle = readFileSync(
  new URL(
    "../../components/hooks/use-denuncia-modal-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
);

test("DenunciaModal delega o lifecycle do modal ao hook dedicado", () => {
  assert.match(
    modal,
    /import \{ useDenunciaModalLifecycle \} from "\.\/hooks\/use-denuncia-modal-lifecycle"/,
  );
  assert.match(modal, /\} = useDenunciaModalLifecycle\(\{/);
  assert.match(modal, /\baberto,\s*alvoId,\s*alvoTipo,\s*enviando,/);
  assert.match(modal, /\bonFechar,\s*setMotivo,\s*setDescricao,/);
  assert.match(modal, /\bsetErro,\s*setEnviado,\s*setEnviando,/);
  assert.doesNotMatch(modal, /useEffect\(/);
  assert.doesNotMatch(modal, /useRef\(/);
  assert.match(
    modal,
    /if \(!montado \|\| !aberto \|\| typeof document === "undefined"\)/,
  );
});

test("hook preserva montagem do portal, reset, overflow e foco inicial", () => {
  assert.match(lifecycle, /const \[montado, setMontado\] = useState\(false\)/);
  assert.match(lifecycle, /const montarTimer = window\.setTimeout\(/);
  assert.match(lifecycle, /setMontado\(true\)/);
  assert.match(lifecycle, /window\.clearTimeout\(montarTimer\)/);
  assert.match(lifecycle, /const overflowAnterior = document\.body\.style\.overflow/);
  assert.match(lifecycle, /document\.body\.style\.overflow = "hidden"/);
  assert.match(lifecycle, /setMotivo\(""\)/);
  assert.match(lifecycle, /setDescricao\(""\)/);
  assert.match(lifecycle, /setErro\(""\)/);
  assert.match(lifecycle, /setEnviado\(false\)/);
  assert.match(lifecycle, /setEnviando\(false\)/);
  assert.match(lifecycle, /botaoFecharRef\.current\?\.focus\(\)/);
  assert.match(lifecycle, /document\.body\.style\.overflow = overflowAnterior/);
  assert.match(lifecycle, /\baberto,\s*alvoId,\s*alvoTipo,/);
  assert.match(lifecycle, /\bsetDescricao,\s*setEnviado,\s*setEnviando,/);
  assert.match(lifecycle, /\bsetErro,\s*setMotivo,/);
});

test("hook preserva Escape, focus trap, listeners e cleanup", () => {
  assert.match(lifecycle, /evento\.key === "Escape" && !enviando/);
  assert.match(lifecycle, /evento\.key !== "Tab" \|\| !painelRef\.current/);
  assert.match(
    lifecycle,
    /button:not\(\[disabled\]\), input:not\(\[disabled\]\), textarea:not\(\[disabled\]\), select:not\(\[disabled\]\), \[tabindex\]:not\(\[tabindex="-1"\]\)/,
  );
  assert.match(lifecycle, /evento\.shiftKey && document\.activeElement === primeiro/);
  assert.match(lifecycle, /ultimo\.focus\(\)/);
  assert.match(lifecycle, /document\.activeElement === ultimo/);
  assert.match(lifecycle, /primeiro\.focus\(\)/);
  assert.match(lifecycle, /document\.addEventListener\("keydown", aoPressionarTecla\)/);
  assert.match(lifecycle, /document\.removeEventListener\("keydown", aoPressionarTecla\)/);
  assert.match(lifecycle, /\}, \[aberto, enviando, onFechar\]\)/);
});

test("hook não assume envio ou renderização do modal", () => {
  assert.doesNotMatch(lifecycle, /supabase/);
  assert.doesNotMatch(lifecycle, /enviarDenuncia/);
  assert.doesNotMatch(lifecycle, /createPortal/);
  assert.doesNotMatch(lifecycle, /<form/);
  assert.doesNotMatch(lifecycle, /OPCOES_MOTIVO/);
});
