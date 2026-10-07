import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-now.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estado inicial e nao agenda relogio com comentarios fechados", () => {
  assert.match(hook, /export function useObraCommentsNow\(comentariosAbertos: boolean\)/);
  assert.match(
    hook,
    /const \[agoraComentarios, setAgoraComentarios\] = useState\(\(\) => Date\.now\(\)\);/,
  );
  assert.match(hook, /if \(!comentariosAbertos\) \{\s*return;\s*\}/);
  assert.match(hook, /\}, \[comentariosAbertos\]\);/);
  assert.match(hook, /return agoraComentarios;/);
});

test("hook preserva timeout inicial, intervalo e cleanup do relogio", () => {
  assert.match(
    hook,
    /window\.setTimeout\(\(\) => \{\s*setAgoraComentarios\(Date\.now\(\)\);\s*\}, 0\);/,
  );
  assert.match(
    hook,
    /window\.setInterval\(\(\) => \{\s*setAgoraComentarios\(Date\.now\(\)\);\s*\}, 1000\);/,
  );
  assert.match(hook, /window\.clearTimeout\(inicioRelogioComentarios\);/);
  assert.match(hook, /window\.clearInterval\(relogioComentarios\);/);
});

test("cliente delega somente o relogio ao hook e preserva o consumidor", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentsNow \} from "\.\/hooks\/use-obra-comments-now";/,
  );
  assert.match(
    cliente,
    /const agoraComentarios = useObraCommentsNow\(comentariosAbertos\);/,
  );
  assert.doesNotMatch(
    cliente,
    /const \[agoraComentarios, setAgoraComentarios\] = useState/,
  );
  assert.doesNotMatch(cliente, /const inicioRelogioComentarios = window\.setTimeout/);
  assert.match(cliente, /<ObraCommentsList[\s\S]*?agoraComentarios=\{agoraComentarios\}/);
});
