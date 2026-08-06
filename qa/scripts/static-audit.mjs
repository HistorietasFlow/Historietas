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

function findLiteralServiceRoleSecrets(file) {
  const findings = [];

  const secretKeyPattern =
    /sb_secret_[A-Za-z0-9._-]{16,}/g;

  if (secretKeyPattern.test(file.content)) {
    findings.push(
      `${file.relative}: chave sb_secret_ literal`
    );
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

const adminModulePaths = new Set(
  sourceFiles
    .filter((file) =>
      /^lib\/supabase\/admin\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(
        file.relative
      )
    )
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

function findAdminImportChain(startPath) {
  const visited = new Set();

  function visit(currentPath, chain) {
    if (adminModulePaths.has(currentPath)) {
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
      /^NEXT_PUBLIC_.*SERVICE_ROLE/.test(
        environmentName
      )
    ) {
      serviceRoleIssues.push(
        `${file.relative}: variável pública perigosa process.env.${environmentName}`
      );
    }

    if (
      isClient &&
      /SERVICE_ROLE/.test(environmentName)
    ) {
      serviceRoleIssues.push(
        `${file.relative}: Client Component acessa process.env.${environmentName}`
      );
    }
  }

  if (isClient) {
    const importChain = findAdminImportChain(file.full);

    if (importChain) {
      serviceRoleIssues.push(
        `${file.relative}: importa módulo administrativo (${importChain.join(
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
    "sem segredo literal, variável pública perigosa ou import administrativo em Client Component"
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

const migration = path.join(
  ROOT_DIR,
  "supabase/migrations/20260801000100_progresso_leitura_capitulo_delete_cascade.sql"
);

if (!fs.existsSync(migration)) {
  fail(
    "migração de cascade do progresso de leitura",
    "arquivo ausente"
  );
} else {
  const sql = fs.readFileSync(migration, "utf8");

  if (
    /foreign key\s*\(capitulo_id\)[\s\S]*on delete cascade/i.test(
      sql
    )
  ) {
    pass(
      "migração de cascade do progresso de leitura"
    );
  } else {
    fail(
      "migração de cascade do progresso de leitura",
      "ON DELETE CASCADE não encontrado"
    );
  }
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

const migrationsDir = path.join(
  ROOT_DIR,
  "supabase/migrations"
);

const migrationCount = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .length;

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
    QA_DIR,
    "reports/static-audit.json"
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