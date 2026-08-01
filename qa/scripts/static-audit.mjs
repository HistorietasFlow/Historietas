import "../env.mjs";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR, QA_DIR } from "../env.mjs";

const results = [];
const pass = (name, details = "") => results.push({ status: "PASS", name, details });
const fail = (name, details = "") => results.push({ status: "FAIL", name, details });

function checkFile(relative) {
  const exists = fs.existsSync(path.join(ROOT_DIR, relative));
  (exists ? pass : fail)(`arquivo ${relative}`, exists ? "presente" : "ausente");
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

const sourceDirs = ["app", "components", "lib"];
let source = "";
for (const dir of sourceDirs) {
  const stack = [path.join(ROOT_DIR, dir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) source += `\n${fs.readFileSync(full, "utf8")}`;
    }
  }
}

if (/SUPABASE_SERVICE_ROLE|service_role/i.test(source)) {
  fail("nenhuma chave service role no código cliente", "referência perigosa encontrada");
} else {
  pass("nenhuma chave service role no código cliente");
}

const publish = fs.readFileSync(path.join(ROOT_DIR, "app/publicar/page.tsx"), "utf8");
const accepted = [".pdf", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
const missingAccepted = accepted.filter((extension) => !publish.includes(extension));
if (missingAccepted.length) fail("formatos de publicação declarados", `faltando: ${missingAccepted.join(", ")}`);
else pass("formatos de publicação declarados", accepted.join(", "));

const editChapter = fs.readFileSync(path.join(ROOT_DIR, "app/editar-capitulo/page.tsx"), "utf8");
const deletionChecks = [
  'from("capitulos")',
  ".delete()",
  '.eq("id", capituloId)',
  '.eq("obra_id", obraId)',
  '.eq("user_id", userId)',
  "window.confirm"
];
const missingDeletion = deletionChecks.filter((snippet) => !editChapter.includes(snippet));
if (missingDeletion.length) fail("exclusão segura de capítulo", `faltando: ${missingDeletion.join(" | ")}`);
else pass("exclusão segura de capítulo", "confirmação + filtros por capítulo, obra e usuário");

const migration = path.join(
  ROOT_DIR,
  "supabase/migrations/20260801000100_progresso_leitura_capitulo_delete_cascade.sql"
);
if (!fs.existsSync(migration)) {
  fail("migração de cascade do progresso de leitura", "arquivo ausente");
} else {
  const sql = fs.readFileSync(migration, "utf8");
  if (/foreign key\s*\(capitulo_id\)[\s\S]*on delete cascade/i.test(sql)) {
    pass("migração de cascade do progresso de leitura");
  } else {
    fail("migração de cascade do progresso de leitura", "ON DELETE CASCADE não encontrado");
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));
for (const script of ["test:static", "test:smoke", "test:e2e", "test:all"]) {
  if (packageJson.scripts?.[script]) pass(`script npm ${script}`);
  else fail(`script npm ${script}`, "ausente");
}

const migrationsDir = path.join(ROOT_DIR, "supabase/migrations");
const migrationCount = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).length;
pass("migrações Supabase encontradas", String(migrationCount));

fs.mkdirSync(path.join(QA_DIR, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(QA_DIR, "reports/static-audit.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)
);

for (const item of results) {
  const icon = item.status === "PASS" ? "✓" : "✗";
  console.log(`${icon} ${item.name}${item.details ? ` — ${item.details}` : ""}`);
}

const failures = results.filter((item) => item.status === "FAIL");
console.log(`\n${results.length - failures.length}/${results.length} verificações aprovadas.`);
if (failures.length) process.exitCode = 1;
