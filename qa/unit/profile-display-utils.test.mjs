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
const workItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-work-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const libraryItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-library-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroIdentitySource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero-identity.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero.tsx",
    import.meta.url,
  ),
  "utf8",
);
const avatarInputSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-avatar-input.tsx",
    import.meta.url,
  ),
  "utf8",
);
const reportModalsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-report-modals.tsx",
    import.meta.url,
  ),
  "utf8",
);
const reportProfileModalSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-report-profile-modal.tsx",
    import.meta.url,
  ),
  "utf8",
);
const reportContentModalSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-report-content-modal.tsx",
    import.meta.url,
  ),
  "utf8",
);
const workActionSheetSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-work-action-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const libraryActionSheetSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-library-action-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const actionSheetsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-action-sheets.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileEditorAvatarSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-editor-avatar.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileEditorFieldsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-editor-fields.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileEditorActionsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-editor-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileEditorHeaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-editor-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileEditorSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-editor.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileHeaderUsernameSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-header-username.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileHeaderSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-header.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileMenuSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-menu.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileOwnMenuContentSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-own-menu-content.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileVisitorMenuContentSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-visitor-menu-content.tsx",
    import.meta.url,
  ),
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
  assert.match(
    pagina,
    /import \{ ProfileReportModals \} from "\.\/components\/profile-report-modals";/,
  );
  assert.match(pagina, /<ProfileReportModals[\s\S]*?profileOpen=\{denunciaPerfilVisivel\}/);
  assert.match(pagina, /<ProfileReportModals[\s\S]*?contentOpen=\{denunciaConteudoVisivel\}/);
  assert.doesNotMatch(pagina, /<DenunciaModal/);
  assert.match(reportModalsSource, /<ProfileReportProfileModal[\s\S]*?open=\{profileOpen\}/);
  assert.match(reportModalsSource, /<ProfileReportContentModal[\s\S]*?open=\{contentOpen\}/);
  assert.match(reportModalsSource, /onClose=\{onProfileClose\}/);
  assert.match(reportModalsSource, /onSent=\{onProfileSent\}/);
  assert.match(reportModalsSource, /onClose=\{onContentClose\}/);
  assert.match(reportModalsSource, /onSent=\{onContentSent\}/);
  assert.match(pagina, /onProfileClose=\{\(\) => setDenunciaPerfilAberta\(false\)\}/);
  assert.match(pagina, /onContentClose=\{\(\) => setAlvoDenunciaConteudoPerfil\(null\)\}/);
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
    /contentTargetType=\{dadosDenunciaConteudoPerfil\.alvoTipo\}/,
  );
  assert.match(
    pagina,
    /contentTargetId=\{dadosDenunciaConteudoPerfil\.alvoId\}/,
  );
  assert.match(
    pagina,
    /contentTargetTitle=\{dadosDenunciaConteudoPerfil\.alvoTitulo\}/,
  );
  assert.match(reportModalsSource, /targetType=\{contentTargetType\}/);
  assert.match(reportContentModalSource, /alvoTipo=\{targetType\}/);
  assert.match(reportContentModalSource, /alvoId=\{targetId\}/);
  assert.match(reportContentModalSource, /alvoTitulo=\{targetTitle\}/);
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
  assert.match(pagina, /profileTargetId=\{dadosDenunciaPerfil\.alvoId\}/);
  assert.match(
    pagina,
    /profileTargetTitle=\{dadosDenunciaPerfil\.alvoTitulo\}/,
  );
  assert.match(pagina, /profileTargetUrl=\{dadosDenunciaPerfil\.alvoUrl\}/);
  assert.match(reportModalsSource, /targetUrl=\{profileTargetUrl\}/);
  assert.match(reportProfileModalSource, /alvoTipo="perfil"/);
  assert.match(reportProfileModalSource, /alvoId=\{targetId\}/);
  assert.match(reportProfileModalSource, /alvoTitulo=\{targetTitle\}/);
  assert.match(reportProfileModalSource, /alvoUrl=\{targetUrl\}/);
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
  assert.match(
    pagina,
    /<ProfileMenu[\s\S]*?ariaLabelNotificationBadge=\{ariaLabelBadgeNotificacoes\}[\s\S]*?ariaLabelNotifications=\{ariaLabelNotificacoes\}[\s\S]*?hasUnreadNotifications=\{temNotificacoesNaoLidas\}[\s\S]*?notificationsUnreadFormatted=\{notificacoesNaoLidasFormatadas\}/,
  );
  assert.match(profileOwnMenuContentSource, /aria-label=\{ariaLabelNotifications\}/);
  assert.match(profileOwnMenuContentSource, /aria-label=\{ariaLabelNotificationBadge\}/);
  assert.match(profileOwnMenuContentSource, /\{hasUnreadNotifications \? \(/);
  assert.match(profileOwnMenuContentSource, /\{notificationsUnreadFormatted\}/);
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
  assert.equal(
    (pagina.match(/alternarIdentificadorMenuPerfilAutor\(/g) || []).length,
    0,
  );
  assert.equal(
    (workItemRendererSource.match(/alternarIdentificadorMenuPerfilAutor\(/g) || [])
      .length,
    1,
  );
  assert.equal(
    (libraryItemRendererSource.match(/alternarIdentificadorMenuPerfilAutor\(/g) || [])
      .length,
    1,
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
    /setNomePerfilEditor\(limitarTextoPerfilAutor\(value, 80\)\)/,
  );
  assert.match(
    pagina,
    /setBioPerfilEditor\(\s*limitarTextoPerfilAutor\(value, BIO_MAX_LENGTH\),\s*\)/,
  );
  assert.match(profileEditorFieldsSource, /maxLength=\{80\}/);
  assert.match(profileEditorFieldsSource, /maxLength=\{maxBioLength\}/);
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
    /import \{ ProfileActionSheets \} from "\.\/components\/profile-action-sheets";/,
  );
  assert.match(
    actionSheetsSource,
    /import \{ ProfileWorkActionSheet \} from "\.\/profile-work-action-sheet";/,
  );
  assert.match(
    actionSheetsSource,
    /import \{ ProfileLibraryActionSheet \} from "\.\/profile-library-action-sheet";/,
  );
  assert.doesNotMatch(pagina, /obterIndicadorSelecaoPerfilAutor/);
  for (const source of [workActionSheetSource, libraryActionSheetSource]) {
    assert.match(
      source,
      /obterIndicadorSelecaoPerfilAutor \} from "\.\.\/lib\/profile-display-utils";/,
    );
    assert.match(source, /obterIndicadorSelecaoPerfilAutor\(/);
  }
  assert.doesNotMatch(
    workActionSheetSource,
    /\{(?:obraFavorita|obraConcluida|obraNoQueroLer) \? "✓" : ""\}/,
  );
  assert.doesNotMatch(
    libraryActionSheetSource,
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
    /heroTitle=\{obterTituloSobrePerfilAutor\(perfilNome\)\}/,
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
    /const usernameExibidoCabecalho =\s*obterUsernameExibidoPerfilAutor\(autorHandlePerfil\);/,
  );
  assert.match(pagina, /username=\{usernameExibidoCabecalho\}/);
  assert.match(profileHeaderUsernameSource, /\{username\}/);
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
    3,
  );
  assert.match(pagina, /temAvatar: temAvatarPerfilEditor/);
  assert.match(pagina, /hasAvatar=\{temAvatarPerfilEditor\}/);
  assert.match(profileEditorAvatarSource, /\{hasAvatar \? \(/);
  assert.match(profileEditorAvatarSource, /\{hasAvatar && \(/);
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
    /const inicialAvatarPerfilEditor = obterInicialAvatarPerfilAutor\(\s*nomePerfilEditor,\s*perfilNome,\s*\);/,
  );
  assert.match(pagina, /fallbackInitial=\{inicialAvatarPerfilEditor\}/);
  assert.match(profileEditorAvatarSource, /\{fallbackInitial\}/);
  assert.doesNotMatch(
    pagina,
    /\(nomePerfilEditor \|\| perfilParaMostrar\.nome\)[\s\S]*?\.charAt\(0\)[\s\S]*?\.toUpperCase\(\)/,
  );
});

test("página delega a composição externa do editor de perfil", () => {
  assert.match(
    pagina,
    /import \{ ProfileEditor \} from "\.\/components\/profile-editor";/,
  );
  assert.match(pagina, /onChooseImage=\{\(\) => avatarInputRef\.current\?\.click\(\)\}/);
  assert.match(pagina, /onRemoveImage=\{removerAvatarAutor\}/);
  assert.match(pagina, /onCancel=\{fecharEditorPerfil\}/);
  assert.match(pagina, /onSave=\{\(\) => void salvarEdicaoPerfilAutor\(\)\}/);
  assert.match(profileEditorSource, /import \{ ProfileEditorHeader \} from "\.\/profile-editor-header";/);
  assert.match(profileEditorSource, /import \{ ProfileEditorAvatar \} from "\.\/profile-editor-avatar";/);
  assert.match(profileEditorSource, /import \{ ProfileEditorFields \} from "\.\/profile-editor-fields";/);
  assert.match(profileEditorSource, /import \{ ProfileEditorActions \} from "\.\/profile-editor-actions";/);
  assert.match(profileEditorSource, /role="dialog"/);
  assert.match(profileEditorSource, /aria-modal="true"/);
  assert.match(profileEditorSource, /aria-label="Editar perfil"/);
  assert.match(profileEditorSource, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(profileEditorHeaderSource, />Editar perfil<\/strong>/);
  assert.match(profileEditorHeaderSource, /Atualize suas informações públicas/);
  assert.match(profileEditorHeaderSource, /aria-label="Fechar edição do perfil"/);
  assert.match(profileEditorHeaderSource, /disabled=\{disabled\}/);
  assert.match(profileEditorAvatarSource, /alt="Prévia da imagem do perfil"/);
  assert.match(profileEditorAvatarSource, /\{error && <span style=\{avatarErrorStyle\}>\{error\}<\/span>\}/);
  assert.match(profileEditorFieldsSource, /if \(event\.key === "Enter"\)/);
  assert.match(profileEditorFieldsSource, /event\.preventDefault\(\);/);
  assert.match(profileEditorFieldsSource, /@username público/);
  assert.match(profileEditorActionsSource, />\s*Cancelar\s*<\/button>/);
  assert.match(profileEditorActionsSource, /\{saveLabel\}/);
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
    /const ariaLabelCopiarUsernameCabecalho =\s*obterAriaLabelCopiarUsernamePerfilAutor\(autorHandlePerfil\);/,
  );
  assert.match(pagina, /ariaLabelCopyUsername=\{ariaLabelCopiarUsernameCabecalho\}/);
  assert.match(profileHeaderUsernameSource, /aria-label=\{ariaLabelCopy\}/);
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
    /ariaLabelNotificationBadge=\{ariaLabelBadgeNotificacoes\}/,
  );
  assert.match(profileOwnMenuContentSource, /aria-label=\{ariaLabelNotificationBadge\}/);
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
    /ariaLabelNotifications=\{ariaLabelNotificacoes\}/,
  );
  assert.match(profileOwnMenuContentSource, /aria-label=\{ariaLabelNotifications\}/);
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
  assert.match(
    pagina,
    /<ProfileMenu[\s\S]*?blockActionLabel=\{rotuloAcaoBloqueioPerfil\}[\s\S]*?blockActionStyle=\{menuBloqueioStyle\}[\s\S]*?blockSaving=\{bloqueioPerfilSalvando\}/,
  );
  assert.match(profileVisitorMenuContentSource, /style=\{blockActionStyle\}/);
  assert.match(profileVisitorMenuContentSource, /\{blockActionLabel\}/);
  assert.match(profileVisitorMenuContentSource, /disabled=\{blockSaving\}/);
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
  assert.match(
    pagina,
    /const ariaLabelAlternarUsernameCabecalho =\s*obterRotuloVisibilidadeUsernamePerfilAutor\(usernameCabecalhoVisivel\);/,
  );
  assert.match(pagina, /ariaLabelToggleUsername=\{ariaLabelAlternarUsernameCabecalho\}/);
  assert.match(profileHeaderUsernameSource, /aria-label=\{ariaLabelToggle\}/);
  assert.doesNotMatch(
    pagina,
    /usernameCabecalhoVisivel[\s\S]{0,80}\? "Esconder username"[\s\S]{0,80}: "Mostrar username"/,
  );
});


test("página delega a composição do cabeçalho do perfil", () => {
  assert.match(
    pagina,
    /import \{ ProfileHeader \} from "\.\/components\/profile-header";/,
  );
  assert.equal((pagina.match(/<ProfileHeader/g) || []).length, 1);
  assert.match(pagina, /headerStyle=\{profileHeaderAtualStyle\}/);
  assert.match(pagina, /menuOpen=\{menuPerfilAberto\}/);
  assert.match(pagina, /onCopyUsername=\{copiarUsernameCabecalho\}/);
  assert.match(pagina, /onOpenMenu=\{\(\) => setMenuPerfilAberto\(true\)\}/);
  assert.match(
    pagina,
    /onToggleUsername=\{\(\) =>\s*setUsernameCabecalhoVisivel\(\(visivel\) => !visivel\)\s*\}/,
  );
  assert.match(
    profileHeaderSource,
    /import \{ ProfileHeaderUsername \} from "\.\/profile-header-username";/,
  );
  assert.match(profileHeaderSource, /aria-label="Abrir menu do perfil"/);
  assert.match(profileHeaderSource, /aria-expanded=\{menuOpen\}/);
  assert.match(profileHeaderSource, /<span style=\{profileMenuIconLineStyle\} \/>/);
  assert.equal(
    (profileHeaderSource.match(/profileMenuIconLineStyle/g) || []).length,
    4,
  );
  assert.match(profileHeaderUsernameSource, /aria-expanded=\{visible\}/);
  assert.match(profileHeaderUsernameSource, /title="Copiar username"/);
  assert.match(
    profileHeaderUsernameSource,
    /data-historietas-user-content="true"/,
  );
  assert.match(
    profileHeaderUsernameSource,
    /data-historietas-i18n-ignore="true"/,
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
    /<ProfileAboutSection[\s\S]*?heroUserContent=\{bioSobreAutorUserContent\}/,
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
  assert.match(pagina, /heroEditorVisible=\{editorSobreVisivel\}/);
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
  assert.match(pagina, /<ProfileMenu[\s\S]*?profileName=\{perfilNome\}/);
  assert.match(
    profileMenuSource,
    /<strong data-historietas-user-content="true" style=\{menuTitleStyle\}>\s*\{profileName\}\s*<\/strong>/,
  );
  assert.match(
    pagina,
    /obterInicialAvatarPerfilAutor\(\s*nomePerfilEditor,\s*perfilNome,\s*\)/,
  );
  assert.match(
    pagina,
    /import \{ ProfileHero \} from "\.\/components\/profile-hero";/,
  );
  assert.match(
    pagina,
    /<ProfileHero[\s\S]*?autorNome=\{perfilNome\}/,
  );
  assert.match(heroSource, /<ProfileHeroIdentity[\s\S]*?autorNome=\{autorNome\}/);
  assert.match(
    heroIdentitySource,
    /import \{ ProfileAvatar \} from "\.\/profile-avatar";/,
  );
  assert.match(
    heroIdentitySource,
    /import \{ ProfileHeaderInfo \} from "\.\/profile-header-info";/,
  );
  assert.match(
    heroIdentitySource,
    /import \{ ProfileStats \} from "\.\/profile-stats";/,
  );
  assert.equal(
    (heroIdentitySource.match(/autorNome=\{autorNome\}/g) || []).length,
    3,
  );
});

test("Perfil de Autor delega a composição do hero e o input oculto do avatar", () => {
  assert.match(pagina, /<ProfileHero[\s\S]*?heroStyle=\{heroAtualStyle\}/);
  assert.match(pagina, /<ProfileHero[\s\S]*?avatarInputRef=\{avatarInputRef\}/);
  assert.match(pagina, /<ProfileHero[\s\S]*?onSelectAvatar=\{selecionarAvatarAutor\}/);
  assert.match(pagina, /<ProfileHero[\s\S]*?podeEditar=\{podeEditarPerfil\}/);
  assert.match(heroSource, /<ProfileBio[\s\S]*?bioPersonalizada=\{bioPersonalizada\}/);
  assert.match(heroSource, /<ProfileHeroActions[\s\S]*?message=\{message\}/);
  assert.match(heroSource, /\{podeEditar && \(/);
  assert.match(heroSource, /<ProfileAvatarInput[\s\S]*?avatarInputRef=\{avatarInputRef\}[\s\S]*?onSelectAvatar=\{onSelectAvatar\}/);
  assert.match(avatarInputSource, /type="file"/);
  assert.match(avatarInputSource, /accept="image\/\*"/);
  assert.match(avatarInputSource, /onChange=\{onSelectAvatar\}/);
  assert.match(avatarInputSource, /style=\{hiddenInputStyle\}/);
});

test("Perfil de Autor delega a composição do menu aos componentes apresentacionais", () => {
  assert.match(
    pagina,
    /import \{ ProfileMenu \} from "\.\/components\/profile-menu";/,
  );
  assert.match(pagina, /\{menuPerfilAberto && \(/);
  assert.equal((pagina.match(/<ProfileMenu/g) || []).length, 1);
  assert.match(pagina, /isOwner=\{podeEditarPerfil\}/);
  assert.match(pagina, /communityHref=\{comunidadeAutorHref\}/);
  assert.match(pagina, /onClose=\{\(\) => setMenuPerfilAberto\(false\)\}/);
  assert.match(pagina, /onCopyLink=\{\(\) => void copiarLinkPerfil\(\)\}/);
  assert.match(pagina, /onReport=\{abrirDenunciaPerfil\}/);
  assert.match(pagina, /onBlock=\{\(\) => void alternarBloqueioPerfil\(\)\}/);
  assert.match(pagina, /onSignOut=\{\(\) => void sairDaConta\(\)\}/);
  assert.match(profileMenuSource, /style=\{menuOverlayStyle\}/);
  assert.match(profileMenuSource, /role="dialog"/);
  assert.match(profileMenuSource, /aria-label="Menu do perfil"/);
  assert.match(profileMenuSource, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(profileMenuSource, /\{isOwner \? \(/);
  assert.match(profileMenuSource, /<ProfileOwnMenuContent/);
  assert.match(profileMenuSource, /<ProfileVisitorMenuContent/);
  assert.match(profileOwnMenuContentSource, /href="\/painel-autor"/);
  assert.match(profileOwnMenuContentSource, /href="\/notificacoes"/);
  assert.match(profileOwnMenuContentSource, /href="\/configuracoes"/);
  assert.match(profileOwnMenuContentSource, />\s*Sair da conta\s*<\/strong>/);
  assert.match(profileVisitorMenuContentSource, /href=\{communityHref\}/);
  assert.match(profileVisitorMenuContentSource, />\s*Denunciar perfil\s*<\/strong>/);
  assert.match(profileVisitorMenuContentSource, />\s*Explorar outras obras\s*<\/strong>/);
});
