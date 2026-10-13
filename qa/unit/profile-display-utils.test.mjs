import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-display-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

globalThis.__profileDisplayDependencies = {
  SOBRE_BIO_MAX_LENGTH: 160,
  criarBioAutor(perfil) {
    return `Bio padrão de ${perfil.nome}`;
  },
  criarHandlePerfilAutor(nome, autorId, username) {
    return username ? `@${username}` : `@${nome.toLowerCase()}-${autorId}`;
  },
  formatarEntradaHistorietasPerfilAutor(criadoEm) {
    return criadoEm ? `Entrada: ${criadoEm}` : "Entrada não informada";
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      'import { SOBRE_BIO_MAX_LENGTH } from "../constants";',
      "const { SOBRE_BIO_MAX_LENGTH } = globalThis.__profileDisplayDependencies;",
    )
    .replace(
      /import \{[\s\S]*?criarHandlePerfilAutor,[\s\S]*?formatarEntradaHistorietasPerfilAutor,[\s\S]*?\} from "\.\/profile-formatters";/,
      [
        "const {",
        "  criarHandlePerfilAutor,",
        "  formatarEntradaHistorietasPerfilAutor,",
        "} = globalThis.__profileDisplayDependencies;",
      ].join("\n"),
    )
    .replace(
      'import { criarBioAutor } from "./work-normalizers";',
      "const { criarBioAutor } = globalThis.__profileDisplayDependencies;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const {
  alternarIdentificadorMenuPerfilAutor,
  formatarContagemNotificacoesPerfilAutor,
  limitarTextoPerfilAutor,
  obterAriaLabelBadgeNotificacoesPerfilAutor,
  obterAriaLabelCopiarUsernamePerfilAutor,
  obterAriaLabelNotificacoesPerfilAutor,
  obterBioSobreExibicaoPerfilAutor,
  obterDadosDenunciaConteudoPerfilAutor,
  obterDadosDenunciaPerfilAutor,
  obterDadosExibicaoPerfilAutor,
  obterDadosNotificacoesPerfilAutor,
  obterVisibilidadeDenunciasPerfilAutor,
  obterCaracteresRestantesPerfilAutor,
  obterIndicadorSelecaoPerfilAutor,
  obterInicialAvatarPerfilAutor,
  obterRotuloAcaoBloqueioPerfilAutor,
  obterTituloSobrePerfilAutor,
  obterUsernameExibidoPerfilAutor,
  obterRotuloVisibilidadeUsernamePerfilAutor,
  obterRotulosAcoesEditorPerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function perfil(autorId = "user-a", nome = "Ana") {
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

test("prioriza dados locais salvos sobre perfil remoto", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "USER-A",
      nome: "Ana",
      username: "ana.remota",
      avatar: "avatar-remoto",
      bio: "Bio remota",
      sobreBio: "Sobre remoto",
      criadoEm: "2026-01-15",
    },
    perfisAutoresSalvos: {
      "user-a": {
        avatar: "avatar-local",
        avatarNome: "avatar.png",
        bio: "Bio local",
        sobreBio: "Sobre local",
        mostrarDestaques: true,
      },
    },
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.perfilUsuarioRemotoAtivo.username, "ana.remota");
  assert.equal(resultado.bioAutorPersonalizada, "Bio local");
  assert.equal(resultado.bioSobrePersonalizada, "Sobre local");
  assert.equal(resultado.bioSobreAutor, "Sobre local");
  assert.equal(resultado.avatarAutor, "avatar-local");
  assert.equal(resultado.autorHandlePerfil, "@ana.remota");
  assert.equal(resultado.entradaHistorietasPerfil, "Entrada: 2026-01-15");
  assert.equal(
    resultado.caracteresRestantesBioSobre,
    160 - "Sobre local".length,
  );
});

test("usa perfil remoto quando não há personalização local", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "user-a",
      nome: "Ana",
      username: "ana",
      avatar: "avatar-remoto",
      bio: "Bio remota",
      sobreBio: "Sobre remoto",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.bioAutorPersonalizada, "Bio remota");
  assert.equal(resultado.bioSobrePersonalizada, "Sobre remoto");
  assert.equal(resultado.avatarAutor, "avatar-remoto");
  assert.equal(resultado.autorHandlePerfil, "@ana");
});

test("ignora perfil remoto de outro usuário e usa fallbacks", () => {
  const resultado = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil("user-a", "Ana"),
    perfilUsuarioRemoto: {
      userId: "user-b",
      nome: "Bia",
      username: "bia",
      avatar: "avatar-b",
      bio: "Bio B",
      sobreBio: "Sobre B",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });

  assert.equal(resultado.perfilUsuarioRemotoAtivo, null);
  assert.equal(resultado.bioAutorPersonalizada, "");
  assert.equal(resultado.bioAutor, "Bio padrão de Ana");
  assert.equal(resultado.bioSobreAutor, "Bio padrão de Ana");
  assert.equal(resultado.avatarAutor, "");
  assert.equal(resultado.autorHandlePerfil, "@ana-user-a");
});

test("preserva detecção da bio padrão do leitor e fallback sem perfil", () => {
  const padrao = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: perfil(),
    perfilUsuarioRemoto: {
      userId: "user-a",
      nome: "Ana",
      username: "",
      avatar: "",
      bio: "",
      sobreBio: "Perfil de leitor no Historietas.",
      criadoEm: "",
    },
    perfisAutoresSalvos: {},
    autorChavePerfil: "user-a",
    autorNormalizadoParaSeguir: "ana",
  });
  assert.equal(padrao.bioSobreAutorEhPadrao, true);

  const vazio = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar: null,
    perfilUsuarioRemoto: null,
    perfisAutoresSalvos: {},
    autorChavePerfil: "",
    autorNormalizadoParaSeguir: "",
  });
  assert.equal(vazio.bioAutor, "");
  assert.equal(vazio.bioSobreAutor, "");
  assert.equal(vazio.avatarAutor, "");
  assert.equal(vazio.autorHandlePerfil, "@autor.historietas");
  assert.equal(vazio.entradaHistorietasPerfil, "Entrada não informada");
  assert.equal(vazio.caracteresRestantesBioSobre, 160);
});


test("visibilidade das denúncias preserva perfil, conteúdo e bloqueio de edição", () => {
  assert.deepEqual(
    obterVisibilidadeDenunciasPerfilAutor({
      denunciaPerfilAberta: true,
      podeEditarPerfil: false,
      perfilParaMostrar: perfil(),
      alvoDenunciaConteudoPerfil: {
        alvoTipo: "obra",
        alvoId: "obra-1",
        alvoTitulo: "Minha Obra",
      },
    }),
    {
      denunciaPerfilVisivel: true,
      denunciaConteudoVisivel: true,
    },
  );

  assert.deepEqual(
    obterVisibilidadeDenunciasPerfilAutor({
      denunciaPerfilAberta: true,
      podeEditarPerfil: true,
      perfilParaMostrar: perfil(),
      alvoDenunciaConteudoPerfil: {
        alvoTipo: "obra",
        alvoId: "obra-1",
        alvoTitulo: "Minha Obra",
      },
    }),
    {
      denunciaPerfilVisivel: false,
      denunciaConteudoVisivel: false,
    },
  );

  assert.deepEqual(
    obterVisibilidadeDenunciasPerfilAutor({
      denunciaPerfilAberta: true,
      podeEditarPerfil: false,
      perfilParaMostrar: null,
      alvoDenunciaConteudoPerfil: null,
    }),
    {
      denunciaPerfilVisivel: false,
      denunciaConteudoVisivel: false,
    },
  );
});


test("página delega a visibilidade dos modais de denúncia ao helper", () => {
  assert.match(
    pagina,
    /obterVisibilidadeDenunciasPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterVisibilidadeDenunciasPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /aberto=\{denunciaPerfilVisivel\}/);
  assert.match(pagina, /aberto=\{denunciaConteudoVisivel\}/);
  assert.doesNotMatch(
    pagina,
    /Boolean\(perfilParaMostrar\)|Boolean\(alvoDenunciaConteudoPerfil\)/,
  );
});


test("dados da denúncia de conteúdo preservam alvo e fallbacks", () => {
  assert.deepEqual(
    obterDadosDenunciaConteudoPerfilAutor({
      alvoTipo: "obra",
      alvoId: "obra-1",
      alvoTitulo: "Minha Obra",
    }),
    {
      alvoTipo: "obra",
      alvoId: "obra-1",
      alvoTitulo: "Minha Obra",
    },
  );

  assert.deepEqual(obterDadosDenunciaConteudoPerfilAutor(null), {
    alvoTipo: "post",
    alvoId: "",
    alvoTitulo: "Conteúdo",
  });
});


test("página delega os dados da denúncia de conteúdo ao helper", () => {
  assert.match(
    pagina,
    /obterDadosDenunciaConteudoPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterDadosDenunciaConteudoPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /alvoTipo=\{dadosDenunciaConteudoPerfil\.alvoTipo\}/,
  );
  assert.match(
    pagina,
    /alvoId=\{dadosDenunciaConteudoPerfil\.alvoId\}/,
  );
  assert.match(
    pagina,
    /alvoTitulo=\{dadosDenunciaConteudoPerfil\.alvoTitulo\}/,
  );
  assert.doesNotMatch(
    pagina,
    /alvoDenunciaConteudoPerfil\?\.alvoTipo \|\| "post"/,
  );
});


test("dados da denúncia do perfil preservam ID, título, URL e fallbacks", () => {
  assert.deepEqual(
    obterDadosDenunciaPerfilAutor({
      autorId: " user/1 ",
      nome: "Ana",
    }),
    {
      alvoId: " user/1 ",
      alvoTitulo: "Ana",
      alvoUrl: "/perfil-autor?userId=%20user%2F1%20",
    },
  );

  assert.deepEqual(obterDadosDenunciaPerfilAutor(null), {
    alvoId: "",
    alvoTitulo: "Perfil",
    alvoUrl: "",
  });
});


test("página delega os dados do alvo da denúncia do perfil ao helper", () => {
  assert.match(
    pagina,
    /obterDadosDenunciaPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterDadosDenunciaPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(pagina, /alvoId=\{dadosDenunciaPerfil\.alvoId\}/);
  assert.match(
    pagina,
    /alvoTitulo=\{dadosDenunciaPerfil\.alvoTitulo\}/,
  );
  assert.match(pagina, /alvoUrl=\{dadosDenunciaPerfil\.alvoUrl\}/);
  assert.doesNotMatch(
    pagina,
    /\/perfil-autor\?userId=\$\{encodeURIComponent\(/,
  );
});


test("dados de notificações consolidam contagem e rótulos acessíveis", () => {
  assert.deepEqual(
    obterDadosNotificacoesPerfilAutor(0),
    {
      notificacoesNaoLidasFormatadas: "0",
      ariaLabelNotificacoes: "Notificações",
      ariaLabelBadgeNotificacoes: "0 notificações não lidas",
      temNotificacoesNaoLidas: false,
    },
  );
  assert.deepEqual(
    obterDadosNotificacoesPerfilAutor(100),
    {
      notificacoesNaoLidasFormatadas: "99+",
      ariaLabelNotificacoes: "Notificações: 100 não lidas",
      ariaLabelBadgeNotificacoes: "99+ notificações não lidas",
      temNotificacoesNaoLidas: true,
    },
  );
});


test("página deriva os dados de notificações em uma única chamada", () => {
  assert.match(
    pagina,
    /obterDadosNotificacoesPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterDadosNotificacoesPerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /formatarContagemNotificacoesPerfilAutor|obterAriaLabelNotificacoesPerfilAutor|obterAriaLabelBadgeNotificacoesPerfilAutor/,
  );
  assert.match(pagina, /\{notificacoesNaoLidasFormatadas\}/);
  assert.match(pagina, /aria-label=\{ariaLabelNotificacoes\}/);
  assert.match(pagina, /aria-label=\{ariaLabelBadgeNotificacoes\}/);
  assert.match(
    pagina,
    /\{temNotificacoesNaoLidas \? \(/,
  );
  assert.doesNotMatch(
    pagina,
    /notificacoesNaoLidas > 0 \? \(/,
  );
});


test("alternância de menu fecha o alvo atual e abre outro alvo", () => {
  assert.equal(alternarIdentificadorMenuPerfilAutor("obra-1", "obra-1"), "");
  assert.equal(
    alternarIdentificadorMenuPerfilAutor("obra-1", "obra-2"),
    "obra-2",
  );
  assert.equal(alternarIdentificadorMenuPerfilAutor("", "obra-1"), "obra-1");
});


test("página delega a alternância dos menus de obra e Biblioteca ao helper", () => {
  assert.match(
    pagina,
    /alternarIdentificadorMenuPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/alternarIdentificadorMenuPerfilAutor\(/g) || []).length,
    2,
  );
  assert.doesNotMatch(
    pagina,
    /chaveAtual === item\.chave \? "" : item\.chave/,
  );
  assert.doesNotMatch(
    pagina,
    /idAtual === obra\.id \? "" : obra\.id/,
  );
});


test("limite de texto preserva corte exato dos campos do editor", () => {
  assert.equal(limitarTextoPerfilAutor("abcdef", 3), "abc");
  assert.equal(limitarTextoPerfilAutor("abc", 5), "abc");
});


test("página delega os limites de nome e biografia ao helper", () => {
  assert.match(
    pagina,
    /limitarTextoPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/limitarTextoPerfilAutor\(/g) || []).length,
    2,
  );
  assert.match(
    pagina,
    /limitarTextoPerfilAutor\(event\.target\.value, 80\)/,
  );
  assert.match(
    pagina,
    /limitarTextoPerfilAutor\(\s*event\.target\.value,\s*BIO_MAX_LENGTH,\s*\)/,
  );
  assert.doesNotMatch(
    pagina,
    /event\.target\.value\.slice\(0, (?:80|BIO_MAX_LENGTH)\)/,
  );
});


test("contador de caracteres preserva limite menos tamanho atual", () => {
  assert.equal(obterCaracteresRestantesPerfilAutor("abc", 90), 87);
  assert.equal(obterCaracteresRestantesPerfilAutor("", 90), 90);
});


test("página delega o contador da biografia ao helper", () => {
  assert.match(
    pagina,
    /obterCaracteresRestantesPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterCaracteresRestantesPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /obterCaracteresRestantesPerfilAutor\(\s*bioPerfilEditor,\s*BIO_MAX_LENGTH,\s*\)/,
  );
  assert.doesNotMatch(
    pagina,
    /BIO_MAX_LENGTH - bioPerfilEditor\.length/,
  );
});


test("indicador de seleção preserva marca ativa e vazio inativo", () => {
  assert.equal(obterIndicadorSelecaoPerfilAutor(true), "✓");
  assert.equal(obterIndicadorSelecaoPerfilAutor(false), "");
});


test("página delega os indicadores de seleção ao helper", () => {
  assert.match(
    pagina,
    /obterIndicadorSelecaoPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterIndicadorSelecaoPerfilAutor\(/g) || []).length,
    5,
  );
  assert.doesNotMatch(
    pagina,
    /\{(?:obraFavorita|obraConcluida|obraNoQueroLer) \? "✓" : ""\}/,
  );
});


test("título da seção Sobre preserva o nome do perfil", () => {
  assert.equal(obterTituloSobrePerfilAutor("Ana"), "Sobre Ana");
  assert.equal(obterTituloSobrePerfilAutor(""), "Sobre ");
});


test("página delega o título da seção Sobre ao helper", () => {
  assert.match(
    pagina,
    /obterTituloSobrePerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterTituloSobrePerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /\{obterTituloSobrePerfilAutor\(perfilNome\)\}/,
  );
  assert.doesNotMatch(
    pagina,
    /Sobre \{perfilParaMostrar\.nome\}/,
  );
});


test("username exibido no cabeçalho remove apenas o @ inicial", () => {
  assert.equal(obterUsernameExibidoPerfilAutor("@ana"), "ana");
  assert.equal(obterUsernameExibidoPerfilAutor("ana"), "ana");
  assert.equal(obterUsernameExibidoPerfilAutor("@@ana"), "@ana");
});


test("página delega a exibição do username ao helper", () => {
  assert.match(
    pagina,
    /obterUsernameExibidoPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterUsernameExibidoPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /\{obterUsernameExibidoPerfilAutor\(autorHandlePerfil\)\}/,
  );
  assert.doesNotMatch(
    pagina,
    /autorHandlePerfil\.replace\(\/\^@\/, ""\)/,
  );
});


test("página deriva a presença do avatar do editor uma única vez", () => {
  assert.match(
    pagina,
    /const temAvatarPerfilEditor = Boolean\(avatarPerfilEditor\);/,
  );
  assert.equal(
    (pagina.match(/\btemAvatarPerfilEditor\b/g) || []).length,
    4,
  );
  assert.match(pagina, /temAvatar: temAvatarPerfilEditor/);
  assert.match(pagina, /\{temAvatarPerfilEditor \? \(/);
  assert.match(pagina, /\{temAvatarPerfilEditor && \(/);
  assert.equal(
    (pagina.match(/Boolean\(avatarPerfilEditor\)/g) || []).length,
    1,
  );
});


test("inicial do avatar preserva nome editado e fallback do perfil", () => {
  assert.equal(obterInicialAvatarPerfilAutor("bia", "Ana"), "B");
  assert.equal(obterInicialAvatarPerfilAutor("", "ana"), "A");
  assert.equal(obterInicialAvatarPerfilAutor("", ""), "");
});


test("página delega a inicial do avatar ao helper", () => {
  assert.match(
    pagina,
    /obterInicialAvatarPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterInicialAvatarPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /\{obterInicialAvatarPerfilAutor\(\s*nomePerfilEditor,\s*perfilParaMostrar\.nome,\s*\)\}/,
  );
  assert.doesNotMatch(
    pagina,
    /\(nomePerfilEditor \|\| perfilParaMostrar\.nome\)[\s\S]*?\.charAt\(0\)[\s\S]*?\.toUpperCase\(\)/,
  );
});


test("aria-label de copiar username preserva o handle exibido", () => {
  assert.equal(
    obterAriaLabelCopiarUsernamePerfilAutor("@ana"),
    "Copiar @ana",
  );
});


test("página delega o aria-label de copiar username ao helper", () => {
  assert.match(
    pagina,
    /obterAriaLabelCopiarUsernamePerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (
      pagina.match(
        /obterAriaLabelCopiarUsernamePerfilAutor\(/g,
      ) || []
    ).length,
    1,
  );
  assert.match(
    pagina,
    /aria-label=\{obterAriaLabelCopiarUsernamePerfilAutor\(autorHandlePerfil\)\}/,
  );
  assert.doesNotMatch(
    pagina,
    /aria-label=\{`Copiar \$\{autorHandlePerfil\}`\}/,
  );
});


test("aria-label do badge de notificações preserva contagem formatada", () => {
  assert.equal(
    obterAriaLabelBadgeNotificacoesPerfilAutor(7),
    "7 notificações não lidas",
  );
  assert.equal(
    obterAriaLabelBadgeNotificacoesPerfilAutor(100),
    "99+ notificações não lidas",
  );
});


test("página reutiliza o aria-label consolidado do badge de notificações", () => {
  assert.doesNotMatch(
    pagina,
    /obterAriaLabelBadgeNotificacoesPerfilAutor/,
  );
  assert.match(
    pagina,
    /aria-label=\{ariaLabelBadgeNotificacoes\}/,
  );
  assert.doesNotMatch(
    pagina,
    /aria-label=\{`\$\{notificacoesNaoLidasFormatadas\} notificações não lidas`\}/,
  );
});


test("aria-label de notificações preserva estado vazio e contagem", () => {
  assert.equal(
    obterAriaLabelNotificacoesPerfilAutor(0),
    "Notificações",
  );
  assert.equal(
    obterAriaLabelNotificacoesPerfilAutor(3),
    "Notificações: 3 não lidas",
  );
});


test("página reutiliza o aria-label consolidado de notificações", () => {
  assert.doesNotMatch(
    pagina,
    /obterAriaLabelNotificacoesPerfilAutor/,
  );
  assert.match(
    pagina,
    /aria-label=\{ariaLabelNotificacoes\}/,
  );
  assert.doesNotMatch(
    pagina,
    /notificacoesNaoLidas > 0[\s\S]{0,120}Notificações: \$\{notificacoesNaoLidas\} não lidas/,
  );
});


test("formatação do badge de notificações preserva limite visual", () => {
  assert.equal(formatarContagemNotificacoesPerfilAutor(0), "0");
  assert.equal(formatarContagemNotificacoesPerfilAutor(7), "7");
  assert.equal(formatarContagemNotificacoesPerfilAutor(99), "99");
  assert.equal(formatarContagemNotificacoesPerfilAutor(100), "99+");
  assert.equal(formatarContagemNotificacoesPerfilAutor(250), "99+");
});


test("página reutiliza a contagem consolidada no badge de notificações", () => {
  assert.doesNotMatch(
    pagina,
    /formatarContagemNotificacoesPerfilAutor/,
  );
  assert.match(
    pagina,
    /\{notificacoesNaoLidasFormatadas\}/,
  );
  assert.doesNotMatch(
    pagina,
    /notificacoesNaoLidas > 99 \? "99\+" : notificacoesNaoLidas/,
  );
});


test("rótulo da ação de bloqueio preserva estado e salvamento", () => {
  assert.equal(
    obterRotuloAcaoBloqueioPerfilAutor({
      bloqueadoPorMim: false,
      salvando: false,
    }),
    "Bloquear usuário",
  );
  assert.equal(
    obterRotuloAcaoBloqueioPerfilAutor({
      bloqueadoPorMim: true,
      salvando: false,
    }),
    "Desbloquear usuário",
  );
  assert.equal(
    obterRotuloAcaoBloqueioPerfilAutor({
      bloqueadoPorMim: false,
      salvando: true,
    }),
    "Bloqueando...",
  );
  assert.equal(
    obterRotuloAcaoBloqueioPerfilAutor({
      bloqueadoPorMim: true,
      salvando: true,
    }),
    "Desbloqueando...",
  );
});


test("página deriva a apresentação da ação de bloqueio uma vez", () => {
  assert.match(
    pagina,
    /const bloqueadoPorMim = estadoBloqueioPerfil\.bloqueadoPorMim;/,
  );
  assert.equal(
    (pagina.match(/estadoBloqueioPerfil\.bloqueadoPorMim/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /const menuBloqueioStyle = bloqueadoPorMim[\s\S]*?\? menuItemStyle[\s\S]*?: menuDangerItemStyle;/,
  );
  assert.match(
    pagina,
    /const rotuloAcaoBloqueioPerfil = obterRotuloAcaoBloqueioPerfilAutor\(\{[\s\S]*?bloqueadoPorMim,[\s\S]*?salvando: bloqueioPerfilSalvando/,
  );
  assert.match(pagina, /style=\{menuBloqueioStyle\}/);
  assert.match(pagina, /\{rotuloAcaoBloqueioPerfil\}/);
});


test("página delega o rótulo da ação de bloqueio ao helper", () => {
  assert.match(
    pagina,
    /obterRotuloAcaoBloqueioPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterRotuloAcaoBloqueioPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /bloqueioPerfilSalvando[\s\S]{0,220}\? "Desbloqueando\.\.\."[\s\S]{0,220}"Bloquear usuário"/,
  );
});


test("rótulo do botão de username acompanha a visibilidade do cabeçalho", () => {
  assert.equal(
    obterRotuloVisibilidadeUsernamePerfilAutor(false),
    "Mostrar username",
  );
  assert.equal(
    obterRotuloVisibilidadeUsernamePerfilAutor(true),
    "Esconder username",
  );
});


test("página delega o rótulo de visibilidade do username ao helper", () => {
  assert.match(
    pagina,
    /obterRotuloVisibilidadeUsernamePerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterRotuloVisibilidadeUsernamePerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /usernameCabecalhoVisivel[\s\S]{0,80}\? "Esconder username"[\s\S]{0,80}: "Mostrar username"/,
  );
});


test("rótulos das ações do editor preservam avatar e estado de salvamento", () => {
  assert.deepEqual(
    obterRotulosAcoesEditorPerfilAutor({
      temAvatar: false,
      salvando: false,
    }),
    {
      rotuloAcaoAvatar: "Colocar imagem",
      rotuloSalvarEditor: "Salvar",
    },
  );

  assert.deepEqual(
    obterRotulosAcoesEditorPerfilAutor({
      temAvatar: true,
      salvando: true,
    }),
    {
      rotuloAcaoAvatar: "Trocar imagem",
      rotuloSalvarEditor: "Salvando...",
    },
  );
});


test("página delega os rótulos das ações do editor ao helper", () => {
  assert.match(
    pagina,
    /obterRotulosAcoesEditorPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterRotulosAcoesEditorPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /avatarPerfilEditor \? "Trocar imagem" : "Colocar imagem"/,
  );
  assert.doesNotMatch(
    pagina,
    /salvandoEditorPerfil \? "Salvando\.\.\." : "Salvar"/,
  );
});


test("bio Sobre traduz apenas o texto padrão e marca conteúdo personalizado", () => {
  const padrao = obterBioSobreExibicaoPerfilAutor({
    bioSobreAutor: "Perfil de leitor no Historietas.",
    bioSobreAutorEhPadrao: true,
    traduzirTexto: (texto) => `Traduzido: ${texto}`,
  });

  assert.deepEqual(padrao, {
    bioSobreAutorExibido:
      "Traduzido: Perfil de leitor no Historietas.",
    bioSobreAutorUserContent: undefined,
  });

  const personalizada = obterBioSobreExibicaoPerfilAutor({
    bioSobreAutor: "Minha bio personalizada",
    bioSobreAutorEhPadrao: false,
    traduzirTexto: () => "não deve ser usado",
  });

  assert.deepEqual(personalizada, {
    bioSobreAutorExibido: "Minha bio personalizada",
    bioSobreAutorUserContent: "true",
  });
});

test("página delega a exibição da bio Sobre ao helper", () => {
  assert.match(
    pagina,
    /obterBioSobreExibicaoPerfilAutor,[\s\S]*?from "\.\/lib\/profile-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterBioSobreExibicaoPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /userContent=\{bioSobreAutorUserContent\}/,
  );
  assert.doesNotMatch(
    pagina,
    /bioSobreAutorEhPadrao \? undefined : "true"/,
  );
});


test("página deriva a visibilidade dos editores uma única vez", () => {
  assert.match(
    pagina,
    /const editorPerfilVisivel = podeEditarPerfil && editorPerfilAberto;/,
  );
  assert.match(
    pagina,
    /const editorSobreVisivel = podeEditarPerfil && editorSobreAberto;/,
  );
  assert.match(pagina, /\{editorPerfilVisivel && \(/);
  assert.match(pagina, /\{editorSobreVisivel && \(/);
  assert.doesNotMatch(
    pagina,
    /\{podeEditarPerfil && editorPerfilAberto && \(/,
  );
  assert.doesNotMatch(
    pagina,
    /\{podeEditarPerfil && editorSobreAberto && \(/,
  );
});

test("Perfil de Autor reutiliza o nome derivado do perfil", () => {
  assert.match(
    pagina,
    /const perfilNome = perfilParaMostrar\?\.nome \|\| "";/,
  );
  assert.equal(
    (pagina.match(/perfilParaMostrar\.nome/g) || []).length,
    0,
  );
  assert.match(
    pagina,
    /<strong data-historietas-user-content="true" style=\{menuTitleStyle\}>\s*\{perfilNome\}\s*<\/strong>/,
  );
  assert.match(
    pagina,
    /obterInicialAvatarPerfilAutor\(\s*nomePerfilEditor,\s*perfilNome,\s*\)/,
  );
  assert.equal(
    (pagina.match(/autorNome=\{perfilNome\}/g) || []).length,
    3,
  );
});
