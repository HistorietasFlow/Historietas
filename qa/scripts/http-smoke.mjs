import "../env.mjs";
import fs from "node:fs";
import path from "node:path";
import { QA_DIR } from "../env.mjs";

const baseURL = (process.env.E2E_BASE_URL || "https://www.historietas.com.br").replace(/\/$/, "");
const routes = [
  "/",
  "/explorar",
  "/em-alta",
  "/em-breve",
  "/comunidade",
  "/ajuda",
  "/diretrizes-da-comunidade",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico"
];

async function check(route) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseURL}${route}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
      headers: { "user-agent": "Historietas-QA/1.0" }
    });
    const contentType = response.headers.get("content-type") || "";
    let body = "";
    if (/text|xml|json|html/i.test(contentType)) body = await response.text();

    const problems = [];
    if (response.status >= 500) problems.push(`status ${response.status}`);
    if (
  route === "/robots.txt" &&
  (!/user-agent:/i.test(body) || !/sitemap:/i.test(body))
) {
  problems.push("robots incompleto");
}
    if (route === "/sitemap.xml" && (!body.includes("<urlset") || !body.includes("historietas.com.br"))) {
      problems.push("sitemap inválido");
    }
    if (route === "/" && response.headers.has("x-powered-by")) problems.push("x-powered-by exposto");

    return {
      route,
      finalUrl: response.url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      contentType,
      ok: problems.length === 0,
      problems
    };
  } catch (error) {
    return {
      route,
      status: 0,
      durationMs: Date.now() - startedAt,
      ok: false,
      problems: [error instanceof Error ? error.message : String(error)]
    };
  }
}

const results = [];
for (const route of routes) {
  const result = await check(route);
  results.push(result);
  console.log(`${result.ok ? "✓" : "✗"} ${route} — ${result.status} — ${result.durationMs} ms`);
  for (const problem of result.problems) console.log(`  ${problem}`);
}

fs.mkdirSync(path.join(QA_DIR, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(QA_DIR, "reports/http-smoke.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, results }, null, 2)
);

const failures = results.filter((result) => !result.ok);
console.log(`\n${results.length - failures.length}/${results.length} rotas aprovadas.`);
if (failures.length) process.exitCode = 1;
