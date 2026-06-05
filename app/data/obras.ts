export type ObraStatus = "Em andamento" | "Pausado" | "Completo";

export type Obra = {
  titulo: string;
  autorId?: string;
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
    genero: "Fantasia",
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
    tags: ["Sobrenatural"],
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
    tags: ["Suspense"],
  },
  {
    titulo: "Night Code",
    autor: "ZeroByte",
    genero: "Ficção",
    classificacaoIndicativa: "12+",
    status: "Pausado",
    views: "6.2K",
    likes: "980",
    comentarios: "156",
    link: "/obra/night-code",
    disponivel: false,
    slug: "night-code",
    formato: "Light Novel",
    sinopse:
      "Em uma metrópole controlada por códigos secretos, um jovem programador encontra uma falha capaz de revelar a verdade por trás do sistema.",
    tags: ["Sci-fi"],
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
    tags: ["Drama"],
  },
  {
    titulo: "Neon Requiem",
    autor: "Aiko Vesper",
    genero: "Ficção",
    classificacaoIndicativa: "14+",
    status: "Em andamento",
    views: "4.8K",
    likes: "720",
    comentarios: "118",
    link: "/obra/neon-requiem",
    disponivel: false,
    slug: "neon-requiem",
    formato: "Webnovel",
    sinopse:
      "Em uma cidade iluminada por neon e dominada por megacorporações, uma hacker descobre uma conspiração capaz de apagar memórias, identidades e destinos.",
    tags: ["Cyberpunk"],
  },
];