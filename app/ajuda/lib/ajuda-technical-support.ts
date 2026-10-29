import type { TextoTraduzido } from "./ajuda-content";

export type CategoriaProblemaTecnico =
  | "conta_acesso"
  | "publicacao"
  | "leitura"
  | "comunidade"
  | "diario"
  | "notificacoes"
  | "privacidade"
  | "desempenho"
  | "outro";

export type StatusProblemaTecnico =
  | "aberto"
  | "em_analise"
  | "aguardando_usuario"
  | "resolvido"
  | "fechado";

export type ProblemaTecnicoResumo = {
  id: string;
  categoria: CategoriaProblemaTecnico;
  titulo: string;
  descricao: string;
  paginaUrl: string;
  status: StatusProblemaTecnico;
  prioridade: string;
  observacaoAdmin: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type ProblemaTecnicoRpcRow = {
  problema_id: string | null;
  categoria: string | null;
  titulo: string | null;
  descricao: string | null;
  pagina_url: string | null;
  status: string | null;
  prioridade: string | null;
  observacao_admin: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};


export const CATEGORIAS_PROBLEMA_TECNICO: Array<{
  valor: CategoriaProblemaTecnico;
  rotulo: TextoTraduzido;
}> = [
  {
    valor: "conta_acesso",
    rotulo: { pt: "Conta e acesso", en: "Account and access", es: "Cuenta y acceso" },
  },
  {
    valor: "publicacao",
    rotulo: { pt: "Publicação", en: "Publishing", es: "Publicación" },
  },
  {
    valor: "leitura",
    rotulo: { pt: "Leitura", en: "Reading", es: "Lectura" },
  },
  {
    valor: "comunidade",
    rotulo: { pt: "Comunidade", en: "Community", es: "Comunidad" },
  },
  {
    valor: "diario",
    rotulo: { pt: "Diário", en: "Journal", es: "Diario" },
  },
  {
    valor: "notificacoes",
    rotulo: { pt: "Notificações", en: "Notifications", es: "Notificaciones" },
  },
  {
    valor: "privacidade",
    rotulo: { pt: "Privacidade", en: "Privacy", es: "Privacidad" },
  },
  {
    valor: "desempenho",
    rotulo: { pt: "Lentidão ou travamento", en: "Slow or crashing", es: "Lentitud o bloqueo" },
  },
  {
    valor: "outro",
    rotulo: { pt: "Outro problema", en: "Other problem", es: "Otro problema" },
  },
];
