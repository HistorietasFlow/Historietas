import "../env.mjs";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, QA_DIR } from "../env.mjs";

const results = [];
const pass = (name, details = "") =>
  results.push({ status: "PASS", name, details });
const fail = (name, details = "") =>
  results.push({ status: "FAIL", name, details });

function checkFile(relative) {
  const exists = fs.existsSync(path.join(ROOT_DIR, relative));
  (exists ? pass : fail)(
    `arquivo ${relative}`,
    exists ? "presente" : "ausente"
  );
}

const expectedRoutes = [
  "app/page.tsx",
  "app/explorar/page.tsx",
  "app/login/page.tsx",
  "app/publicar/page.tsx",
  "app/painel-autor/page.tsx",
  "app/adicionar-capitulo/page.tsx",
  "app/editar-capitulo/page.tsx",
  "app/editar-obra/page.tsx",
  "app/ler-capitulo/page.tsx",
  "app/obra/[slug]/page.tsx",
  "app/obra/[slug]/capitulo/[numero]/page.tsx",
  "app/api/arquivos-obras/url/route.ts",
  "app/api/visualizacoes/route.ts",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/opengraph-image.tsx",
  "app/twitter-image.tsx"
];

expectedRoutes.forEach(checkFile);

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const sourceDirs = ["app", "components", "lib"];

function collectSourceFiles() {
  const files = [];

  for (const dir of sourceDirs) {
    const initial = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(initial)) continue;

    const stack = [initial];

    while (stack.length) {
      const current = stack.pop();

      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);

        if (entry.isDirectory()) {
          stack.push(full);
          continue;
        }

        if (!sourceExtensions.includes(path.extname(entry.name))) continue;

        files.push({
          full: path.resolve(full),
          relative: path
            .relative(ROOT_DIR, full)
            .replaceAll(path.sep, "/"),
          content: fs.readFileSync(full, "utf8")
        });
      }
    }
  }

  return files;
}

function hasUseClientDirective(content) {
  const beginning = content.replace(/^\uFEFF/, "").slice(0, 2000);

  return /^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*["']use client["']\s*;/.test(
    beginning
  );
}

function extractEnvironmentNames(content) {
  const names = new Set();
  let match;

  const dotNotation = /process\.env\.([A-Z0-9_]+)/g;

  while ((match = dotNotation.exec(content))) {
    names.add(match[1]);
  }

  const bracketNotation =
    /process\.env\[\s*["']([A-Z0-9_]+)["']\s*\]/g;

  while ((match = bracketNotation.exec(content))) {
    names.add(match[1]);
  }

  return [...names];
}

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    payload += "=".repeat((4 - (payload.length % 4)) % 4);

    return JSON.parse(
      Buffer.from(payload, "base64").toString("utf8")
    );
  } catch {
    return null;
  }
}

function looksLikeRealSecretSuffix(suffix) {
  const normalized = suffix.toLowerCase();

  const obviousPlaceholder =
    /(example|placeholder|replace|changeme|your[_-]?key|sua[_-]?chave)/i.test(
      normalized
    );

  const distinctCharacters = new Set(suffix).size;

  return (
    suffix.length >= 24 &&
    distinctCharacters >= 8 &&
    !obviousPlaceholder
  );
}

function findLiteralServiceRoleSecrets(file) {
  const findings = [];

  const secretKeyPattern =
    /\bsb_secret_([A-Za-z0-9_-]{24,})\b/g;

  for (const match of file.content.matchAll(secretKeyPattern)) {
    if (!looksLikeRealSecretSuffix(match[1])) {
      continue;
    }

    findings.push(
      `${file.relative}: chave sb_secret_ literal`
    );

    break;
  }

  const jwtPattern =
    /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

  for (const token of file.content.match(jwtPattern) ?? []) {
    const payload = parseJwtPayload(token);

    if (payload?.role === "service_role") {
      findings.push(
        `${file.relative}: JWT service_role literal`
      );

      break;
    }
  }

  return findings;
}

function isSensitiveSupabaseEnvironmentName(name) {
  return (
    /SERVICE_ROLE/.test(name) ||
    /SUPABASE_(?:SECRET|SB_SECRET)(?:_KEY)?/.test(name)
  );
}

function isDangerousPublicEnvironmentName(name) {
  return (
    name.startsWith("NEXT_PUBLIC_") &&
    isSensitiveSupabaseEnvironmentName(name)
  );
}

function extractImportSpecifiers(content) {
  const specifiers = [];

  const importPattern =
    /(?:import\s+(?:[^"'`]*?\s+from\s+)?|export\s+[^"'`]*?\s+from\s+|import\s*\(\s*|require\s*\(\s*)["'`]([^"'`]+)["'`]/g;

  let match;

  while ((match = importPattern.exec(content))) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

const sourceFiles = collectSourceFiles();

const sourceByPath = new Map(
  sourceFiles.map((file) => [file.full, file])
);

const sensitiveServerModulePaths = new Set(
  sourceFiles
    .filter((file) => {
      if (hasUseClientDirective(file.content)) {
        return false;
      }

      const isAdminModule =
        /^lib\/supabase\/admin\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(
          file.relative
        );

      const hasSensitiveEnvironment =
        extractEnvironmentNames(file.content).some(
          isSensitiveSupabaseEnvironmentName
        );

      const hasLiteralSecret =
        findLiteralServiceRoleSecrets(file).length > 0;

      return (
        isAdminModule ||
        hasSensitiveEnvironment ||
        hasLiteralSecret
      );
    })
    .map((file) => file.full)
);

function resolveLocalImport(fromFile, specifier) {
  const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
  let base;

  if (cleanSpecifier.startsWith("@/")) {
    base = path.resolve(
      ROOT_DIR,
      cleanSpecifier.slice(2)
    );
  } else if (
    cleanSpecifier.startsWith("./") ||
    cleanSpecifier.startsWith("../")
  ) {
    base = path.resolve(
      path.dirname(fromFile),
      cleanSpecifier
    );
  } else {
    return null;
  }

  const candidates = [base];

  if (!path.extname(base)) {
    for (const extension of sourceExtensions) {
      candidates.push(`${base}${extension}`);
    }

    for (const extension of sourceExtensions) {
      candidates.push(
        path.join(base, `index${extension}`)
      );
    }
  }

  for (const candidate of candidates) {
    const normalized = path.resolve(candidate);

    if (sourceByPath.has(normalized)) {
      return normalized;
    }
  }

  return null;
}

function findSensitiveImportChain(startPath) {
  const visited = new Set();

  function visit(currentPath, chain) {
    if (sensitiveServerModulePaths.has(currentPath)) {
      return chain;
    }

    if (visited.has(currentPath)) {
      return null;
    }

    visited.add(currentPath);

    const currentFile = sourceByPath.get(currentPath);

    if (!currentFile) {
      return null;
    }

    for (const specifier of extractImportSpecifiers(
      currentFile.content
    )) {
      const resolved = resolveLocalImport(
        currentPath,
        specifier
      );

      if (!resolved) continue;

      const nextFile = sourceByPath.get(resolved);

      const found = visit(resolved, [
        ...chain,
        nextFile?.relative ?? specifier
      ]);

      if (found) {
        return found;
      }
    }

    return null;
  }

  const startFile = sourceByPath.get(startPath);

  return visit(startPath, [
    startFile?.relative ?? startPath
  ]);
}

const serviceRoleIssues = [];

for (const file of sourceFiles) {
  serviceRoleIssues.push(
    ...findLiteralServiceRoleSecrets(file)
  );

  const isClient = hasUseClientDirective(file.content);

  for (const environmentName of extractEnvironmentNames(
    file.content
  )) {
    if (
      isDangerousPublicEnvironmentName(environmentName)
    ) {
      serviceRoleIssues.push(
        `${file.relative}: variável pública perigosa process.env.${environmentName}`
      );
    }

    if (
      isClient &&
      isSensitiveSupabaseEnvironmentName(environmentName)
    ) {
      serviceRoleIssues.push(
        `${file.relative}: Client Component acessa process.env.${environmentName}`
      );
    }
  }

  if (isClient) {
    const importChain = findSensitiveImportChain(file.full);

    if (importChain) {
      serviceRoleIssues.push(
        `${file.relative}: importa módulo sensível (${importChain.join(
          " -> "
        )})`
      );
    }
  }
}

const uniqueServiceRoleIssues = [
  ...new Set(serviceRoleIssues)
];

if (uniqueServiceRoleIssues.length) {
  fail(
    "nenhuma chave service role no código cliente",
    uniqueServiceRoleIssues.slice(0, 8).join(" | ") +
      (uniqueServiceRoleIssues.length > 8
        ? ` | +${
            uniqueServiceRoleIssues.length - 8
          } ocorrência(s)`
        : "")
  );
} else {
  pass(
    "nenhuma chave service role no código cliente",
    "sem segredo real literal, variável pública perigosa ou import sensível em Client Component"
  );
}

const publish = fs.readFileSync(
  path.join(ROOT_DIR, "app/publicar/page.tsx"),
  "utf8"
);

const accepted = [
  ".pdf",
  ".txt",
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif"
];

const missingAccepted = accepted.filter(
  (extension) => !publish.includes(extension)
);

if (missingAccepted.length) {
  fail(
    "formatos de publicação declarados",
    `faltando: ${missingAccepted.join(", ")}`
  );
} else {
  pass(
    "formatos de publicação declarados",
    accepted.join(", ")
  );
}

const editChapter = fs.readFileSync(
  path.join(
    ROOT_DIR,
    "app/editar-capitulo/page.tsx"
  ),
  "utf8"
);

const deletionChecks = [
  'from("capitulos")',
  ".delete()",
  '.eq("id", capituloId)',
  '.eq("obra_id", obraId)',
  '.eq("user_id", userId)',
  "window.confirm"
];

const missingDeletion = deletionChecks.filter(
  (snippet) => !editChapter.includes(snippet)
);

if (missingDeletion.length) {
  fail(
    "exclusão segura de capítulo",
    `faltando: ${missingDeletion.join(" | ")}`
  );
} else {
  pass(
    "exclusão segura de capítulo",
    "confirmação + filtros por capítulo, obra e usuário"
  );
}

const migrationsDir = path.join(
  ROOT_DIR,
  "supabase/migrations"
);

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const abuseProtectionMigrationName = migrationFiles.find((name) =>
  name.endsWith(
    "_proteger_endpoint_exclusao_rpcs_visualizacao.sql"
  )
);

if (!abuseProtectionMigrationName) {
  fail(
    "migration de proteção contra abuso",
    "migration proteger_endpoint_exclusao_rpcs_visualizacao ausente"
  );
} else {
  const abuseProtectionSql = fs.readFileSync(
    path.join(migrationsDir, abuseProtectionMigrationName),
    "utf8"
  );
  const abuseProtectionContracts = [
    {
      name: "limitador persistente fica no schema privado com RLS",
      pattern:
        /create table if not exists historietas_privado\.limites_requisicao[\s\S]*?enable row level security[\s\S]*?revoke all privileges[\s\S]*?from public, anon, authenticated, service_role/i
    },
    {
      name: "limitador serializa o bucket para concorrência",
      pattern:
        /create or replace function historietas_privado\.consumir_limite_requisicao[\s\S]*?set search_path\s*=\s*''[\s\S]*?for update/i
    },
    {
      name: "entrada pública do limitador é exclusiva do servidor",
      pattern:
        /create or replace function public\.consumir_limite_requisicao[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*''[\s\S]*?grant execute[\s\S]*?to service_role/i
    },
    {
      name: "novos RPCs de visualização têm limites por visitante",
      pattern:
        /create or replace function public\.registrar_visualizacao_obra[\s\S]*?'visualizacao:minuto'[\s\S]*?'visualizacao:dia'[\s\S]*?create or replace function public\.registrar_visualizacao_capitulo[\s\S]*?'visualizacao:minuto'[\s\S]*?'visualizacao:dia'/i
    },
    {
      name: "RPCs de visualização são exclusivos do servidor",
      pattern:
        /revoke all on function public\.registrar_visualizacao_obra\(uuid, text\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute[\s\S]*?to service_role[\s\S]*?revoke all on function public\.registrar_visualizacao_capitulo\(uuid, text\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute[\s\S]*?to service_role/i
    },
    {
      name: "RPCs legados de visualização são revogados",
      pattern:
        /revoke all on function public\.incrementar_visualizacao_obra\(uuid\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?revoke all on function public\.incrementar_visualizacao_capitulo\(uuid\)[\s\S]*?from public, anon, authenticated, service_role/i
    }
  ];

  for (const contract of abuseProtectionContracts) {
    if (contract.pattern.test(abuseProtectionSql)) {
      pass(contract.name, abuseProtectionMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${abuseProtectionMigrationName}`
      );
    }
  }
}

const deletionEndpoint = fs.readFileSync(
  path.join(ROOT_DIR, "app/api/conta/excluir/route.ts"),
  "utf8"
);
const limiterCallPosition = deletionEndpoint.indexOf(
  "consumirLimiteRequisicao({"
);
const passwordAttemptPosition = deletionEndpoint.indexOf(
  "signInWithPassword({"
);

if (
  limiterCallPosition >= 0 &&
  passwordAttemptPosition > limiterCallPosition &&
  deletionEndpoint.includes('await cliente.auth.signOut({ scope: "local" })')
) {
  pass(
    "exclusão limita tentativas antes da senha",
    "limitador persistente + descarte da sessão temporária"
  );
} else {
  fail(
    "exclusão limita tentativas antes da senha",
    "limitador ausente, tardio ou sessão temporária não descartada"
  );
}

const viewRoute = fs.readFileSync(
  path.join(ROOT_DIR, "app/api/visualizacoes/route.ts"),
  "utf8"
);
const workPage = fs.readFileSync(
  path.join(ROOT_DIR, "app/obra/[slug]/ObraDinamicaClient.tsx"),
  "utf8"
);
const chapterPage = fs.readFileSync(
  path.join(ROOT_DIR, "app/ler-capitulo/page.tsx"),
  "utf8"
);

if (
  /criarChaveProtecao\(\s*"visualizacao_visitante"/m.test(viewRoute) &&
  viewRoute.includes('"registrar_visualizacao_obra"') &&
  viewRoute.includes('"registrar_visualizacao_capitulo"') &&
  workPage.includes('fetch("/api/visualizacoes"') &&
  chapterPage.includes('fetch("/api/visualizacoes"') &&
  !workPage.includes('rpc("incrementar_visualizacao_obra"') &&
  !chapterPage.includes('"incrementar_visualizacao_capitulo"')
) {
  pass(
    "visualizações passam exclusivamente pelo servidor",
    "identidade HMAC e RPCs server-only"
  );
} else {
  fail(
    "visualizações passam exclusivamente pelo servidor",
    "chamada direta legada ou proteção server-only ausente"
  );
}

const interactionRlsMigrationName = migrationFiles.find((name) =>
  name.endsWith(
    "_corrigir_policies_interacoes_quarentenar_legado.sql"
  )
);

if (!interactionRlsMigrationName) {
  fail(
    "migration RLS de interações",
    "migration corrigir_policies_interacoes_quarentenar_legado ausente"
  );
} else {
  const interactionRlsSql = fs.readFileSync(
    path.join(migrationsDir, interactionRlsMigrationName),
    "utf8"
  );

  const interactionRlsContracts = [
    {
      name: "helpers de interação ficam no schema privado",
      pattern:
        /create or replace function\s+historietas_privado\.pode_interagir_obra[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*''/i
    },
    {
      name: "interação de obra exige publicação e classificação permitida",
      pattern:
        /create or replace function\s+historietas_privado\.pode_interagir_obra[\s\S]*?coalesce\(obra\.publicado, false\)\s*=\s*true[\s\S]*?obra\.classificacao_indicativa\s+in[\s\S]*?usuarios_possuem_bloqueio/i
    },
    {
      name: "interação de capítulo exige pais publicados",
      pattern:
        /create or replace function\s+historietas_privado\.pode_interagir_capitulo[\s\S]*?coalesce\(capitulo\.publicado, false\)\s*=\s*true[\s\S]*?coalesce\(obra\.publicado, false\)\s*=\s*true[\s\S]*?obra\.classificacao_indicativa\s+in/i
    },
    {
      name: "curtida de obra usa autorização centralizada",
      pattern:
        /create policy\s+obra_curtidas_insert_proprio_visivel_sem_bloqueio[\s\S]*?historietas_privado\.pode_interagir_obra\(obra_id\)/i
    },
    {
      name: "leituras de interações seguem visibilidade do conteúdo",
      pattern:
        /create policy\s+obra_curtidas_select_obras_visiveis[\s\S]*?create policy\s+curtidas_capitulos_select_capitulos_visiveis[\s\S]*?create policy\s+comentarios_capitulos_select_capitulo_visivel[\s\S]*?create policy\s+comentarios_capitulos_curtidas_select_capitulo_visivel[\s\S]*?create policy\s+comentarios_obras_select_obra_visivel[\s\S]*?create policy\s+comentarios_obras_curtidas_select_obra_visivel/i
    },
    {
      name: "helpers SECURITY DEFINER públicos são removidos",
      pattern:
        /drop function if exists\s+public\.pode_interagir_comentario_capitulo\(uuid\)[\s\S]*?drop function if exists\s+public\.pode_interagir_obra\(uuid\)/i
    },
    {
      name: "privilégios administrativos das interações são revogados",
      pattern:
        /revoke all privileges on table\s+public\.obra_curtidas[\s\S]*?from public, anon, authenticated/i
    },
    {
      name: "estrutura legada é colocada em quarentena",
      pattern:
        /drop trigger if exists\s+exigir_aceite_termos_obra_comentarios[\s\S]*?drop policy if exists\s+obra_comentarios_leitura_publica[\s\S]*?drop policy if exists\s+obra_comentario_curtidas_leitura_publica[\s\S]*?revoke all privileges on table\s+public\.obra_comentarios[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?revoke all privileges on table\s+public\.obra_comentario_curtidas[\s\S]*?from public, anon, authenticated, service_role/i
    },
    {
      name: "migration verifica pós-condições de segurança",
      pattern:
        /A quarentena falhou: ainda existem policies[\s\S]*?A quarentena falhou: ainda existem grants[\s\S]*?ainda existe SELECT irrestrito em interação ativa/i
    }
  ];

  for (const contract of interactionRlsContracts) {
    if (contract.pattern.test(interactionRlsSql)) {
      pass(contract.name, interactionRlsMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${interactionRlsMigrationName}`
      );
    }
  }

  const syncFunctionMatch =
    /create or replace function\s+public\.sincronizar_nome_perfil_denormalizado\(\)[\s\S]*?\$\$;/i.exec(
      interactionRlsSql
    );

  if (!syncFunctionMatch) {
    fail(
      "sincronização de perfil sem dependência legada",
      `função não encontrada em ${interactionRlsMigrationName}`
    );
  } else if (/obra_comentarios/i.test(syncFunctionMatch[0])) {
    fail(
      "sincronização de perfil sem dependência legada",
      "a função ainda referencia public.obra_comentarios"
    );
  } else {
    pass(
      "sincronização de perfil sem dependência legada",
      interactionRlsMigrationName
    );
  }

  const unsafeInteractionGrant =
    /grant[^;]*\b(?:truncate|trigger|maintain|references)\b[^;]*\bto\s+(?:anon|authenticated)/i;

  if (unsafeInteractionGrant.test(interactionRlsSql)) {
    fail(
      "migration de interações sem grants administrativos",
      "grant administrativo encontrado para anon ou authenticated"
    );
  } else {
    pass(
      "migration de interações sem grants administrativos",
      interactionRlsMigrationName
    );
  }
}

const securityDefinerMigrationName = migrationFiles.find((name) =>
  name.endsWith("_restringir_security_definer_expostos.sql")
);

if (!securityDefinerMigrationName) {
  fail(
    "migration de isolamento SECURITY DEFINER",
    "migration restringir_security_definer_expostos ausente"
  );
} else {
  const securityDefinerSql = fs.readFileSync(
    path.join(migrationsDir, securityDefinerMigrationName),
    "utf8"
  );
  const reviewedSignatures = securityDefinerSql.match(
    /\('public\.[^']+',\s*'(?:api|internal|none)'/g
  );

  if (reviewedSignatures?.length === 41) {
    pass(
      "inventário SECURITY DEFINER é fechado",
      "41 assinaturas revisadas"
    );
  } else {
    fail(
      "inventário SECURITY DEFINER é fechado",
      `${reviewedSignatures?.length || 0}/41 assinaturas encontradas`
    );
  }

  const securityDefinerContracts = [
    {
      name: "rls_auto_enable deixa de ser RPC pública",
      pattern:
        /\('public\.rls_auto_enable\(\)',\s*'none'[\s\S]*?public\.rls_auto_enable\(\)[\s\S]*?historietas_privado\.rls_auto_enable\(\)[\s\S]*?ensure_rls perdeu seu handler interno/i
    },
    {
      name: "núcleos privilegiados migram por assinatura",
      pattern:
        /alter function %I\.%I\(%s\) set schema %I[\s\S]*?historietas_privado[\s\S]*?revoke all on function %s from public, anon, authenticated, service_role/i
    },
    {
      name: "APIs públicas usam SECURITY INVOKER",
      pattern:
        /create function %I\.%I\(%s\) returns %s language sql %s security invoker set search_path = ''''/i
    },
    {
      name: "helpers internos não recebem EXECUTE público",
      pattern:
        /wrapper_mode = 'api' and reviewed\.core_anon[\s\S]*?wrapper_mode = 'api' and reviewed\.core_authenticated[\s\S]*?wrapper_mode = 'api' and reviewed\.core_service_role/i
    },
    {
      name: "novas funções exigem grants explícitos",
      pattern:
        /alter default privileges for role postgres in schema public[\s\S]*?revoke execute on functions from public, anon, authenticated, service_role[\s\S]*?alter default privileges for role postgres in schema historietas_privado[\s\S]*?revoke execute on functions from public, anon, authenticated, service_role/i
    },
    {
      name: "migration bloqueia drift antes da mudança",
      pattern:
        /exposed_count\s*<>\s*41[\s\S]*?SECURITY DEFINER exposto fora do inventario revisado[\s\S]*?ACL inesperada antes da migracao/i
    },
    {
      name: "migration valida ausência de DEFINER público exposto",
      pattern:
        /Ainda existe SECURITY DEFINER publico executavel pela API[\s\S]*?Default privileges ainda autoexpoem novas funcoes/i
    }
  ];

  for (const contract of securityDefinerContracts) {
    if (contract.pattern.test(securityDefinerSql)) {
      pass(contract.name, securityDefinerMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${securityDefinerMigrationName}`
      );
    }
  }
}

const metricsContractMigrationName = migrationFiles.find((name) =>
  name.endsWith("_criar_contrato_metricas_agregadas.sql")
);

if (!metricsContractMigrationName) {
  fail(
    "migration do contrato de métricas",
    "migration criar_contrato_metricas_agregadas ausente"
  );
} else {
  const metricsContractSql = fs.readFileSync(
    path.join(migrationsDir, metricsContractMigrationName),
    "utf8"
  );
  const metricsContracts = [
    {
      name: "RPC pública de métricas preserva a identidade do chamador",
      pattern:
        /create or replace function public\.obter_metricas_conteudos[\s\S]*?security invoker[\s\S]*?set search_path\s*=\s*''/i
    },
    {
      name: "RPC de métricas limita todos os lotes",
      pattern:
        /cardinality\(coalesce\(p_obra_ids[\s\S]*?>\s*100[\s\S]*?cardinality\(coalesce\(p_capitulo_ids[\s\S]*?>\s*600[\s\S]*?cardinality\(coalesce\(p_autor_ids[\s\S]*?>\s*100/i
    },
    {
      name: "progresso privado fica restrito e limitado ao usuário",
      pattern:
        /create or replace function historietas_privado\.obter_progresso_metricas_usuario[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*''[\s\S]*?p_obra_ids[\s\S]*?>\s*100[\s\S]*?p_capitulo_ids[\s\S]*?>\s*600[\s\S]*?progresso\.user_id\s*=\s*\(select auth\.uid\(\)\)/i
    },
    {
      name: "helper de conteúdo reproduz visibilidade em lote",
      pattern:
        /create or replace function historietas_privado\.obter_conteudos_metricas[\s\S]*?security definer[\s\S]*?obra\.user_id\s*=\s*v_usuario_id[\s\S]*?obra\.classificacao_indicativa\s+in[\s\S]*?capitulo\.user_id\s*=\s*obra\.user_id/i
    },
    {
      name: "helper da Biblioteca reutiliza autorização canônica",
      pattern:
        /create or replace function historietas_privado\.obter_interacoes_biblioteca_metricas[\s\S]*?historietas_privado\.usuario_pode_ver_registro_biblioteca[\s\S]*?select distinct/i
    },
    {
      name: "helper de interações preserva conteúdo visível e moderação",
      pattern:
        /create or replace function historietas_privado\.obter_interacoes_conteudo_metricas[\s\S]*?security definer[\s\S]*?obra\.classificacao_indicativa\s+in[\s\S]*?capitulo\.interacao_permitida\s+or\s+v_usuario_admin/i
    },
    {
      name: "contrato não publica contagem de progresso privado",
      pattern:
        /Progresso privado aparece somente em lido_por_mim\/lido_em e nunca e exposto como contador publico/i
    },
    {
      name: "índices sustentam as novas agregações",
      pattern:
        /favoritos_obra_id_idx[\s\S]*?concluidas_obra_id_idx[\s\S]*?comunidade_posts_obra_tipo_idx[\s\S]*?curtidas_capitulos_obra_id_idx[\s\S]*?comentarios_capitulos_obra_id_idx[\s\S]*?salvos_capitulos_obra_id_idx/i
    },
    {
      name: "execução da RPC de métricas é explícita",
      pattern:
        /revoke all on function public\.obter_metricas_conteudos\(uuid\[\], uuid\[\], uuid\[\]\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute[\s\S]*?to anon, authenticated, service_role/i
    },
    {
      name: "helpers de métricas têm grants explícitos",
      pattern:
        /revoke all on function historietas_privado\.obter_progresso_metricas_usuario[\s\S]*?grant execute on function historietas_privado\.obter_progresso_metricas_usuario[\s\S]*?revoke all on function historietas_privado\.obter_conteudos_metricas[\s\S]*?grant execute on function historietas_privado\.obter_conteudos_metricas[\s\S]*?revoke all on function historietas_privado\.obter_interacoes_biblioteca_metricas[\s\S]*?grant execute on function historietas_privado\.obter_interacoes_biblioteca_metricas[\s\S]*?revoke all on function historietas_privado\.obter_interacoes_conteudo_metricas[\s\S]*?grant execute on function historietas_privado\.obter_interacoes_conteudo_metricas/i
    },
    {
      name: "migration de métricas valida pós-condições",
      pattern:
        /do \$metricas_pos_condicoes\$[\s\S]*?PUBLIC nao pode executar[\s\S]*?Nem todos os indices do contrato de metricas foram criados/i
    }
  ];

  for (const contract of metricsContracts) {
    if (contract.pattern.test(metricsContractSql)) {
      pass(contract.name, metricsContractMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${metricsContractMigrationName}`
      );
    }
  }
}

const metricsConsumerFiles = [
  "app/page.tsx",
  "app/em-alta/page.tsx",
  "app/explorar/page.tsx",
  "app/listas/page.tsx",
  "app/seguindo/page.tsx",
  "app/perfil-autor/page.tsx",
  "app/painel-autor/page.tsx",
  "app/obra/[slug]/ObraDinamicaClient.tsx",
  "app/ler-capitulo/page.tsx"
];
const consumersOutsideMetricsContract = metricsConsumerFiles.filter(
  (relative) => {
    const content = fs.readFileSync(path.join(ROOT_DIR, relative), "utf8");

    return !content.includes("carregarMetricasConteudos");
  }
);

if (consumersOutsideMetricsContract.length) {
  fail(
    "consumidores usam o contrato único de métricas",
    consumersOutsideMetricsContract.join(", ")
  );
} else {
  pass(
    "consumidores usam o contrato único de métricas",
    `${metricsConsumerFiles.length} consumidores cobertos`
  );
}

const metricsClientPath = path.join(ROOT_DIR, "lib/metricas.ts");

if (!fs.existsSync(metricsClientPath)) {
  fail("cliente do contrato único de métricas", "lib/metricas.ts ausente");
} else {
  const metricsClient = fs.readFileSync(metricsClientPath, "utf8");
  const metricsClientContracts = [
    {
      name: "cliente pagina lotes dentro dos limites da RPC",
      pattern:
        /LIMITE_OBRAS_METRICAS\s*=\s*100[\s\S]*?LIMITE_CAPITULOS_METRICAS\s*=\s*600[\s\S]*?LIMITE_AUTORES_METRICAS\s*=\s*100[\s\S]*?dividirEmLotes[\s\S]*?for \(let indice = 0; indice < totalLotes/i
    },
    {
      name: "cliente rejeita versão incompatível do contrato",
      pattern:
        /versao\s*!==\s*VERSAO_CONTRATO_METRICAS[\s\S]*?return contratoMetricasVazio\(false\)/i
    },
    {
      name: "falha de qualquer lote invalida a resposta inteira",
      pattern:
        /if \(error\)[\s\S]*?return contratoMetricasVazio\(false\)[\s\S]*?if \(!lote\.carregado\)[\s\S]*?return contratoMetricasVazio\(false\)/i
    }
  ];

  for (const contract of metricsClientContracts) {
    if (contract.pattern.test(metricsClient)) {
      pass(contract.name, "lib/metricas.ts");
    } else {
      fail(contract.name, "contrato ausente em lib/metricas.ts");
    }
  }
}

const legacyMetricsScanners = metricsConsumerFiles.filter((relative) => {
  const content = fs.readFileSync(path.join(ROOT_DIR, relative), "utf8");

  return /while\s*\([^)]*\)[\s\S]{0,1200}?\.range\(/i.test(content);
});

if (legacyMetricsScanners.length) {
  fail(
    "varreduras paginadas de métricas foram removidas do cliente",
    legacyMetricsScanners.join(", ")
  );
} else {
  pass(
    "varreduras paginadas de métricas foram removidas do cliente",
    `${metricsConsumerFiles.length} consumidores verificados`
  );
}

const storageQuotaMigrationName = migrationFiles.find((name) =>
  name.endsWith("_proteger_storage_contra_esgotamento_cota.sql")
);

if (!storageQuotaMigrationName) {
  fail(
    "migration de proteção da cota do Storage",
    "migration proteger_storage_contra_esgotamento_cota ausente"
  );
} else {
  const storageQuotaSql = fs.readFileSync(
    path.join(migrationsDir, storageQuotaMigrationName),
    "utf8"
  );
  const storageQuotaContracts = [
    {
      name: "bucket de arquivos limita tamanho e MIME",
      pattern:
        /file_size_limit\s*=\s*5\s*\*\s*1024\s*\*\s*1024[\s\S]*?application\/pdf[\s\S]*?text\/plain[\s\S]*?image\/webp[\s\S]*?where id = 'arquivos-obras'/i
    },
    {
      name: "helper privado do Storage usa DEFINER com search_path vazio",
      pattern:
        /create or replace function historietas_privado\.upload_storage_dentro_cota[\s\S]*?security definer[\s\S]*?set search_path\s*=\s*''/i
    },
    {
      name: "cotas de usuário e projeto ficam limitadas",
      pattern:
        /v_limite_bytes_global constant bigint\s*:=\s*700\s*\*\s*1024\s*\*\s*1024[\s\S]*?v_limite_objetos_global constant bigint\s*:=\s*5000[\s\S]*?v_limite_bytes_usuario constant bigint\s*:=\s*100\s*\*\s*1024\s*\*\s*1024[\s\S]*?v_limite_objetos_usuario constant bigint\s*:=\s*100/i
    },
    {
      name: "upload concorrente é serializado antes da contagem",
      pattern:
        /pg_advisory_xact_lock[\s\S]*?select[\s\S]*?from storage\.objects/i
    },
    {
      name: "metadata pendente reserva o máximo do bucket",
      pattern:
        /primeiro INSERT com metadata nula[\s\S]*?v_tamanho_novo\s*:=\s*v_limite_arquivo[\s\S]*?when 'arquivos-obras' then 5::bigint \* 1024 \* 1024/i
    },
    {
      name: "policies de cota são restritivas para insert e update",
      pattern:
        /create policy storage_cota_insert_restritiva[\s\S]*?as restrictive[\s\S]*?for insert[\s\S]*?create policy storage_cota_update_restritiva[\s\S]*?as restrictive[\s\S]*?for update/i
    },
    {
      name: "helper da cota não vira RPC anônima",
      pattern:
        /revoke all on function historietas_privado\.upload_storage_dentro_cota[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute on function historietas_privado\.upload_storage_dentro_cota[\s\S]*?to authenticated/i
    },
    {
      name: "migration do Storage valida pós-condições",
      pattern:
        /A configuração dos três buckets não foi confirmada[\s\S]*?Os privilégios do helper de cota não ficaram restritos[\s\S]*?As policies restritivas de cota não foram confirmadas/i
    }
  ];

  for (const contract of storageQuotaContracts) {
    if (contract.pattern.test(storageQuotaSql)) {
      pass(contract.name, storageQuotaMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${storageQuotaMigrationName}`
      );
    }
  }
}

const storageClientPath = path.join(ROOT_DIR, "lib/storageUploads.ts");

if (!fs.existsSync(storageClientPath)) {
  fail("contrato único de uploads", "lib/storageUploads.ts ausente");
} else {
  const storageClient = fs.readFileSync(storageClientPath, "utf8");

  if (
    /avatars:\s*1\s*\*\s*1024\s*\*\s*1024[\s\S]*?"capas-obras":\s*2\s*\*\s*1024\s*\*\s*1024[\s\S]*?"arquivos-obras":\s*5\s*\*\s*1024\s*\*\s*1024/i.test(
      storageClient
    )
  ) {
    pass("cliente compartilha os limites dos buckets", "lib/storageUploads.ts");
  } else {
    fail(
      "cliente compartilha os limites dos buckets",
      "limites 1/2/5 MiB não encontrados em lib/storageUploads.ts"
    );
  }

  if (
    /return extensao \? `\$\{userId\}\/avatar\.\$\{extensao\}` : null/i.test(
      storageClient
    )
  ) {
    pass("avatar usa caminho estável e limitado", "lib/storageUploads.ts");
  } else {
    fail(
      "avatar usa caminho estável e limitado",
      "caminho determinístico do avatar não encontrado"
    );
  }
}

const storageEgressMigrationName = migrationFiles.find((name) =>
  name.endsWith("_proteger_egress_arquivos_obras.sql")
);

if (!storageEgressMigrationName) {
  fail(
    "migration de proteção do egress de arquivos",
    "migration proteger_egress_arquivos_obras ausente"
  );
} else {
  const storageEgressSql = fs.readFileSync(
    path.join(migrationsDir, storageEgressMigrationName),
    "utf8"
  );
  const storageEgressContracts = [
    {
      name: "migration exige bucket de arquivos privado",
      pattern:
        /where bucket\.id = 'arquivos-obras'[\s\S]*?bucket\.public is false/i
    },
    {
      name: "migration remove leitura direta de arquivos pela API",
      pattern:
        /drop policy storage_arquivos_select_publicado_ou_proprio\s+on storage\.objects/i
    },
    {
      name: "migration preserva apenas o SELECT técnico do upload",
      pattern:
        /create policy storage_arquivos_select_upload_proprio[\s\S]*?for select[\s\S]*?to authenticated[\s\S]*?bucket_id = 'arquivos-obras'[\s\S]*?storage\.allow_only_operation\('object\.upload'\)[\s\S]*?storage\.foldername\(name\)[\s\S]*?select auth\.uid\(\)[\s\S]*?::text/i
    },
    {
      name: "migration valida ausência de policy de leitura residual",
      pattern:
        /policy\.polname <> 'storage_arquivos_select_upload_proprio'[\s\S]*?pg_catalog\.pg_get_expr[\s\S]*?arquivos-obras[\s\S]*?Ainda existe outra policy de leitura/i
    },
    {
      name: "migration preserva privacidade do bucket",
      pattern:
        /if not exists \([\s\S]*?bucket\.id = 'arquivos-obras'[\s\S]*?bucket\.public is false[\s\S]*?O bucket arquivos-obras deixou de ser privado/i
    }
  ];

  for (const contract of storageEgressContracts) {
    if (contract.pattern.test(storageEgressSql)) {
      pass(contract.name, storageEgressMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${storageEgressMigrationName}`
      );
    }
  }
}

const storageEgressRoutePath = path.join(
  ROOT_DIR,
  "app/api/arquivos-obras/url/route.ts"
);

if (!fs.existsSync(storageEgressRoutePath)) {
  fail(
    "endpoint server-only para arquivos privados",
    "app/api/arquivos-obras/url/route.ts ausente"
  );
} else {
  const storageEgressRoute = fs.readFileSync(storageEgressRoutePath, "utf8");
  const storageEgressRouteContracts = [
    {
      name: "endpoint de arquivos usa cliente administrativo server-only",
      pattern:
        /criarSupabaseAdminClient[\s\S]*?supabaseAdminConfigurado/i
    },
    {
      name: "endpoint de arquivos valida origem e corpo limitado",
      pattern:
        /request\.headers\.get\("origin"\)[\s\S]*?origensPermitidas\.has[\s\S]*?content-type[\s\S]*?request\.body\?\.getReader\(\)[\s\S]*?tamanhoRecebido > TAMANHO_MAXIMO_CORPO[\s\S]*?leitor\.cancel\(\)/i
    },
    {
      name: "endpoint de arquivos valida UUID da obra",
      pattern: /UUID_VALIDO\.test\(obraId\)/i
    },
    {
      name: "endpoint de arquivos respeita o bloqueio público 18+",
      pattern:
        /const CLASSIFICACOES_PUBLICAS = new Set\(\[\s*"Livre",\s*"10\+",\s*"12\+",\s*"14\+",\s*"16\+",?\s*\]\);/i
    },
    {
      name: "endpoint de arquivos limita rede e usuário persistentemente",
      pattern:
        /escopo: "arquivo_obra_rede"[\s\S]*?limite: 60[\s\S]*?escopo: "arquivo_obra_usuario"[\s\S]*?limite: 30[\s\S]*?janelaSegundos: 5 \* 60[\s\S]*?bloqueioSegundos: 15 \* 60/i
    },
    {
      name: "endpoint consulta obra por RPC administrativa mínima",
      pattern:
        /\.rpc\(\s*"obter_arquivo_obra_para_assinatura"[\s\S]*?p_obra_id: obraId[\s\S]*?usuarioId !== data\.user_id[\s\S]*?!data\.publicado[\s\S]*?!CLASSIFICACOES_PUBLICAS\.has\(data\.classificacao_indicativa\)/i
    },
    {
      name: "endpoint restringe o objeto ao diretório do proprietário",
      pattern:
        /partes\[0\]\?\.toLowerCase\(\) !== proprietarioId\.trim\(\)\.toLowerCase\(\)/i
    },
    {
      name: "endpoint assina arquivos por apenas dez minutos",
      pattern:
        /DURACAO_URL_SEGUNDOS = 10 \* 60[\s\S]*?\.createSignedUrl\(caminho, DURACAO_URL_SEGUNDOS\)/i
    },
    {
      name: "endpoint impede cache da resposta assinada",
      pattern:
        /"Cache-Control": "no-store"[\s\S]*?"X-Content-Type-Options": "nosniff"/i
    }
  ];

  for (const contract of storageEgressRouteContracts) {
    if (contract.pattern.test(storageEgressRoute)) {
      pass(contract.name, "app/api/arquivos-obras/url/route.ts");
    } else {
      fail(
        contract.name,
        "contrato ausente em app/api/arquivos-obras/url/route.ts"
      );
    }
  }

  if (/SUPABASE_SERVICE_ROLE(?:_KEY)?/.test(storageEgressRoute)) {
    fail(
      "endpoint não referencia segredo administrativo diretamente",
      "variável de service role encontrada no Route Handler"
    );
  } else {
    pass(
      "endpoint não referencia segredo administrativo diretamente",
      "segredo encapsulado em lib/supabase/admin"
    );
  }

  if (/\.from\(\s*["']obras["']\s*\)/i.test(storageEgressRoute)) {
    fail(
      "endpoint não exige SELECT administrativo direto em obras",
      "consulta direta de public.obras encontrada no Route Handler"
    );
  } else {
    pass(
      "endpoint não exige SELECT administrativo direto em obras",
      "consulta limitada à RPC server-only"
    );
  }
}

const storageEgressLookupMigrationName = migrationFiles.find((name) =>
  name.endsWith("_corrigir_consulta_server_arquivo_obra.sql")
);

if (!storageEgressLookupMigrationName) {
  fail(
    "migration da consulta server-only de arquivo",
    "migration corrigir_consulta_server_arquivo_obra ausente"
  );
} else {
  const storageEgressLookupSql = fs.readFileSync(
    path.join(migrationsDir, storageEgressLookupMigrationName),
    "utf8"
  );
  const storageEgressLookupContracts = [
    {
      name: "núcleo privado retorna somente campos necessários",
      pattern:
        /function historietas_privado\.obter_arquivo_obra_para_assinatura\(\s*p_obra_id uuid\s*\)[\s\S]*?returns table\s*\(\s*id uuid,\s*user_id uuid,\s*publicado boolean,\s*classificacao_indicativa text,\s*arquivo_url text\s*\)/i
    },
    {
      name: "núcleo administrativo usa DEFINER somente no schema privado",
      pattern:
        /function historietas_privado\.obter_arquivo_obra_para_assinatura\([\s\S]*?security definer[\s\S]*?set search_path\s*=\s*''/i
    },
    {
      name: "wrapper público usa SECURITY INVOKER",
      pattern:
        /function public\.obter_arquivo_obra_para_assinatura\([\s\S]*?security invoker[\s\S]*?from historietas_privado\.obter_arquivo_obra_para_assinatura\(p_obra_id\)/i
    },
    {
      name: "núcleo e wrapper são executáveis somente por service_role",
      pattern:
        /revoke all on function historietas_privado\.obter_arquivo_obra_para_assinatura\(uuid\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute on function historietas_privado\.obter_arquivo_obra_para_assinatura\(uuid\)[\s\S]*?to service_role[\s\S]*?revoke all on function public\.obter_arquivo_obra_para_assinatura\(uuid\)[\s\S]*?from public, anon, authenticated, service_role[\s\S]*?grant execute on function public\.obter_arquivo_obra_para_assinatura\(uuid\)[\s\S]*?to service_role/i
    },
    {
      name: "migration preserva ausência de SELECT direto para service_role",
      pattern:
        /has_table_privilege\(\s*'service_role',\s*'public\.obras',\s*'select'\s*\)[\s\S]*?service_role recebeu SELECT direto indevido/i
    }
  ];

  for (const contract of storageEgressLookupContracts) {
    if (contract.pattern.test(storageEgressLookupSql)) {
      pass(contract.name, storageEgressLookupMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${storageEgressLookupMigrationName}`
      );
    }
  }
}

const privateFileClientPath = path.join(ROOT_DIR, "lib/arquivosObras.ts");

const rlsPerformanceMigrationName = migrationFiles.find((name) =>
  name.endsWith("_otimizar_policies_rls_indices.sql")
);

if (!rlsPerformanceMigrationName) {
  fail(
    "migration de performance RLS e índices",
    "migration otimizar_policies_rls_indices ausente"
  );
} else {
  const rlsPerformanceSql = fs.readFileSync(
    path.join(migrationsDir, rlsPerformanceMigrationName),
    "utf8"
  );

  const rlsPerformanceContracts = [
    {
      name: "migration RLS bloqueia drift no inventário",
      pattern:
        /rls_initplan_expected[\s\S]*?rls_policy_before[\s\S]*?inventario RLS deve conter exatamente 99 policies/i
    },
    {
      name: "migration RLS usa initplan recomendado",
      pattern:
        /replace\(\s*reviewed\.(?:qual|with_check),\s*'auth\.uid\(\)',\s*'\(select auth\.uid\(\)\)'/i
    },
    {
      name: "migration RLS compara semântica antes e depois",
      pattern:
        /rls_policy_before[\s\S]*?regexp_replace\([\s\S]*?A otimizacao de initplan alterou a semantica/i
    },
    {
      name: "migration consolida policies permissivas",
      pattern:
        /select_policy_merges[\s\S]*?delete_policy_merges[\s\S]*?comunidade_posts_insert_autenticado[\s\S]*?usuarios podem criar publicacoes/i
    },
    {
      name: "migration não remove índice de constraint",
      pattern:
        /pg_constraint[\s\S]*?conindid\s*=\s*snapshot\.index_oid[\s\S]*?tentou remover indice de constraint/i
    },
    {
      name: "migration preserva equivalente de índice removido",
      pattern:
        /duplicate_index_snapshot[\s\S]*?indice inventariado nao possui equivalente preservado[\s\S]*?Um indice equivalente deixou de existir/i
    },
    {
      name: "migration valida cobertura das FKs",
      pattern:
        /fk_indexes_expected[\s\S]*?index_row\.indkey\[0\]\s*=\s*attribute\.attnum[\s\S]*?FK permaneceu sem o indice de apoio esperado/i
    }
  ];

  for (const contract of rlsPerformanceContracts) {
    if (contract.pattern.test(rlsPerformanceSql)) {
      pass(contract.name, rlsPerformanceMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${rlsPerformanceMigrationName}`
      );
    }
  }

  const initplanSection = rlsPerformanceSql.match(
    /insert into pg_temp\.rls_initplan_expected[\s\S]*?values([\s\S]*?)create temporary table pg_temp\.rls_policy_before/i
  )?.[1] ?? "";
  const initplanPolicies = [
    ...initplanSection.matchAll(
      /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g
    )
  ].map((match) => `${match[1]}|${match[2]}`);

  if (
    initplanPolicies.length === 99 &&
    new Set(initplanPolicies).size === 99
  ) {
    pass(
      "inventário initplan contém 99 policies únicas",
      rlsPerformanceMigrationName
    );
  } else {
    fail(
      "inventário initplan contém 99 policies únicas",
      `encontradas ${initplanPolicies.length} entradas e ${new Set(initplanPolicies).size} únicas`
    );
  }

  const duplicateIndexSection = rlsPerformanceSql.match(
    /insert into pg_temp\.duplicate_indexes_to_drop[\s\S]*?values([\s\S]*?)create temporary table pg_temp\.duplicate_index_snapshot/i
  )?.[1] ?? "";
  const duplicateIndexes = [
    ...duplicateIndexSection.matchAll(/\(\s*'([^']+)'\s*\)/g)
  ].map((match) => match[1]);

  if (
    duplicateIndexes.length === 23 &&
    new Set(duplicateIndexes).size === 23
  ) {
    pass(
      "inventário contém somente 23 índices duplicados",
      rlsPerformanceMigrationName
    );
  } else {
    fail(
      "inventário contém somente 23 índices duplicados",
      `encontrados ${duplicateIndexes.length} índices e ${new Set(duplicateIndexes).size} únicos`
    );
  }

  const expectedFkIndexes = [
    "comentarios_capitulos_user_id_idx",
    "comunidade_comentarios_salvos_usuario_id_idx",
    "comunidade_curtidas_usuario_id_idx",
    "comunidade_denuncias_analisado_por_idx",
    "comunidade_post_salvos_usuario_id_idx",
    "comunidade_posts_fixado_por_idx",
    "comunidade_salvos_usuario_id_idx",
    "notificacoes_autor_id_idx",
    "problemas_tecnicos_analisado_por_idx",
    "progresso_leitura_capitulo_id_idx",
    "progresso_leitura_obra_id_idx",
    "top5_curtidas_usuario_id_idx"
  ].sort();
  const createdFkIndexes = [
    ...rlsPerformanceSql.matchAll(
      /create index\s+([a-z0-9_]+)\s+on public\.[a-z0-9_]+\s*\(\s*[a-z0-9_]+\s*\)/gi
    )
  ].map((match) => match[1]).sort();

  if (
    JSON.stringify(createdFkIndexes) ===
    JSON.stringify(expectedFkIndexes)
  ) {
    pass(
      "migration cria os 12 índices de FK esperados",
      rlsPerformanceMigrationName
    );
  } else {
    fail(
      "migration cria os 12 índices de FK esperados",
      `índices encontrados: ${createdFkIndexes.join(", ")}`
    );
  }
}

if (!fs.existsSync(privateFileClientPath)) {
  fail("cliente único de arquivos privados", "lib/arquivosObras.ts ausente");
} else {
  const privateFileClient = fs.readFileSync(privateFileClientPath, "utf8");

  if (
    /fetch\("\/api\/arquivos-obras\/url"[\s\S]*?method: "POST"[\s\S]*?credentials: "same-origin"[\s\S]*?cache: "no-store"/i.test(
      privateFileClient
    )
  ) {
    pass("cliente usa endpoint único para arquivos privados", "lib/arquivosObras.ts");
  } else {
    fail(
      "cliente usa endpoint único para arquivos privados",
      "contrato ausente em lib/arquivosObras.ts"
    );
  }
}

for (const relative of [
  "app/obra/[slug]/ObraDinamicaClient.tsx",
  "app/painel-autor/page.tsx"
]) {
  const content = fs.readFileSync(path.join(ROOT_DIR, relative), "utf8");

  if (/solicitarUrlTemporariaArquivoObra/.test(content)) {
    pass("consumidor usa endpoint protegido de arquivos", relative);
  } else {
    fail(
      "consumidor usa endpoint protegido de arquivos",
      `helper ausente em ${relative}`
    );
  }
}

const publicWorkClient = fs.readFileSync(
  path.join(ROOT_DIR, "app/obra/[slug]/ObraDinamicaClient.tsx"),
  "utf8"
);

if (
  /arquivo\.categoria !== "imagem"[\s\S]*?arquivoAssinado\.expiraEm > Date\.now\(\)[\s\S]*?solicitarUrlTemporariaArquivoObra\(obraId\)[\s\S]*?onClick=\{abrirArquivo\}/i.test(
    publicWorkClient
  )
) {
  pass(
    "cliente assina documentos e renova URLs apenas sob demanda",
    "app/obra/[slug]/ObraDinamicaClient.tsx"
  );
} else {
  fail(
    "cliente assina documentos e renova URLs apenas sob demanda",
    "assinatura sob demanda ausente na página pública"
  );
}

const directSigningClients = sourceFiles.filter(
  (file) =>
    hasUseClientDirective(file.content) &&
    /\.createSignedUrl\s*\(/.test(file.content)
);

if (directSigningClients.length) {
  fail(
    "clientes não assinam objetos privados diretamente",
    directSigningClients.map((file) => file.relative).join(", ")
  );
} else {
  pass(
    "clientes não assinam objetos privados diretamente",
    `${sourceFiles.filter((file) => hasUseClientDirective(file.content)).length} clientes verificados`
  );
}

if (fs.existsSync(storageClientPath)) {
  const storageClient = fs.readFileSync(storageClientPath, "utf8");

  if (
    /CACHE_CONTROL_PUBLICO_SEGUNDOS = "31536000"[\s\S]*?CACHE_CONTROL_PRIVADO_SEGUNDOS = "3600"[\s\S]*?bucket === "arquivos-obras"[\s\S]*?CACHE_CONTROL_PRIVADO_SEGUNDOS[\s\S]*?CACHE_CONTROL_PUBLICO_SEGUNDOS/i.test(
      storageClient
    )
  ) {
    pass(
      "cache de uploads diferencia conteúdo público e privado",
      "imagens públicas: 1 ano; arquivos privados: 1 hora"
    );
  } else {
    fail(
      "cache de uploads diferencia conteúdo público e privado",
      "contrato de cache ausente em lib/storageUploads.ts"
    );
  }
}

const profilePage = fs.readFileSync(
  path.join(ROOT_DIR, "app/perfil-autor/page.tsx"),
  "utf8"
);

if (
  /avatar_url:[\s\S]*?avatarRemoto\.startsWith\("data:"\)[\s\S]*?avatarRemoto\.startsWith\("blob:"\)[\s\S]*?\? ""/i.test(
    profilePage
  )
) {
  pass("fallback Base64 do avatar não vai para o Postgres", "app/perfil-autor/page.tsx");
} else {
  fail(
    "fallback Base64 do avatar não vai para o Postgres",
    "proteção contra data URL remota ausente"
  );
}

if (
  /deveRemoverAvatarAnterior[\s\S]*?\.from\(AVATAR_STORAGE_BUCKET\)[\s\S]*?\.remove\(\[caminhoAvatarAnterior\]\)/i.test(
    profilePage
  )
) {
  pass("avatar anterior é removido após troca confirmada", "app/perfil-autor/page.tsx");
} else {
  fail(
    "avatar anterior é removido após troca confirmada",
    "limpeza do avatar anterior não encontrada"
  );
}

const rlsPrivacyMigrationName =
  "20260821220055_corrigir_rls_capitulos_privacidade.sql";
const rlsPrivacyMigrationPath = path.join(
  migrationsDir,
  rlsPrivacyMigrationName
);

const rlsLibraryExecuteMigrationName =
  "20260821222837_corrigir_execute_helper_biblioteca.sql";
const rlsLibraryExecuteMigrationPath = path.join(
  migrationsDir,
  rlsLibraryExecuteMigrationName
);

if (!fs.existsSync(rlsPrivacyMigrationPath)) {
  fail(
    "migration RLS de capítulos e privacidade",
    `${rlsPrivacyMigrationName} ausente`
  );
} else {
  const rlsSql = fs.readFileSync(
    rlsPrivacyMigrationPath,
    "utf8"
  );

  const rlsContracts = [
    {
      name: "autoria de capítulo validada por trigger",
      pattern:
        /create trigger\s+capitulos_validar_autoria[\s\S]*?execute function\s+public\.validar_autoria_capitulo\(\)/i
    },
    {
      name: "insert de capítulo exige dono da obra",
      pattern:
        /create policy\s+capitulos_insert_autor_obra[\s\S]*?user_id\s*=\s*auth\.uid\(\)[\s\S]*?obra\.user_id\s*=\s*auth\.uid\(\)/i
    },
    {
      name: "coleções usam autorização da Biblioteca",
      pattern:
        /create or replace function\s+historietas_privado\.usuario_pode_ver_registro_biblioteca[\s\S]*?visibilidade_biblioteca/i
    },
    {
      name: "favoritos privados protegidos",
      pattern: /create policy\s+favoritos_select_visiveis/i
    },
    {
      name: "concluídas privadas protegidas",
      pattern: /create policy\s+concluidas_select_visiveis/i
    },
    {
      name: "avaliações privadas protegidas",
      pattern: /create policy\s+obra_avaliacoes_select_visiveis/i
    },
    {
      name: "obras seguidas privadas protegidas",
      pattern: /create policy\s+seguindo_obras_select_visiveis/i
    },
    {
      name: "capítulos salvos privados protegidos",
      pattern: /create policy\s+salvos_capitulos_select_visiveis/i
    },
    {
      name: "autores seguidos restritos ao dono",
      pattern: /create policy\s+seguindo_autores_select_proprio/i
    },
    {
      name: "grants de autores seguidos funcionais",
      pattern:
        /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on table\s+public\.seguindo_autores\s+to\s+authenticated/i
    },
    {
      name: "preferências completas restritas ao dono",
      pattern:
        /create policy\s+preferencias_privacidade_select_proprio/i
    },
    {
      name: "bio pública passa por máscara de privacidade",
      pattern:
        /create or replace function\s+historietas_privado\.carregar_bios_perfil_publicas[\s\S]*?else null[\s\S]*?create view\s+public\.profiles_publicos\s+with\s*\(\s*security_invoker\s*=\s*true[\s\S]*?revoke all privileges on table public\.profiles[\s\S]*?revoke select\s*\(\s*bio\s*,\s*sobre_bio\s*\)[\s\S]*?grant select\s*\([\s\S]*?username[\s\S]*?\) on table public\.profiles to anon, authenticated/i
    },
    {
      name: "view pública respeita RLS do chamador",
      pattern:
        /create view\s+public\.profiles_publicos\s+with\s*\(\s*security_invoker\s*=\s*true\s*,\s*security_barrier\s*=\s*true\s*\)/i
    },
    {
      name: "helper interno da Biblioteca não vira RPC pública",
      pattern:
        /revoke all on function\s+historietas_privado\.usuario_pode_ver_registro_biblioteca\(uuid, text, text\)\s+from public, anon, authenticated, service_role/i
    },
    {
      name: "gravação de profiles continua limitada por coluna",
      pattern:
        /grant insert\s*\([\s\S]*?username[\s\S]*?\) on table public\.profiles to authenticated;[\s\S]*?grant update\s*\([\s\S]*?username[\s\S]*?\) on table public\.profiles to authenticated;[\s\S]*?grant delete on table public\.profiles to authenticated/i
    }
  ];

  for (const contract of rlsContracts) {
    if (contract.pattern.test(rlsSql)) {
      pass(contract.name, rlsPrivacyMigrationName);
    } else {
      fail(contract.name, `contrato ausente em ${rlsPrivacyMigrationName}`);
    }
  }

  const unsafeGrantPatterns = [
    /grant\s+all(?:\s+privileges)?\s+on table\s+public\.[a-z_]+\s+to\s+(?:anon|authenticated)/i,
    /grant[^;]*\b(?:truncate|trigger|maintain)\b[^;]*\bto\s+(?:anon|authenticated)/i
  ];

  if (unsafeGrantPatterns.some((pattern) => pattern.test(rlsSql))) {
    fail(
      "migration RLS sem grants administrativos ao cliente",
      "GRANT ALL/TRUNCATE/TRIGGER/MAINTAIN encontrado para anon ou authenticated"
    );
  } else {
    pass(
      "migration RLS sem grants administrativos ao cliente",
      rlsPrivacyMigrationName
    );
  }
}

if (!fs.existsSync(rlsLibraryExecuteMigrationPath)) {
  fail(
    "migration de execução do helper da Biblioteca",
    `${rlsLibraryExecuteMigrationName} ausente`
  );
} else {
  const libraryExecuteSql = fs.readFileSync(
    rlsLibraryExecuteMigrationPath,
    "utf8"
  );

  const libraryExecuteContracts = [
    {
      name: "roles de RLS acessam o schema privado",
      pattern:
        /grant usage on schema historietas_privado\s+to anon, authenticated/i
    },
    {
      name: "roles de RLS executam o helper da Biblioteca",
      pattern:
        /grant execute on function historietas_privado\.usuario_pode_ver_registro_biblioteca\(uuid, text, text\)\s+to anon, authenticated/i
    },
    {
      name: "helper da Biblioteca permanece negado a PUBLIC e service_role",
      pattern:
        /revoke execute on function historietas_privado\.usuario_pode_ver_registro_biblioteca\(uuid, text, text\)\s+from public, service_role/i
    }
  ];

  for (const contract of libraryExecuteContracts) {
    if (contract.pattern.test(libraryExecuteSql)) {
      pass(contract.name, rlsLibraryExecuteMigrationName);
    } else {
      fail(
        contract.name,
        `contrato ausente em ${rlsLibraryExecuteMigrationName}`
      );
    }
  }

  const unsafeLibraryExecuteGrant =
    /grant execute on function historietas_privado\.usuario_pode_ver_registro_biblioteca\(uuid, text, text\)\s+to[^;]*(?:\bpublic\b|\bservice_role\b)/i;

  if (unsafeLibraryExecuteGrant.test(libraryExecuteSql)) {
    fail(
      "helper da Biblioteca sem execução ampla",
      "grant para PUBLIC ou service_role encontrado"
    );
  } else {
    pass(
      "helper da Biblioteca sem execução ampla",
      rlsLibraryExecuteMigrationName
    );
  }
}

const rawSensitiveProfileReads = sourceFiles
  .filter((file) =>
    /\.from\(["']profiles["']\)[\s\S]{0,240}?\.select\([^)]*(?:bio|sobre_bio)/.test(
      file.content
    )
  )
  .map((file) => file.relative);

if (rawSensitiveProfileReads.length) {
  fail(
    "bio não é lida diretamente de profiles",
    rawSensitiveProfileReads.join(", ")
  );
} else {
  pass(
    "bio não é lida diretamente de profiles",
    "consultas sensíveis usam profiles_publicos"
  );
}

const progressCascadePattern =
  /foreign key\s*\(\s*"?capitulo_id"?\s*\)\s*references\s+(?:"?public"?\.)?"?capitulos"?\s*\(\s*"?id"?\s*\)\s*on delete cascade/i;

let progressCascadeMigration = "";

for (const migrationName of migrationFiles) {
  const sql = fs.readFileSync(
    path.join(migrationsDir, migrationName),
    "utf8"
  );

  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  const hasExpectedCascade = statements.some(
    (statement) =>
      /(?:alter table(?: only)?|create table)\s+(?:"?public"?\.)?"?progresso_leitura"?/i.test(
        statement
      ) &&
      progressCascadePattern.test(statement)
  );

  if (hasExpectedCascade) {
    progressCascadeMigration = migrationName;
    break;
  }
}

if (progressCascadeMigration) {
  pass(
    "cascade do progresso de leitura",
    progressCascadeMigration
  );
} else {
  fail(
    "cascade do progresso de leitura",
    "FK progresso_leitura.capitulo_id -> capitulos.id ON DELETE CASCADE não encontrada nas migrations ativas"
  );
}

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(ROOT_DIR, "package.json"),
    "utf8"
  )
);

for (const script of [
  "test:static",
  "test:smoke",
  "test:e2e",
  "test:all"
]) {
  if (packageJson.scripts?.[script]) {
    pass(`script npm ${script}`);
  } else {
    fail(
      `script npm ${script}`,
      "ausente"
    );
  }
}

const migrationCount = migrationFiles.length;

pass(
  "migrações Supabase encontradas",
  String(migrationCount)
);

fs.mkdirSync(
  path.join(QA_DIR, "reports"),
  { recursive: true }
);

fs.writeFileSync(
  path.join(
    ROOT_DIR,
    "qa/reports/static-audit.json"
  ),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      results
    },
    null,
    2
  )
);

for (const item of results) {
  const icon =
    item.status === "PASS" ? "✓" : "✗";

  console.log(
    `${icon} ${item.name}${
      item.details
        ? ` — ${item.details}`
        : ""
    }`
  );
}

const failures = results.filter(
  (item) => item.status === "FAIL"
);

console.log(
  `\n${
    results.length - failures.length
  }/${results.length} verificações aprovadas.`
);

if (failures.length) {
  process.exitCode = 1;
}
