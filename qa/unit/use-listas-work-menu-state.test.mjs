import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/listas/hooks/use-listas-work-menu-state.ts");
const pagina = ler("../../app/listas/page.tsx");
const lifecycle = ler("../../app/listas/hooks/use-listas-work-menu-lifecycle.ts");
const actions = ler("../../app/listas/hooks/use-listas-work-menu-actions.ts");

test("hook centraliza somente os estados do menu de obra de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(hook, /CategoriaPerfil,/);
  assert.match(hook, /ItemObraLista,/);
  assert.match(hook, /ObraLista,/);
  assert.match(hook, /export function useListasWorkMenuState\(\)/);
  assert.match(hook, /obraMenuAberta, setObraMenuAberta\] = useState<ObraLista \| null>\(null\)/);
  assert.match(hook, /itemPerfilMenuAberto, setItemPerfilMenuAberto\]\s*=\s*useState<ItemObraLista \| null>\(null\)/);
  assert.match(hook, /categoriaMenuAberta, setCategoriaMenuAberta\]\s*=\s*useState<CategoriaPerfil>\("tudo"\)/);
  assert.match(hook, /salvandoQueroLer, setSalvandoQueroLer\] = useState\(false\)/);
  assert.match(hook, /obraMenuNoQueroLer, setObraMenuNoQueroLer\] = useState\(false\)/);
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("Listas delega o estado sem alterar lifecycle, ações ou composição", () => {
  assert.match(
    pagina,
    /import \{ useListasWorkMenuState \} from "\.\/hooks\/use-listas-work-menu-state";/,
  );
  assert.match(pagina, /\} = useListasWorkMenuState\(\);/);

  for (const estadoLocal of [
    "const [obraMenuAberta, setObraMenuAberta]",
    "const [itemPerfilMenuAberto, setItemPerfilMenuAberto]",
    "const [categoriaMenuAberta, setCategoriaMenuAberta]",
    "const [salvandoQueroLer, setSalvandoQueroLer]",
    "const [obraMenuNoQueroLer, setObraMenuNoQueroLer]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useListasWorkMenuLifecycle\(\{[\s\S]*?obraMenuAberta,[\s\S]*?setObraMenuAberta,[\s\S]*?setItemPerfilMenuAberto,[\s\S]*?setObraMenuNoQueroLer,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasWorkMenuActions\(\{[\s\S]*?obraMenuAberta,[\s\S]*?obraMenuNoQueroLer,[\s\S]*?salvandoQueroLer,[\s\S]*?setCategoriaMenuAberta,[\s\S]*?setItemPerfilMenuAberto,[\s\S]*?setObraMenuAberta,[\s\S]*?setObraMenuNoQueroLer,[\s\S]*?setSalvandoQueroLer,[\s\S]*?\}\);/,
  );
  assert.match(
    pagina,
    /useListasDiaryAnnotationActions\(\{[\s\S]*?categoriaMenuAberta,[\s\S]*?itemPerfilMenuAberto,[\s\S]*?obraMenuAberta,[\s\S]*?setItemPerfilMenuAberto,/,
  );
  assert.match(
    pagina,
    /useListasWorkActionSheetRenderer\(\{[\s\S]*?categoriaMenuAberta,[\s\S]*?itemPerfilMenuAberto,[\s\S]*?obraMenuAberta,[\s\S]*?obraMenuNoQueroLer,[\s\S]*?salvandoQueroLer,/,
  );
  assert.match(lifecycle, /document\.body\.style\.overflow = "hidden";/);
  assert.match(lifecycle, /event\.key === "Escape"/);
  assert.match(actions, /if \(salvandoQueroLer \|\| editorAnotacao\.salvando\)/);
  assert.match(actions, /setSalvandoQueroLer\(false\);/);
  assert.match(actions, /router\.push\(criarLoginHrefListas\(\)\);/);
});
