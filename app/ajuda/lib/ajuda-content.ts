export type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

export type CategoriaAjudaId =
  | "todos"
  | "conta"
  | "publicacao"
  | "leitura"
  | "comunidade"
  | "privacidade";

export type CategoriaAjuda = {
  id: CategoriaAjudaId;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export type PerguntaAjuda = {
  id: string;
  categoria: Exclude<CategoriaAjudaId, "todos">;
  pergunta: TextoTraduzido;
  resposta: TextoTraduzido;
  palavrasChave: TextoTraduzido;
};

export type AtalhoAjuda = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};


export type IconName =
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


export const CATEGORIAS_AJUDA: CategoriaAjuda[] = [
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
export const PERGUNTAS_AJUDA: PerguntaAjuda[] = [
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
export const ATALHOS_AJUDA: AtalhoAjuda[] = [
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
