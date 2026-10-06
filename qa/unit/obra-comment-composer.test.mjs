import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const compositorComentario = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-comment-composer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("compositor preserva a sequencia, chave e callback das reacoes rapidas", () => {
  assert.match(
    compositorComentario,
    /\["💜", "🔥", "😂", "😮", "😭", "👏"\]\.map\(\(emoji\) => \(/,
  );
  assert.match(compositorComentario, /key=\{emoji\}/);
  assert.match(
    compositorComentario,
    /onClick=\{\(\) => onInserirNoComentario\(emoji\)\}/,
  );
  assert.match(
    compositorComentario,
    /aria-label=\{`Adicionar \$\{emoji\} ao comentário`\}/,
  );
});

test("compositor preserva formulario controlado, ref, limite e limpeza de status", () => {
  assert.match(
    compositorComentario,
    /<form onSubmit=\{onSubmit\} style=\{commentsSheetFormStyle\}>/,
  );
  assert.match(compositorComentario, /ref=\{comentarioInputRef\}/);
  assert.match(compositorComentario, /value=\{comentarioTexto\}/);
  assert.match(
    compositorComentario,
    /onChange=\{\(event\) => onAlterarTexto\(event\.target\.value\)\}/,
  );
  assert.match(compositorComentario, /maxLength=\{600\}/);
  assert.match(compositorComentario, /rows=\{1\}/);
  assert.match(
    paginaObra,
    /function alterarTextoComentarioObra\(valor: string\) \{\s*setComentarioTexto\(valor\.slice\(0, 600\)\);\s*setComentarioStatus\(""\);\s*\}/,
  );
});

test("compositor preserva labels, avatar e fallbacks de usuario", () => {
  assert.match(
    compositorComentario,
    /usuarioIdLogado\s*\? "Adicionar comentário\.\.\."\s*:\s*"Entre para comentar\."/,
  );
  assert.match(compositorComentario, /aria-label=\{textoCompositor\}/);
  assert.match(compositorComentario, /placeholder=\{textoCompositor\}/);
  assert.match(
    compositorComentario,
    /backgroundImage: `url\(\$\{avatarUsuario\}\)`/,
  );
  assert.match(compositorComentario, /backgroundSize: "cover"/);
  assert.match(compositorComentario, /backgroundPosition: "center"/);
  assert.match(
    compositorComentario,
    /nomeUsuario\.slice\(0, 1\)\.toUpperCase\(\) \|\| "V"/,
  );
  assert.match(compositorComentario, /: "H"/);
});

test("compositor preserva mencao, envio, spinner e status", () => {
  assert.match(
    compositorComentario,
    /onClick=\{\(\) => onInserirNoComentario\("@"\)\}/,
  );
  assert.match(compositorComentario, /aria-label="Adicionar menção"/);
  assert.match(compositorComentario, /type="submit"/);
  assert.match(compositorComentario, /aria-label="Enviar comentário"/);
  assert.equal(
    (compositorComentario.match(/disabled=\{comentarioEnviando\}/g) || [])
      .length,
    3,
  );
  assert.match(
    compositorComentario,
    /<LoadingSpinner compacto label="Enviando comentário" \/>/,
  );
  assert.match(compositorComentario, /\) : \(\s*"↑"\s*\)/);
  assert.match(
    compositorComentario,
    /\{comentarioStatus \? \(\s*<span style=\{commentStatusStyle\}>\{comentarioStatus\}<\/span>/,
  );
});

test("estado, ref e handlers permanecem no cliente", () => {
  assert.match(
    paginaObra,
    /const \[comentarioTexto, setComentarioTexto\] = useState\(""\);/,
  );
  assert.match(
    paginaObra,
    /const \[comentarioStatus, setComentarioStatus\] = useState\(""\);/,
  );
  assert.match(
    paginaObra,
    /const \[comentarioEnviando, setComentarioEnviando\] = useState\(false\);/,
  );
  assert.match(
    paginaObra,
    /const comentarioInputRef = useRef<HTMLTextAreaElement \| null>\(null\);/,
  );
  assert.match(paginaObra, /async function enviarComentarioObra\(/);
  assert.match(paginaObra, /function inserirNoComentarioObra\(valor: string\)/);
  assert.match(paginaObra, /function responderComentarioObra\(/);
  assert.match(
    paginaObra,
    /comentarioInputRef\.current\?\.focus\(\);/,
  );
  assert.match(
    paginaObra,
    /<ObraCommentComposer\s*comentarioTexto=\{comentarioTexto\}\s*comentarioStatus=\{comentarioStatus\}\s*comentarioEnviando=\{comentarioEnviando\}/,
  );
  assert.match(paginaObra, /comentarioInputRef=\{comentarioInputRef\}/);
  assert.match(paginaObra, /onSubmit=\{enviarComentarioObra\}/);
  assert.match(paginaObra, /onInserirNoComentario=\{inserirNoComentarioObra\}/);
  assert.doesNotMatch(compositorComentario, /setComentarioTexto/);
  assert.doesNotMatch(compositorComentario, /setComentarioStatus/);
  assert.doesNotMatch(compositorComentario, /supabase/);
  assert.doesNotMatch(compositorComentario, /criarGuardIdentidadeAcao/);
});
