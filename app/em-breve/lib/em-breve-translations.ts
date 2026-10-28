import type { HistorietasLanguage } from "../../../lib/i18n";

type TraducaoEmBreve = {
  en: string;
  es: string;
};

const EM_BREVE_UI_TRANSLATIONS: Record<string, TraducaoEmBreve> = {
  "EM BREVE": { en: "COMING SOON", es: "PRÓXIMAMENTE" },
  "Voltar para a Home": { en: "Back to Home", es: "Volver al inicio" },
  "Notificações": { en: "Notifications", es: "Notificaciones" },
  "AVISO ATIVADO": { en: "ALERT ENABLED", es: "AVISO ACTIVADO" },
  "LANÇAMENTO REAL SEM CONTEÚDO": {
    en: "REAL RELEASE WITHOUT CONTENT",
    es: "LANZAMIENTO REAL SIN CONTENIDO",
  },
  "Você será avisado quando a leitura for liberada.": {
    en: "You will be notified when reading becomes available.",
    es: "Recibirás un aviso cuando la lectura esté disponible.",
  },
  "Esta obra existe, mas ainda não tem capítulo ou arquivo publicado.": {
    en: "This work exists, but it does not have a published chapter or file yet.",
    es: "Esta obra existe, pero todavía no tiene ningún capítulo o archivo publicado.",
  },
  "Salvando...": { en: "Saving...", es: "Guardando..." },
  "✓ Aviso ativo": { en: "✓ Alert enabled", es: "✓ Aviso activo" },
  "Avisar": { en: "Notify me", es: "Avisarme" },
  "Essa obra ainda não está disponível": {
    en: "This work is not available yet",
    es: "Esta obra aún no está disponible",
  },
  "Ainda não há lançamentos em breve": {
    en: "There are no upcoming releases yet",
    es: "Aún no hay próximos lanzamientos",
  },
  "Sobre o aviso": { en: "About the alert", es: "Sobre el aviso" },
  "Entre na sua conta para ativar aviso de lançamento.": {
    en: "Sign in to enable a release alert.",
    es: "Inicia sesión para activar un aviso de lanzamiento.",
  },
  "Não consegui salvar o aviso agora. Tente novamente em instantes.": {
    en: "I could not save the alert right now. Try again in a moment.",
    es: "No pude guardar el aviso ahora. Inténtalo de nuevo en unos instantes.",
  },
  "Não consegui confirmar sua conta agora. Tente novamente.": {
    en: "I could not confirm your account right now. Try again.",
    es: "No pude confirmar tu cuenta ahora. Inténtalo de nuevo.",
  },
  "Obra sem título": { en: "Untitled work", es: "Obra sin título" },
  "Autor não informado": { en: "Author not provided", es: "Autor no informado" },
  "Não informado": { en: "Not provided", es: "No informado" },
  "Original": { en: "Original", es: "Original" },
  "Por": { en: "By", es: "Por" },
  "Romance": { en: "Romance", es: "Romance" },
  "Terror": { en: "Horror", es: "Terror" },
  "Fantasia": { en: "Fantasy", es: "Fantasía" },
  "Ação": { en: "Action", es: "Acción" },
  "Aventura": { en: "Adventure", es: "Aventura" },
  "Comédia": { en: "Comedy", es: "Comedia" },
  "Ficção": { en: "Fiction", es: "Ficción" },
  "Ficção científica": { en: "Science fiction", es: "Ciencia ficción" },
  "Mistério": { en: "Mystery", es: "Misterio" },
  "Suspense": { en: "Thriller", es: "Suspenso" },
  "Sobrenatural": { en: "Supernatural", es: "Sobrenatural" },
  "Drama": { en: "Drama", es: "Drama" },
  "Conto": { en: "Short story", es: "Cuento" },
  "Poesia": { en: "Poetry", es: "Poesía" },
  "Mangá": { en: "Manga", es: "Manga" },
  "HQ": { en: "Comics", es: "Cómic" },
  "Livro": { en: "Book", es: "Libro" },
  "Webnovel": { en: "Web novel", es: "Novela web" },
};

export function traduzirTextoEmBreve(texto: string, idioma: HistorietasLanguage) {
  if (idioma === "pt-BR" || !texto) {
    return texto;
  }

  const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);

  if (!partes) {
    return texto;
  }

  const inicio = partes[1];
  const conteudo = partes[2];
  const fim = partes[3];
  const traducaoExata = EM_BREVE_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  let correspondencia = /^Notificações:\s*(\d+)\s*não lidas$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^Abrir aviso de (.+)$/i.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open the alert for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir el aviso de ${correspondencia[1]}${fim}`;
  }

  return texto;
}
