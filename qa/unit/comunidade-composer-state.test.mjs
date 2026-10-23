import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-composer-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeComposerState preserva os defaults e refs do composer", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeComposerState\(\)/);
  assert.match(hook, /useState<CategoriaComunidade>\("Geral"\)/);
  assert.match(hook, /useState<TipoPublicacaoComunidade>\("Discussão"\)/);
  assert.match(hook, /useState<VisibilidadePostComunidade>\("publico"\)/);
  assert.match(hook, /const \[temSpoilerPost, setTemSpoilerPost\] = useState\(false\);/);
  assert.match(hook, /const \[obraRelacionadaBusca, setObraRelacionadaBusca\] = useState\(""\);/);
  assert.match(hook, /const \[capituloRelacionadoPost, setCapituloRelacionadoPost\] = useState\(""\);/);
  assert.match(hook, /const \[sugestoesObrasAbertas, setSugestoesObrasAbertas\] = useState\(false\);/);
  assert.match(hook, /const textoPostRef = useRef<HTMLTextAreaElement \| null>\(null\);/);
  assert.match(hook, /const obraRelacionadaRef = useRef<HTMLInputElement \| null>\(null\);/);
  assert.match(hook, /const \[composerAberto, setComposerAberto\] = useState\(false\);/);
});

test("useComunidadeComposerState preserva a limpeza postergada ao fechar", () => {
  assert.match(
    hook,
    /if \(composerAberto\) \{\s*return;\s*\}[\s\S]*?const fecharSugestoesTimer = window\.setTimeout\(\(\) => \{[\s\S]*?setSugestoesObrasAbertas\(false\);[\s\S]*?setObraRelacionadaBusca\(""\);[\s\S]*?setVisibilidadePost\("publico"\);[\s\S]*?\}, 0\);/,
  );
  assert.match(
    hook,
    /return \(\) => \{\s*window\.clearTimeout\(fecharSugestoesTimer\);\s*\};\s*\}, \[composerAberto\]\);/,
  );
  assert.doesNotMatch(hook, /supabase\.|localStorage|useRouter|createPortal/);
});

test("Comunidade delega somente o estado e lifecycle do composer ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeComposerState \} from "\.\/hooks\/use-comunidade-composer-state";/,
  );
  assert.match(
    pagina,
    /const \{[\s\S]*?categoriaPost,[\s\S]*?setCategoriaPost,[\s\S]*?tipoPublicacaoPost,[\s\S]*?setTipoPublicacaoPost,[\s\S]*?visibilidadePost,[\s\S]*?setVisibilidadePost,[\s\S]*?temSpoilerPost,[\s\S]*?setTemSpoilerPost,[\s\S]*?obraRelacionadaBusca,[\s\S]*?setObraRelacionadaBusca,[\s\S]*?capituloRelacionadoPost,[\s\S]*?setCapituloRelacionadoPost,[\s\S]*?sugestoesObrasAbertas,[\s\S]*?setSugestoesObrasAbertas,[\s\S]*?textoPostRef,[\s\S]*?obraRelacionadaRef,[\s\S]*?composerAberto,[\s\S]*?setComposerAberto,[\s\S]*?\} = useComunidadeComposerState\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[categoriaPost, setCategoriaPost\] =\s*useState<CategoriaComunidade>\("Geral"\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[obraRelacionadaBusca, setObraRelacionadaBusca\] = useState\(""\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const textoPostRef = useRef<HTMLTextAreaElement \| null>\(null\);/,
  );
  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\([\s\S]*?textoPostRef,[\s\S]*?obraRelacionadaRef,[\s\S]*?setComposerAberto,[\s\S]*?setObraRelacionadaBusca,[\s\S]*?setCapituloRelacionadoPost,[\s\S]*?setSugestoesObrasAbertas,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeOverlayBodyLock\(\{\s*bloqueioPrimario: composerAberto,\s*focoComposerRef: textoPostRef,\s*\}\);/,
  );
  assert.match(pagina, /async function publicarPost\(/);
});
