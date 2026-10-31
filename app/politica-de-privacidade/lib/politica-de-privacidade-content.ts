import type { HistorietasLanguage } from "../../../lib/i18n";

export type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

export type IconName =
  | "arrowLeft"
  | "arrowRight"
  | "shield"
  | "user"
  | "database"
  | "book"
  | "activity"
  | "settings"
  | "eye"
  | "device"
  | "share"
  | "globe"
  | "clock"
  | "lock"
  | "check"
  | "children"
  | "refresh"
  | "help"
  | "info"
  | "download"
  | "alert";

export type SecaoPrivacidade = {
  id: string;
  numero: string;
  icon: IconName;
  titulo: TextoTraduzido;
  resumo: TextoTraduzido;
  paragrafos: TextoTraduzido[];
  itens?: TextoTraduzido[];
};

export type DestaquePrivacidade = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export const ULTIMA_ATUALIZACAO: TextoTraduzido = {
  pt: "5 de agosto de 2026",
  en: "August 5, 2026",
  es: "5 de agosto de 2026",
};

export const DESTAQUES_PRIVACIDADE: DestaquePrivacidade[] = [
  {
    icon: "eye",
    titulo: {
      pt: "Transparência",
      en: "Transparency",
      es: "Transparencia",
    },
    descricao: {
      pt: "Explicamos quais dados são usados e para quais finalidades.",
      en: "We explain which data is used and for what purposes.",
      es: "Explicamos qué datos se utilizan y con qué finalidades.",
    },
  },
  {
    icon: "settings",
    titulo: {
      pt: "Controles de privacidade",
      en: "Privacy controls",
      es: "Controles de privacidad",
    },
    descricao: {
      pt: "Você pode controlar a visibilidade de diferentes áreas do perfil.",
      en: "You may control the visibility of different profile areas.",
      es: "Puedes controlar la visibilidad de distintas áreas del perfil.",
    },
  },
  {
    icon: "lock",
    titulo: {
      pt: "Proteção dos dados",
      en: "Data protection",
      es: "Protección de datos",
    },
    descricao: {
      pt: "Adotamos medidas para reduzir riscos de acesso, alteração ou perda indevida.",
      en: "We adopt measures to reduce the risk of unauthorized access, alteration, or loss.",
      es: "Adoptamos medidas para reducir riesgos de acceso, alteración o pérdida indebida.",
    },
  },
];

export const SECOES_PRIVACIDADE: SecaoPrivacidade[] = [
  {
    id: "sobre-politica",
    numero: "1",
    icon: "shield",
    titulo: {
      pt: "Sobre esta Política e quem trata os dados",
      en: "About this Policy and who processes the data",
      es: "Sobre esta Política y quién trata los datos",
    },
    resumo: {
      pt: "Este documento explica como o Historietas utiliza dados pessoais.",
      en: "This document explains how Historietas uses personal data.",
      es: "Este documento explica cómo Historietas utiliza datos personales.",
    },
    paragrafos: [
      {
        pt: "Esta Política de Privacidade se aplica ao site Historietas e aos recursos associados à criação de contas, publicação e leitura de obras, perfis, comunidade, diário, biblioteca, comentários, avaliações, notificações e configurações.",
        en: "This Privacy Policy applies to the Historietas website and features related to account creation, publishing and reading works, profiles, community, journal, library, comments, ratings, notifications, and settings.",
        es: "Esta Política de Privacidad se aplica al sitio Historietas y a las funciones relacionadas con la creación de cuentas, publicación y lectura de obras, perfiles, comunidad, diario, biblioteca, comentarios, valoraciones, notificaciones y configuración.",
      },
      {
        pt: "Para os tratamentos descritos nesta Política, o Historietas atua como responsável pelas decisões sobre o uso dos dados pessoais, sem prejuízo das responsabilidades próprias dos fornecedores que prestam serviços técnicos.",
        en: "For the processing described in this Policy, Historietas is responsible for decisions about the use of personal data, without prejudice to the independent responsibilities of technical service providers.",
        es: "Para los tratamientos descritos en esta Política, Historietas es responsable de las decisiones sobre el uso de los datos personales, sin perjuicio de las responsabilidades propias de los proveedores que prestan servicios técnicos.",
      },
      {
        pt: "Solicitações relacionadas à privacidade podem ser encaminhadas pela Central de ajuda. Para excluir a conta, use Configurações → Zona de risco → Excluir minha conta ou a página pública /excluir-conta caso não consiga entrar.",
        en: "Privacy-related requests may be submitted through the Help center. To delete your account, use Settings → Danger zone → Delete my account, or the public /excluir-conta page if you cannot sign in.",
        es: "Las solicitudes relacionadas con la privacidad pueden enviarse mediante el Centro de ayuda. Para eliminar la cuenta, usa Configuración → Zona de riesgo → Eliminar mi cuenta o la página pública /excluir-conta si no puedes iniciar sesión.",
      },
    ],
  },
  {
    id: "dados-coletados",
    numero: "2",
    icon: "database",
    titulo: {
      pt: "Quais dados podem ser utilizados",
      en: "Which data may be used",
      es: "Qué datos pueden utilizarse",
    },
    resumo: {
      pt: "Os dados variam conforme os recursos utilizados por cada pessoa.",
      en: "The data varies according to the features each person uses.",
      es: "Los datos varían según las funciones que utiliza cada persona.",
    },
    paragrafos: [
      {
        pt: "O Historietas utiliza apenas as categorias de dados necessárias para oferecer, proteger e melhorar seus recursos. Nem todas as categorias abaixo serão utilizadas para todos os usuários.",
        en: "Historietas uses only the categories of data necessary to provide, protect, and improve its features. Not every category below will be used for every user.",
        es: "Historietas utiliza solo las categorías de datos necesarias para ofrecer, proteger y mejorar sus funciones. No todas las categorías siguientes se utilizarán para todos los usuarios.",
      },
    ],
    itens: [
      {
        pt: "Dados da conta: identificador interno, nome, nome de usuário, endereço de e-mail, senha protegida pelo serviço de autenticação, informações de sessão e metadados necessários ao acesso.",
        en: "Account data: internal identifier, name, username, email address, password protected by the authentication service, session information, and metadata required for access.",
        es: "Datos de la cuenta: identificador interno, nombre, nombre de usuario, dirección de correo electrónico, contraseña protegida por el servicio de autenticación, información de sesión y metadatos necesarios para el acceso.",
      },
      {
        pt: "Dados do perfil: imagem de perfil, biografia, informações de apresentação, preferências de visibilidade e outros campos preenchidos voluntariamente.",
        en: "Profile data: profile image, biography, presentation information, visibility preferences, and other fields voluntarily completed.",
        es: "Datos del perfil: imagen de perfil, biografía, información de presentación, preferencias de visibilidad y otros campos completados voluntariamente.",
      },
      {
        pt: "Conteúdo publicado: obras, títulos, sinopses, gêneros, capas, capítulos, imagens, diário, publicações da comunidade, comentários e demais materiais enviados.",
        en: "Published content: works, titles, synopses, genres, covers, chapters, images, journal entries, community posts, comments, and other submitted materials.",
        es: "Contenido publicado: obras, títulos, sinopsis, géneros, portadas, capítulos, imágenes, diario, publicaciones de la comunidad, comentarios y otros materiales enviados.",
      },
      {
        pt: "Interações: seguidores, solicitações de seguidores, obras e autores seguidos, curtidas, favoritos, avaliações, comentários, votos em enquetes, itens salvos, obras concluídas e progresso de leitura.",
        en: "Interactions: followers, follow requests, followed works and authors, likes, favorites, ratings, comments, poll votes, saved items, completed works, and reading progress.",
        es: "Interacciones: seguidores, solicitudes de seguimiento, obras y autores seguidos, me gusta, favoritos, valoraciones, comentarios, votos en encuestas, elementos guardados, obras completadas y progreso de lectura.",
      },
      {
        pt: "Dados de segurança e moderação: denúncias, registros de ações administrativas, conteúdo denunciado, histórico necessário para análise de abuso e comunicações relacionadas.",
        en: "Security and moderation data: reports, administrative action records, reported content, history needed to review abuse, and related communications.",
        es: "Datos de seguridad y moderación: denuncias, registros de acciones administrativas, contenido denunciado, historial necesario para analizar abusos y comunicaciones relacionadas.",
      },
      {
        pt: "Dados técnicos: endereço IP, navegador, tipo de dispositivo, sistema operacional, horários de acesso, identificadores de sessão, registros de erro e eventos de segurança que possam ser processados pela infraestrutura técnica.",
        en: "Technical data: IP address, browser, device type, operating system, access times, session identifiers, error logs, and security events that may be processed by the technical infrastructure.",
        es: "Datos técnicos: dirección IP, navegador, tipo de dispositivo, sistema operativo, horarios de acceso, identificadores de sesión, registros de error y eventos de seguridad que puedan ser procesados por la infraestructura técnica.",
      },
      {
        pt: "Preferências do navegador: idioma, tema visual, recebimento de avisos, controles de privacidade, preferências de leitura e dados usados por recursos locais de resumo ou backup.",
        en: "Browser preferences: language, visual theme, alert preferences, privacy controls, reading preferences, and data used by local summary or backup features.",
        es: "Preferencias del navegador: idioma, tema visual, recepción de avisos, controles de privacidad, preferencias de lectura y datos utilizados por funciones locales de resumen o copia de seguridad.",
      },
    ],
  },
  {
    id: "origem-dados",
    numero: "3",
    icon: "activity",
    titulo: {
      pt: "Como os dados são obtidos",
      en: "How data is obtained",
      es: "Cómo se obtienen los datos",
    },
    resumo: {
      pt: "Os dados podem ser fornecidos, gerados pelo uso ou recebidos da infraestrutura.",
      en: "Data may be provided, generated through use, or received from infrastructure.",
      es: "Los datos pueden ser proporcionados, generados por el uso o recibidos de la infraestructura.",
    },
    paragrafos: [
      {
        pt: "Parte dos dados é fornecida diretamente por você ao criar a conta, editar o perfil, publicar conteúdo, enviar comentários, participar da comunidade, configurar a privacidade ou solicitar atendimento.",
        en: "Some data is provided directly by you when creating an account, editing a profile, publishing content, submitting comments, participating in the community, configuring privacy, or requesting support.",
        es: "Parte de los datos es proporcionada directamente por ti al crear una cuenta, editar el perfil, publicar contenido, enviar comentarios, participar en la comunidad, configurar la privacidad o solicitar atención.",
      },
      {
        pt: "Outros dados são gerados durante o uso da plataforma, como progresso de leitura, favoritos, seguidores, avaliações, curtidas, notificações e registros necessários para manter a sessão e a segurança.",
        en: "Other data is generated while using the platform, such as reading progress, favorites, followers, ratings, likes, notifications, and records required to maintain sessions and security.",
        es: "Otros datos se generan durante el uso de la plataforma, como progreso de lectura, favoritos, seguidores, valoraciones, me gusta, notificaciones y registros necesarios para mantener la sesión y la seguridad.",
      },
      {
        pt: "Fornecedores de autenticação, banco de dados, hospedagem e infraestrutura podem gerar registros técnicos indispensáveis ao funcionamento, à prevenção de fraude e à investigação de falhas.",
        en: "Authentication, database, hosting, and infrastructure providers may generate technical records necessary for operation, fraud prevention, and failure investigation.",
        es: "Los proveedores de autenticación, base de datos, alojamiento e infraestructura pueden generar registros técnicos necesarios para el funcionamiento, la prevención del fraude y la investigación de fallos.",
      },
    ],
  },
  {
    id: "finalidades-bases",
    numero: "4",
    icon: "check",
    titulo: {
      pt: "Finalidades e fundamentos para o tratamento",
      en: "Purposes and grounds for processing",
      es: "Finalidades y fundamentos del tratamiento",
    },
    resumo: {
      pt: "Os dados são utilizados para finalidades específicas ligadas ao serviço.",
      en: "Data is used for specific purposes related to the service.",
      es: "Los datos se utilizan para finalidades específicas relacionadas con el servicio.",
    },
    paragrafos: [
      {
        pt: "Dependendo do contexto, o tratamento pode ser necessário para executar os serviços solicitados pelo usuário, cumprir obrigações legais, exercer direitos, proteger pessoas e a plataforma, atender interesses legítimos compatíveis com os direitos do titular ou cumprir uma autorização específica.",
        en: "Depending on the context, processing may be necessary to perform services requested by the user, comply with legal obligations, exercise rights, protect people and the platform, pursue legitimate interests compatible with the data subject's rights, or comply with specific authorization.",
        es: "Según el contexto, el tratamiento puede ser necesario para prestar los servicios solicitados por el usuario, cumplir obligaciones legales, ejercer derechos, proteger a las personas y la plataforma, atender intereses legítimos compatibles con los derechos del titular o cumplir una autorización específica.",
      },
    ],
    itens: [
      {
        pt: "Criar, autenticar e administrar contas.",
        en: "Create, authenticate, and manage accounts.",
        es: "Crear, autenticar y administrar cuentas.",
      },
      {
        pt: "Permitir publicação, edição, armazenamento, leitura e descoberta de obras e capítulos.",
        en: "Enable publication, editing, storage, reading, and discovery of works and chapters.",
        es: "Permitir la publicación, edición, almacenamiento, lectura y descubrimiento de obras y capítulos.",
      },
      {
        pt: "Exibir perfis e conteúdos conforme as escolhas de visibilidade.",
        en: "Display profiles and content according to visibility choices.",
        es: "Mostrar perfiles y contenidos según las opciones de visibilidad.",
      },
      {
        pt: "Registrar biblioteca, progresso, favoritos, avaliações, seguidores e outras interações solicitadas.",
        en: "Record library items, progress, favorites, ratings, followers, and other requested interactions.",
        es: "Registrar biblioteca, progreso, favoritos, valoraciones, seguidores y otras interacciones solicitadas.",
      },
      {
        pt: "Entregar notificações e avisos quando essa preferência estiver habilitada.",
        en: "Deliver notifications and alerts when this preference is enabled.",
        es: "Entregar notificaciones y avisos cuando esta preferencia esté habilitada.",
      },
      {
        pt: "Prevenir fraude, abuso, invasões, spam, manipulação de métricas e outras violações.",
        en: "Prevent fraud, abuse, intrusions, spam, metric manipulation, and other violations.",
        es: "Prevenir fraude, abuso, intrusiones, spam, manipulación de métricas y otras infracciones.",
      },
      {
        pt: "Analisar denúncias, aplicar regras e cumprir decisões ou obrigações legais.",
        en: "Review reports, enforce rules, and comply with decisions or legal obligations.",
        es: "Analizar denuncias, aplicar reglas y cumplir decisiones u obligaciones legales.",
      },
      {
        pt: "Corrigir erros, manter a estabilidade, compreender o uso dos recursos e melhorar a experiência.",
        en: "Fix errors, maintain stability, understand feature use, and improve the experience.",
        es: "Corregir errores, mantener la estabilidad, comprender el uso de las funciones y mejorar la experiencia.",
      },
    ],
  },
  {
    id: "conteudo-publico",
    numero: "5",
    icon: "eye",
    titulo: {
      pt: "Conteúdo público e controles de visibilidade",
      en: "Public content and visibility controls",
      es: "Contenido público y controles de visibilidad",
    },
    resumo: {
      pt: "A visibilidade depende do tipo de conteúdo e das configurações escolhidas.",
      en: "Visibility depends on the content type and selected settings.",
      es: "La visibilidad depende del tipo de contenido y de la configuración elegida.",
    },
    paragrafos: [
      {
        pt: "Obras publicadas, nome de autor, nome de usuário, imagem de perfil e outras informações destinadas à divulgação podem ser visíveis para outras pessoas e aparecer em páginas de exploração, rankings, pesquisas ou compartilhamentos.",
        en: "Published works, author name, username, profile image, and other information intended for disclosure may be visible to others and appear on discovery pages, rankings, searches, or shares.",
        es: "Las obras publicadas, el nombre de autor, el nombre de usuario, la imagen de perfil y otra información destinada a la difusión pueden ser visibles para otras personas y aparecer en páginas de exploración, clasificaciones, búsquedas o compartidos.",
      },
      {
        pt: "O Historietas oferece controles para definir quem pode visualizar diferentes áreas, incluindo perfil, obras, informações pessoais de apresentação, diário, comunidade, biblioteca e atividades. Algumas obras podem permanecer públicas mesmo quando outras partes do perfil são restritas, conforme a escolha realizada.",
        en: "Historietas provides controls to define who may view different areas, including profile, works, personal presentation information, journal, community, library, and activities. Some works may remain public even when other profile areas are restricted, according to the selected choice.",
        es: "Historietas ofrece controles para definir quién puede ver distintas áreas, incluidos perfil, obras, información personal de presentación, diario, comunidad, biblioteca y actividades. Algunas obras pueden permanecer públicas aunque otras partes del perfil estén restringidas, según la opción elegida.",
      },
      {
        pt: "Mesmo após a remoção de uma publicação, cópias feitas por terceiros, resultados temporários de mecanismos de busca ou registros necessários ao cumprimento de obrigações podem permanecer fora do controle imediato do Historietas.",
        en: "Even after a publication is removed, copies made by third parties, temporary search engine results, or records required to meet obligations may remain outside Historietas' immediate control.",
        es: "Incluso después de eliminar una publicación, las copias realizadas por terceros, los resultados temporales de motores de búsqueda o los registros necesarios para cumplir obligaciones pueden permanecer fuera del control inmediato de Historietas.",
      },
    ],
  },
  {
    id: "armazenamento-local",
    numero: "6",
    icon: "device",
    titulo: {
      pt: "Armazenamento no navegador e tecnologias de sessão",
      en: "Browser storage and session technologies",
      es: "Almacenamiento en el navegador y tecnologías de sesión",
    },
    resumo: {
      pt: "Algumas preferências e dados auxiliares podem permanecer no próprio dispositivo.",
      en: "Some preferences and supporting data may remain on the device itself.",
      es: "Algunas preferencias y datos auxiliares pueden permanecer en el propio dispositivo.",
    },
    paragrafos: [
      {
        pt: "O Historietas utiliza armazenamento local do navegador para manter preferências como idioma, tema visual, recebimento de avisos, configurações de privacidade, informações auxiliares de biblioteca e outros estados necessários para a experiência.",
        en: "Historietas uses browser local storage to maintain preferences such as language, visual theme, alert settings, privacy settings, supporting library information, and other states required for the experience.",
        es: "Historietas utiliza el almacenamiento local del navegador para mantener preferencias como idioma, tema visual, recepción de avisos, configuración de privacidad, información auxiliar de biblioteca y otros estados necesarios para la experiencia.",
      },
      {
        pt: "O serviço de autenticação também pode utilizar tecnologias essenciais de sessão, como armazenamento local, armazenamento de sessão ou cookies técnicos, conforme a configuração adotada pelo navegador e pela infraestrutura.",
        en: "The authentication service may also use essential session technologies, such as local storage, session storage, or technical cookies, depending on browser and infrastructure configuration.",
        es: "El servicio de autenticación también puede utilizar tecnologías esenciales de sesión, como almacenamiento local, almacenamiento de sesión o cookies técnicas, según la configuración del navegador y la infraestructura.",
      },
      {
        pt: "Ao limpar os dados do navegador, trocar de dispositivo ou utilizar navegação privada, preferências mantidas apenas localmente podem ser perdidas. Quando uma sincronização com o banco de dados falhar, o Historietas informa que a alteração ficou salva somente no aparelho.",
        en: "When clearing browser data, changing devices, or using private browsing, preferences stored only locally may be lost. When database synchronization fails, Historietas informs the user that the change was saved only on the device.",
        es: "Al borrar los datos del navegador, cambiar de dispositivo o utilizar navegación privada, las preferencias almacenadas solo localmente pueden perderse. Cuando falla la sincronización con la base de datos, Historietas informa que el cambio se guardó solo en el dispositivo.",
      },
      {
        pt: "A ferramenta de copiar dados ou baixar backup pode reunir informações salvas no navegador. Ela não deve ser interpretada como uma exportação integral de todos os registros mantidos na infraestrutura do Historietas.",
        en: "The copy data or download backup feature may gather information stored in the browser. It should not be interpreted as a complete export of every record maintained in Historietas infrastructure.",
        es: "La función de copiar datos o descargar una copia de seguridad puede reunir información guardada en el navegador. No debe interpretarse como una exportación completa de todos los registros mantenidos en la infraestructura de Historietas.",
      },
    ],
  },
  {
    id: "compartilhamento",
    numero: "7",
    icon: "share",
    titulo: {
      pt: "Compartilhamento e fornecedores de serviço",
      en: "Sharing and service providers",
      es: "Uso compartido y proveedores de servicios",
    },
    resumo: {
      pt: "Dados são compartilhados apenas quando necessário ao serviço ou exigido por lei.",
      en: "Data is shared only when necessary for the service or required by law.",
      es: "Los datos se comparten solo cuando es necesario para el servicio o exigido por la ley.",
    },
    paragrafos: [
      {
        pt: "O Historietas utiliza fornecedores técnicos para autenticação, banco de dados, armazenamento, hospedagem, segurança e entrega do site. No funcionamento atual, o Supabase é utilizado em recursos de autenticação e banco de dados.",
        en: "Historietas uses technical providers for authentication, database, storage, hosting, security, and site delivery. In the current operation, Supabase is used for authentication and database features.",
        es: "Historietas utiliza proveedores técnicos para autenticación, base de datos, almacenamiento, alojamiento, seguridad y entrega del sitio. En el funcionamiento actual, Supabase se utiliza para funciones de autenticación y base de datos.",
      },
      {
        pt: "Esses fornecedores podem processar dados em nome do Historietas ou de acordo com responsabilidades próprias, observando contratos, medidas de segurança e regras aplicáveis.",
        en: "These providers may process data on behalf of Historietas or under their own responsibilities, subject to contracts, security measures, and applicable rules.",
        es: "Estos proveedores pueden tratar datos en nombre de Historietas o conforme a sus propias responsabilidades, respetando contratos, medidas de seguridad y reglas aplicables.",
      },
      {
        pt: "Dados também podem ser fornecidos para cumprir lei, ordem judicial ou solicitação válida de autoridade; proteger direitos, segurança e integridade; investigar fraude ou abuso; ou viabilizar uma reorganização legítima do projeto, com proteção adequada aos titulares.",
        en: "Data may also be provided to comply with law, court order, or a valid authority request; protect rights, safety, and integrity; investigate fraud or abuse; or enable a legitimate project reorganization with appropriate protection for data subjects.",
        es: "Los datos también pueden proporcionarse para cumplir la ley, una orden judicial o una solicitud válida de autoridad; proteger derechos, seguridad e integridad; investigar fraude o abuso; o permitir una reorganización legítima del proyecto con protección adecuada para los titulares.",
      },
      {
        pt: "O Historietas não deve comercializar dados pessoais como produto nem compartilhar informações para finalidades incompatíveis com esta Política.",
        en: "Historietas must not commercialize personal data as a product or share information for purposes incompatible with this Policy.",
        es: "Historietas no debe comercializar datos personales como producto ni compartir información para finalidades incompatibles con esta Política.",
      },
    ],
  },
  {
    id: "transferencia-internacional",
    numero: "8",
    icon: "globe",
    titulo: {
      pt: "Transferência e processamento internacional",
      en: "International transfer and processing",
      es: "Transferencia y tratamiento internacional",
    },
    resumo: {
      pt: "Fornecedores de infraestrutura podem processar informações em outros países.",
      en: "Infrastructure providers may process information in other countries.",
      es: "Los proveedores de infraestructura pueden tratar información en otros países.",
    },
    paragrafos: [
      {
        pt: "Serviços de banco de dados, autenticação, hospedagem, armazenamento ou segurança podem operar servidores e equipes fora do Brasil. Isso pode resultar em transferência ou acesso internacional a dados pessoais.",
        en: "Database, authentication, hosting, storage, or security services may operate servers and teams outside Brazil. This may result in international transfer or access to personal data.",
        es: "Los servicios de base de datos, autenticación, alojamiento, almacenamiento o seguridad pueden operar servidores y equipos fuera de Brasil. Esto puede dar lugar a transferencias o accesos internacionales a datos personales.",
      },
      {
        pt: "Quando houver transferência internacional, serão buscados mecanismos e salvaguardas compatíveis com a legislação aplicável, considerando contratos, medidas de segurança, regras do fornecedor e o nível de proteção disponível.",
        en: "When an international transfer occurs, mechanisms and safeguards compatible with applicable law will be pursued, considering contracts, security measures, provider rules, and the available level of protection.",
        es: "Cuando exista una transferencia internacional, se buscarán mecanismos y salvaguardas compatibles con la legislación aplicable, considerando contratos, medidas de seguridad, reglas del proveedor y el nivel de protección disponible.",
      },
    ],
  },
  {
    id: "retencao",
    numero: "9",
    icon: "clock",
    titulo: {
      pt: "Por quanto tempo os dados são mantidos",
      en: "How long data is retained",
      es: "Durante cuánto tiempo se conservan los datos",
    },
    resumo: {
      pt: "Os prazos dependem da finalidade, do tipo de registro e de obrigações aplicáveis.",
      en: "Retention periods depend on purpose, record type, and applicable obligations.",
      es: "Los plazos dependen de la finalidad, el tipo de registro y las obligaciones aplicables.",
    },
    paragrafos: [
      {
        pt: "Dados da conta e conteúdos permanecem enquanto forem necessários para oferecer o serviço ou enquanto a conta e as publicações estiverem ativas.",
        en: "Account data and content remain while needed to provide the service or while the account and publications are active.",
        es: "Los datos de la cuenta y los contenidos permanecen mientras sean necesarios para prestar el servicio o mientras la cuenta y las publicaciones estén activas.",
      },
      {
        pt: "Após exclusão ou encerramento, determinados registros podem ser mantidos durante o período necessário para concluir operações, restaurar consistência técnica, preservar backups temporários, combater fraude, atender solicitações, exercer direitos ou cumprir obrigação legal.",
        en: "After deletion or closure, certain records may be retained for the time necessary to complete operations, restore technical consistency, preserve temporary backups, combat fraud, respond to requests, exercise rights, or comply with a legal obligation.",
        es: "Después de la eliminación o cierre, determinados registros pueden conservarse durante el período necesario para completar operaciones, restaurar la consistencia técnica, preservar copias temporales, combatir fraude, atender solicitudes, ejercer derechos o cumplir una obligación legal.",
      },
      {
        pt: "Dados anonimizados, que não permitam identificar razoavelmente uma pessoa, podem ser mantidos para estatísticas, segurança, melhoria e compreensão geral do serviço.",
        en: "Anonymized data that does not reasonably identify a person may be retained for statistics, security, improvement, and general understanding of the service.",
        es: "Los datos anonimizados que no permitan identificar razonablemente a una persona pueden conservarse para estadísticas, seguridad, mejora y comprensión general del servicio.",
      },
    ],
  },
  {
    id: "seguranca",
    numero: "10",
    icon: "lock",
    titulo: {
      pt: "Segurança e incidentes",
      en: "Security and incidents",
      es: "Seguridad e incidentes",
    },
    resumo: {
      pt: "Medidas técnicas e administrativas são utilizadas para reduzir riscos.",
      en: "Technical and administrative measures are used to reduce risks.",
      es: "Se utilizan medidas técnicas y administrativas para reducir riesgos.",
    },
    paragrafos: [
      {
        pt: "O Historietas busca utilizar autenticação, controle de acesso, políticas de banco de dados, validações, registros de segurança e outras medidas compatíveis com o porte e os riscos do serviço.",
        en: "Historietas seeks to use authentication, access controls, database policies, validation, security records, and other measures compatible with the size and risks of the service.",
        es: "Historietas procura utilizar autenticación, controles de acceso, políticas de base de datos, validaciones, registros de seguridad y otras medidas compatibles con el tamaño y los riesgos del servicio.",
      },
      {
        pt: "Nenhum sistema é completamente livre de riscos. Você também deve proteger sua senha, manter seus dispositivos seguros, evitar links suspeitos e comunicar acessos não reconhecidos.",
        en: "No system is completely risk-free. You should also protect your password, keep devices secure, avoid suspicious links, and report unrecognized access.",
        es: "Ningún sistema está completamente libre de riesgos. También debes proteger tu contraseña, mantener seguros tus dispositivos, evitar enlaces sospechosos e informar accesos no reconocidos.",
      },
      {
        pt: "Em caso de incidente de segurança relevante, serão adotadas medidas para conter o evento, avaliar impactos, preservar evidências, corrigir vulnerabilidades e realizar as comunicações exigidas pela legislação e pelas autoridades competentes.",
        en: "In the event of a relevant security incident, measures will be taken to contain the event, assess impacts, preserve evidence, correct vulnerabilities, and make communications required by law and competent authorities.",
        es: "En caso de un incidente de seguridad relevante, se adoptarán medidas para contener el evento, evaluar impactos, preservar evidencias, corregir vulnerabilidades y realizar las comunicaciones exigidas por la ley y las autoridades competentes.",
      },
    ],
  },
  {
    id: "direitos",
    numero: "11",
    icon: "user",
    titulo: {
      pt: "Seus direitos sobre os dados pessoais",
      en: "Your rights regarding personal data",
      es: "Tus derechos sobre los datos personales",
    },
    resumo: {
      pt: "Você pode solicitar informações e medidas previstas na legislação aplicável.",
      en: "You may request information and measures provided by applicable law.",
      es: "Puedes solicitar información y medidas previstas por la legislación aplicable.",
    },
    paragrafos: [
      {
        pt: "Nos limites e condições da legislação, você pode solicitar confirmação da existência de tratamento, acesso aos dados, correção de informações incompletas ou desatualizadas e informações sobre compartilhamento.",
        en: "Within the limits and conditions of the law, you may request confirmation of processing, access to data, correction of incomplete or outdated information, and information about sharing.",
        es: "Dentro de los límites y condiciones de la ley, puedes solicitar confirmación del tratamiento, acceso a los datos, corrección de información incompleta o desactualizada e información sobre el uso compartido.",
      },
      {
        pt: "Também podem ser solicitados anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade, portabilidade quando aplicável e regulamentada, eliminação de dados tratados com consentimento e revogação de consentimento.",
        en: "You may also request anonymization, blocking, or deletion of unnecessary or non-compliant data, portability when applicable and regulated, deletion of data processed with consent, and withdrawal of consent.",
        es: "También puedes solicitar anonimización, bloqueo o eliminación de datos innecesarios o tratados de forma irregular, portabilidad cuando sea aplicable y esté regulada, eliminación de datos tratados con consentimiento y revocación del consentimiento.",
      },
      {
        pt: "Quando houver decisão tomada exclusivamente por tratamento automatizado que afete seus interesses, você poderá solicitar as informações e revisões cabíveis conforme a legislação.",
        en: "When a decision is made exclusively through automated processing and affects your interests, you may request applicable information and review under the law.",
        es: "Cuando exista una decisión tomada exclusivamente mediante tratamiento automatizado que afecte tus intereses, podrás solicitar la información y revisión correspondientes conforme a la ley.",
      },
      {
        pt: "Para proteger a conta, o Historietas poderá solicitar informações suficientes para confirmar a identidade e a legitimidade do pedido. Algumas solicitações podem ser limitadas quando houver obrigação legal, necessidade de preservação, direitos de terceiros ou outra justificativa permitida.",
        en: "To protect the account, Historietas may request sufficient information to confirm identity and the legitimacy of the request. Some requests may be limited when there is a legal obligation, preservation need, third-party rights, or another permitted justification.",
        es: "Para proteger la cuenta, Historietas podrá solicitar información suficiente para confirmar la identidad y legitimidad de la solicitud. Algunas solicitudes pueden limitarse cuando exista obligación legal, necesidad de conservación, derechos de terceros u otra justificación permitida.",
      },
    ],
  },
  {
    id: "criancas-adolescentes",
    numero: "12",
    icon: "children",
    titulo: {
      pt: "Crianças e adolescentes",
      en: "Children and adolescents",
      es: "Niños y adolescentes",
    },
    resumo: {
      pt: "Dados de pessoas menores de idade exigem cuidados adicionais.",
      en: "Data relating to minors requires additional care.",
      es: "Los datos de personas menores de edad requieren cuidados adicionales.",
    },
    paragrafos: [
      {
        pt: "Pessoas menores de idade devem utilizar o Historietas com conhecimento e acompanhamento de responsável legal quando isso for exigido pela legislação ou necessário à sua proteção.",
        en: "Minors should use Historietas with the knowledge and supervision of a legal guardian when required by law or necessary for their protection.",
        es: "Las personas menores de edad deben utilizar Historietas con conocimiento y supervisión de un responsable legal cuando lo exija la ley o sea necesario para su protección.",
      },
      {
        pt: "O tratamento de dados de crianças e adolescentes deve considerar seu melhor interesse, a natureza do recurso utilizado, a necessidade dos dados e medidas adequadas de transparência e segurança.",
        en: "Processing children's and adolescents' data must consider their best interests, the nature of the feature used, data necessity, and appropriate transparency and security measures.",
        es: "El tratamiento de datos de niños y adolescentes debe considerar su interés superior, la naturaleza de la función utilizada, la necesidad de los datos y medidas adecuadas de transparencia y seguridad.",
      },
      {
        pt: "Responsáveis legais podem utilizar a Central de ajuda para comunicar dúvidas, solicitar orientação ou exercer direitos relacionados a uma conta de pessoa menor de idade.",
        en: "Legal guardians may use the Help center to submit questions, request guidance, or exercise rights relating to a minor's account.",
        es: "Los responsables legales pueden utilizar el Centro de ayuda para comunicar dudas, solicitar orientación o ejercer derechos relacionados con la cuenta de una persona menor de edad.",
      },
    ],
  },
  {
    id: "alteracoes",
    numero: "13",
    icon: "refresh",
    titulo: {
      pt: "Alterações desta Política",
      en: "Changes to this Policy",
      es: "Cambios en esta Política",
    },
    resumo: {
      pt: "O documento pode ser atualizado conforme o serviço evolui.",
      en: "This document may be updated as the service evolves.",
      es: "Este documento puede actualizarse a medida que evoluciona el servicio.",
    },
    paragrafos: [
      {
        pt: "Esta Política poderá ser atualizada para refletir novos recursos, fornecedores, práticas de segurança, mudanças legais ou melhorias de clareza.",
        en: "This Policy may be updated to reflect new features, providers, security practices, legal changes, or clarity improvements.",
        es: "Esta Política podrá actualizarse para reflejar nuevas funciones, proveedores, prácticas de seguridad, cambios legales o mejoras de claridad.",
      },
      {
        pt: "A versão vigente indicará a data da última atualização. Quando uma alteração relevante exigir destaque adicional, o Historietas poderá apresentar aviso na plataforma ou utilizar outro canal adequado.",
        en: "The current version will show the date of the latest update. When a material change requires additional prominence, Historietas may display a notice on the platform or use another appropriate channel.",
        es: "La versión vigente indicará la fecha de la última actualización. Cuando un cambio relevante requiera mayor destaque, Historietas podrá mostrar un aviso en la plataforma o utilizar otro canal adecuado.",
      },
    ],
  },
  {
    id: "contato",
    numero: "14",
    icon: "help",
    titulo: {
      pt: "Contato e solicitações de privacidade",
      en: "Contact and privacy requests",
      es: "Contacto y solicitudes de privacidad",
    },
    resumo: {
      pt: "A Central de ajuda é o canal disponível para dúvidas e solicitações.",
      en: "The Help center is the available channel for questions and requests.",
      es: "El Centro de ayuda es el canal disponible para dudas y solicitudes.",
    },
    paragrafos: [
      {
        pt: "Para exercer direitos, comunicar um incidente, questionar uma prática ou solicitar informações sobre esta Política, utilize a Central de ajuda. Pedidos de exclusão de conta também podem ser feitos pela página pública /excluir-conta.",
        en: "To exercise rights, report an incident, question a practice, or request information about this Policy, use the Help center. Account deletion requests may also be submitted through the public /excluir-conta page.",
        es: "Para ejercer derechos, comunicar un incidente, cuestionar una práctica o solicitar información sobre esta Política, utiliza el Centro de ayuda. Las solicitudes de eliminación de cuenta también pueden enviarse desde la página pública /excluir-conta.",
      },
    ],
  },
];

export function traduzirTexto(
  texto: TextoTraduzido,
  language: HistorietasLanguage,
) {
  if (language === "en") {
    return texto.en;
  }

  if (language === "es") {
    return texto.es;
  }

  return texto.pt;
}
