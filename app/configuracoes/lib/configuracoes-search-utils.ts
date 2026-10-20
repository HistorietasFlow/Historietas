import type { HistorietasLanguage } from "../../../lib/i18n";

export function textoIdioma(
  language: HistorietasLanguage,
  portugues: string,
  ingles: string,
  espanhol: string,
) {
  if (language === "en") {
    return ingles;
  }

  if (language === "es") {
    return espanhol;
  }

  return portugues;
}

export function normalizarTextoBuscaConfiguracoes(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export const ALIASES_BUSCA_CONFIGURACOES: Record<string, string[]> = {
  conta: ["account", "cuenta"],
  nome: ["name", "nombre"],
  exibicao: ["display", "visualizacion"],
  autor: ["author", "autor"],
  usuario: ["user", "usuario"],
  perfil: ["profile", "perfil"],
  arroba: ["handle", "usuario"],
  email: ["email", "correo"],
  contato: ["contact", "contacto"],
  senha: ["password", "contrasena"],
  seguranca: ["security", "seguridad"],
  privacidade: ["privacy", "privacidad"],
  privado: ["private", "privado"],
  bloqueio: ["block", "blocking", "bloqueo"],
  bloqueados: ["blocked users", "usuarios bloqueados"],
  desbloquear: ["unblock", "desbloquear"],
  visibilidade: ["visibility", "visibilidad"],
  publico: ["public", "público"],
  somente: ["only", "solo"],
  pessoas: ["people", "personas"],
  sigo: ["following", "sigo"],
  progresso: ["progress", "progreso"],
  avaliacoes: ["ratings", "reviews", "valoraciones", "resenas"],
  avaliar: ["rate", "rating", "review", "evaluar", "valorar"],
  comentarios: ["comments", "comentarios"],
  seguidores: ["followers", "seguidores"],
  aprovacao: ["approval", "aprobacion"],
  aprovar: ["approve", "aprobar"],
  solicitacoes: ["requests", "solicitudes"],
  salvar: ["save", "guardar"],
  alteracoes: ["changes", "cambios"],
  configuracoes: ["settings", "configuracion"],
  moderacao: ["moderation", "moderacion"],
  comunidade: ["community", "comunidad"],
  obras: ["works", "stories", "obras", "historias"],
  criadas: ["created", "creadas"],
  biblioteca: ["library", "biblioteca"],
  lista: ["list", "lista"],
  favoritas: ["favorites", "favoritas"],
  concluidas: ["completed", "completadas"],
  notificacoes: ["notifications", "notificaciones"],
  avisos: ["alerts", "notices", "avisos"],
  historico: ["history", "historial"],
  leitura: ["reading", "lectura"],
  diario: ["journal", "diario"],
  preferencias: ["preferences", "preferencias"],
  tema: ["theme", "tema"],
  visual: ["appearance", "apariencia"],
  aparencia: ["appearance", "apariencia"],
  idioma: ["language", "idioma"],
  lingua: ["language", "idioma"],
  receber: ["receive", "recibir"],
  dados: ["data", "datos"],
  backup: ["backup", "copia"],
  copiar: ["copy", "copiar"],
  baixar: ["download", "descargar"],
  resumo: ["summary", "resumen"],
  suporte: ["support", "soporte"],
  ajuda: ["help", "ayuda"],
  termos: ["terms", "terminos"],
  politicas: ["policies", "politicas"],
  sobre: ["about", "acerca"],
  versao: ["version", "version"],
  sair: ["sign out", "logout", "cerrar sesion"],
  excluir: ["delete", "remove", "eliminar"],
  apagar: ["delete", "erase", "borrar"],
  permanente: ["permanent", "permanente"],
  login: ["login", "inicio de sesion"],
};
