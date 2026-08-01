import type { MetadataRoute } from "next";

const SITE_URL = "https://www.historietas.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/configuracoes",
        "/notificacoes",
        "/painel-autor",
        "/publicar",
        "/editar-obra",
        "/editar-capitulo",
        "/adicionar-capitulo",
        "/redefinir-senha",
        "/login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}