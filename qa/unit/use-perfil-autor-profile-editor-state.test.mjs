import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/perfil-autor/hooks/use-perfil-autor-profile-editor-state.ts",
);
const pagina = ler("../../app/perfil-autor/page.tsx");

test("hook reune o estado local do editor de perfil e avatar", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorProfileEditorState\(\)/);

  for (const estado of [
    "editorPerfilAberto, setEditorPerfilAberto] = useState(false)",
    'nomePerfilEditor, setNomePerfilEditor] = useState("")',
    'usernamePerfilEditor, setUsernamePerfilEditor] = useState("")',
    'bioPerfilEditor, setBioPerfilEditor] = useState("")',
    'avatarPerfilEditor, setAvatarPerfilEditor] = useState("")',
    'avatarNomePerfilEditor, setAvatarNomePerfilEditor] = useState("")',
    "avatarArquivoPerfilEditor, setAvatarArquivoPerfilEditor] =\n    useState<File | null>(null)",
    'avatarErro, setAvatarErro] = useState("")',
    "salvandoEditorPerfil, setSalvandoEditorPerfil] = useState(false)",
  ]) {
    assert.equal(hook.includes(estado), true, estado);
  }

  for (const valor of [
    "editorPerfilAberto",
    "setEditorPerfilAberto",
    "nomePerfilEditor",
    "setNomePerfilEditor",
    "usernamePerfilEditor",
    "setUsernamePerfilEditor",
    "bioPerfilEditor",
    "setBioPerfilEditor",
    "avatarPerfilEditor",
    "setAvatarPerfilEditor",
    "avatarNomePerfilEditor",
    "setAvatarNomePerfilEditor",
    "avatarArquivoPerfilEditor",
    "setAvatarArquivoPerfilEditor",
    "avatarErro",
    "setAvatarErro",
    "salvandoEditorPerfil",
    "setSalvandoEditorPerfil",
  ]) {
    assert.match(hook, new RegExp(`\\b${valor}\\b`));
  }

  assert.doesNotMatch(hook, /useEffect|supabase|localStorage|router|return\s*\(\s*</);
});

test("pagina delega somente o estado e preserva as integracoes do editor", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorProfileEditorState \} from "\.\/hooks\/use-perfil-autor-profile-editor-state";/,
  );
  assert.match(pagina, /\} = usePerfilAutorProfileEditorState\(\);/);

  for (const estadoLocal of [
    "const [editorPerfilAberto, setEditorPerfilAberto]",
    "const [nomePerfilEditor, setNomePerfilEditor]",
    "const [usernamePerfilEditor, setUsernamePerfilEditor]",
    "const [bioPerfilEditor, setBioPerfilEditor]",
    "const [avatarPerfilEditor, setAvatarPerfilEditor]",
    "const [avatarNomePerfilEditor, setAvatarNomePerfilEditor]",
    "const [avatarArquivoPerfilEditor, setAvatarArquivoPerfilEditor]",
    "const [avatarErro, setAvatarErro]",
    "const [salvandoEditorPerfil, setSalvandoEditorPerfil]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  for (const integracao of [
    "usePerfilAutorProfileEditorActions({",
    "usePerfilAutorProfileEditorSaveActions({",
    "usePerfilAutorAvatarEditorActions({",
    "usePerfilAutorAuthIdentitySync({",
    "<ProfileEditor",
  ]) {
    assert.equal(pagina.includes(integracao), true, integracao);
  }
});
