"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";
import { normalizarTexto } from "../../lib/utils";

type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

type CategoriaAjudaId =
  | "todos"
  | "conta"
  | "publicacao"
  | "leitura"
  | "comunidade"
  | "privacidade";

type CategoriaAjuda = {
  id: CategoriaAjudaId;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

type PerguntaAjuda = {
  id: string;
  categoria: Exclude<CategoriaAjudaId, "todos">;
  pergunta: TextoTraduzido;
  resposta: TextoTraduzido;
  palavrasChave: TextoTraduzido;
};

type AtalhoAjuda = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

type IconName =
  | "arrowLeft"
  | "search"
  | "help"
  | "user"
  | "pen"
  | "book"
  | "message"
  | "shield"
  | "settings"
  | "bell"
  | "chevronDown"
  | "arrowRight"
  | "spark";

const CATEGORIAS_AJUDA: CategoriaAjuda[] = [
  {
    id: "todos",
    icon: "help",
    titulo: {
      pt: "Todas",
      en: "All",
      es: "Todas",
    },
    descricao: {
      pt: "Veja todas as dúvidas",
      en: "View every topic",
      es: "Ver todos los temas",
    },
  },
  {
    id: "conta",
    icon: "user",
    titulo: {
      pt: "Conta e acesso",
      en: "Account and access",
      es: "Cuenta y acceso",
    },
    descricao: {
      pt: "Login, perfil e senha",
      en: "Sign-in, profile and password",
      es: "Acceso, perfil y contraseña",
    },
  },
  {
    id: "publicacao",
    icon: "pen",
    titulo: {
      pt: "Publicação",
      en: "Publishing",
      es: "Publicación",
    },
    descricao: {
      pt: "Obras e capítulos",
      en: "Works and chapters",
      es: "Obras y capítulos",
    },
  },
  {
    id: "leitura",
    icon: "book",
    titulo: {
      pt: "Leitura e biblioteca",
      en: "Reading and library",
      es: "Lectura y biblioteca",
    },
    descricao: {
      pt: "Listas, favoritos e progresso",
      en: "Lists, favorites and progress",
      es: "Listas, favoritos y progreso",
    },
  },
  {
    id: "comunidade",
    icon: "message",
    titulo: {
      pt: "Comunidade",
      en: "Community",
      es: "Comunidad",
    },
    descricao: {
      pt: "Interações e notificações",
      en: "Interactions and notifications",
      es: "Interacciones y notificaciones",
    },
  },
  {
    id: "privacidade",
    icon: "shield",
    titulo: {
      pt: "Privacidade e dados",
      en: "Privacy and data",
      es: "Privacidad y datos",
    },
    descricao: {
      pt: "Visibilidade e backup",
      en: "Visibility and backup",
      es: "Visibilidad y copia",
    },
  },
];

const PERGUNTAS_AJUDA: PerguntaAjuda[] = [
  {
    id: "entrar-conta",
    categoria: "conta",
    pergunta: {
      pt: "Como entrar na minha conta?",
      en: "How do I sign in to my account?",
      es: "¿Cómo inicio sesión en mi cuenta?",
    },
    resposta: {
      pt: "Abra a página de login, informe o e-mail e a senha cadastrados e conclua o acesso. Quando uma área exigir autenticação, o Historietas também encaminhará você para o login e retornará à página anterior depois da entrada.",
      en: "Open the sign-in page, enter your registered email and password, and complete access. When an area requires authentication, Historietas will also send you to sign in and return you to the previous page afterward.",
      es: "Abre la página de acceso, escribe el correo y la contraseña registrados y completa el ingreso. Cuando un área requiera autenticación, Historietas también te enviará al acceso y volverá a la página anterior después.",
    },
    palavrasChave: {
      pt: "login entrar acesso email conta",
      en: "login sign in access email account",
      es: "acceso iniciar sesión correo cuenta",
    },
  },
  {
    id: "alterar-perfil",
    categoria: "conta",
    pergunta: {
      pt: "Como alterar meu nome e meu @username?",
      en: "How do I change my name and @username?",
      es: "¿Cómo cambio mi nombre y mi @username?",
    },
    resposta: {
      pt: "Abra Configurações, edite o nome de exibição e o @username na seção Sua conta e toque em Salvar alterações. O @username precisa ter pelo menos três caracteres e não pode estar em uso por outra conta.",
      en: "Open Settings, edit the display name and @username in the Your account section, and select Save changes. The @username must have at least three characters and cannot already be used by another account.",
      es: "Abre Configuración, edita el nombre visible y el @username en la sección Tu cuenta y pulsa Guardar cambios. El @username debe tener al menos tres caracteres y no puede estar en uso por otra cuenta.",
    },
    palavrasChave: {
      pt: "nome username arroba perfil editar",
      en: "name username handle profile edit",
      es: "nombre username usuario perfil editar",
    },
  },
  {
    id: "alterar-senha",
    categoria: "conta",
    pergunta: {
      pt: "Como alterar minha senha?",
      en: "How do I change my password?",
      es: "¿Cómo cambio mi contraseña?",
    },
    resposta: {
      pt: "Em Configurações, abra Senha e segurança. Informe a senha atual, crie uma nova senha com pelo menos oito caracteres, incluindo uma letra e um número, confirme e conclua a alteração.",
      en: "In Settings, open Password and security. Enter your current password, create a new one with at least eight characters including a letter and a number, confirm it, and complete the change.",
      es: "En Configuración, abre Contraseña y seguridad. Escribe la contraseña actual, crea una nueva con al menos ocho caracteres, incluyendo una letra y un número, confírmala y completa el cambio.",
    },
    palavrasChave: {
      pt: "senha segurança trocar alterar acesso",
      en: "password security change access",
      es: "contraseña seguridad cambiar acceso",
    },
  },
  {
    id: "publicar-obra",
    categoria: "publicacao",
    pergunta: {
      pt: "Como publicar uma obra?",
      en: "How do I publish a work?",
      es: "¿Cómo publico una obra?",
    },
    resposta: {
      pt: "Toque em Publicar na barra inferior, preencha título, autoria, gênero, formato, classificação indicativa, sinopse, tags e capa. Revise a prévia e conclua a publicação. Depois disso, a obra aparecerá no Painel do Autor.",
      en: "Select Publish in the bottom navigation, fill in the title, authorship, genre, format, age rating, synopsis, tags, and cover. Review the preview and complete publishing. The work will then appear in the Author Dashboard.",
      es: "Pulsa Publicar en la barra inferior, completa título, autoría, género, formato, clasificación, sinopsis, etiquetas y portada. Revisa la vista previa y finaliza la publicación. Después, la obra aparecerá en el Panel del Autor.",
    },
    palavrasChave: {
      pt: "publicar criar obra historia capa sinopse gênero",
      en: "publish create work story cover synopsis genre",
      es: "publicar crear obra historia portada sinopsis género",
    },
  },
  {
    id: "editar-obra",
    categoria: "publicacao",
    pergunta: {
      pt: "Como editar uma obra já publicada?",
      en: "How do I edit a published work?",
      es: "¿Cómo edito una obra publicada?",
    },
    resposta: {
      pt: "Abra o Painel do Autor, localize a obra e entre na opção de edição. Atualize as informações necessárias, confira a prévia e salve. Alterações de conteúdo devem respeitar a classificação indicativa e as regras da plataforma.",
      en: "Open the Author Dashboard, find the work, and enter its editing option. Update the required information, review the preview, and save. Content changes must follow the age rating and platform rules.",
      es: "Abre el Panel del Autor, busca la obra y entra en la opción de edición. Actualiza la información necesaria, revisa la vista previa y guarda. Los cambios deben respetar la clasificación y las reglas de la plataforma.",
    },
    palavrasChave: {
      pt: "editar obra alterar título capa sinopse painel autor",
      en: "edit work change title cover synopsis author dashboard",
      es: "editar obra cambiar título portada sinopsis panel autor",
    },
  },
  {
    id: "capitulos",
    categoria: "publicacao",
    pergunta: {
      pt: "Como adicionar ou editar capítulos?",
      en: "How do I add or edit chapters?",
      es: "¿Cómo agrego o edito capítulos?",
    },
    resposta: {
      pt: "No Painel do Autor, abra a obra desejada e use a ação para adicionar capítulo. Para corrigir um capítulo existente, abra a edição correspondente, faça as mudanças e salve. Confira título, texto e ordem antes de publicar.",
      en: "In the Author Dashboard, open the desired work and use the action to add a chapter. To correct an existing chapter, open its editing option, make the changes, and save. Check the title, text, and order before publishing.",
      es: "En el Panel del Autor, abre la obra y usa la acción para agregar un capítulo. Para corregir uno existente, abre su edición, realiza los cambios y guarda. Revisa el título, el texto y el orden antes de publicar.",
    },
    palavrasChave: {
      pt: "capítulo adicionar editar texto publicar",
      en: "chapter add edit text publish",
      es: "capítulo agregar editar texto publicar",
    },
  },
  {
    id: "biblioteca",
    categoria: "leitura",
    pergunta: {
      pt: "Como funciona a Biblioteca?",
      en: "How does the Library work?",
      es: "¿Cómo funciona la Biblioteca?",
    },
    resposta: {
      pt: "A Biblioteca reúne as obras que você favoritou, concluiu ou acompanha. Abra Minhas listas para navegar entre essas categorias. As informações vinculadas à conta são carregadas novamente quando você acessa o Historietas em outro dispositivo.",
      en: "The Library gathers works you favorited, completed, or follow. Open My lists to browse those categories. Information linked to your account is loaded again when you access Historietas on another device.",
      es: "La Biblioteca reúne las obras que marcaste como favoritas, completaste o sigues. Abre Mis listas para navegar por esas categorías. La información vinculada a tu cuenta vuelve a cargarse al acceder desde otro dispositivo.",
    },
    palavrasChave: {
      pt: "biblioteca listas favoritos concluídas seguindo obras",
      en: "library lists favorites completed following works",
      es: "biblioteca listas favoritos completadas siguiendo obras",
    },
  },
  {
    id: "progresso-leitura",
    categoria: "leitura",
    pergunta: {
      pt: "Meu progresso de leitura é salvo?",
      en: "Is my reading progress saved?",
      es: "¿Se guarda mi progreso de lectura?",
    },
    resposta: {
      pt: "Quando você está conectado, o Historietas registra o capítulo lido e o progresso da obra. Isso permite continuar a leitura e consultar atividades recentes. Em caso de falha de conexão, atualize a página depois que a internet voltar.",
      en: "When you are signed in, Historietas records the chapter read and the work progress. This lets you continue reading and review recent activity. If the connection fails, refresh the page after internet access returns.",
      es: "Cuando has iniciado sesión, Historietas registra el capítulo leído y el progreso de la obra. Esto permite continuar la lectura y revisar la actividad reciente. Si falla la conexión, actualiza la página cuando vuelva internet.",
    },
    palavrasChave: {
      pt: "progresso leitura capítulo lido continuar histórico",
      en: "progress reading chapter read continue history",
      es: "progreso lectura capítulo leído continuar historial",
    },
  },
  {
    id: "seguir-autores",
    categoria: "comunidade",
    pergunta: {
      pt: "Como seguir autores e obras?",
      en: "How do I follow authors and works?",
      es: "¿Cómo sigo a autores y obras?",
    },
    resposta: {
      pt: "Abra o perfil de um autor ou a página de uma obra e use o botão de seguir disponível. O conteúdo acompanhado aparece nas áreas Seguindo e Biblioteca, conforme o tipo de item.",
      en: "Open an author's profile or a work page and use the available follow button. Followed content appears in Following and Library, depending on the item type.",
      es: "Abre el perfil de un autor o la página de una obra y usa el botón para seguir. El contenido seguido aparece en Siguiendo y Biblioteca, según el tipo de elemento.",
    },
    palavrasChave: {
      pt: "seguir autor obra acompanhando seguidores",
      en: "follow author work following followers",
      es: "seguir autor obra siguiendo seguidores",
    },
  },
  {
    id: "notificacoes",
    categoria: "comunidade",
    pergunta: {
      pt: "Onde vejo minhas notificações?",
      en: "Where can I see my notifications?",
      es: "¿Dónde veo mis notificaciones?",
    },
    resposta: {
      pt: "Abra Notificações para ver novos capítulos, comentários, curtidas, seguidores e outras atividades da conta. Você pode marcar itens como lidos e usar os filtros da página para encontrar um aviso específico.",
      en: "Open Notifications to see new chapters, comments, likes, followers, and other account activity. You can mark items as read and use page filters to find a specific notice.",
      es: "Abre Notificaciones para ver capítulos nuevos, comentarios, Me gusta, seguidores y otras actividades de la cuenta. Puedes marcar elementos como leídos y usar los filtros para encontrar un aviso.",
    },
    palavrasChave: {
      pt: "notificações avisos comentários curtidas capítulos seguidores",
      en: "notifications alerts comments likes chapters followers",
      es: "notificaciones avisos comentarios me gusta capítulos seguidores",
    },
  },
  {
    id: "receber-avisos",
    categoria: "comunidade",
    pergunta: {
      pt: "Como parar ou voltar a receber avisos?",
      en: "How do I stop or resume receiving alerts?",
      es: "¿Cómo dejo de recibir avisos o vuelvo a activarlos?",
    },
    resposta: {
      pt: "Em Configurações, use a opção Receber avisos. Ao desligá-la, o contador e as atualizações de notificações em tempo real são interrompidos. Ao ativá-la novamente, o sistema volta a buscar novos avisos.",
      en: "In Settings, use the Receive alerts option. Turning it off stops the notification counter and real-time updates. Turning it on again resumes fetching new alerts.",
      es: "En Configuración, usa la opción Recibir avisos. Al desactivarla se detienen el contador y las actualizaciones en tiempo real. Al activarla de nuevo, el sistema vuelve a buscar avisos.",
    },
    palavrasChave: {
      pt: "receber avisos desligar notificações contador tempo real",
      en: "receive alerts disable notifications counter real time",
      es: "recibir avisos desactivar notificaciones contador tiempo real",
    },
  },
  {
    id: "comentar",
    categoria: "comunidade",
    pergunta: {
      pt: "Como comentar e participar da Comunidade?",
      en: "How do I comment and join the Community?",
      es: "¿Cómo comento y participo en la Comunidad?",
    },
    resposta: {
      pt: "Entre na sua conta e abra uma obra, capítulo, publicação da Comunidade ou entrada do Diário que aceite comentários. Escreva de forma respeitosa e relacionada ao conteúdo. Comentários e respostas podem gerar notificações para outras pessoas.",
      en: "Sign in and open a work, chapter, Community post, or Journal entry that accepts comments. Write respectfully and stay related to the content. Comments and replies may generate notifications for other people.",
      es: "Inicia sesión y abre una obra, capítulo, publicación de la Comunidad o entrada del Diario que acepte comentarios. Escribe con respeto y de forma relacionada con el contenido. Los comentarios y respuestas pueden generar notificaciones.",
    },
    palavrasChave: {
      pt: "comentar resposta comunidade diário obra capítulo",
      en: "comment reply community journal work chapter",
      es: "comentar respuesta comunidad diario obra capítulo",
    },
  },
  {
    id: "perfil-privado",
    categoria: "privacidade",
    pergunta: {
      pt: "Como deixar meu perfil privado?",
      en: "How do I make my profile private?",
      es: "¿Cómo hago privado mi perfil?",
    },
    resposta: {
      pt: "Abra Configurações e ative Perfil privado. Você também pode decidir quem vê cada área do perfil, como obras, sobre, Diário, Comunidade, Biblioteca e atividades. Obras públicas continuam podendo ser acessadas conforme a visibilidade definida para elas.",
      en: "Open Settings and enable Private profile. You can also decide who sees each profile area, such as works, about, Journal, Community, Library, and activity. Public works can still be accessed according to their defined visibility.",
      es: "Abre Configuración y activa Perfil privado. También puedes decidir quién ve cada área del perfil, como obras, información, Diario, Comunidad, Biblioteca y actividad. Las obras públicas siguen accesibles según su visibilidad.",
    },
    palavrasChave: {
      pt: "perfil privado privacidade visibilidade seguidores público",
      en: "private profile privacy visibility followers public",
      es: "perfil privado privacidad visibilidad seguidores público",
    },
  },
  {
    id: "preferencia-local",
    categoria: "privacidade",
    pergunta: {
      pt: "O que significa uma preferência salva apenas neste aparelho?",
      en: "What does a preference saved only on this device mean?",
      es: "¿Qué significa una preferencia guardada solo en este dispositivo?",
    },
    resposta: {
      pt: "Isso acontece quando a mudança foi registrada no navegador, mas não conseguiu sincronizar com o Supabase. A preferência funciona neste aparelho, porém pode não aparecer em outro dispositivo. Verifique a conexão e toque novamente em Salvar alterações.",
      en: "This happens when the change was stored in the browser but could not sync with Supabase. The preference works on this device, but may not appear on another one. Check your connection and select Save changes again.",
      es: "Esto ocurre cuando el cambio se guardó en el navegador, pero no pudo sincronizarse con Supabase. La preferencia funciona en este dispositivo, pero puede no aparecer en otro. Comprueba la conexión y vuelve a pulsar Guardar cambios.",
    },
    palavrasChave: {
      pt: "salvo aparelho sincronizar supabase conexão preferência",
      en: "saved device sync supabase connection preference",
      es: "guardado dispositivo sincronizar supabase conexión preferencia",
    },
  },
  {
    id: "backup",
    categoria: "privacidade",
    pergunta: {
      pt: "Como copiar meus dados ou baixar um backup?",
      en: "How do I copy my data or download a backup?",
      es: "¿Cómo copio mis datos o descargo una copia?",
    },
    resposta: {
      pt: "Na seção Seus dados das Configurações, use Copiar dados para enviar as informações disponíveis à área de transferência ou Baixar backup para gerar um arquivo JSON. O backup reúne os dados locais disponíveis no navegador e não substitui os registros principais da conta no Supabase.",
      en: "In the Your data section of Settings, use Copy data to send available information to the clipboard or Download backup to generate a JSON file. The backup contains local data available in the browser and does not replace the main account records in Supabase.",
      es: "En la sección Tus datos de Configuración, usa Copiar datos para enviar la información disponible al portapapeles o Descargar copia para generar un archivo JSON. La copia contiene datos locales del navegador y no reemplaza los registros principales de la cuenta en Supabase.",
    },
    palavrasChave: {
      pt: "backup baixar copiar dados json exportar",
      en: "backup download copy data json export",
      es: "copia descargar copiar datos json exportar",
    },
  },
];

const ATALHOS_AJUDA: AtalhoAjuda[] = [
  {
    href: "/publicar",
    icon: "pen",
    titulo: {
      pt: "Publicar uma obra",
      en: "Publish a work",
      es: "Publicar una obra",
    },
    descricao: {
      pt: "Abra o formulário de publicação",
      en: "Open the publishing form",
      es: "Abrir el formulario de publicación",
    },
  },
  {
    href: "/painel-autor",
    icon: "spark",
    titulo: {
      pt: "Painel do Autor",
      en: "Author Dashboard",
      es: "Panel del Autor",
    },
    descricao: {
      pt: "Gerencie obras e capítulos",
      en: "Manage works and chapters",
      es: "Gestionar obras y capítulos",
    },
  },
  {
    href: "/listas",
    icon: "book",
    titulo: {
      pt: "Minha biblioteca",
      en: "My library",
      es: "Mi biblioteca",
    },
    descricao: {
      pt: "Veja favoritos, concluídas e seguidas",
      en: "View favorites, completed and followed works",
      es: "Ver favoritas, completadas y seguidas",
    },
  },
  {
    href: "/notificacoes",
    icon: "bell",
    titulo: {
      pt: "Notificações",
      en: "Notifications",
      es: "Notificaciones",
    },
    descricao: {
      pt: "Consulte avisos e atividades",
      en: "Review alerts and activity",
      es: "Revisar avisos y actividad",
    },
  },
  {
    href: "/comunidade",
    icon: "message",
    titulo: {
      pt: "Comunidade",
      en: "Community",
      es: "Comunidad",
    },
    descricao: {
      pt: "Participe das conversas",
      en: "Join the conversations",
      es: "Participar en las conversaciones",
    },
  },
  {
    href: "/configuracoes",
    icon: "settings",
    titulo: {
      pt: "Configurações",
      en: "Settings",
      es: "Configuración",
    },
    descricao: {
      pt: "Ajuste conta, privacidade e dados",
      en: "Adjust account, privacy and data",
      es: "Ajustar cuenta, privacidad y datos",
    },
  },
];

function traduzirTexto(
  texto: TextoTraduzido,
  idioma: HistorietasLanguage,
) {
  if (idioma === "en") {
    return texto.en;
  }

  if (idioma === "es") {
    return texto.es;
  }

  return texto.pt;
}

function SvgIcon({
  name,
  size = 24,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<IconName, ReactNode> = {
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-3.4-3.4" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.6 9.1a2.7 2.7 0 0 1 5.1 1.2c0 2-2.7 2.3-2.7 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    user: (
      <>
        <circle {...common} cx="12" cy="7" r="4" />
        <path {...common} d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    pen: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </>
    ),
    message: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
        <path {...common} d="M8 10h8M8 14h5" />
      </>
    ),
    shield: <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </>
    ),
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    chevronDown: <path {...common} d="m6 9 6 6 6-6" />,
    arrowRight: (
      <>
        <path {...common} d="M5 12h14" />
        <path {...common} d="m12 5 7 7-7 7" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5M12 17v5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5" />
        <path {...common} d="M2 12h5M17 12h5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}

export default function AjudaPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] =
    useState<CategoriaAjudaId>("todos");
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  const perguntasFiltradas = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return PERGUNTAS_AJUDA.filter((item) => {
      const correspondeCategoria =
        categoriaAtiva === "todos" || item.categoria === categoriaAtiva;

      if (!correspondeCategoria) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const conteudo = normalizarTexto(
        `${traduzirTexto(item.pergunta, language)} ${traduzirTexto(
          item.resposta,
          language,
        )} ${traduzirTexto(item.palavrasChave, language)}`,
      );

      return conteudo.includes(buscaNormalizada);
    });
  }, [busca, categoriaAtiva, language]);

  const categoriaSelecionada =
    CATEGORIAS_AJUDA.find((categoria) => categoria.id === categoriaAtiva) ||
    CATEGORIAS_AJUDA[0];

  return (
    <main
      style={pageThemeStyle}
      data-historietas-ajuda-root="true"
    >
      <style>{`${historietasThemeCss}${ajudaPageCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/configuracoes"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Configurações",
              en: "Back to Settings",
              es: "Volver a Configuración",
            })}
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "SUPORTE",
                en: "SUPPORT",
                es: "SOPORTE",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Central de ajuda",
                en: "Help center",
                es: "Centro de ayuda",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <SvgIcon name="help" size={31} strokeWidth={2.15} />
          </span>

          <div style={heroTextStyle}>
            <h2 style={heroTitleStyle}>
              {t({
                pt: "Como podemos ajudar?",
                en: "How can we help?",
                es: "¿Cómo podemos ayudarte?",
              })}
            </h2>
            <p style={heroDescriptionStyle}>
              {t({
                pt: "Encontre respostas sobre sua conta, publicação, leitura, comunidade e privacidade.",
                en: "Find answers about your account, publishing, reading, community, and privacy.",
                es: "Encuentra respuestas sobre tu cuenta, publicación, lectura, comunidad y privacidad.",
              })}
            </p>
          </div>

          <label style={searchBoxStyle} htmlFor="buscar-ajuda">
            <SvgIcon name="search" size={23} strokeWidth={2.3} />
            <input
              id="buscar-ajuda"
              className="ajuda-search-input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder={t({
                pt: "Digite sua dúvida...",
                en: "Type your question...",
                es: "Escribe tu duda...",
              })}
              maxLength={100}
              autoComplete="off"
              style={searchInputStyle}
            />
            {busca ? (
              <button
                type="button"
                className="ajuda-clear-button"
                onClick={() => setBusca("")}
                aria-label={t({
                  pt: "Limpar busca",
                  en: "Clear search",
                  es: "Borrar búsqueda",
                })}
              >
                ×
              </button>
            ) : null}
          </label>
        </section>

        <section style={sectionStyle} aria-labelledby="categorias-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ASSUNTOS",
                  en: "TOPICS",
                  es: "TEMAS",
                })}
              </span>
              <h2 id="categorias-ajuda-titulo" style={sectionTitleStyle}>
                {t({
                  pt: "Escolha uma categoria",
                  en: "Choose a category",
                  es: "Elige una categoría",
                })}
              </h2>
            </div>
          </div>

          <div style={categoriesGridStyle}>
            {CATEGORIAS_AJUDA.map((categoria) => {
              const ativa = categoria.id === categoriaAtiva;

              return (
                <button
                  key={categoria.id}
                  type="button"
                  className="ajuda-category-button"
                  data-active={ativa ? "true" : "false"}
                  aria-pressed={ativa}
                  onClick={() => setCategoriaAtiva(categoria.id)}
                >
                  <span className="ajuda-category-icon">
                    <SvgIcon name={categoria.icon} size={23} strokeWidth={2.05} />
                  </span>
                  <span className="ajuda-category-copy">
                    <strong>{t(categoria.titulo)}</strong>
                    <span>{t(categoria.descricao)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section style={sectionStyle} aria-labelledby="perguntas-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "PERGUNTAS FREQUENTES",
                  en: "FREQUENTLY ASKED QUESTIONS",
                  es: "PREGUNTAS FRECUENTES",
                })}
              </span>
              <h2 id="perguntas-ajuda-titulo" style={sectionTitleStyle}>
                {t(categoriaSelecionada.titulo)}
              </h2>
            </div>

            <span style={resultsCountStyle}>
              {perguntasFiltradas.length}{" "}
              {perguntasFiltradas.length === 1
                ? t({ pt: "resposta", en: "answer", es: "respuesta" })
                : t({ pt: "respostas", en: "answers", es: "respuestas" })}
            </span>
          </div>

          {perguntasFiltradas.length > 0 ? (
            <div style={faqListStyle}>
              {perguntasFiltradas.map((item) => {
                const categoria = CATEGORIAS_AJUDA.find(
                  (entrada) => entrada.id === item.categoria,
                );

                return (
                  <details key={item.id} className="ajuda-faq-details">
                    <summary className="ajuda-faq-summary">
                      <span className="ajuda-faq-icon">
                        <SvgIcon
                          name={categoria?.icon || "help"}
                          size={21}
                          strokeWidth={2.1}
                        />
                      </span>

                      <span className="ajuda-faq-question">
                        {t(item.pergunta)}
                      </span>

                      <span className="ajuda-faq-chevron">
                        <SvgIcon
                          name="chevronDown"
                          size={21}
                          strokeWidth={2.35}
                        />
                      </span>
                    </summary>

                    <div className="ajuda-faq-answer">
                      <p>{t(item.resposta)}</p>
                    </div>
                  </details>
                );
              })}
            </div>
          ) : (
            <div style={emptyStateStyle}>
              <span style={emptyIconStyle}>
                <SvgIcon name="search" size={28} strokeWidth={2.15} />
              </span>
              <strong style={emptyTitleStyle}>
                {t({
                  pt: "Nenhuma resposta encontrada",
                  en: "No answer found",
                  es: "No se encontró ninguna respuesta",
                })}
              </strong>
              <p style={emptyDescriptionStyle}>
                {t({
                  pt: "Tente pesquisar com outras palavras ou escolha Todas para ver os assuntos disponíveis.",
                  en: "Try different words or choose All to view the available topics.",
                  es: "Prueba con otras palabras o elige Todas para ver los temas disponibles.",
                })}
              </p>
              <button
                type="button"
                className="ajuda-reset-button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                }}
              >
                {t({
                  pt: "Mostrar todas as respostas",
                  en: "Show all answers",
                  es: "Mostrar todas las respuestas",
                })}
              </button>
            </div>
          )}
        </section>

        <section style={sectionStyle} aria-labelledby="atalhos-ajuda-titulo">
          <div style={sectionHeadingStyle}>
            <div>
              <span style={sectionKickerStyle}>
                {t({
                  pt: "ACESSO RÁPIDO",
                  en: "QUICK ACCESS",
                  es: "ACCESO RÁPIDO",
                })}
              </span>
              <h2 id="atalhos-ajuda-titulo" style={sectionTitleStyle}>
                {t({
                  pt: "Atalhos úteis",
                  en: "Useful shortcuts",
                  es: "Accesos útiles",
                })}
              </h2>
            </div>
          </div>

          <div style={shortcutsGridStyle}>
            {ATALHOS_AJUDA.map((atalho) => (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="ajuda-shortcut-link"
              >
                <span className="ajuda-shortcut-icon">
                  <SvgIcon name={atalho.icon} size={23} strokeWidth={2.05} />
                </span>
                <span className="ajuda-shortcut-copy">
                  <strong>{t(atalho.titulo)}</strong>
                  <span>{t(atalho.descricao)}</span>
                </span>
                <span className="ajuda-shortcut-arrow">
                  <SvgIcon name="arrowRight" size={20} strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside style={noticeStyle}>
          <span style={noticeIconStyle}>
            <SvgIcon name="shield" size={24} strokeWidth={2.1} />
          </span>
          <div style={noticeTextStyle}>
            <strong>
              {t({
                pt: "Orientações da versão atual",
                en: "Current version guidance",
                es: "Orientaciones de la versión actual",
              })}
            </strong>
            <p>
              {t({
                pt: "Esta central descreve os recursos que já estão disponíveis no Historietas. Novas respostas serão adicionadas conforme a plataforma receber atualizações.",
                en: "This center describes features already available in Historietas. New answers will be added as the platform receives updates.",
                es: "Este centro describe las funciones que ya están disponibles en Historietas. Se agregarán nuevas respuestas a medida que la plataforma reciba actualizaciones.",
              })}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

const ajudaPageCss = `
  [data-historietas-ajuda-root="true"] {
    --ajuda-card: color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent);
    --ajuda-card-strong: color-mix(in srgb, var(--historietas-surface-strong, #120C1E) 94%, transparent);
    --ajuda-control: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent);
    --ajuda-control-hover: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent);
    --ajuda-border: var(--historietas-border-soft, rgba(255,255,255,0.10));
    --ajuda-muted: var(--historietas-text-secondary, #D4D4D8);
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::-webkit-search-cancel-button {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::placeholder {
    color: color-mix(in srgb, var(--ajuda-muted) 70%, transparent);
    opacity: 1;
  }

  [data-historietas-ajuda-root="true"] .ajuda-clear-button {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    font-size: 21px;
    line-height: 1;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button {
    width: 100%;
    min-height: 82px;
    border: 1px solid var(--ajuda-border);
    border-radius: 17px;
    padding: 13px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    background: var(--ajuda-card);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 75%, white 8%);
    background: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, var(--ajuda-card-strong));
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-icon,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon {
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy strong,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 820;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy span,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy span {
    color: var(--ajuda-muted);
    font-size: 12px;
    line-height: 1.32;
    font-weight: 560;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details {
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    background: var(--ajuda-card);
    overflow: hidden;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] {
    background: var(--ajuda-card-strong);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary {
    min-height: 64px;
    padding: 13px 14px;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 11px;
    color: var(--historietas-text-primary, #FFFFFF);
    cursor: pointer;
    list-style: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary::-webkit-details-marker {
    display: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-question {
    min-width: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.3;
    font-weight: 760;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-chevron {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
    transition: transform 180ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] .ajuda-faq-chevron {
    transform: rotate(180deg);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
    padding: 0 16px 16px 63px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer p {
    margin: 0;
    padding-top: 13px;
    border-top: 1px solid var(--ajuda-border);
    color: var(--ajuda-muted);
    font-size: 13px;
    line-height: 1.62;
    font-weight: 540;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    min-height: 42px;
    border: 1px solid var(--ajuda-border);
    border-radius: 12px;
    padding: 9px 14px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link {
    min-height: 76px;
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 10px;
    background: var(--ajuda-card);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, background 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-arrow {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] {
    --ajuda-card: #050505;
    --ajuda-card-strong: #000000;
    --ajuda-control: rgba(255,255,255,0.08);
    --ajuda-control-hover: rgba(255,255,255,0.10);
    --ajuda-border: rgba(255,255,255,0.18);
    --ajuda-muted: #A1A1AA;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: #FFFFFF;
    background: #000000;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon,
  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 680px) {
    [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
      padding-left: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-ajuda-root="true"] *,
    [data-historietas-ajuda-root="true"] *::before,
    [data-historietas-ajuda-root="true"] *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(920px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 124px",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  marginBottom: "17px",
};

const backButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

const headerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "2px",
};

const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.16em",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(21px, 5vw, 27px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

const heroStyle: CSSProperties = {
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px)",
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1fr)",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "26px",
};

const heroIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const heroTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "center",
  gap: "6px",
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(24px, 6vw, 38px)",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.055em",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "660px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

const searchBoxStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "52px",
  marginTop: "8px",
  borderRadius: "16px",
  padding: "0 12px 0 15px",
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  border: 0,
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  font: "inherit",
  fontSize: "15px",
  fontWeight: 650,
};

const sectionStyle: CSSProperties = {
  marginBottom: "27px",
};

const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "12px",
};

const sectionKickerStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.5vw, 22px)",
  lineHeight: 1.1,
  fontWeight: 870,
  letterSpacing: "-0.035em",
};

const resultsCountStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 7%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 760,
};

const categoriesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
  gap: "10px",
};

const faqListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const emptyStateStyle: CSSProperties = {
  minHeight: "240px",
  borderRadius: "19px",
  padding: "28px 18px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const emptyIconStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  marginBottom: "13px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const emptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.15,
  fontWeight: 850,
};

const emptyDescriptionStyle: CSSProperties = {
  maxWidth: "520px",
  margin: "8px 0 16px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 540,
};

const shortcutsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "10px",
};

const noticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const noticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const noticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};