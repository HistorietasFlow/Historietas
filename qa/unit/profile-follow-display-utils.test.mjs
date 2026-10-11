import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-follow-display-utils.ts", import.meta.url),
  "utf8",
);

globalThis.__profileFollowDisplayDependencies = {
  criarChaveAutorPerfil(autorId, nome) {
    return autorId.trim().toLowerCase() || nome.trim().toLowerCase();
  },
  criarHrefListaSeguimentoPerfilAutor(aba, perfil) {
    const params = new URLSearchParams({ aba });
    if (perfil?.autorId?.trim()) {
      params.set("userId", perfil.autorId.trim());
      params.set("autorId", perfil.autorId.trim());
    }
    if (perfil?.nome?.trim()) params.set("autor", perfil.nome.trim());
    return `/seguindo?${params.toString()}`;
  },
  idAutorSupabaseValido(valor) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
  },
  normalizarNomeAutor(nome) {
    return nome.trim().replace(/\s+/g, " ").toLowerCase();
  },
};

const javascript = typescript.transpileModule(
  source.replace(
    /import \{[\s\S]*?\} from "\.\/profile-formatters";/,
    [
      "const {",
      "  criarChaveAutorPerfil,",
      "  criarHrefListaSeguimentoPerfilAutor,",
      "  idAutorSupabaseValido,",
      "  normalizarNomeAutor,",
      "} = globalThis.__profileFollowDisplayDependencies;",
    ].join("\n"),
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const { obterEstadoSeguimentoPerfilAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

const UUID = "123e4567-e89b-42d3-a456-426614174000";

test("usa relacionamento remoto quando o ID permite seguimento por usuário", () => {
  const resultado = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar: { autorId: UUID, nome: "Ana" },
    autoresSeguidos: [],
    estadoRelacionamentoPerfil: "seguindo",
    seguindoUsuarioPerfil: false,
    seguidoresUsuarioPerfilTotal: 12,
    seguindoUsuarioPerfilTotal: 8,
    podeEditarPerfil: false,
  });

  assert.equal(resultado.podeUsarSeguimentoUsuario, true);
  assert.equal(resultado.seguindoPerfilAtual, true);
  assert.equal(resultado.solicitacaoSeguimentoPendente, false);
  assert.equal(resultado.seguidoresTotal, 12);
  assert.equal(resultado.seguindoTotalPerfil, 8);
  assert.match(resultado.seguidoresPerfilHref, /aba=seguidores/);
  assert.match(resultado.seguindoPerfilHref, /aba=seguindo/);
});

test("preserva fallback local para perfis sem ID válido", () => {
  const resultado = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar: { autorId: "autor-local", nome: "Ana Silva" },
    autoresSeguidos: ["autor-local"],
    estadoRelacionamentoPerfil: "nenhum",
    seguindoUsuarioPerfil: false,
    seguidoresUsuarioPerfilTotal: 99,
    seguindoUsuarioPerfilTotal: 99,
    podeEditarPerfil: false,
  });

  assert.equal(resultado.podeUsarSeguimentoUsuario, false);
  assert.equal(resultado.seguindoAutor, true);
  assert.equal(resultado.seguindoPerfilAtual, true);
  assert.equal(resultado.seguidoresTotal, 1);
  assert.equal(resultado.seguindoTotalPerfil, 0);
});

test("perfil próprio usa rotas e total local de seguindo", () => {
  const resultado = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar: { autorId: "autor-local", nome: "Ana" },
    autoresSeguidos: ["a", "b", "c"],
    estadoRelacionamentoPerfil: "nenhum",
    seguindoUsuarioPerfil: false,
    seguidoresUsuarioPerfilTotal: 0,
    seguindoUsuarioPerfilTotal: 0,
    podeEditarPerfil: true,
  });

  assert.equal(resultado.seguidoresPerfilHref, "/seguindo?conteudo=seguidores");
  assert.equal(resultado.seguindoPerfilHref, "/seguindo?conteudo=pessoas");
  assert.equal(resultado.obrasSeguidasPerfilHref, "/seguindo?conteudo=obras");
  assert.equal(resultado.seguindoTotalPerfil, 3);
});

test("preserva estado de solicitação pendente", () => {
  const resultado = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar: { autorId: UUID, nome: "Ana" },
    autoresSeguidos: [],
    estadoRelacionamentoPerfil: "solicitado",
    seguindoUsuarioPerfil: false,
    seguidoresUsuarioPerfilTotal: 2,
    seguindoUsuarioPerfilTotal: 4,
    podeEditarPerfil: false,
  });

  assert.equal(resultado.solicitacaoSeguimentoPendente, true);
  assert.equal(resultado.seguindoPerfilAtual, false);
});
