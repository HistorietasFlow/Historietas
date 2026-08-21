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

const rlsPrivacyMigrationName =
  "20260821000100_corrigir_rls_capitulos_privacidade.sql";
const rlsPrivacyMigrationPath = path.join(
  migrationsDir,
  rlsPrivacyMigrationName
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
