import type { PermissoesAbasPerfil } from "../../lib/historietasPrivacy";
import { LIMITES_BYTES_STORAGE } from "../../lib/storageUploads";
import type {
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
  ComunidadePerfilEstado,
  DiarioPerfilEstado,
  TotaisInteracoesObrasPerfilAutor,
} from "./types";

export const PERMISSOES_ABAS_PERFIL_PADRAO: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: false,
  atividades: false,
};

export const PERMISSOES_ABAS_PERFIL_PROPRIO: PermissoesAbasPerfil = {
  obras: true,
  sobre: true,
  diario: true,
  comunidade: true,
  biblioteca: true,
  atividades: true,
};

export const STORAGE_KEY = "historietas-obras";
export const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos";
export const LIBRARY_FOLLOW_STORAGE_KEY = "historietas-obras-seguidas";
export const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
export const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
export const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
export const AUTHOR_RATINGS_STORAGE_KEY = "historietas-autores-avaliacoes";
export const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";
export const TOP_FIVE_LIKES_STORAGE_KEY = "historietas-top-5-curtidas";
export const TOP_FIVE_MAXIMO = 5;
export const AVATAR_MAX_SIZE = LIMITES_BYTES_STORAGE.avatars;
export const AVATAR_STORAGE_BUCKET = "avatars";
export const BIO_MAX_LENGTH = 90;
export const SOBRE_BIO_MAX_LENGTH = 600;
export const NOTAS_AVALIACAO_AUTOR = [1, 2, 3, 4, 5] as const;

export const diarioPerfilVazio: DiarioPerfilEstado = {
  carregando: false,
  lendoAgora: [],
  queroLer: [],
  favoritas: [],
  concluidas: [],
  avaliacoes: [],
  reviews: [],
  atividades: [],
};

export const avaliacaoAutorVazia: AvaliacaoAutorPublica = {
  media: 0,
  total: 0,
  minhaNota: 0,
  carregado: false,
  salvando: false,
};

export const avaliacaoDiarioVazia: AvaliacaoDiarioPublica = {
  media: 0,
  total: 0,
  minhaNota: 0,
  carregado: false,
  salvando: false,
  visivel: false,
  mostrar: true,
  podeAvaliar: false,
};

export const totaisInteracoesObrasPerfilVazio: TotaisInteracoesObrasPerfilAutor = {
  curtidasPorObra: {},
  comentariosPorObra: {},
  curtidasPorCapitulo: {},
  comentariosPorCapitulo: {},
  salvosPorObra: {},
  salvosPorCapitulo: {},
  concluidasPorObra: {},
};

export const comunidadePerfilVazia: ComunidadePerfilEstado = {
  carregando: false,
  erro: "",
  totalPublicacoes: 0,
  totalTeorias: 0,
  totalReviews: 0,
  publicacoesRecentes: [],
};

export const CAMPOS_REGISTROS_DIARIO_PERFIL_AUTOR = {
  seguindo_obras: "obra_id,visibilidade,criado_em",
  favoritos: "obra_id,visibilidade,criado_em",
  concluidas: "obra_id,visibilidade,criado_em",
  obra_avaliacoes: "obra_id,nota,criado_em,atualizado_em",
  progresso_leitura: "obra_id,capitulo_id,lido,progresso,criado_em,atualizado_em",
  diario_atividades:
    "id,tipo,texto,nota,obra_id,capitulo_id,metadata,visibilidade,criado_em",
} as const;
