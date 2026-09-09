import type { TipoAlvoDenuncia } from "../../components/DenunciaModal";

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
};

export type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

export type ObraLocal = {
  id: string;
  titulo: string;
  autorId: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  slug: string;
  link: string;
};

export type CapituloSalvo = Partial<CapituloLocal> & Record<string, unknown>;

export type ObraSalva = Partial<ObraLocal> & {
  capitulos?: CapituloSalvo[];
} & Record<string, unknown>;

export type AutorPerfil = {
  autorId: string;
  nome: string;
  obras: ObraLocal[];
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  totalPublicadas: number;
};

export type PerfilUsuarioRemoto = {
  userId: string;
  nome: string;
  username: string;
  avatar: string;
  bio: string;
  sobreBio: string;
  criadoEm: string;
};

export type AbaPerfilAutor =
  | "obras"
  | "diario"
  | "comunidade"
  | "sobre"
  | "biblioteca";

export type AbaBibliotecaPerfil =
  | "tudo"
  | "quero-ler"
  | "lendo-agora"
  | "favoritas"
  | "concluidas"
  | "salvos"
  | "historico";

export type PerfilAutorTranslationEntry = {
  en: string;
  es: string;
};

export type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
  sobreBio: string;
  mostrarDestaques: boolean;
};

export type AvaliacaoAutorPublica = {
  media: number;
  total: number;
  minhaNota: number;
  carregado: boolean;
  salvando: boolean;
};

export type AvaliacaoDiarioPublica = AvaliacaoAutorPublica & {
  visivel: boolean;
  mostrar: boolean;
  podeAvaliar: boolean;
};

export type VisibilidadeDiarioPerfil = "publico" | "parcial" | "privado";

export type DiarioPerfilItem = {
  chave: string;
  tipo:
    | "lendo"
    | "quero_ler"
    | "favorita"
    | "concluida"
    | "avaliacao"
    | "review"
    | "atividade";
  titulo: string;
  descricao: string;
  data: string;
  obra: ObraLocal | null;
  href?: string;
  nota?: number;
  progresso?: number;
  visibilidade?: VisibilidadeDiarioPerfil;
};

export type DiarioPerfilEstado = {
  carregando: boolean;
  lendoAgora: DiarioPerfilItem[];
  queroLer: DiarioPerfilItem[];
  favoritas: DiarioPerfilItem[];
  concluidas: DiarioPerfilItem[];
  avaliacoes: DiarioPerfilItem[];
  reviews: DiarioPerfilItem[];
  atividades: DiarioPerfilItem[];
};

export type DiarioPerfilResumoItem = DiarioPerfilItem & {
  tipos: DiarioPerfilItem["tipo"][];
};

export type PublicacaoComunidadePerfil = {
  id: string;
  categoria: string;
  tipoPublicacao: string;
  temSpoiler: boolean;
  texto: string;
  obraRelacionada: string;
  criadoEm: string;
};

export type ComunidadePerfilEstado = {
  carregando: boolean;
  erro: string;
  totalPublicacoes: number;
  totalTeorias: number;
  totalReviews: number;
  publicacoesRecentes: PublicacaoComunidadePerfil[];
};

export type AlvoDenunciaConteudoPerfil = {
  alvoTipo: Extract<TipoAlvoDenuncia, "post" | "obra">;
  alvoId: string;
  alvoTitulo: string;
} | null;

export type ItemBibliotecaPerfil = {
  chave: string;
  obra: ObraLocal;
  capitulo: CapituloLocal | null;
  numeroCapitulo: number;
  tempoAtividade: number;
  tipoDiario: DiarioPerfilItem["tipo"];
  descricao: string;
};

export type TotaisInteracoesObrasPerfilAutor = {
  curtidasPorObra: Record<string, number>;
  comentariosPorObra: Record<string, number>;
  curtidasPorCapitulo: Record<string, number>;
  comentariosPorCapitulo: Record<string, number>;
  salvosPorObra: Record<string, number>;
  salvosPorCapitulo: Record<string, number>;
  concluidasPorObra: Record<string, number>;
};

export type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;
export type SupabaseObraRow = Record<string, unknown>;
export type SupabaseCapituloRow = Record<string, unknown>;
export type TabelaObrasUsuario = "favoritos" | "concluidas" | "seguindo_obras";

export type TabelaRegistrosDiarioPerfil =
  | "seguindo_obras"
  | "favoritos"
  | "concluidas"
  | "obra_avaliacoes"
  | "progresso_leitura"
  | "diario_atividades";

export type DiarioPerfilSemCarregando = Omit<DiarioPerfilEstado, "carregando">;

export type NotificacaoSocialPerfilAutorPayload = {
  receptorId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string;
  notificacaoId: string;
};

export type MenuPerfilIconeTipo =
  | "painel"
  | "notificacoes"
  | "configuracoes"
  | "link"
  | "sair"
  | "comunidade"
  | "denunciar"
  | "bloquear"
  | "explorar";

export type DadosCompartilhamentoPerfilAutor = {
  title?: string;
  text?: string;
  url?: string;
};

export type NavegadorCompartilhamentoPerfilAutor = Navigator & {
  share?: (data: DadosCompartilhamentoPerfilAutor) => Promise<void>;
  canShare?: (data: DadosCompartilhamentoPerfilAutor) => boolean;
};
