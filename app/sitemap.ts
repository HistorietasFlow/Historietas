import type { MetadataRoute } from "next";

const SITE_URL = "https://www.historietas.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: agora,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/explorar`,
      lastModified: agora,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/em-alta`,
      lastModified: agora,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/em-breve`,
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/comunidade`,
      lastModified: agora,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/ajuda`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/termos-de-uso`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politica-de-privacidade`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/excluir-conta`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/diretrizes-da-comunidade`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}