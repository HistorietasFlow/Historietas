export type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

export type Obra = {
  id?: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
  capa?: string;
  capaUrl?: string;
  cover?: string;
  imagem?: string;
  capitulos?: CapituloLocal[];
};

export type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: unknown;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

export const OBRAS_CATALOGO_HOME: Obra[] = [];

export const HERO_INICIAL_HOME = {
  titulo: "DESCUBRA NOVAS HISTÓRIAS",
  autor: "HISTORIETAS",
  genero: "Catálogo em formação",
  classificacaoIndicativa: "Leitores",
  sinopse:
    "O HISTORIETAS está formando seu catálogo inicial. Explore obras publicadas, acompanhe autores e publique sua história quando quiser.",
  status: "Catálogo aberto",
  slug: "inicio",
  formato: "Leitura online",
  tags: ["leitura", "autores", "histórias"],
  views: "",
  likes: "",
  comentarios: "",
  disponivel: false,
  link: "/explorar",
} as Obra & { link: string };
