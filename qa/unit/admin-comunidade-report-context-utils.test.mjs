import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-report-context-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const page = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

async function importarModulo() {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(
      `${javascript}\n// ${Math.random()}`,
    ).toString("base64")}`
  );
}

function criarDenuncia(alvoTipo, alvoId, extras = {}) {
  return {
    id: `denuncia-${alvoTipo}`,
    alvoTipo,
    alvoId,
    alvoAutorId: "",
    denuncianteId: "denunciante",
    motivo: "Conteúdo inadequado",
    detalhe: "",
    status: "pendente",
    arquivada: false,
    observacaoAdmin: "",
    analisadoPor: null,
    analisadoEm: null,
    criadoEm: "2026-01-01T00:00:00.000Z",
    ...extras,
  };
}

function criarParametros(denunciasMapeadas) {
  const textoCapitulo = "x".repeat(5001);

  return {
    denunciasMapeadas,
    perfisPorId: new Map([
      ["denunciante", "Quem denunciou"],
      ["autor-capitulo", "Perfil do capítulo"],
      ["autor-diario", "Perfil do Diário"],
      ["autor-comentario-diario", "Perfil do comentário Diário"],
      ["autor-comentario-obra", "Perfil do comentário da obra"],
    ]),
    postsPorId: new Map([
      [
        "post-1",
        {
          id: "post-1",
          autor_nome: "Autor do post",
          categoria: "Resenha",
          tipo_publicacao: "Pergunta",
          tem_spoiler: 1,
          texto: "Texto do post",
          obra_relacionada: "Obra relacionada",
          criado_em: "post-data",
        },
      ],
    ]),
    comentariosPorId: new Map([
      [
        "comentario-1",
        {
          id: "comentario-1",
          post_id: "post-1",
          autor_nome: "Autor do comentário",
          texto: "Texto do comentário",
          criado_em: "comentario-data",
        },
      ],
    ]),
    comentariosCapitulosPorId: new Map([
      [
        "comentario-capitulo-1",
        {
          id: "comentario-capitulo-1",
          capitulo_id: "capitulo-1",
          user_id: "autor-capitulo",
          comentario: "Comentário de capítulo",
          criado_em: "comentario-capitulo-data",
        },
      ],
    ]),
    comentariosObrasPorId: new Map([
      [
        "comentario-obra-1",
        {
          id: "comentario-obra-1",
          obra_id: "obra-1",
          user_id: "autor-comentario-obra",
          comentario: "Comentário da obra",
          criado_em: "comentario-obra-data",
        },
      ],
    ]),
    comentariosDiarioPorId: new Map([
      [
        "comentario-diario-1",
        {
          id: "comentario-diario-1",
          anotacao_id: "anotacao-1",
          user_id: "autor-comentario-diario",
          texto: "Comentário do Diário",
          criado_em: "comentario-diario-criado",
          atualizado_em: "comentario-diario-atualizado",
        },
      ],
    ]),
    diarioAnotacoesPorId: new Map([
      [
        "anotacao-1",
        {
          id: "anotacao-1",
          obra_id: "obra-1",
          user_id: "autor-diario",
          tipo: "leitura",
          texto: "Anotação do Diário",
          contem_spoiler: 1,
          criado_em: "anotacao-criada",
          atualizado_em: "anotacao-atualizada",
        },
      ],
    ]),
    capitulosPorId: new Map([
      [
        "capitulo-1",
        {
          id: "capitulo-1",
          obra_id: "obra-1",
          user_id: "autor-capitulo",
          titulo: "Título do capítulo",
          texto: textoCapitulo,
          criado_em: "capitulo-data",
        },
      ],
    ]),
    obrasPorId: new Map([
      [
        "obra-1",
        {
          id: "obra-1",
          user_id: "autor-obra",
          titulo: " Obra principal ",
          autor: " Autor da obra ",
          slug: " slug-da-obra ",
          criada_em: "obra-data",
        },
      ],
    ]),
  };
}

test("monta os oito contextos de denúncia com os dados e prioridades atuais", async () => {
  const { montarDenunciasComContextoModeracao } = await importarModulo();
  const denuncias = [
    criarDenuncia("post", "post-1"),
    criarDenuncia("comentario", "comentario-1"),
    criarDenuncia("comentario_capitulo", "comentario-capitulo-1"),
    criarDenuncia("obra", "obra-1"),
    criarDenuncia("capitulo", "capitulo-1"),
    criarDenuncia("diario_anotacao", "anotacao-1"),
    criarDenuncia("comentario_diario", "comentario-diario-1"),
    criarDenuncia("comentario_obra", "comentario-obra-1"),
  ];
  const resultado = montarDenunciasComContextoModeracao(
    criarParametros(denuncias),
  );

  assert.equal(resultado[0].denuncianteNome, "Quem denunciou");
  assert.equal(resultado[0].alvoResumo, "Texto do post");
  assert.equal(resultado[0].alvoAutor, "Autor do post");
  assert.equal(resultado[0].alvoCategoria, "Resenha");
  assert.equal(resultado[0].alvoTipoPublicacao, "Pergunta");
  assert.equal(resultado[0].alvoTemSpoiler, true);

  assert.equal(resultado[1].alvoResumo, "Texto do comentário");
  assert.equal(resultado[1].alvoPostId, "post-1");

  assert.equal(resultado[2].alvoAutor, "Perfil do capítulo");
  assert.equal(resultado[2].alvoObraId, "obra-1");
  assert.equal(resultado[2].alvoCapituloTitulo, "Título do capítulo");

  assert.equal(resultado[3].alvoResumo, "Obra principal");
  assert.equal(resultado[3].alvoAutor, "Autor da obra");
  assert.equal(resultado[3].alvoObraSlug, "slug-da-obra");

  assert.equal(resultado[4].alvoResumo.length, 5000);
  assert.equal(resultado[4].alvoAutor, "Perfil do capítulo");
  assert.equal(resultado[4].alvoCapituloId, "capitulo-1");

  assert.equal(resultado[5].alvoCategoria, "Diário");
  assert.equal(resultado[5].alvoData, "anotacao-atualizada");
  assert.equal(resultado[5].alvoTemSpoiler, true);
  assert.equal(resultado[5].alvoPerfilUserId, "autor-diario");

  assert.equal(resultado[6].alvoResumo, "Comentário do Diário");
  assert.equal(resultado[6].alvoData, "comentario-diario-atualizado");
  assert.equal(resultado[6].alvoAnotacaoId, "anotacao-1");
  assert.equal(resultado[6].alvoAutor, "Perfil do comentário Diário");

  assert.equal(resultado[7].alvoResumo, "Comentário da obra");
  assert.equal(resultado[7].alvoAutor, "Perfil do comentário da obra");
  assert.equal(resultado[7].alvoObraId, "obra-1");
});

test("preserva fallbacks dos alvos ausentes e não muta denúncias ou mapas", async () => {
  const { montarDenunciasComContextoModeracao } = await importarModulo();
  const denuncias = [
    criarDenuncia("post", "ausente", { denuncianteId: "sem-perfil" }),
    criarDenuncia("comentario", "ausente"),
    criarDenuncia("comentario_capitulo", "ausente"),
    criarDenuncia("obra", "ausente"),
    criarDenuncia("capitulo", "ausente"),
    criarDenuncia("diario_anotacao", "ausente"),
    criarDenuncia("comentario_diario", "ausente"),
    criarDenuncia("comentario_obra", "ausente"),
  ];
  const params = criarParametros(denuncias);
  const denunciasAntes = structuredClone(denuncias);
  const tamanhosAntes = Object.fromEntries(
    Object.entries(params)
      .filter(([, valor]) => valor instanceof Map)
      .map(([nome, mapa]) => [nome, mapa.size]),
  );

  const resultado = montarDenunciasComContextoModeracao(params);

  assert.deepEqual(denuncias, denunciasAntes);
  for (const [nome, tamanho] of Object.entries(tamanhosAntes)) {
    assert.equal(params[nome].size, tamanho);
  }
  assert.equal(resultado[0].denuncianteNome, "Usuário");
  assert.equal(resultado[0].alvoResumo, "Publicação não encontrada ou removida.");
  assert.equal(resultado[1].alvoResumo, "Comentário não encontrado ou removido.");
  assert.equal(
    resultado[2].alvoResumo,
    "Comentário de capítulo não encontrado ou removido.",
  );
  assert.equal(resultado[2].alvoAutor, "Autor não encontrado");
  assert.equal(resultado[3].alvoResumo, "Obra não encontrada ou removida.");
  assert.equal(resultado[4].alvoResumo, "Capítulo não encontrado ou removido.");
  assert.equal(
    resultado[5].alvoResumo,
    "Anotação do Diário não encontrada ou removida.",
  );
  assert.equal(
    resultado[6].alvoResumo,
    "Comentário do Diário não encontrado ou removido.",
  );
  assert.equal(
    resultado[7].alvoResumo,
    "Comentário da obra não encontrado ou removido.",
  );
});

test("preserva prioridades de perfil e fallbacks de obra e capítulo", async () => {
  const { montarDenunciasComContextoModeracao } = await importarModulo();
  const params = criarParametros([
    criarDenuncia("obra", "obra-1"),
    criarDenuncia("capitulo", "capitulo-sem-obra"),
  ]);
  params.obrasPorId.set("obra-1", {
    id: "obra-1",
    user_id: "autor-capitulo",
    titulo: "Obra sem autor",
    autor: " ",
    slug: "obra-sem-autor",
    criada_em: "obra-data",
  });
  params.capitulosPorId.set("capitulo-sem-obra", {
    id: "capitulo-sem-obra",
    obra_id: "obra-ausente",
    user_id: "autor-capitulo",
    titulo: "Capítulo sem obra",
    texto: "",
    criado_em: "capitulo-sem-obra-data",
  });

  const resultado = montarDenunciasComContextoModeracao(params);

  assert.equal(resultado[0].alvoAutor, "Perfil do capítulo");
  assert.equal(resultado[1].alvoResumo, "Capítulo sem obra");
  assert.equal(resultado[1].alvoObra, "");
  assert.equal(resultado[1].alvoObraId, "obra-ausente");
});

test("Admin Comunidade delega somente a montagem final do contexto das denúncias", () => {
  assert.doesNotMatch(page, /const nomeDenunciante/);
  assert.doesNotMatch(page, /denunciasMapeadas\.map\(\(denuncia\) =>/);
  assert.match(page, /montarDenunciasComContextoModeracao\(\{/);
  assert.match(page, /setDenuncias\(denunciasComContexto\)/);
  assert.match(page, /setObservacoes\(/);
  assert.match(source, /perfisPorId\.get\(denuncia\.denuncianteId\) \|\| "Usuário"/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|supabase|router|localStorage|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
