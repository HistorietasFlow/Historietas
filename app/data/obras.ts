export type ObraStatus = "Em andamento" | "Pausado" | "Completo";

export type Obra = {
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: ObraStatus;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
};

export const obras: Obra[] = [
  {
    titulo: "Shadow Eclipse",
    autor: "Historietas Studio",
    genero: "Fantasia Sombria",
    classificacaoIndicativa: "16+",
    status: "Em andamento",
    views: "12.4K",
    likes: "2.1K",
    comentarios: "384",
    link: "/obra/shadow-eclipse",
    disponivel: true,
    slug: "shadow-eclipse",
    formato: "Webnovel",
    sinopse:
      "Um universo sombrio onde poderes ocultos, mistérios ancestrais e escolhas impossíveis moldam o destino de jovens marcados pela sombra.",
    tags: ["Fantasia", "Mistério", "Sobrenatural", "Lore", "Ação"],
  },
  {
    titulo: "Dark Soul",
    autor: "Kira Moon",
    genero: "Terror",
    classificacaoIndicativa: "16+",
    status: "Em andamento",
    views: "8.7K",
    likes: "1.4K",
    comentarios: "210",
    link: "/obra/dark-soul",
    disponivel: false,
    slug: "dark-soul",
    formato: "Webnovel",
    sinopse:
      "Uma história de terror sobrenatural sobre almas presas, pactos perigosos e segredos enterrados em uma cidade tomada pela escuridão.",
    tags: ["Terror", "Sobrenatural", "Mistério", "Suspense", "Dark"],
  },
  {
    titulo: "Night Code",
    autor: "ZeroByte",
    genero: "Sci-fi",
    classificacaoIndicativa: "12+",
    status: "Pausado",
    views: "6.2K",
    likes: "980",
    comentarios: "156",
    link: "/obra/night-code",
    disponivel: false,
    slug: "night-code",
    formato: "Light novel",
    sinopse:
      "Em uma metrópole controlada por códigos secretos, um jovem programador encontra uma falha capaz de revelar a verdade por trás do sistema.",
    tags: ["Sci-fi", "Tecnologia", "Mistério", "Ação", "Cyberpunk"],
  },
  {
    titulo: "Crimson Love",
    autor: "Mika Haru",
    genero: "Romance",
    classificacaoIndicativa: "14+",
    status: "Completo",
    views: "15.9K",
    likes: "3.8K",
    comentarios: "642",
    link: "/obra/crimson-love",
    disponivel: false,
    slug: "crimson-love",
    formato: "Conto",
    sinopse:
      "Um romance dramático sobre reencontros, promessas quebradas e sentimentos que resistem mesmo depois de anos de distância.",
    tags: ["Romance", "Drama", "Slice of Life", "Emoção", "Completo"],
  },
];