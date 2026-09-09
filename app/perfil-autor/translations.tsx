"use client";

import { useEffect } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import type { PerfilAutorTranslationEntry } from "./types";

const PERFIL_AUTOR_UI_TRANSLATIONS: Record<
  string,
  PerfilAutorTranslationEntry
> = {
  "DESCUBRA NOVAS HISTÓRIAS": {
    "en": "DISCOVER NEW STORIES",
    "es": "DESCUBRE NUEVAS HISTORIAS"
  },
  "Catálogo em formação": {
    "en": "Catalog in progress",
    "es": "Catálogo en formación"
  },
  "Leitores": {
    "en": "Readers",
    "es": "Lectores"
  },
  "O HISTORIETAS está formando seu catálogo inicial. Explore obras publicadas, acompanhe autores e publique sua história quando quiser.": {
    "en": "HISTORIETAS is building its first catalog. Explore published works, follow authors, and publish your story whenever you are ready.",
    "es": "HISTORIETAS está formando su catálogo inicial. Explora obras publicadas, sigue a autores y publica tu historia cuando quieras."
  },
  "Catálogo aberto": {
    "en": "Open catalog",
    "es": "Catálogo abierto"
  },
  "Leitura online": {
    "en": "Online reading",
    "es": "Lectura en línea"
  },
  "histórias": {
    "en": "stories",
    "es": "historias"
  },
  "Ficção": {
    "en": "Fiction",
    "es": "Ficción"
  },
  "Não informado": {
    "en": "Not provided",
    "es": "No informado"
  },
  "Não informada": {
    "en": "Not provided",
    "es": "No informada"
  },
  "Nenhuma sinopse informada.": {
    "en": "No synopsis provided.",
    "es": "No se proporcionó una sinopsis."
  },
  "Em andamento": {
    "en": "Ongoing",
    "es": "En curso"
  },
  "Publicado": {
    "en": "Published",
    "es": "Publicado"
  },
  "História": {
    "en": "Story",
    "es": "Historia"
  },
  "Autor não informado": {
    "en": "Author not provided",
    "es": "Autor no informado"
  },
  "Capítulo sem título": {
    "en": "Untitled chapter",
    "es": "Capítulo sin título"
  },
  "Obra sem título": {
    "en": "Untitled work",
    "es": "Obra sin título"
  },
  "sem tags": {
    "en": "no tags",
    "es": "sin etiquetas"
  },
  "Arquivo da obra": {
    "en": "Work file",
    "es": "Archivo de la obra"
  },
  "Carregando": {
    "en": "Loading",
    "es": "Cargando"
  },
  "Carregando página inicial": {
    "en": "Loading home page",
    "es": "Cargando la página de inicio"
  },
  "Buscar...": {
    "en": "Search...",
    "es": "Buscar..."
  },
  "Configurações": {
    "en": "Settings",
    "es": "Configuración"
  },
  "Notificações": {
    "en": "Notifications",
    "es": "Notificaciones"
  },
  "Abrir busca": {
    "en": "Open search",
    "es": "Abrir búsqueda"
  },
  "Fechar busca": {
    "en": "Close search",
    "es": "Cerrar búsqueda"
  },
  "Navegação principal": {
    "en": "Main navigation",
    "es": "Navegación principal"
  },
  "Início": {
    "en": "Home",
    "es": "Inicio"
  },
  "Explorar": {
    "en": "Explore",
    "es": "Explorar"
  },
  "Em Alta": {
    "en": "Trending",
    "es": "Tendencias"
  },
  "Minhas Obras": {
    "en": "My Works",
    "es": "Mis obras"
  },
  "Biblioteca": {
    "en": "Library",
    "es": "Biblioteca"
  },
  "Seguindo": {
    "en": "Following",
    "es": "Siguiendo"
  },
  "Painel do Autor": {
    "en": "Author Dashboard",
    "es": "Panel del Autor"
  },
  "Buscar obras, autor, gênero...": {
    "en": "Search works, authors, genres...",
    "es": "Buscar obras, autores, géneros..."
  },
  "Publicar obra": {
    "en": "Publish work",
    "es": "Publicar obra"
  },
  "Explorar obras": {
    "en": "Explore works",
    "es": "Explorar obras"
  },
  "Ver obra": {
    "en": "View work",
    "es": "Ver obra"
  },
  "Salvar": {
    "en": "Save",
    "es": "Guardar"
  },
  "Salvo": {
    "en": "Saved",
    "es": "Guardado"
  },
  "Obras em destaque": {
    "en": "Featured works",
    "es": "Obras destacadas"
  },
  "Atalhos principais": {
    "en": "Main shortcuts",
    "es": "Accesos principales"
  },
  "Em breve": {
    "en": "Coming soon",
    "es": "Próximamente"
  },
  "Continuar lendo": {
    "en": "Continue reading",
    "es": "Continuar leyendo"
  },
  "Continue do ponto em que parou.": {
    "en": "Pick up where you left off.",
    "es": "Continúa desde donde lo dejaste."
  },
  "Minha lista": {
    "en": "My list",
    "es": "Mi lista"
  },
  "Autores para conhecer": {
    "en": "Authors to discover",
    "es": "Autores por descubrir"
  },
  "Perfis que dão vida ao catálogo.": {
    "en": "Profiles that bring the catalog to life.",
    "es": "Perfiles que dan vida al catálogo."
  },
  "Recomendações para você": {
    "en": "Recommendations for you",
    "es": "Recomendaciones para ti"
  },
  "Obras parecidas com o que você lê ou salvou.": {
    "en": "Works similar to what you read or saved.",
    "es": "Obras parecidas a las que lees o guardaste."
  },
  "Sugestões para começar sua próxima leitura.": {
    "en": "Suggestions for your next read.",
    "es": "Sugerencias para comenzar tu próxima lectura."
  },
  "Publicações recentes": {
    "en": "Recent publications",
    "es": "Publicaciones recientes"
  },
  "obra publicada": {
    "en": "published work",
    "es": "obra publicada"
  },
  "obras publicadas": {
    "en": "published works",
    "es": "obras publicadas"
  },
  "Novos capítulos": {
    "en": "New chapters",
    "es": "Nuevos capítulos"
  },
  "Capítulos novos para acompanhar sem perder o ritmo.": {
    "en": "New chapters to follow without missing a beat.",
    "es": "Nuevos capítulos para seguir sin perder el ritmo."
  },
  "Mais curtidas": {
    "en": "Most liked",
    "es": "Más gustadas"
  },
  "Na lista da comunidade nesta fase.": {
    "en": "Popular with the community right now.",
    "es": "Populares en la comunidad en este momento."
  },
  "Mais comentadas": {
    "en": "Most commented",
    "es": "Más comentadas"
  },
  "Histórias que estão puxando conversa.": {
    "en": "Stories sparking conversations.",
    "es": "Historias que están generando conversación."
  },
  "Extras e arquivos": {
    "en": "Extras and files",
    "es": "Extras y archivos"
  },
  "Histórias com material extra para abrir depois.": {
    "en": "Stories with extra material to open later.",
    "es": "Historias con material extra para abrir después."
  },
  "Para ler agora": {
    "en": "Read now",
    "es": "Para leer ahora"
  },
  "Obras curtas para entrar rápido no universo.": {
    "en": "Short works that pull you into the story quickly.",
    "es": "Obras cortas para entrar rápidamente en el universo."
  },
  "Catálogo": {
    "en": "Catalog",
    "es": "Catálogo"
  },
  "Obras reais publicadas na plataforma.": {
    "en": "Real works published on the platform.",
    "es": "Obras reales publicadas en la plataforma."
  },
  "Fantasia e poderes": {
    "en": "Fantasy and powers",
    "es": "Fantasía y poderes"
  },
  "Mundos, poderes e mistérios para explorar.": {
    "en": "Worlds, powers, and mysteries to explore.",
    "es": "Mundos, poderes y misterios por explorar."
  },
  "Terror e suspense": {
    "en": "Horror and suspense",
    "es": "Terror y suspenso"
  },
  "Atmosfera sombria, tensão e mistério.": {
    "en": "Dark atmosphere, tension, and mystery.",
    "es": "Atmósfera oscura, tensión y misterio."
  },
  "Romance e drama": {
    "en": "Romance and drama",
    "es": "Romance y drama"
  },
  "Relações intensas e escolhas difíceis.": {
    "en": "Intense relationships and difficult choices.",
    "es": "Relaciones intensas y decisiones difíciles."
  },
  "Ação e rivalidades": {
    "en": "Action and rivalries",
    "es": "Acción y rivalidades"
  },
  "Conflitos, disputas e personagens intensos.": {
    "en": "Conflicts, rivalries, and intense characters.",
    "es": "Conflictos, rivalidades y personajes intensos."
  },
  "Sci-fi e códigos": {
    "en": "Sci-fi and code",
    "es": "Ciencia ficción y código"
  },
  "Futuro, sistemas e universos alternativos.": {
    "en": "The future, systems, and alternate universes.",
    "es": "Futuro, sistemas y universos alternativos."
  },
  "Em breve na Historietas": {
    "en": "Coming soon to Historietas",
    "es": "Próximamente en Historietas"
  },
  "Obras chegando ao catálogo em breve.": {
    "en": "Works coming to the catalog soon.",
    "es": "Obras que llegarán pronto al catálogo."
  },
  "Obras reais disponíveis para leitura.": {
    "en": "Real works available to read.",
    "es": "Obras reales disponibles para leer."
  },
  "Continuar": {
    "en": "Continue",
    "es": "Continuar"
  },
  "Ler agora": {
    "en": "Read now",
    "es": "Leer ahora"
  },
  "Leitura": {
    "en": "Reading",
    "es": "Lectura"
  },
  "Por": {
    "en": "By",
    "es": "Por"
  },
  "Novo cap": {
    "en": "New ch.",
    "es": "Cap. nuevo"
  },
  "% lido": {
    "en": "% read",
    "es": "% leído"
  },
  "Ver perfil": {
    "en": "View profile",
    "es": "Ver perfil"
  },
  "Autor ainda sem avaliações": {
    "en": "Author has no ratings yet",
    "es": "El autor aún no tiene valoraciones"
  },
  "avaliação": {
    "en": "rating",
    "es": "valoración"
  },
  "avaliações": {
    "en": "ratings",
    "es": "valoraciones"
  },
  "Ver detalhes": {
    "en": "View details",
    "es": "Ver detalles"
  },
  "Nenhuma obra cadastrada": {
    "en": "No works available",
    "es": "No hay obras registradas"
  },
  "Nenhuma obra encontrada": {
    "en": "No works found",
    "es": "No se encontraron obras"
  },
  "Rolar carrossel para a esquerda": {
    "en": "Scroll carousel left",
    "es": "Desplazar el carrusel a la izquierda"
  },
  "Rolar carrossel para a direita": {
    "en": "Scroll carousel right",
    "es": "Desplazar el carrusel a la derecha"
  },
  "Entre na sua conta para salvar obras na sua lista.": {
    "en": "Sign in to save works to your list.",
    "es": "Inicia sesión para guardar obras en tu lista."
  },
  "A obra ficou salva no aparelho, mas não sincronizou agora.": {
    "en": "The work was saved on this device, but it could not sync right now.",
    "es": "La obra se guardó en este dispositivo, pero no pudo sincronizarse ahora."
  },
  "Carregando Explorar": {
    "en": "Loading Explore",
    "es": "Cargando Explorar"
  },
  "Abrir funções do Explorar": {
    "en": "Open Explore options",
    "es": "Abrir opciones de Explorar"
  },
  "Buscar autores...": {
    "en": "Search authors...",
    "es": "Buscar autores..."
  },
  "Buscar histórias...": {
    "en": "Search stories...",
    "es": "Buscar historias..."
  },
  "Categorias": {
    "en": "Categories",
    "es": "Categorías"
  },
  "Tudo": {
    "en": "All",
    "es": "Todo"
  },
  "Autores": {
    "en": "Authors",
    "es": "Autores"
  },
  "EXPLORAR": {
    "en": "EXPLORE",
    "es": "EXPLORAR"
  },
  "Mostrar": {
    "en": "Show",
    "es": "Mostrar"
  },
  "Todas": {
    "en": "All",
    "es": "Todas"
  },
  "Lendo agora": {
    "en": "Reading now",
    "es": "Leyendo ahora"
  },
  "Na lista": {
    "en": "In list",
    "es": "En la lista"
  },
  "Concluídas": {
    "en": "Completed",
    "es": "Completadas"
  },
  "Sem leitura": {
    "en": "Not started",
    "es": "Sin comenzar"
  },
  "Ordenar": {
    "en": "Sort",
    "es": "Ordenar"
  },
  "Relevância": {
    "en": "Relevance",
    "es": "Relevancia"
  },
  "Mais recentes": {
    "en": "Most recent",
    "es": "Más recientes"
  },
  "Limpar filtros": {
    "en": "Clear filters",
    "es": "Limpiar filtros"
  },
  "Entre na sua conta para usar filtros pessoais.": {
    "en": "Sign in to use personal filters.",
    "es": "Inicia sesión para usar filtros personales."
  },
  "Autores em destaque": {
    "en": "Featured authors",
    "es": "Autores destacados"
  },
  "Mais bem avaliados": {
    "en": "Top rated",
    "es": "Mejor valorados"
  },
  "Resultados da busca": {
    "en": "Search results",
    "es": "Resultados de búsqueda"
  },
  "Autores encontrados": {
    "en": "Authors found",
    "es": "Autores encontrados"
  },
  "Nenhum autor encontrado": {
    "en": "No author found",
    "es": "No se encontró ningún autor"
  },
  "PUBLIQUE SUA HISTÓRIA": {
    "en": "PUBLISH YOUR STORY",
    "es": "PUBLICA TU HISTORIA"
  },
  "Rascunho": {
    "en": "Draft",
    "es": "Borrador"
  },
  "Ação do começo ao fim": {
    "en": "Nonstop action",
    "es": "Acción de principio a fin"
  },
  "Aventuras sem limites": {
    "en": "Limitless adventures",
    "es": "Aventuras sin límites"
  },
  "Para rir agora": {
    "en": "A good laugh",
    "es": "Para reír ahora"
  },
  "Histórias que deixam marcas": {
    "en": "Stories that leave a mark",
    "es": "Historias que dejan huella"
  },
  "Mundos além da imaginação": {
    "en": "Worlds beyond imagination",
    "es": "Mundos más allá de la imaginación"
  },
  "Além do que é possível": {
    "en": "Beyond what is possible",
    "es": "Más allá de lo posible"
  },
  "Mistérios para desvendar": {
    "en": "Mysteries to uncover",
    "es": "Misterios por descubrir"
  },
  "Amores que deixam marcas": {
    "en": "Love stories that leave a mark",
    "es": "Amores que dejan huella"
  },
  "Tensão até a última página": {
    "en": "Tension to the final page",
    "es": "Tensión hasta la última página"
  },
  "Histórias para perder o sono": {
    "en": "Stories that will keep you awake",
    "es": "Historias para perder el sueño"
  },
  "Entre este mundo e o outro": {
    "en": "Between this world and the next",
    "es": "Entre este mundo y el otro"
  },
  "Viagens por outros tempos": {
    "en": "Journeys through other times",
    "es": "Viajes por otros tiempos"
  },
  "Vidas que merecem ser contadas": {
    "en": "Lives worth telling",
    "es": "Vidas que merecen ser contadas"
  },
  "Descobertas fora do comum": {
    "en": "Unusual discoveries",
    "es": "Descubrimientos fuera de lo común"
  },
  "Histórias para descobrir": {
    "en": "Stories to discover",
    "es": "Historias por descubrir"
  },
  "Autores que aceleram o coração": {
    "en": "Authors who make your heart race",
    "es": "Autores que aceleran el corazón"
  },
  "Autores de grandes jornadas": {
    "en": "Authors of great journeys",
    "es": "Autores de grandes viajes"
  },
  "Autores para arrancar risadas": {
    "en": "Authors who make you laugh",
    "es": "Autores que provocan risas"
  },
  "Autores que tocam fundo": {
    "en": "Authors who move you deeply",
    "es": "Autores que llegan al corazón"
  },
  "Criadores de mundos impossíveis": {
    "en": "Creators of impossible worlds",
    "es": "Creadores de mundos imposibles"
  },
  "Autores que enxergam além": {
    "en": "Authors who see beyond",
    "es": "Autores que ven más allá"
  },
  "Mestres dos enigmas": {
    "en": "Masters of mysteries",
    "es": "Maestros de los enigmas"
  },
  "Autores que escrevem sentimentos": {
    "en": "Authors who write emotions",
    "es": "Autores que escriben sentimientos"
  },
  "Mestres da tensão": {
    "en": "Masters of tension",
    "es": "Maestros de la tensión"
  },
  "Autores que dominam o medo": {
    "en": "Authors who master fear",
    "es": "Autores que dominan el miedo"
  },
  "Vozes do desconhecido": {
    "en": "Voices of the unknown",
    "es": "Voces de lo desconocido"
  },
  "Autores que revivem o passado": {
    "en": "Authors who bring the past to life",
    "es": "Autores que reviven el pasado"
  },
  "Autores de vidas reais": {
    "en": "Authors of real lives",
    "es": "Autores de vidas reales"
  },
  "Novas vozes para descobrir": {
    "en": "New voices to discover",
    "es": "Nuevas voces por descubrir"
  },
  "Autores para descobrir": {
    "en": "Authors to discover",
    "es": "Autores por descubrir"
  },
  "Geral": {
    "en": "General",
    "es": "General"
  },
  "Divulgação": {
    "en": "Promotion",
    "es": "Promoción"
  },
  "Recomendações": {
    "en": "Recommendations",
    "es": "Recomendaciones"
  },
  "Discussão": {
    "en": "Discussion",
    "es": "Discusión"
  },
  "Dúvidas": {
    "en": "Questions",
    "es": "Dudas"
  },
  "Teoria": {
    "en": "Theory",
    "es": "Teoría"
  },
  "Enquete": {
    "en": "Poll",
    "es": "Encuesta"
  },
  "Pedido de indicação": {
    "en": "Recommendation request",
    "es": "Solicitud de recomendación"
  },
  "Review": {
    "en": "Review",
    "es": "Reseña"
  },
  "Aviso de capítulo": {
    "en": "Chapter update",
    "es": "Aviso de capítulo"
  },
  "Dúvida": {
    "en": "Question",
    "es": "Duda"
  },
  "Recentes": {
    "en": "Recent",
    "es": "Recientes"
  },
  "Em alta": {
    "en": "Trending",
    "es": "Tendencias"
  },
  "Todos": {
    "en": "All",
    "es": "Todos"
  },
  "Primeiros leitores": {
    "en": "First readers",
    "es": "Primeros lectores"
  },
  "Que tipo de história você quer encontrar no HISTORIETAS?": {
    "en": "What kind of story do you want to find on HISTORIETAS?",
    "es": "¿Qué tipo de historia quieres encontrar en HISTORIETAS?"
  },
  "Enquete: qual opção você escolheria?\nOpção 1:\nOpção 2:": {
    "en": "Poll: which option would you choose?\nOption 1:\nOption 2:",
    "es": "Encuesta: ¿qué opción elegirías?\nOpción 1:\nOpción 2:"
  },
  "Usuário": {
    "en": "User",
    "es": "Usuario"
  },
  "Agora": {
    "en": "Now",
    "es": "Ahora"
  },
  "agora": {
    "en": "now",
    "es": "ahora"
  },
  "Enquete da comunidade": {
    "en": "Community poll",
    "es": "Encuesta de la comunidad"
  },
  "Responder": {
    "en": "Reply",
    "es": "Responder"
  },
  "Removendo...": {
    "en": "Removing...",
    "es": "Eliminando..."
  },
  "Remover": {
    "en": "Remove",
    "es": "Eliminar"
  },
  "Enviando...": {
    "en": "Sending...",
    "es": "Enviando..."
  },
  "Denunciar": {
    "en": "Report",
    "es": "Denunciar"
  },
  "Denunciar publicação": {
    "en": "Report post",
    "es": "Denunciar publicación"
  },
  "Denunciar obra": {
    "en": "Report work",
    "es": "Denunciar obra"
  },
  "Não foi possível identificar este conteúdo.": {
    "en": "This content could not be identified.",
    "es": "No se pudo identificar este contenido."
  },
  "Remover curtida do comentário": {
    "en": "Unlike comment",
    "es": "Quitar Me gusta del comentario"
  },
  "Curtir comentário": {
    "en": "Like comment",
    "es": "Me gusta en el comentario"
  },
  "Comentários": {
    "en": "Comments",
    "es": "Comentarios"
  },
  "Fechar comentários": {
    "en": "Close comments",
    "es": "Cerrar comentarios"
  },
  "Recolher comentários": {
    "en": "Collapse comments",
    "es": "Contraer comentarios"
  },
  "Expandir comentários": {
    "en": "Expand comments",
    "es": "Expandir comentarios"
  },
  "Ordenar comentários": {
    "en": "Sort comments",
    "es": "Ordenar comentarios"
  },
  "Relevantes": {
    "en": "Relevant",
    "es": "Relevantes"
  },
  "Ocultar respostas": {
    "en": "Hide replies",
    "es": "Ocultar respuestas"
  },
  "Sem comentários ainda": {
    "en": "No comments yet",
    "es": "Aún no hay comentarios"
  },
  "Adicionar comentário...": {
    "en": "Add a comment...",
    "es": "Añadir un comentario..."
  },
  "Entre para comentar.": {
    "en": "Sign in to comment.",
    "es": "Inicia sesión para comentar."
  },
  "Adicionar menção": {
    "en": "Add mention",
    "es": "Añadir mención"
  },
  "Enviar comentário": {
    "en": "Send comment",
    "es": "Enviar comentario"
  },
  "Carregando Comunidade": {
    "en": "Loading Community",
    "es": "Cargando Comunidad"
  },
  "Comunidade": {
    "en": "Community",
    "es": "Comunidad"
  },
  "Você já votou nesta enquete.": {
    "en": "You have already voted in this poll.",
    "es": "Ya votaste en esta encuesta."
  },
  "Erro ao votar na enquete": {
    "en": "Error voting in the poll",
    "es": "Error al votar en la encuesta"
  },
  "Voto registrado.": {
    "en": "Vote recorded.",
    "es": "Voto registrado."
  },
  "Publicação removida dos salvos.": {
    "en": "Post removed from saved items.",
    "es": "Publicación eliminada de guardados."
  },
  "Publicação salva.": {
    "en": "Post saved.",
    "es": "Publicación guardada."
  },
  "Publicação salva neste navegador.": {
    "en": "Post saved in this browser.",
    "es": "Publicación guardada en este navegador."
  },
  "Compartilhamento da publicação aberto.": {
    "en": "Post sharing opened.",
    "es": "Se abrió la opción para compartir la publicación."
  },
  "Link da publicação copiado.": {
    "en": "Post link copied.",
    "es": "Enlace de la publicación copiado."
  },
  "Não consegui compartilhar nem copiar o link da publicação neste navegador.": {
    "en": "I couldn't share or copy the post link in this browser.",
    "es": "No se pudo compartir ni copiar el enlace de la publicación en este navegador."
  },
  "Erro ao carregar Comunidade": {
    "en": "Error loading Community",
    "es": "Error al cargar Comunidad"
  },
  "Entre na sua conta para participar da Comunidade.": {
    "en": "Sign in to participate in the Community.",
    "es": "Inicia sesión para participar en la Comunidad."
  },
  "Não foi possível atualizar este usuário agora.": {
    "en": "This user could not be updated right now.",
    "es": "No se pudo actualizar este usuario ahora."
  },
  "Escreva uma publicação com pelo menos 8 caracteres.": {
    "en": "Write a post with at least 8 characters.",
    "es": "Escribe una publicación de al menos 8 caracteres."
  },
  "Escreva a pergunta da enquete na primeira linha.": {
    "en": "Write the poll question on the first line.",
    "es": "Escribe la pregunta de la encuesta en la primera línea."
  },
  "A enquete precisa ter pelo menos 2 opções preenchidas.": {
    "en": "The poll must have at least 2 completed options.",
    "es": "La encuesta debe tener al menos 2 opciones completas."
  },
  "A enquete pode ter no máximo 4 opções.": {
    "en": "The poll can have at most 4 options.",
    "es": "La encuesta puede tener como máximo 4 opciones."
  },
  "Erro ao publicar": {
    "en": "Error publishing",
    "es": "Error al publicar"
  },
  "Erro ao publicar: o Supabase não retornou a publicação criada.": {
    "en": "Error publishing: Supabase did not return the created post.",
    "es": "Error al publicar: Supabase no devolvió la publicación creada."
  },
  "Publicação enviada para a Comunidade.": {
    "en": "Post published in the Community.",
    "es": "Publicación enviada a la Comunidad."
  },
  "Erro ao atualizar curtida": {
    "en": "Error updating like",
    "es": "Error al actualizar Me gusta"
  },
  "Erro ao curtir": {
    "en": "Error liking the post",
    "es": "Error al marcar Me gusta"
  },
  "Nova curtida na Comunidade": {
    "en": "New like in the Community",
    "es": "Nuevo Me gusta en la Comunidad"
  },
  "Curtida removida.": {
    "en": "Like removed.",
    "es": "Me gusta eliminado."
  },
  "Publicação curtida.": {
    "en": "Post liked.",
    "es": "Publicación marcada con Me gusta."
  },
  "Escreva um comentário antes de enviar.": {
    "en": "Write a comment before sending.",
    "es": "Escribe un comentario antes de enviarlo."
  },
  "O comentário respondido não foi encontrado.": {
    "en": "The comment you replied to was not found.",
    "es": "No se encontró el comentario respondido."
  },
  "Erro ao comentar": {
    "en": "Error commenting",
    "es": "Error al comentar"
  },
  "Erro ao comentar: o Supabase não retornou o comentário criado.": {
    "en": "Error commenting: Supabase did not return the created comment.",
    "es": "Error al comentar: Supabase no devolvió el comentario creado."
  },
  "Novo comentário na Comunidade": {
    "en": "New comment in the Community",
    "es": "Nuevo comentario en la Comunidad"
  },
  "Comentário enviado.": {
    "en": "Comment sent.",
    "es": "Comentario enviado."
  },
  "Conteúdo inadequado": {
    "en": "Inappropriate content",
    "es": "Contenido inapropiado"
  },
  "Você já denunciou este conteúdo.": {
    "en": "You have already reported this content.",
    "es": "Ya denunciaste este contenido."
  },
  "Erro ao denunciar": {
    "en": "Error reporting",
    "es": "Error al denunciar"
  },
  "Denúncia enviada para análise.": {
    "en": "Report sent for review.",
    "es": "Denuncia enviada para revisión."
  },
  "Você só pode remover seus próprios comentários.": {
    "en": "You can only remove your own comments.",
    "es": "Solo puedes eliminar tus propios comentarios."
  },
  "Remover este comentário?": {
    "en": "Remove this comment?",
    "es": "¿Eliminar este comentario?"
  },
  "Erro ao remover comentário": {
    "en": "Error removing comment",
    "es": "Error al eliminar el comentario"
  },
  "Comentário removido.": {
    "en": "Comment removed.",
    "es": "Comentario eliminado."
  },
  "Erro ao atualizar curtida do comentário": {
    "en": "Error updating the comment like",
    "es": "Error al actualizar el Me gusta del comentario"
  },
  "Erro ao curtir comentário": {
    "en": "Error liking the comment",
    "es": "Error al marcar Me gusta en el comentario"
  },
  "Nova curtida no seu comentário": {
    "en": "New like on your comment",
    "es": "Nuevo Me gusta en tu comentario"
  },
  "Curtida do comentário removida.": {
    "en": "Comment like removed.",
    "es": "Me gusta del comentario eliminado."
  },
  "Comentário curtido.": {
    "en": "Comment liked.",
    "es": "Comentario marcado con Me gusta."
  },
  "Apenas administradores podem fixar publicações.": {
    "en": "Only administrators can pin posts.",
    "es": "Solo los administradores pueden fijar publicaciones."
  },
  "Erro ao atualizar fixado": {
    "en": "Error updating pinned status",
    "es": "Error al actualizar el estado fijado"
  },
  "Publicação fixada no topo.": {
    "en": "Post pinned to the top.",
    "es": "Publicación fijada arriba."
  },
  "Publicação desafixada.": {
    "en": "Post unpinned.",
    "es": "Publicación desfijada."
  },
  "Remover esta publicação?": {
    "en": "Remove this post?",
    "es": "¿Eliminar esta publicación?"
  },
  "Erro ao remover publicação": {
    "en": "Error removing post",
    "es": "Error al eliminar la publicación"
  },
  "Publicação removida.": {
    "en": "Post removed.",
    "es": "Publicación eliminada."
  },
  "Abrir filtros, ordenação e ações da comunidade": {
    "en": "Open Community filters, sorting, and actions",
    "es": "Abrir filtros, orden y acciones de la comunidad"
  },
  "Buscar publicações ou usuários": {
    "en": "Search posts or users",
    "es": "Buscar publicaciones o usuarios"
  },
  "Filtros, ordenação e ações da comunidade": {
    "en": "Community filters, sorting, and actions",
    "es": "Filtros, orden y acciones de la comunidad"
  },
  "Fechar filtros e ações da comunidade": {
    "en": "Close Community filters and actions",
    "es": "Cerrar filtros y acciones de la comunidad"
  },
  "Filtrar e ordenar": {
    "en": "Filter and sort",
    "es": "Filtrar y ordenar"
  },
  "Ações": {
    "en": "Actions",
    "es": "Acciones"
  },
  "Publicar": {
    "en": "Post",
    "es": "Publicar"
  },
  "Pedir recomendações": {
    "en": "Ask for recommendations",
    "es": "Pedir recomendaciones"
  },
  "Posts salvos": {
    "en": "Saved posts",
    "es": "Publicaciones guardadas"
  },
  "Usuários encontrados": {
    "en": "Users found",
    "es": "Usuarios encontrados"
  },
  "Usuários": {
    "en": "Users",
    "es": "Usuarios"
  },
  "Buscando...": {
    "en": "Searching...",
    "es": "Buscando..."
  },
  "Digite pelo menos 2 caracteres para encontrar usuários.": {
    "en": "Enter at least 2 characters to find users.",
    "es": "Escribe al menos 2 caracteres para encontrar usuarios."
  },
  "Buscando usuários": {
    "en": "Searching for users",
    "es": "Buscando usuarios"
  },
  "Perfil da comunidade": {
    "en": "Community profile",
    "es": "Perfil de la comunidad"
  },
  "Você": {
    "en": "You",
    "es": "Tú"
  },
  "Seguir": {
    "en": "Follow",
    "es": "Seguir"
  },
  "Solicitado": {
    "en": "Requested",
    "es": "Solicitado"
  },
  "Cancelar solicitação": {
    "en": "Cancel request",
    "es": "Cancelar solicitud"
  },
  "Perfil privado": {
    "en": "Private profile",
    "es": "Perfil privado"
  },
  "Conteúdo privado": {
    "en": "Private content",
    "es": "Contenido privado"
  },
  "Siga este perfil para ver as seções que o autor escolheu manter privadas.": {
    "en": "Follow this profile to view the sections the author chose to keep private.",
    "es": "Sigue este perfil para ver las secciones que el autor decidió mantener privadas."
  },
  "Este autor manteve todas as seções do perfil privadas.": {
    "en": "This author has kept all profile sections private.",
    "es": "Este autor mantuvo privadas todas las secciones del perfil."
  },
  "Apenas seguidores aprovados podem ver o Diário, a comunidade, a biblioteca e as atividades deste perfil.": {
    "en": "Only approved followers can view this profile's Journal, community, library and activity.",
    "es": "Solo los seguidores aprobados pueden ver el Diario, la comunidad, la biblioteca y la actividad de este perfil."
  },
  "Nenhum usuário encontrado.": {
    "en": "No users found.",
    "es": "No se encontraron usuarios."
  },
  "Publicações": {
    "en": "Posts",
    "es": "Publicaciones"
  },
  "Abrir opções da publicação": {
    "en": "Open post options",
    "es": "Abrir opciones de la publicación"
  },
  "Ações da publicação": {
    "en": "Post actions",
    "es": "Acciones de la publicación"
  },
  "Fechar ações da publicação": {
    "en": "Close post actions",
    "es": "Cerrar acciones de la publicación"
  },
  "Salvando...": {
    "en": "Saving...",
    "es": "Guardando..."
  },
  "Remover dos salvos": {
    "en": "Remove from saved",
    "es": "Eliminar de guardados"
  },
  "Salvar publicação": {
    "en": "Save post",
    "es": "Guardar publicación"
  },
  "Compartilhando...": {
    "en": "Sharing...",
    "es": "Compartiendo..."
  },
  "Compartilhar": {
    "en": "Share",
    "es": "Compartir"
  },
  "Atualizando...": {
    "en": "Updating...",
    "es": "Actualizando..."
  },
  "Desfixar publicação": {
    "en": "Unpin post",
    "es": "Desfijar publicación"
  },
  "Fixar publicação": {
    "en": "Pin post",
    "es": "Fijar publicación"
  },
  "Remover publicação": {
    "en": "Remove post",
    "es": "Eliminar publicación"
  },
  "Fixado": {
    "en": "Pinned",
    "es": "Fijado"
  },
  "Conteúdo com spoiler oculto": {
    "en": "Spoiler content hidden",
    "es": "Contenido con spoiler oculto"
  },
  "Votar": {
    "en": "Vote",
    "es": "Votar"
  },
  "Remover curtida da publicação": {
    "en": "Unlike post",
    "es": "Quitar Me gusta de la publicación"
  },
  "Curtir publicação": {
    "en": "Like post",
    "es": "Me gusta en la publicación"
  },
  "REVELAR": {
    "en": "REVEAL",
    "es": "MOSTRAR"
  },
  "OCULTAR": {
    "en": "HIDE",
    "es": "OCULTAR"
  },
  "Nenhuma publicação salva": {
    "en": "No saved posts",
    "es": "No hay publicaciones guardadas"
  },
  "Nenhuma publicação encontrada": {
    "en": "No posts found",
    "es": "No se encontraron publicaciones"
  },
  "Nenhuma publicação ainda": {
    "en": "No posts yet",
    "es": "Aún no hay publicaciones"
  },
  "Carregando mais publicações": {
    "en": "Loading more posts",
    "es": "Cargando más publicaciones"
  },
  "Carregar mais publicações": {
    "en": "Load more posts",
    "es": "Cargar más publicaciones"
  },
  "Criar publicação": {
    "en": "Create post",
    "es": "Crear publicación"
  },
  "Fechar publicação": {
    "en": "Close post",
    "es": "Cerrar publicación"
  },
  "Nova publicação": {
    "en": "New post",
    "es": "Nueva publicación"
  },
  "Categoria": {
    "en": "Category",
    "es": "Categoría"
  },
  "Tipo": {
    "en": "Type",
    "es": "Tipo"
  },
  "Obra relacionada": {
    "en": "Related work",
    "es": "Obra relacionada"
  },
  "Opcional: nome da obra": {
    "en": "Optional: work title",
    "es": "Opcional: nombre de la obra"
  },
  "OBRA": {
    "en": "WORK",
    "es": "OBRA"
  },
  "Publicação": {
    "en": "Post",
    "es": "Publicación"
  },
  "Modelo de enquete": {
    "en": "Poll template",
    "es": "Plantilla de encuesta"
  },
  "máx. 700": {
    "en": "max. 700",
    "es": "máx. 700"
  },
  "Abra uma conversa, peça indicação ou divulgue uma obra real publicada...": {
    "en": "Start a conversation, ask for recommendations, or promote a published work...",
    "es": "Inicia una conversación, pide recomendaciones o promociona una obra publicada..."
  },
  "Este post contém spoiler": {
    "en": "This post contains spoilers",
    "es": "Esta publicación contiene spoilers"
  },
  "Publicando...": {
    "en": "Publishing...",
    "es": "Publicando..."
  },
  "1 comentário": {
    "en": "1 comment",
    "es": "1 comentario"
  },
  "Sem título": {
    "en": "Untitled",
    "es": "Sin título"
  },
  "Não consegui carregar usuário da Comunidade:": {
    "en": "I couldn't load the Community user:",
    "es": "No se pudo cargar el usuario de la Comunidad:"
  },
  "Não consegui iniciar usuário da Comunidade:": {
    "en": "I couldn't initialize the Community user:",
    "es": "No se pudo iniciar el usuario de la Comunidad:"
  },
  "Não consegui remover a review do Diário:": {
    "en": "I couldn't remove the review from the Journal:",
    "es": "No se pudo eliminar la reseña del Diario:"
  },
  "Não consegui acessar o Diário para remover a review:": {
    "en": "I couldn't access the Journal to remove the review:",
    "es": "No se pudo acceder al Diario para eliminar la reseña:"
  },
  "Ação": {
    "en": "Action",
    "es": "Acción"
  },
  "Aventura": {
    "en": "Adventure",
    "es": "Aventura"
  },
  "Comédia": {
    "en": "Comedy",
    "es": "Comedia"
  },
  "Drama": {
    "en": "Drama",
    "es": "Drama"
  },
  "Fantasia": {
    "en": "Fantasy",
    "es": "Fantasía"
  },
  "Mistério": {
    "en": "Mystery",
    "es": "Misterio"
  },
  "Romance": {
    "en": "Romance",
    "es": "Romance"
  },
  "Suspense": {
    "en": "Thriller",
    "es": "Suspenso"
  },
  "Terror": {
    "en": "Horror",
    "es": "Terror"
  },
  "Sobrenatural": {
    "en": "Supernatural",
    "es": "Sobrenatural"
  },
  "Histórico": {
    "en": "History",
    "es": "Historial"
  },
  "Biografia": {
    "en": "Bio",
    "es": "Biografía"
  },
  "Livre": {
    "en": "All ages",
    "es": "Todo público"
  },
  "Webnovel": {
    "en": "Web novel",
    "es": "Novela web"
  },
  "Light novel": {
    "en": "Light novel",
    "es": "Novela ligera"
  },
  "Conto": {
    "en": "Short story",
    "es": "Cuento"
  },
  "Poesia": {
    "en": "Poetry",
    "es": "Poesía"
  },
  "HQ": {
    "en": "Comic",
    "es": "Cómic"
  },
  "Mangá": {
    "en": "Manga",
    "es": "Manga"
  },
  "Fanfic": {
    "en": "Fan fiction",
    "es": "Fanfic"
  },
  "Sombria": {
    "en": "Dark",
    "es": "Oscura"
  },
  "Psicológico": {
    "en": "Psychological",
    "es": "Psicológico"
  },
  "Espacial": {
    "en": "Space",
    "es": "Espacial"
  },
  "Distopia": {
    "en": "Dystopia",
    "es": "Distopía"
  },
  "Apocalipse": {
    "en": "Apocalypse",
    "es": "Apocalipsis"
  },
  "Escolar": {
    "en": "School",
    "es": "Escolar"
  },
  "Máfia": {
    "en": "Mafia",
    "es": "Mafia"
  },
  "Investigação": {
    "en": "Investigation",
    "es": "Investigación"
  },
  "Religioso": {
    "en": "Religious",
    "es": "Religioso"
  },
  "Mitologia": {
    "en": "Mythology",
    "es": "Mitología"
  },
  "Folclore": {
    "en": "Folklore",
    "es": "Folclore"
  },
  "Vampiro": {
    "en": "Vampire",
    "es": "Vampiro"
  },
  "Lobisomem": {
    "en": "Werewolf",
    "es": "Hombre lobo"
  },
  "Zumbi": {
    "en": "Zombie",
    "es": "Zombi"
  },
  "Super-herói": {
    "en": "Superhero",
    "es": "Superhéroe"
  },
  "Magia": {
    "en": "Magic",
    "es": "Magia"
  },
  "Guerra": {
    "en": "War",
    "es": "Guerra"
  },
  "Família": {
    "en": "Family",
    "es": "Familia"
  },
  "Amizade": {
    "en": "Friendship",
    "es": "Amistad"
  },
  "Traição": {
    "en": "Betrayal",
    "es": "Traición"
  },
  "Vingança": {
    "en": "Revenge",
    "es": "Venganza"
  },
  "Sobrevivência": {
    "en": "Survival",
    "es": "Supervivencia"
  },
  "Perfil de leitor no Historietas.": {
    "en": "Reader profile on Historietas.",
    "es": "Perfil de lector en Historietas."
  },
  "histórias variadas": {
    "en": "varied stories",
    "es": "historias variadas"
  },
  "Histórias variadas": {
    "en": "Varied stories",
    "es": "Historias variadas"
  },
  "Data não informada": {
    "en": "Date not provided",
    "es": "Fecha no informada"
  },
  "Lendo": {
    "en": "Reading",
    "es": "Leyendo"
  },
  "lendo": {
    "en": "reading",
    "es": "leyendo"
  },
  "Favorita": {
    "en": "Favorite",
    "es": "Favorita"
  },
  "Favoritas": {
    "en": "Favorites",
    "es": "Favoritas"
  },
  "favoritas": {
    "en": "favorites",
    "es": "favoritas"
  },
  "Concluída": {
    "en": "Completed",
    "es": "Completada"
  },
  "concluídas": {
    "en": "completed",
    "es": "completadas"
  },
  "Avaliação": {
    "en": "Rating",
    "es": "Valoración"
  },
  "Avaliações": {
    "en": "Ratings",
    "es": "Valoraciones"
  },
  "Avaliações recentes": {
    "en": "Recent ratings",
    "es": "Valoraciones recientes"
  },
  "Quero ler": {
    "en": "Want to read",
    "es": "Quiero leer"
  },
  "quero ler": {
    "en": "want to read",
    "es": "quiero leer"
  },
  "Atividade": {
    "en": "Activity",
    "es": "Actividad"
  },
  "Atividade recente": {
    "en": "Recent activity",
    "es": "Actividad reciente"
  },
  "Atividades": {
    "en": "Activity",
    "es": "Actividad"
  },
  "Reviews": {
    "en": "Reviews",
    "es": "Reseñas"
  },
  "Leitura em andamento": {
    "en": "Reading in progress",
    "es": "Lectura en curso"
  },
  "Capítulo salvo na Biblioteca": {
    "en": "Chapter saved to the Library",
    "es": "Capítulo guardado en la Biblioteca"
  },
  "Capítulo salvo na Biblioteca.": {
    "en": "Chapter saved to the Library.",
    "es": "Capítulo guardado en la Biblioteca."
  },
  "Capítulo removido dos salvos.": {
    "en": "Chapter removed from saved items.",
    "es": "Capítulo eliminado de guardados."
  },
  "Obra adicionada ao Quero ler.": {
    "en": "Work added to Want to read.",
    "es": "Obra añadida a Quiero leer."
  },
  "Obra removida do Quero ler.": {
    "en": "Work removed from Want to read.",
    "es": "Obra eliminada de Quiero leer."
  },
  "Histórico de leitura removido.": {
    "en": "Reading history removed.",
    "es": "Historial de lectura eliminado."
  },
  "Obra favoritada no perfil": {
    "en": "Work favorited on the profile",
    "es": "Obra añadida a favoritas en el perfil"
  },
  "Obra favoritada no Diário": {
    "en": "Work favorited in the Journal",
    "es": "Obra añadida a favoritas en el Diario"
  },
  "Obra marcada como concluída": {
    "en": "Work marked as completed",
    "es": "Obra marcada como completada"
  },
  "Adicionada para acompanhar depois": {
    "en": "Added to read later",
    "es": "Añadida para leer después"
  },
  "Leu um capítulo.": {
    "en": "Read a chapter.",
    "es": "Leyó un capítulo."
  },
  "Começou a ler esta obra.": {
    "en": "Started reading this work.",
    "es": "Empezó a leer esta obra."
  },
  "Concluiu esta obra.": {
    "en": "Completed this work.",
    "es": "Completó esta obra."
  },
  "Avaliou esta obra.": {
    "en": "Rated this work.",
    "es": "Valoró esta obra."
  },
  "Favoritou esta obra.": {
    "en": "Added this work to favorites.",
    "es": "Añadió esta obra a favoritas."
  },
  "Salvou para acompanhar depois.": {
    "en": "Saved to read later.",
    "es": "Guardó para leer después."
  },
  "Publicou uma review.": {
    "en": "Published a review.",
    "es": "Publicó una reseña."
  },
  "Criou uma lista de leitura.": {
    "en": "Created a reading list.",
    "es": "Creó una lista de lectura."
  },
  "Atualizou o Diário.": {
    "en": "Updated the Journal.",
    "es": "Actualizó el Diario."
  },
  "Atividade do Diário": {
    "en": "Journal activity",
    "es": "Actividad del Diario"
  },
  "Carregando perfil": {
    "en": "Loading profile",
    "es": "Cargando perfil"
  },
  "Perfil não encontrado": {
    "en": "Profile not found",
    "es": "Perfil no encontrado"
  },
  "Abrir menu do perfil": {
    "en": "Open profile menu",
    "es": "Abrir menú del perfil"
  },
  "Menu do perfil": {
    "en": "Profile menu",
    "es": "Menú del perfil"
  },
  "Ações do perfil": {
    "en": "Profile actions",
    "es": "Acciones del perfil"
  },
  "Fechar menu": {
    "en": "Close menu",
    "es": "Cerrar menú"
  },
  "Conta e sistema": {
    "en": "Account and system",
    "es": "Cuenta y sistema"
  },
  "Configurações e atividade": {
    "en": "Settings and activity",
    "es": "Configuración y actividad"
  },
  "Copiar link do perfil": {
    "en": "Copy profile link",
    "es": "Copiar enlace del perfil"
  },
  "Sair da conta": {
    "en": "Sign out",
    "es": "Cerrar sesión"
  },
  "Perfil": {
    "en": "Profile",
    "es": "Perfil"
  },
  "Comunidade do autor": {
    "en": "Author community",
    "es": "Comunidad del autor"
  },
  "Denunciar perfil": {
    "en": "Report profile",
    "es": "Denunciar perfil"
  },
  "Bloquear usuário": {
    "en": "Block user",
    "es": "Bloquear usuario"
  },
  "Desbloquear usuário": {
    "en": "Unblock user",
    "es": "Desbloquear usuario"
  },
  "Bloqueando...": {
    "en": "Blocking...",
    "es": "Bloqueando..."
  },
  "Desbloqueando...": {
    "en": "Unblocking...",
    "es": "Desbloqueando..."
  },
  "Perfil bloqueado": {
    "en": "Blocked profile",
    "es": "Perfil bloqueado"
  },
  "O conteúdo deste perfil está oculto porque existe um bloqueio entre vocês.": {
    "en": "This profile's content is hidden because there is a block between you.",
    "es": "El contenido de este perfil está oculto porque existe un bloqueo entre ustedes."
  },
  "Descoberta": {
    "en": "Discover",
    "es": "Descubrimiento"
  },
  "Explorar outras obras": {
    "en": "Explore other works",
    "es": "Explorar otras obras"
  },
  "Editar perfil": {
    "en": "Edit profile",
    "es": "Editar perfil"
  },
  "Atualize suas informações públicas": {
    "en": "Update your public information",
    "es": "Actualiza tu información pública"
  },
  "Fechar edição do perfil": {
    "en": "Close profile editor",
    "es": "Cerrar edición del perfil"
  },
  "Prévia da imagem do perfil": {
    "en": "Profile image preview",
    "es": "Vista previa de la imagen del perfil"
  },
  "Trocar imagem": {
    "en": "Change image",
    "es": "Cambiar imagen"
  },
  "Colocar imagem": {
    "en": "Add image",
    "es": "Añadir imagen"
  },
  "Nome de usuário": {
    "en": "Display name",
    "es": "Nombre de usuario"
  },
  "Digite seu nome": {
    "en": "Enter your name",
    "es": "Escribe tu nombre"
  },
  "@username público": {
    "en": "Public @username",
    "es": "@username público"
  },
  "Digite seu username": {
    "en": "Enter your username",
    "es": "Escribe tu username"
  },
  "caracteres": {
    "en": "characters",
    "es": "caracteres"
  },
  "Cancelar": {
    "en": "Cancel",
    "es": "Cancelar"
  },
  "Essa denúncia será enviada para análise da moderação.": {
    "en": "This report will be sent to moderation for review.",
    "es": "Esta denuncia se enviará a moderación para su revisión."
  },
  "Fechar denúncia": {
    "en": "Close report",
    "es": "Cerrar denuncia"
  },
  "Explique rapidamente o problema, se quiser.": {
    "en": "Briefly explain the problem, if you wish.",
    "es": "Explica brevemente el problema, si quieres."
  },
  "Enviar denúncia": {
    "en": "Submit report",
    "es": "Enviar denuncia"
  },
  "obras": {
    "en": "works",
    "es": "obras"
  },
  "seguidas": {
    "en": "followed",
    "es": "seguidas"
  },
  "seguidores": {
    "en": "followers",
    "es": "seguidores"
  },
  "seguindo": {
    "en": "following",
    "es": "siguiendo"
  },
  "Média": {
    "en": "Average",
    "es": "Promedio"
  },
  "+ Adicionar biografia": {
    "en": "+ Add bio",
    "es": "+ Añadir biografía"
  },
  "Ocultar destaques": {
    "en": "Hide highlights",
    "es": "Ocultar destacados"
  },
  "Mostrar destaques": {
    "en": "Show highlights",
    "es": "Mostrar destacados"
  },
  "Ocultar destaque": {
    "en": "Hide highlight",
    "es": "Ocultar destacado"
  },
  "Mostrar destaque": {
    "en": "Show highlight",
    "es": "Mostrar destacado"
  },
  "Remover curtida do TOP 5": {
    "en": "Unlike TOP 5",
    "es": "Quitar Me gusta del TOP 5"
  },
  "Curtir TOP 5": {
    "en": "Like TOP 5",
    "es": "Me gusta en TOP 5"
  },
  "Montar ou editar TOP 5": {
    "en": "Create or edit TOP 5",
    "es": "Crear o editar TOP 5"
  },
  "Monte seu TOP 5 para destacar suas obras favoritas.": {
    "en": "Build your TOP 5 to highlight your favorite works.",
    "es": "Crea tu TOP 5 para destacar tus obras favoritas."
  },
  "Avaliação do autor": {
    "en": "Author rating",
    "es": "Valoración del autor"
  },
  "AVALIE ESTE AUTOR": {
    "en": "RATE THIS AUTHOR",
    "es": "VALORA A ESTE AUTOR"
  },
  "Avaliação do Diário": {
    "en": "Journal rating",
    "es": "Valoración del Diario"
  },
  "AVALIE ESTE DIÁRIO": {
    "en": "RATE THIS JOURNAL",
    "es": "VALORA ESTE DIARIO"
  },
  "Seções do perfil": {
    "en": "Profile sections",
    "es": "Secciones del perfil"
  },
  "Obras": {
    "en": "Works",
    "es": "Obras"
  },
  "Diário": {
    "en": "Journal",
    "es": "Diario"
  },
  "Sobre": {
    "en": "About",
    "es": "Acerca de"
  },
  "Salvos": {
    "en": "Saved",
    "es": "Guardados"
  },
  "Carregando biblioteca": {
    "en": "Loading library",
    "es": "Cargando biblioteca"
  },
  "Sua Biblioteca ainda não tem itens em": {
    "en": "Your Library does not have any items in",
    "es": "Tu Biblioteca todavía no tiene elementos en"
  },
  "Meu Diário": {
    "en": "My Journal",
    "es": "Mi Diario"
  },
  "Ocultar resumo do Diário": {
    "en": "Hide Journal summary",
    "es": "Ocultar resumen del Diario"
  },
  "Mostrar resumo do Diário": {
    "en": "Show Journal summary",
    "es": "Mostrar resumen del Diario"
  },
  "Carregando diário": {
    "en": "Loading journal",
    "es": "Cargando diario"
  },
  "Suas leituras recentes aparecerão aqui.": {
    "en": "Your recent reads will appear here.",
    "es": "Tus lecturas recientes aparecerán aquí."
  },
  "Este perfil ainda não compartilhou leituras recentes.": {
    "en": "This profile has not shared any recent reads yet.",
    "es": "Este perfil aún no ha compartido lecturas recientes."
  },
  "As obras salvas para acompanhar depois aparecerão aqui.": {
    "en": "Works saved for later will appear here.",
    "es": "Las obras guardadas para después aparecerán aquí."
  },
  "Este perfil ainda não compartilhou obras para ler depois.": {
    "en": "This profile has not shared any works to read later yet.",
    "es": "Este perfil aún no ha compartido obras para leer después."
  },
  "Favorite obras para montar sua vitrine de leitura.": {
    "en": "Favorite works to build your reading showcase.",
    "es": "Añade obras a favoritas para crear tu escaparate de lectura."
  },
  "Este perfil ainda não compartilhou favoritas.": {
    "en": "This profile has not shared any favorites yet.",
    "es": "Este perfil aún no ha compartido favoritas."
  },
  "Obras concluídas aparecerão nesta área.": {
    "en": "Completed works will appear here.",
    "es": "Las obras completadas aparecerán aquí."
  },
  "Este perfil ainda não compartilhou obras concluídas.": {
    "en": "This profile has not shared any completed works yet.",
    "es": "Este perfil aún no ha compartido obras completadas."
  },
  "Suas avaliações públicas aparecerão aqui.": {
    "en": "Your public ratings will appear here.",
    "es": "Tus valoraciones públicas aparecerán aquí."
  },
  "Este perfil ainda não possui avaliações públicas.": {
    "en": "This profile does not have any public ratings yet.",
    "es": "Este perfil aún no tiene valoraciones públicas."
  },
  "Suas avaliações publicadas na Comunidade aparecerão aqui.": {
    "en": "Your reviews published in the Community will appear here.",
    "es": "Tus reseñas publicadas en la Comunidad aparecerán aquí."
  },
  "Este perfil ainda não publicou avaliações.": {
    "en": "This profile has not published any reviews yet.",
    "es": "Este perfil aún no ha publicado reseñas."
  },
  "PUBLICAÇÕES": {
    "en": "POSTS",
    "es": "PUBLICACIONES"
  },
  "posts do perfil": {
    "en": "profile posts",
    "es": "publicaciones del perfil"
  },
  "TEORIAS": {
    "en": "THEORIES",
    "es": "TEORÍAS"
  },
  "discussões": {
    "en": "discussions",
    "es": "discusiones"
  },
  "REVIEWS": {
    "en": "REVIEWS",
    "es": "RESEÑAS"
  },
  "opiniões": {
    "en": "opinions",
    "es": "opiniones"
  },
  "Sua comunidade ainda está vazia": {
    "en": "Your community is still empty",
    "es": "Tu comunidad todavía está vacía"
  },
  "Nenhuma publicação por aqui ainda": {
    "en": "No posts here yet",
    "es": "Aún no hay publicaciones aquí"
  },
  "Publique avisos, bastidores, teorias e chamadas para aproximar leitores das suas obras.": {
    "en": "Publish updates, behind-the-scenes posts, theories and invitations to bring readers closer to your works.",
    "es": "Publica avisos, contenido entre bastidores, teorías e invitaciones para acercar a los lectores a tus obras."
  },
  "Editar sinopse do Sobre": {
    "en": "Edit About description",
    "es": "Editar descripción de Acerca de"
  },
  "Especialidades": {
    "en": "Specialties",
    "es": "Especialidades"
  },
  "Números do perfil": {
    "en": "Profile numbers",
    "es": "Números del perfil"
  },
  "publicadas": {
    "en": "published",
    "es": "publicadas"
  },
  "capítulos": {
    "en": "chapters",
    "es": "capítulos"
  },
  "curtidas": {
    "en": "likes",
    "es": "Me gusta"
  },
  "visualizações": {
    "en": "views",
    "es": "visualizaciones"
  },
  "obras no perfil": {
    "en": "works on profile",
    "es": "obras en el perfil"
  },
  "rascunhos em desenvolvimento": {
    "en": "drafts in progress",
    "es": "borradores en desarrollo"
  },
  "comentários recebidos": {
    "en": "comments received",
    "es": "comentarios recibidos"
  },
  "concluídas por leitores": {
    "en": "completed by readers",
    "es": "completadas por lectores"
  },
  "sem capítulos ainda": {
    "en": "no chapters yet",
    "es": "sin capítulos todavía"
  },
  "Na Historietas desde": {
    "en": "On Historietas since",
    "es": "En Historietas desde"
  },
  "Você ainda não publicou obras. Seu perfil continua ativo como leitor, com Diário e Comunidade.": {
    "en": "You have not published any works yet. Your profile remains active as a reader, with Journal and Community.",
    "es": "Todavía no has publicado obras. Tu perfil sigue activo como lector, con Diario y Comunidad."
  },
  "Este perfil ainda não publicou obras. O Diário e a Comunidade continuam disponíveis.": {
    "en": "This profile has not published any works yet. The Journal and Community are still available.",
    "es": "Este perfil aún no ha publicado obras. El Diario y la Comunidad siguen disponibles."
  },
  "Nenhuma obra encontrada.": {
    "en": "No works found.",
    "es": "No se encontraron obras."
  },
  "Ler": {
    "en": "Read",
    "es": "Leer"
  },
  "Remover da lista": {
    "en": "Remove from list",
    "es": "Eliminar de la lista"
  },
  "Adicionar à lista": {
    "en": "Add to list",
    "es": "Añadir a la lista"
  },
  "Marcar como não concluída": {
    "en": "Mark as not completed",
    "es": "Marcar como no completada"
  },
  "Concluir": {
    "en": "Mark completed",
    "es": "Completar"
  },
  "capítulo": {
    "en": "chapter",
    "es": "capítulo"
  },
  "Obra": {
    "en": "Work",
    "es": "Obra"
  },
  "Ler capítulo": {
    "en": "Read chapter",
    "es": "Leer capítulo"
  },
  "Remover do Quero ler": {
    "en": "Remove from Want to read",
    "es": "Eliminar de Quiero leer"
  },
  "Remover favorita": {
    "en": "Remove favorite",
    "es": "Eliminar de favoritas"
  },
  "Favoritar": {
    "en": "Add to favorites",
    "es": "Añadir a favoritas"
  },
  "Parar leitura": {
    "en": "Stop reading",
    "es": "Dejar de leer"
  },
  "Limpar histórico": {
    "en": "Clear history",
    "es": "Borrar historial"
  },
  "Continuar leitura": {
    "en": "Continue reading",
    "es": "Continuar lectura"
  },
  "Editar anotação": {
    "en": "Edit note",
    "es": "Editar nota"
  },
  "Adicionar anotação": {
    "en": "Add note",
    "es": "Añadir nota"
  },
  "Escreva o que achou desta leitura...": {
    "en": "Write what you thought of this reading...",
    "es": "Escribe qué te pareció esta lectura..."
  },
  "Anotação": {
    "en": "Note",
    "es": "Nota"
  },
  "Remover curtida da anotação": {
    "en": "Unlike note",
    "es": "Quitar Me gusta de la nota"
  },
  "Curtir anotação": {
    "en": "Like note",
    "es": "Me gusta en la nota"
  },
  "Ocultar": {
    "en": "Hide",
    "es": "Ocultar"
  },
  "Abrir": {
    "en": "Open",
    "es": "Abrir"
  },
  "Nenhuma atividade recente para mostrar.": {
    "en": "No recent activity to show.",
    "es": "No hay actividad reciente para mostrar."
  },
  "Entre para curtir o TOP 5 deste perfil.": {
    "en": "Sign in to like this profile’s TOP 5.",
    "es": "Inicia sesión para indicar que te gusta el TOP 5 de este perfil."
  },
  "Não foi possível confirmar este perfil para edição.": {
    "en": "This profile could not be verified for editing.",
    "es": "No se pudo confirmar este perfil para editarlo."
  },
  "O nome do perfil precisa ter pelo menos 3 caracteres.": {
    "en": "The profile name must have at least 3 characters.",
    "es": "El nombre del perfil debe tener al menos 3 caracteres."
  },
  "O @username precisa ter pelo menos 3 caracteres.": {
    "en": "The @username must have at least 3 characters.",
    "es": "El @username debe tener al menos 3 caracteres."
  },
  "Salvando perfil...": {
    "en": "Saving profile...",
    "es": "Guardando perfil..."
  },
  "A imagem ficou salva neste aparelho, mas não foi enviada ao Storage.": {
    "en": "The image was saved on this device but was not uploaded to Storage.",
    "es": "La imagen se guardó en este dispositivo, pero no se subió al Storage."
  },
  "Esse @username já está em uso.": {
    "en": "That @username is already in use.",
    "es": "Ese @username ya está en uso."
  },
  "Não foi possível copiar o username agora.": {
    "en": "The username could not be copied right now.",
    "es": "No se pudo copiar el username ahora."
  },
  "Você não pode avaliar seu próprio perfil.": {
    "en": "You cannot rate your own profile.",
    "es": "No puedes valorar tu propio perfil."
  },
  "Entre na sua conta para avaliar este autor.": {
    "en": "Sign in to rate this author.",
    "es": "Inicia sesión para valorar a este autor."
  },
  "Você não pode avaliar seu próprio Diário.": {
    "en": "You cannot rate your own Journal.",
    "es": "No puedes valorar tu propio Diario."
  },
  "Entre na sua conta para avaliar este Diário.": {
    "en": "Sign in to rate this Journal.",
    "es": "Inicia sesión para valorar este Diario."
  },
  "Este Diário não está disponível para avaliação.": {
    "en": "This Journal is not available for rating.",
    "es": "Este Diario no está disponible para valoración."
  },
  "Escolha uma imagem válida.": {
    "en": "Choose a valid image.",
    "es": "Elige una imagen válida."
  },
  "A imagem precisa ter no máximo 1 MB.": {
    "en": "The image must be no larger than 1 MB.",
    "es": "La imagen debe tener como máximo 1 MB."
  },
  "Não consegui carregar essa imagem.": {
    "en": "I could not load this image.",
    "es": "No se pudo cargar esta imagen."
  },
  "Compartilhamento do perfil aberto.": {
    "en": "Profile sharing opened.",
    "es": "Se abrió la opción para compartir el perfil."
  },
  "Não consegui compartilhar nem copiar o link do perfil neste navegador.": {
    "en": "I could not share or copy the profile link in this browser.",
    "es": "No se pudo compartir ni copiar el enlace del perfil en este navegador."
  },
  "Não foi possível identificar este perfil.": {
    "en": "This profile could not be identified.",
    "es": "No se pudo identificar este perfil."
  },
  "Entre na sua conta para denunciar este perfil.": {
    "en": "Sign in to report this profile.",
    "es": "Inicia sesión para denunciar este perfil."
  },
  "Você não pode denunciar o próprio perfil.": {
    "en": "You cannot report your own profile.",
    "es": "No puedes denunciar tu propio perfil."
  },
  "Não consegui enviar a denúncia agora.": {
    "en": "I could not submit the report now.",
    "es": "No se pudo enviar la denuncia ahora."
  },
  "Obra na Historietas": {
    "en": "Work on Historietas",
    "es": "Obra en Historietas"
  },
  "Compartilhamento da obra aberto.": {
    "en": "Work sharing opened.",
    "es": "Se abrió la opción para compartir la obra."
  },
  "Link da obra copiado.": {
    "en": "Work link copied.",
    "es": "Enlace de la obra copiado."
  },
  "Não consegui compartilhar nem copiar o link da obra neste navegador.": {
    "en": "I could not share or copy the work link in this browser.",
    "es": "No se pudo compartir ni copiar el enlace de la obra en este navegador."
  },
  "Entre na sua conta para seguir perfis.": {
    "en": "Sign in to follow profiles.",
    "es": "Inicia sesión para seguir perfiles."
  },
  "Este é o seu perfil.": {
    "en": "This is your profile.",
    "es": "Este es tu perfil."
  },
  "Não consegui atualizar este seguimento agora.": {
    "en": "I could not update this follow right now.",
    "es": "No se pudo actualizar este seguimiento ahora."
  },
  "Perfil adicionado aos seus seguindo.": {
    "en": "Profile added to your following list.",
    "es": "Perfil añadido a tu lista de seguidos."
  },
  "Perfil removido dos seus seguindo.": {
    "en": "Profile removed from your following list.",
    "es": "Perfil eliminado de tu lista de seguidos."
  },
  "Sua solicitação foi enviada.": {
    "en": "Your follow request was sent.",
    "es": "Tu solicitud de seguimiento fue enviada."
  },
  "Solicitação cancelada.": {
    "en": "Request canceled.",
    "es": "Solicitud cancelada."
  },
  "Entre na sua conta para adicionar obras à lista.": {
    "en": "Sign in to add works to the list.",
    "es": "Inicia sesión para añadir obras a la lista."
  },
  "Entre na sua conta para concluir obras.": {
    "en": "Sign in to mark works as completed.",
    "es": "Inicia sesión para marcar obras como completadas."
  },
  "Entre na sua conta para atualizar a Biblioteca.": {
    "en": "Sign in to update the Library.",
    "es": "Inicia sesión para actualizar la Biblioteca."
  },
  "Entre na sua conta para limpar o histórico.": {
    "en": "Sign in to clear history.",
    "es": "Inicia sesión para borrar el historial."
  },
  "Esta anotação só pode ser criada em uma obra salva no Supabase.": {
    "en": "This note can only be created for a work saved in Supabase.",
    "es": "Esta nota solo puede crearse en una obra guardada en Supabase."
  },
  "Entre na sua conta para salvar a anotação.": {
    "en": "Sign in to save the note.",
    "es": "Inicia sesión para guardar la nota."
  },
  "A obra ainda não possui um ID válido no Supabase.": {
    "en": "The work does not yet have a valid Supabase ID.",
    "es": "La obra todavía no tiene un ID válido en Supabase."
  },
  "Escreva uma anotação antes de salvar.": {
    "en": "Write a note before saving.",
    "es": "Escribe una nota antes de guardar."
  },
  "Anotação salva no Diário.": {
    "en": "Note saved in the Journal.",
    "es": "Nota guardada en el Diario."
  },
  "Não foi possível salvar a anotação.": {
    "en": "The note could not be saved.",
    "es": "No se pudo guardar la nota."
  },
  "Remover esta anotação do Diário?": {
    "en": "Remove this note from the Journal?",
    "es": "¿Eliminar esta nota del Diario?"
  },
  "Anotação removida do Diário.": {
    "en": "Note removed from the Journal.",
    "es": "Nota eliminada del Diario."
  },
  "Não foi possível remover a anotação.": {
    "en": "The note could not be removed.",
    "es": "No se pudo eliminar la nota."
  },
  "Não foi possível atualizar a curtida.": {
    "en": "The like could not be updated.",
    "es": "No se pudo actualizar el Me gusta."
  },
  "Não foi possível enviar o comentário.": {
    "en": "The comment could not be sent.",
    "es": "No se pudo enviar el comentario."
  },
  "Não foi possível remover o comentário.": {
    "en": "The comment could not be removed.",
    "es": "No se pudo eliminar el comentario."
  },
  "Nova notificação": {
    "en": "New notification",
    "es": "Nueva notificación"
  },
  "Você recebeu uma nova notificação.": {
    "en": "You received a new notification.",
    "es": "Recibiste una nueva notificación."
  },
  "Conteúdo ofensivo": {
    "en": "Offensive content",
    "es": "Contenido ofensivo"
  },
  "Perfil falso": {
    "en": "Fake profile",
    "es": "Perfil falso"
  },
  "Assédio": {
    "en": "Harassment",
    "es": "Acoso"
  },
  "Conteúdo impróprio": {
    "en": "Inappropriate content",
    "es": "Contenido inapropiado"
  },
  "Outro": {
    "en": "Other",
    "es": "Otro"
  }
};

export function obterLocaleDocumentoPerfilAutor() {
  if (typeof document === "undefined") {
    return "pt-BR";
  }

  const idiomaDocumento = document.documentElement.lang.toLowerCase();

  if (idiomaDocumento.startsWith("en")) {
    return "en-US";
  }

  if (idiomaDocumento.startsWith("es")) {
    return "es-ES";
  }

  return "pt-BR";
}

export function traduzirTextoPerfilAutor(
  texto: string,
  idioma: HistorietasLanguage,
): string {
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
  const traducaoExata = PERFIL_AUTOR_UI_TRANSLATIONS[conteudo];

  if (traducaoExata) {
    return `${inicio}${traducaoExata[idioma]}${fim}`;
  }

  const separadorComposto = conteudo.includes(" • ")
    ? " • "
    : conteudo.includes(" · ")
      ? " · "
      : "";

  if (separadorComposto) {
    const partesOriginais = conteudo.split(separadorComposto);
    const partesTraduzidas: string[] = partesOriginais.map(
      (parte: string): string =>
        traduzirTextoPerfilAutor(parte.trim(), idioma),
    );

    if (
      partesTraduzidas.some(
        (parte, index) => parte !== partesOriginais[index]?.trim(),
      )
    ) {
      return `${inicio}${partesTraduzidas.join(separadorComposto)}${fim}`;
    }
  }

  let correspondencia = /^Notificações: (\d+) não lidas$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Notifications: ${correspondencia[1]} unread${fim}`
      : `${inicio}Notificaciones: ${correspondencia[1]} sin leer${fim}`;
  }

  correspondencia = /^(\d+|99\+) notificações não lidas$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} unread notifications${fim}`
      : `${inicio}${correspondencia[1]} notificaciones sin leer${fim}`;
  }

  correspondencia = /^(\d+) (avaliação|avaliações)$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1]);
    return idioma === "en"
      ? `${inicio}${total} ${total === 1 ? "rating" : "ratings"}${fim}`
      : `${inicio}${total} ${total === 1 ? "valoración" : "valoraciones"}${fim}`;
  }

  correspondencia = /^Média ([0-9.,]+) de 5$/.exec(conteudo);

  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Average ${correspondencia[1]} out of 5${fim}`
      : `${inicio}Promedio ${correspondencia[1]} de 5${fim}`;
  }

  correspondencia = /^Avaliar autor com ([0-9.,]+) (estrela|estrelas)$/.exec(conteudo);

  if (correspondencia) {
    const total = Number(correspondencia[1].replace(",", "."));
    return idioma === "en"
      ? `${inicio}Rate author with ${correspondencia[1]} ${total === 1 ? "star" : "stars"}${fim}`
      : `${inicio}Valorar al autor con ${correspondencia[1]} ${total === 1 ? "estrella" : "estrellas"}${fim}`;
  }

  correspondencia = /^Imagem de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Image of ${correspondencia[1]}${fim}`
      : `${inicio}Imagen de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir obras seguidas por (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open works followed by ${correspondencia[1]}${fim}`
      : `${inicio}Abrir obras seguidas por ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir lista de seguidores de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s followers list${fim}`
      : `${inicio}Abrir la lista de seguidores de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir lista de perfis que (.+) segue$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open the list of profiles followed by ${correspondencia[1]}${fim}`
      : `${inicio}Abrir la lista de perfiles que sigue ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Diário de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]}'s Journal${fim}`
      : `${inicio}Diario de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Comunidade de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]}'s Community${fim}`
      : `${inicio}Comunidad de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Sobre (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}About ${correspondencia[1]}${fim}`
      : `${inicio}Acerca de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir publicações de (.+) na comunidade$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s posts in the Community${fim}`
      : `${inicio}Abrir las publicaciones de ${correspondencia[1]} en la Comunidad${fim}`;
  }

  correspondencia = /^Abrir teorias de (.+) na comunidade$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s theories in the Community${fim}`
      : `${inicio}Abrir las teorías de ${correspondencia[1]} en la Comunidad${fim}`;
  }

  correspondencia = /^Abrir reviews de (.+) na comunidade$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}'s reviews in the Community${fim}`
      : `${inicio}Abrir las reseñas de ${correspondencia[1]} en la Comunidad${fim}`;
  }

  correspondencia = /^Quando (.+) publicar posts, teorias ou reviews, eles aparecerão nesta área\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}When ${correspondencia[1]} publishes posts, theories or reviews, they will appear here.${fim}`
      : `${inicio}Cuando ${correspondencia[1]} publique posts, teorías o reseñas, aparecerán aquí.${fim}`;
  }

  correspondencia = /^(.+) nao montou top 5$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} has not created a TOP 5${fim}`
      : `${inicio}${correspondencia[1]} no ha creado un TOP 5${fim}`;
  }

  correspondencia = /^Ações da obra (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ações da Biblioteca (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Library actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones de Biblioteca para ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Ações do Diário (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Journal actions for ${correspondencia[1]}${fim}`
      : `${inicio}Acciones del Diario para ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir opções de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open options for ${correspondencia[1]}${fim}`
      : `${inicio}Abrir opciones de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Abrir (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Open ${correspondencia[1]}${fim}`
      : `${inicio}Abrir ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Por (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}By ${correspondencia[1]}${fim}`
      : `${inicio}Por ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(\d+) (capítulo|capítulos)$/.exec(conteudo);
  if (correspondencia) {
    const total = Number(correspondencia[1]);
    return idioma === "en"
      ? `${inicio}${total} ${total === 1 ? "chapter" : "chapters"}${fim}`
      : `${inicio}${total} ${total === 1 ? "capítulo" : "capítulos"}${fim}`;
  }

  correspondencia = /^(\d+)% concluíd[oa]$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]}% completed${fim}`
      : `${inicio}${correspondencia[1]}% completado${fim}`;
  }

  correspondencia = /^Leitura em andamento • (\d+)% concluída$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Reading in progress • ${correspondencia[1]}% completed${fim}`
      : `${inicio}Lectura en curso • ${correspondencia[1]}% completada${fim}`;
  }

  correspondencia = /^Capítulo (\d+) de (\d+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Chapter ${correspondencia[1]} of ${correspondencia[2]}${fim}`
      : `${inicio}Capítulo ${correspondencia[1]} de ${correspondencia[2]}${fim}`;
  }

  correspondencia = /^Confira o perfil de (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Check out ${correspondencia[1]}'s profile${fim}`
      : `${inicio}Mira el perfil de ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^(.+) começou a seguir você\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}${correspondencia[1]} started following you.${fim}`
      : `${inicio}${correspondencia[1]} empezó a seguirte.${fim}`;
  }

  correspondencia = /^Veja (.+) na Historietas\.$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}See ${correspondencia[1]} on Historietas.${fim}`
      : `${inicio}Mira ${correspondencia[1]} en Historietas.${fim}`;
  }

  correspondencia = /^Avaliou com ([0-9.,]+) estrelas(\.)?$/.exec(conteudo);
  if (correspondencia) {
    const nota =
      idioma === "en"
        ? correspondencia[1].replace(",", ".")
        : correspondencia[1];
    const pontoFinal = correspondencia[2] || "";

    return idioma === "en"
      ? `${inicio}Rated ${nota} stars${pontoFinal}${fim}`
      : `${inicio}Valoró con ${nota} estrellas${pontoFinal}${fim}`;
  }

  correspondencia = /^Publicou review: (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Published a review: ${correspondencia[1]}${fim}`
      : `${inicio}Publicó una reseña: ${correspondencia[1]}${fim}`;
  }

  correspondencia = /^Leitura em andamento • (.+)$/.exec(conteudo);
  if (correspondencia) {
    return idioma === "en"
      ? `${inicio}Reading in progress • ${correspondencia[1]}${fim}`
      : `${inicio}Lectura en curso • ${correspondencia[1]}${fim}`;
  }

  return texto;
}

export function PerfilAutorLanguageBridge() {
  const { language } = useHistorietasLanguage();

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }

    type EstadoTraducaoPerfilAutor = {
      original: string;
      traduzido: string;
    };

    const estadosTexto: WeakMap<Text, EstadoTraducaoPerfilAutor> = new WeakMap();
    const estadosAtributos: WeakMap<
      Element,
      Map<string, EstadoTraducaoPerfilAutor>
    > = new WeakMap();
    const textosAlterados = new Set<Text>();
    const atributosAlterados = new Set<{ elemento: Element; atributo: string }>();
    const atributosTraduziveis = ["aria-label", "title", "placeholder", "alt"];
    let aplicando = false;

    function pertenceAConteudoUsuario(elemento: Element | null) {
      return Boolean(
        elemento?.closest("[data-historietas-user-content='true']"),
      );
    }

    function deveIgnorarElemento(elemento: Element | null) {
      if (!elemento) {
        return true;
      }

      const tag = elemento.tagName.toLowerCase();

      return tag === "script" || tag === "style" || pertenceAConteudoUsuario(elemento);
    }

    function aplicarTexto(no: Text) {
      const elementoPai = no.parentElement;

      if (
        deveIgnorarElemento(elementoPai) ||
        elementoPai?.tagName.toLowerCase() === "textarea"
      ) {
        return;
      }

      const atual = no.data;
      let estado = estadosTexto.get(no);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        estadosTexto.set(no, estado);
        textosAlterados.add(no);
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoPerfilAutor(estado.original, language);
      estado.traduzido = proximo;

      if (no.data !== proximo) {
        no.data = proximo;
      }
    }

    function aplicarAtributo(elemento: Element, atributo: string) {
      if (deveIgnorarElemento(elemento) || !elemento.hasAttribute(atributo)) {
        return;
      }

      const atual = elemento.getAttribute(atributo) || "";
      let mapaElemento = estadosAtributos.get(elemento);

      if (!mapaElemento) {
        mapaElemento = new Map();
        estadosAtributos.set(elemento, mapaElemento);
      }

      let estado = mapaElemento.get(atributo);

      if (!estado) {
        estado = { original: atual, traduzido: atual };
        mapaElemento.set(atributo, estado);
        atributosAlterados.add({ elemento, atributo });
      } else if (atual !== estado.traduzido && atual !== estado.original) {
        estado.original = atual;
      }

      const proximo = traduzirTextoPerfilAutor(estado.original, language);
      estado.traduzido = proximo;

      if (atual !== proximo) {
        elemento.setAttribute(atributo, proximo);
      }
    }

    function aplicarNo(no: Node) {
      if (no.nodeType === Node.TEXT_NODE) {
        aplicarTexto(no as Text);
        return;
      }

      if (!(no instanceof Element) || deveIgnorarElemento(no)) {
        return;
      }

      atributosTraduziveis.forEach((atributo) => aplicarAtributo(no, atributo));

      const walker = document.createTreeWalker(
        no,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      let atual: Node | null = walker.nextNode();

      while (atual) {
        if (atual.nodeType === Node.TEXT_NODE) {
          aplicarTexto(atual as Text);
        } else if (atual instanceof Element && !deveIgnorarElemento(atual)) {
          atributosTraduziveis.forEach((atributo) =>
            aplicarAtributo(atual as Element, atributo),
          );
        }

        atual = walker.nextNode();
      }
    }

    function aplicarTudo() {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        aplicarNo(document.body);
      } finally {
        aplicando = false;
      }
    }

    aplicarTudo();

    const observador = new MutationObserver((mutacoes) => {
      if (aplicando) {
        return;
      }

      aplicando = true;

      try {
        mutacoes.forEach((mutacao) => {
          if (mutacao.type === "characterData") {
            aplicarTexto(mutacao.target as Text);
            return;
          }

          if (mutacao.type === "attributes" && mutacao.target instanceof Element) {
            if (
              mutacao.attributeName &&
              atributosTraduziveis.includes(mutacao.attributeName)
            ) {
              aplicarAtributo(mutacao.target, mutacao.attributeName);
            }

            return;
          }

          mutacao.addedNodes.forEach((no) => aplicarNo(no));
        });
      } finally {
        aplicando = false;
      }
    });

    observador.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: atributosTraduziveis,
    });

    return () => {
      observador.disconnect();

      textosAlterados.forEach((no) => {
        const estado = estadosTexto.get(no);

        if (estado && no.isConnected && no.data === estado.traduzido) {
          no.data = estado.original;
        }
      });

      atributosAlterados.forEach((registro) => {
        const estado = estadosAtributos
          .get(registro.elemento)
          ?.get(registro.atributo);

        if (
          estado &&
          registro.elemento.isConnected &&
          registro.elemento.getAttribute(registro.atributo) === estado.traduzido
        ) {
          registro.elemento.setAttribute(registro.atributo, estado.original);
        }
      });
    };
  }, [language]);

  return null;
}
