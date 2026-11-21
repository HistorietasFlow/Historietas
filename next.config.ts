import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const allowedDevOrigins: NonNullable<NextConfig["allowedDevOrigins"]> = [
  "192.168.15.5",
  "192.168.15.5:3000",
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const supabaseCoverRemotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const origemHomologacao = "https://rvmsnsltlhlnvbrlyoxh.supabase.co";
const origemProducao = "https://drqqgfxrchnymetmpabd.supabase.co";
const recomendacoesPreview =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "codex/recomendacoes-homologacao" &&
  process.env.HISTORIETAS_RECOMENDACOES_PREVIEW === "1" &&
  (supabaseUrl === origemHomologacao || supabaseUrl === origemHomologacao + "/");
const recomendacoesProducao =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_GIT_COMMIT_REF === "main" &&
  process.env.HISTORIETAS_RECOMENDACOES_PRODUCAO === "1" &&
  (supabaseUrl === origemProducao || supabaseUrl === origemProducao + "/");

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);

    if (url.protocol === "https:") {
      supabaseCoverRemotePatterns.push({
        protocol: "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/capas-obras/**",
      });
    }
  } catch {
    // A aplicação já trata Supabase ausente/inválido no cliente.
  }
}

const nextConfig: NextConfig = {
  env: {
    // O navegador recebe só a origem pública validada durante o build.
    HISTORIETAS_RECOMENDACOES_ORIGEM_PREVIEW: recomendacoesPreview ? origemHomologacao : "",
    HISTORIETAS_RECOMENDACOES_ORIGEM_PRODUCAO: recomendacoesProducao ? origemProducao : "",
  },
  poweredByHeader: false,
  // Inclui o título da obra ou do capítulo no <head> do primeiro documento.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Inclui erros do roteador, métodos não suportados e URLs sem obraId.
        source: "/api/capas-obras/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "Surrogate-Control", value: "no-store" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  images: {
    // O otimizador pode cachear uma resposta interna sem respeitar a autorização
    // por requisição. Somente assets estáticos locais podem passar por ele.
    localPatterns: [
      { pathname: "/icon-192.png", search: "" },
      { pathname: "/icon-512.png", search: "" },
      { pathname: "/maskable-icon-512.png", search: "" },
      { pathname: "/apple-touch-icon.png", search: "" },
    ],
    remotePatterns: supabaseCoverRemotePatterns,
  },
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins }
    : {}),
};

export default withSentryConfig(nextConfig, {
  // Build validation must not send plugin usage/project metadata to Sentry.
  // Runtime error monitoring and production source-map uploads stay configured.
  telemetry: false,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/uploading/bundler-plugin-options/

  org: "historietas",

  project: "historietas",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
