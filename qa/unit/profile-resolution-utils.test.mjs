import assert from "node:assert/strict";
import test from "node:test";
import { resolverEstadoPerfilAutor } from "../../app/perfil-autor/lib/profile-resolution-utils.ts";

function perfil(autorId, nome) {
  return {
    autorId,
    nome,
    obras: [],
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: 0,
  };
}

test("prioriza ID selecionado e usa perfil remoto como fallback", () => {
  const ana = perfil("user-a", "Ana");
  const bia = perfil("user-b", "Bia");
  const remoto = perfil("user-remoto", "Remoto");

  const local = resolverEstadoPerfilAutor({
    perfisAutores: [ana, bia],
    autorSelecionado: "nome ignorado",
    autorIdSelecionado: " USER-B ",
    usuarioIdLogado: "",
    perfilUsuarioRemotoComoAutor: remoto,
    autenticacaoCarregada: true,
  });
  assert.equal(local.perfilAtual, bia);

  const remotoResolvido = resolverEstadoPerfilAutor({
    perfisAutores: [ana, bia],
    autorSelecionado: "",
    autorIdSelecionado: "USER-REMOTO",
    usuarioIdLogado: "",
    perfilUsuarioRemotoComoAutor: remoto,
    autenticacaoCarregada: true,
  });
  assert.equal(remotoResolvido.perfilAtual, remoto);
});

test("resolve por nome normalizado quando não encontra por ID", () => {
  const ana = perfil("user-a", "Ana Silva");
  const resultado = resolverEstadoPerfilAutor({
    perfisAutores: [ana],
    autorSelecionado: "  ANA SILVA  ",
    autorIdSelecionado: "id-inexistente",
    usuarioIdLogado: "",
    perfilUsuarioRemotoComoAutor: null,
    autenticacaoCarregada: true,
  });

  assert.equal(resultado.perfilAtual, ana);
  assert.equal(resultado.autorNaoEncontrado, false);
  assert.equal(resultado.perfilParaMostrar, ana);
});

test("sem parâmetros mostra o perfil do usuário logado", () => {
  const proprio = perfil("usuario-1", "Leitor");
  const resultado = resolverEstadoPerfilAutor({
    perfisAutores: [proprio],
    autorSelecionado: "",
    autorIdSelecionado: "",
    usuarioIdLogado: " USUARIO-1 ",
    perfilUsuarioRemotoComoAutor: null,
    autenticacaoCarregada: true,
  });

  assert.equal(resultado.perfilSemParametro, true);
  assert.equal(resultado.perfilDoUsuarioLogado, proprio);
  assert.equal(resultado.perfilParaMostrar, proprio);
  assert.equal(resultado.perfilPertenceAoUsuario, true);
  assert.equal(resultado.redirecionandoParaLogin, false);
});

test("sem parâmetros e sem login não mostra perfil e redireciona após autenticação", () => {
  const remoto = perfil("remoto", "Remoto");
  const resultado = resolverEstadoPerfilAutor({
    perfisAutores: [],
    autorSelecionado: "",
    autorIdSelecionado: "",
    usuarioIdLogado: "",
    perfilUsuarioRemotoComoAutor: remoto,
    autenticacaoCarregada: true,
  });

  assert.equal(resultado.perfilSemLoginSemParametro, true);
  assert.equal(resultado.perfilParaMostrar, null);
  assert.equal(resultado.perfilPertenceAoUsuario, false);
  assert.equal(resultado.redirecionandoParaLogin, true);
});

test("preserva autor não encontrado e propriedade pelo ID da URL", () => {
  const resultado = resolverEstadoPerfilAutor({
    perfisAutores: [],
    autorSelecionado: "",
    autorIdSelecionado: "usuario-1",
    usuarioIdLogado: "USUARIO-1",
    perfilUsuarioRemotoComoAutor: null,
    autenticacaoCarregada: true,
  });

  assert.equal(resultado.perfilAtual, null);
  assert.equal(resultado.autorNaoEncontrado, true);
  assert.equal(resultado.perfilParaMostrar, null);
  assert.equal(resultado.perfilPertenceAoUsuario, true);
});
