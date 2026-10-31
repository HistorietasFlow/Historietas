import type { HistorietasLanguage } from "../../../lib/i18n";

export type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

export type IconName =
  | "arrowLeft"
  | "arrowRight"
  | "file"
  | "user"
  | "book"
  | "copyright"
  | "shield"
  | "comment"
  | "alert"
  | "settings"
  | "ban"
  | "server"
  | "scale"
  | "refresh"
  | "help"
  | "check"
  | "info";

export type SecaoTermos = {
  id: string;
  numero: string;
  icon: IconName;
  titulo: TextoTraduzido;
  resumo: TextoTraduzido;
  paragrafos: TextoTraduzido[];
  itens?: TextoTraduzido[];
};

export type DestaqueTermos = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export const ULTIMA_ATUALIZACAO: TextoTraduzido = {
  pt: "5 de agosto de 2026",
  en: "August 5, 2026",
  es: "5 de agosto de 2026",
};

export const DESTAQUES_TERMOS: DestaqueTermos[] = [
  {
    icon: "copyright",
    titulo: {
      pt: "Sua obra continua sendo sua",
      en: "Your work remains yours",
      es: "Tu obra sigue siendo tuya",
    },
    descricao: {
      pt: "O Historietas não assume a autoria nem a propriedade do conteúdo que você publica.",
      en: "Historietas does not claim authorship or ownership of the content you publish.",
      es: "Historietas no asume la autoría ni la propiedad del contenido que publicas.",
    },
  },
  {
    icon: "shield",
    titulo: {
      pt: "Regras para proteger a comunidade",
      en: "Rules that protect the community",
      es: "Reglas que protegen a la comunidad",
    },
    descricao: {
      pt: "Conteúdo ilegal, abusivo, fraudulento ou que viole direitos de terceiros pode ser removido.",
      en: "Illegal, abusive, fraudulent content or content that violates third-party rights may be removed.",
      es: "El contenido ilegal, abusivo, fraudulento o que viole derechos de terceros puede eliminarse.",
    },
  },
  {
    icon: "settings",
    titulo: {
      pt: "Você controla sua conta",
      en: "You control your account",
      es: "Tú controlas tu cuenta",
    },
    descricao: {
      pt: "Você pode alterar configurações, remover conteúdo e solicitar o encerramento da conta.",
      en: "You may change settings, remove content, and request account closure.",
      es: "Puedes cambiar configuraciones, eliminar contenido y solicitar el cierre de la cuenta.",
    },
  },
];

export const SECOES_TERMOS: SecaoTermos[] = [
  {
    id: "aceitacao",
    numero: "1",
    icon: "file",
    titulo: {
      pt: "Aceitação e alcance destes Termos",
      en: "Acceptance and scope of these Terms",
      es: "Aceptación y alcance de estos Términos",
    },
    resumo: {
      pt: "Estes Termos regulam o acesso e a utilização do Historietas.",
      en: "These Terms govern access to and use of Historietas.",
      es: "Estos Términos regulan el acceso y uso de Historietas.",
    },
    paragrafos: [
      {
        pt: "Ao criar uma conta, acessar ou utilizar o Historietas, você confirma que leu e concorda com estes Termos de Uso e com os demais documentos indicados na página Termos e políticas.",
        en: "By creating an account, accessing, or using Historietas, you confirm that you have read and agree to these Terms of Use and the other documents listed on the Terms and policies page.",
        es: "Al crear una cuenta, acceder o utilizar Historietas, confirmas que has leído y aceptas estos Términos de Uso y los demás documentos indicados en la página Términos y políticas.",
      },
      {
        pt: "Caso você não concorde com estas condições, não deve utilizar a plataforma. Alguns recursos futuros poderão possuir condições adicionais, que serão apresentadas antes de sua utilização.",
        en: "If you do not agree with these conditions, you should not use the platform. Some future features may have additional conditions that will be presented before use.",
        es: "Si no estás de acuerdo con estas condiciones, no debes utilizar la plataforma. Algunas funciones futuras podrán tener condiciones adicionales que se presentarán antes de su uso.",
      },
    ],
  },
  {
    id: "conta",
    numero: "2",
    icon: "user",
    titulo: {
      pt: "Cadastro, capacidade e segurança da conta",
      en: "Registration, capacity, and account security",
      es: "Registro, capacidad y seguridad de la cuenta",
    },
    resumo: {
      pt: "A conta deve conter informações legítimas e permanecer protegida.",
      en: "The account must contain legitimate information and remain protected.",
      es: "La cuenta debe contener información legítima y mantenerse protegida.",
    },
    paragrafos: [
      {
        pt: "Para utilizar recursos que exigem autenticação, você deve fornecer informações verdadeiras, manter seus dados atualizados e não se passar por outra pessoa, organização ou personagem de forma enganosa.",
        en: "To use features that require authentication, you must provide truthful information, keep your details current, and not misleadingly impersonate another person, organization, or character.",
        es: "Para utilizar funciones que requieren autenticación, debes proporcionar información verdadera, mantener tus datos actualizados y no suplantar de forma engañosa a otra persona, organización o personaje.",
      },
      {
        pt: "Você deve possuir capacidade legal para aceitar estes Termos. Pessoas menores de idade somente devem utilizar a plataforma com autorização e acompanhamento de responsável legal, quando isso for exigido pela legislação aplicável.",
        en: "You must have the legal capacity to accept these Terms. Minors should use the platform only with the authorization and supervision of a legal guardian when required by applicable law.",
        es: "Debes tener capacidad legal para aceptar estos Términos. Las personas menores de edad solo deben utilizar la plataforma con autorización y supervisión de un responsable legal cuando lo exija la legislación aplicable.",
      },
      {
        pt: "Você é responsável por proteger sua senha, suas sessões e os dispositivos utilizados para acessar a conta. Avise o Historietas pela Central de ajuda ao perceber acesso não autorizado ou outro risco de segurança.",
        en: "You are responsible for protecting your password, sessions, and devices used to access the account. Notify Historietas through the Help center if you notice unauthorized access or another security risk.",
        es: "Eres responsable de proteger tu contraseña, tus sesiones y los dispositivos utilizados para acceder a la cuenta. Informa a Historietas mediante el Centro de ayuda si detectas acceso no autorizado u otro riesgo de seguridad.",
      },
    ],
    itens: [
      {
        pt: "Não venda, alugue, transfira ou compartilhe o controle da conta.",
        en: "Do not sell, rent, transfer, or share control of the account.",
        es: "No vendas, alquiles, transfieras ni compartas el control de la cuenta.",
      },
      {
        pt: "Não utilize contas automatizadas ou múltiplas contas para manipular métricas, avaliações ou interações.",
        en: "Do not use automated or multiple accounts to manipulate metrics, ratings, or interactions.",
        es: "No utilices cuentas automatizadas o múltiples cuentas para manipular métricas, valoraciones o interacciones.",
      },
    ],
  },
  {
    id: "publicacoes",
    numero: "3",
    icon: "book",
    titulo: {
      pt: "Obras, capítulos e demais publicações",
      en: "Works, chapters, and other publications",
      es: "Obras, capítulos y otras publicaciones",
    },
    resumo: {
      pt: "Você responde pelo conteúdo enviado e deve possuir os direitos necessários.",
      en: "You are responsible for submitted content and must hold the necessary rights.",
      es: "Eres responsable del contenido enviado y debes tener los derechos necesarios.",
    },
    paragrafos: [
      {
        pt: "Você continua sendo titular dos direitos sobre suas obras, capítulos, capas, imagens, textos, comentários e demais materiais publicados, conforme a legislação aplicável.",
        en: "You remain the owner of the rights to your works, chapters, covers, images, texts, comments, and other published materials, subject to applicable law.",
        es: "Sigues siendo titular de los derechos sobre tus obras, capítulos, portadas, imágenes, textos, comentarios y demás materiales publicados, conforme a la legislación aplicable.",
      },
      {
        pt: "Ao publicar conteúdo, você concede ao Historietas uma licença não exclusiva, gratuita e limitada ao necessário para armazenar, processar, adaptar tecnicamente, exibir e disponibilizar esse conteúdo dentro da plataforma e de seus recursos de compartilhamento ou divulgação.",
        en: "By publishing content, you grant Historietas a non-exclusive, royalty-free license limited to what is necessary to store, process, technically adapt, display, and make that content available within the platform and its sharing or promotional features.",
        es: "Al publicar contenido, otorgas a Historietas una licencia no exclusiva, gratuita y limitada a lo necesario para almacenar, procesar, adaptar técnicamente, mostrar y poner ese contenido a disposición dentro de la plataforma y sus funciones de difusión o promoción.",
      },
      {
        pt: "Essa licença não transfere a autoria ou a propriedade de sua obra. Ela permanece enquanto o conteúdo estiver publicado e pelo tempo tecnicamente necessário para remoção de cópias temporárias, backups ou cumprimento de obrigação legal.",
        en: "This license does not transfer authorship or ownership of your work. It remains while the content is published and for the time technically necessary to remove temporary copies, backups, or comply with a legal obligation.",
        es: "Esta licencia no transfiere la autoría ni la propiedad de tu obra. Permanece mientras el contenido esté publicado y durante el tiempo técnicamente necesario para eliminar copias temporales, respaldos o cumplir una obligación legal.",
      },
      {
        pt: "Você declara possuir autorização para publicar todos os elementos utilizados, inclusive textos, imagens, marcas, personagens, traduções e adaptações de terceiros.",
        en: "You represent that you have authorization to publish all elements used, including third-party texts, images, trademarks, characters, translations, and adaptations.",
        es: "Declaras que tienes autorización para publicar todos los elementos utilizados, incluidos textos, imágenes, marcas, personajes, traducciones y adaptaciones de terceros.",
      },
    ],
  },
  {
    id: "condutas-proibidas",
    numero: "4",
    icon: "ban",
    titulo: {
      pt: "Conteúdo e condutas proibidas",
      en: "Prohibited content and conduct",
      es: "Contenido y conductas prohibidas",
    },
    resumo: {
      pt: "O Historietas não pode ser utilizado para prejudicar pessoas ou violar a lei.",
      en: "Historietas may not be used to harm people or violate the law.",
      es: "Historietas no puede utilizarse para perjudicar a personas o infringir la ley.",
    },
    paragrafos: [
      {
        pt: "É proibido utilizar a plataforma para publicar, promover, solicitar, armazenar ou distribuir conteúdo ilegal ou para praticar atividades que violem estes Termos, as Diretrizes da Comunidade ou direitos de terceiros.",
        en: "You may not use the platform to publish, promote, request, store, or distribute illegal content or to engage in activities that violate these Terms, the Community Guidelines, or third-party rights.",
        es: "Está prohibido utilizar la plataforma para publicar, promover, solicitar, almacenar o distribuir contenido ilegal o realizar actividades que infrinjan estos Términos, las Normas de la Comunidad o derechos de terceros.",
      },
    ],
    itens: [
      {
        pt: "Plágio, pirataria ou publicação sem autorização do titular dos direitos.",
        en: "Plagiarism, piracy, or publication without authorization from the rights holder.",
        es: "Plagio, piratería o publicación sin autorización del titular de los derechos.",
      },
      {
        pt: "Ameaças, assédio, perseguição, discurso de ódio, humilhação direcionada ou incentivo à violência.",
        en: "Threats, harassment, stalking, hate speech, targeted humiliation, or incitement to violence.",
        es: "Amenazas, acoso, persecución, discurso de odio, humillación dirigida o incitación a la violencia.",
      },
      {
        pt: "Exploração sexual, abuso, aliciamento ou qualquer conteúdo ilegal envolvendo crianças ou adolescentes.",
        en: "Sexual exploitation, abuse, grooming, or any illegal content involving children or adolescents.",
        es: "Explotación sexual, abuso, captación o cualquier contenido ilegal que involucre a niños o adolescentes.",
      },
      {
        pt: "Fraudes, golpes, falsidade ideológica, engenharia social ou tentativa de obter senhas e dados de outras pessoas.",
        en: "Fraud, scams, identity deception, social engineering, or attempts to obtain other people's passwords and data.",
        es: "Fraudes, estafas, suplantación, ingeniería social o intentos de obtener contraseñas y datos de otras personas.",
      },
      {
        pt: "Malware, código nocivo, ataques, raspagem abusiva, sobrecarga ou tentativa de contornar proteções da plataforma.",
        en: "Malware, harmful code, attacks, abusive scraping, overload, or attempts to bypass platform protections.",
        es: "Malware, código dañino, ataques, extracción abusiva, sobrecarga o intentos de eludir las protecciones de la plataforma.",
      },
      {
        pt: "Manipulação artificial de seguidores, leituras, avaliações, comentários, rankings ou outros indicadores.",
        en: "Artificial manipulation of followers, reads, ratings, comments, rankings, or other indicators.",
        es: "Manipulación artificial de seguidores, lecturas, valoraciones, comentarios, clasificaciones u otros indicadores.",
      },
    ],
  },
  {
    id: "comunidade",
    numero: "5",
    icon: "comment",
    titulo: {
      pt: "Comentários, avaliações e convivência",
      en: "Comments, ratings, and interaction",
      es: "Comentarios, valoraciones y convivencia",
    },
    resumo: {
      pt: "As interações devem ser honestas, respeitosas e relacionadas ao conteúdo.",
      en: "Interactions must be honest, respectful, and related to the content.",
      es: "Las interacciones deben ser honestas, respetuosas y relacionadas con el contenido.",
    },
    paragrafos: [
      {
        pt: "Comentários, avaliações, mensagens e outras interações devem respeitar as pessoas, a autoria das obras e as regras da comunidade. Discordâncias e críticas são permitidas quando não envolvem ataques pessoais, intimidação ou perseguição.",
        en: "Comments, ratings, messages, and other interactions must respect people, authorship, and community rules. Disagreement and criticism are allowed when they do not involve personal attacks, intimidation, or harassment.",
        es: "Los comentarios, valoraciones, mensajes y otras interacciones deben respetar a las personas, la autoría y las reglas de la comunidad. Se permiten desacuerdos y críticas cuando no incluyen ataques personales, intimidación o acoso.",
      },
      {
        pt: "Avaliações devem representar uma opinião genuína. Não é permitido trocar, comprar, vender ou coordenar avaliações e interações com a finalidade de alterar artificialmente a visibilidade de uma obra ou perfil.",
        en: "Ratings must represent a genuine opinion. Exchanging, buying, selling, or coordinating ratings and interactions to artificially alter the visibility of a work or profile is not allowed.",
        es: "Las valoraciones deben representar una opinión auténtica. No se permite intercambiar, comprar, vender o coordinar valoraciones e interacciones para alterar artificialmente la visibilidad de una obra o perfil.",
      },
    ],
  },
  {
    id: "moderacao",
    numero: "6",
    icon: "shield",
    titulo: {
      pt: "Moderação, denúncias e medidas de proteção",
      en: "Moderation, reports, and protective measures",
      es: "Moderación, denuncias y medidas de protección",
    },
    resumo: {
      pt: "O Historietas pode agir para proteger usuários, direitos e a integridade do serviço.",
      en: "Historietas may act to protect users, rights, and service integrity.",
      es: "Historietas puede actuar para proteger a los usuarios, los derechos y la integridad del servicio.",
    },
    paragrafos: [
      {
        pt: "O Historietas pode analisar denúncias, sinais de abuso, ordens de autoridades e possíveis violações destes Termos. A análise pode considerar o conteúdo, o contexto, o histórico relevante e a gravidade do risco.",
        en: "Historietas may review reports, signs of abuse, authority orders, and possible violations of these Terms. The review may consider the content, context, relevant history, and severity of the risk.",
        es: "Historietas puede revisar denuncias, indicios de abuso, órdenes de autoridades y posibles infracciones de estos Términos. La revisión puede considerar el contenido, el contexto, el historial relevante y la gravedad del riesgo.",
      },
      {
        pt: "Quando necessário, o Historietas poderá reduzir a visibilidade, limitar recursos, remover conteúdo, emitir avisos, suspender ou encerrar contas, preservar registros e cooperar com autoridades nos casos previstos em lei.",
        en: "When necessary, Historietas may reduce visibility, limit features, remove content, issue warnings, suspend or close accounts, preserve records, and cooperate with authorities in cases provided by law.",
        es: "Cuando sea necesario, Historietas podrá reducir la visibilidad, limitar funciones, eliminar contenido, emitir advertencias, suspender o cerrar cuentas, conservar registros y cooperar con autoridades en los casos previstos por la ley.",
      },
      {
        pt: "Sempre que for adequado e permitido, poderão ser fornecidas informações sobre a medida adotada e formas disponíveis de contestação. Medidas urgentes poderão ser aplicadas sem aviso prévio para evitar dano imediato.",
        en: "Whenever appropriate and permitted, information about the action taken and available appeal options may be provided. Urgent measures may be applied without prior notice to prevent immediate harm.",
        es: "Cuando sea apropiado y esté permitido, se podrá proporcionar información sobre la medida adoptada y las opciones de revisión disponibles. Las medidas urgentes podrán aplicarse sin aviso previo para evitar un daño inmediato.",
      },
    ],
  },
  {
    id: "direitos-autorais",
    numero: "7",
    icon: "copyright",
    titulo: {
      pt: "Direitos autorais e reclamações",
      en: "Copyright and complaints",
      es: "Derechos de autor y reclamaciones",
    },
    resumo: {
      pt: "Titulares de direitos podem comunicar publicações não autorizadas.",
      en: "Rights holders may report unauthorized publications.",
      es: "Los titulares de derechos pueden denunciar publicaciones no autorizadas.",
    },
    paragrafos: [
      {
        pt: "O Historietas respeita os direitos autorais e espera o mesmo de seus usuários. Uma reclamação deve identificar o titular ou representante, a obra protegida, o conteúdo denunciado, a localização desse conteúdo e informações suficientes para análise e contato.",
        en: "Historietas respects copyright and expects the same from its users. A complaint should identify the rights holder or representative, the protected work, the reported content, its location, and sufficient information for review and contact.",
        es: "Historietas respeta los derechos de autor y espera lo mismo de sus usuarios. Una reclamación debe identificar al titular o representante, la obra protegida, el contenido denunciado, su ubicación e información suficiente para la revisión y el contacto.",
      },
      {
        pt: "O usuário responsável pelo conteúdo poderá ser informado da reclamação quando isso for permitido e necessário. Informações falsas ou denúncias abusivas também podem gerar medidas sobre a conta responsável.",
        en: "The user responsible for the content may be informed of the complaint when permitted and necessary. False information or abusive reports may also result in action against the responsible account.",
        es: "El usuario responsable del contenido podrá ser informado de la reclamación cuando esté permitido y sea necesario. La información falsa o las denuncias abusivas también pueden generar medidas sobre la cuenta responsable.",
      },
      {
        pt: "Reclamações podem ser encaminhadas pelos canais indicados na Central de ajuda.",
        en: "Complaints may be submitted through the channels listed in the Help center.",
        es: "Las reclamaciones pueden enviarse mediante los canales indicados en el Centro de ayuda.",
      },
    ],
  },
  {
    id: "servico",
    numero: "8",
    icon: "server",
    titulo: {
      pt: "Funcionamento, alterações e serviços de terceiros",
      en: "Operation, changes, and third-party services",
      es: "Funcionamiento, cambios y servicios de terceros",
    },
    resumo: {
      pt: "A plataforma pode evoluir e depender de serviços técnicos externos.",
      en: "The platform may evolve and depend on external technical services.",
      es: "La plataforma puede evolucionar y depender de servicios técnicos externos.",
    },
    paragrafos: [
      {
        pt: "O Historietas poderá criar, modificar, testar, limitar ou descontinuar recursos para melhorar segurança, desempenho, experiência de uso ou adequação jurídica. Quando uma mudança afetar significativamente os usuários, será buscada uma comunicação adequada.",
        en: "Historietas may create, modify, test, limit, or discontinue features to improve security, performance, user experience, or legal compliance. When a change significantly affects users, appropriate notice will be sought.",
        es: "Historietas podrá crear, modificar, probar, limitar o descontinuar funciones para mejorar la seguridad, el rendimiento, la experiencia de uso o la adecuación jurídica. Cuando un cambio afecte significativamente a los usuarios, se procurará una comunicación adecuada.",
      },
      {
        pt: "A operação pode depender de serviços de hospedagem, autenticação, banco de dados, entrega de conteúdo e outras soluções de terceiros. Interrupções, manutenções ou falhas podem ocorrer, e esforços razoáveis serão realizados para restaurar o serviço.",
        en: "Operation may depend on hosting, authentication, database, content delivery, and other third-party solutions. Interruptions, maintenance, or failures may occur, and reasonable efforts will be made to restore the service.",
        es: "El funcionamiento puede depender de servicios de alojamiento, autenticación, base de datos, distribución de contenido y otras soluciones de terceros. Pueden ocurrir interrupciones, mantenimiento o fallos, y se realizarán esfuerzos razonables para restaurar el servicio.",
      },
      {
        pt: "O Historietas não garante disponibilidade contínua, ausência total de erros ou preservação ilimitada de rascunhos e arquivos. Usuários devem manter cópias próprias de materiais importantes.",
        en: "Historietas does not guarantee continuous availability, complete absence of errors, or unlimited preservation of drafts and files. Users should keep their own copies of important materials.",
        es: "Historietas no garantiza disponibilidad continua, ausencia total de errores ni conservación ilimitada de borradores y archivos. Los usuarios deben mantener sus propias copias de materiales importantes.",
      },
    ],
  },
  {
    id: "encerramento",
    numero: "9",
    icon: "alert",
    titulo: {
      pt: "Suspensão, encerramento e remoção da conta",
      en: "Suspension, closure, and account removal",
      es: "Suspensión, cierre y eliminación de la cuenta",
    },
    resumo: {
      pt: "A conta pode ser encerrada pelo usuário ou por violação grave das regras.",
      en: "The account may be closed by the user or for serious rule violations.",
      es: "La cuenta puede cerrarse por el usuario o por infracciones graves de las reglas.",
    },
    paragrafos: [
      {
        pt: "Você pode deixar de utilizar o Historietas, remover publicações e solicitar o encerramento da conta pelos recursos disponíveis ou pela Central de ajuda.",
        en: "You may stop using Historietas, remove publications, and request account closure through available features or the Help center.",
        es: "Puedes dejar de utilizar Historietas, eliminar publicaciones y solicitar el cierre de la cuenta mediante las funciones disponibles o el Centro de ayuda.",
      },
      {
        pt: "O Historietas poderá suspender ou encerrar uma conta em caso de violação destes Termos, risco à segurança, fraude, obrigação legal, uso abusivo ou dano relevante a usuários, terceiros ou à plataforma.",
        en: "Historietas may suspend or close an account in the event of a violation of these Terms, security risk, fraud, legal obligation, abusive use, or significant harm to users, third parties, or the platform.",
        es: "Historietas podrá suspender o cerrar una cuenta en caso de infracción de estos Términos, riesgo de seguridad, fraude, obligación legal, uso abusivo o daño relevante a usuarios, terceros o a la plataforma.",
      },
      {
        pt: "Após o encerramento, parte dos dados poderá permanecer pelo período necessário para backups, prevenção de fraude, exercício de direitos, cumprimento de obrigações legais e resolução de disputas, conforme explicado na Política de Privacidade.",
        en: "After closure, some data may remain for the period necessary for backups, fraud prevention, exercise of rights, legal obligations, and dispute resolution, as explained in the Privacy Policy.",
        es: "Después del cierre, algunos datos podrán permanecer durante el período necesario para copias de seguridad, prevención de fraude, ejercicio de derechos, cumplimiento de obligaciones legales y resolución de disputas, según se explica en la Política de Privacidad.",
      },
    ],
  },
  {
    id: "responsabilidades",
    numero: "10",
    icon: "scale",
    titulo: {
      pt: "Responsabilidades e limites legais",
      en: "Responsibilities and legal limitations",
      es: "Responsabilidades y límites legales",
    },
    resumo: {
      pt: "Cada usuário responde por sua conduta, sem afastar direitos obrigatórios previstos em lei.",
      en: "Each user is responsible for their conduct, without excluding mandatory legal rights.",
      es: "Cada usuario responde por su conducta, sin excluir derechos obligatorios previstos por la ley.",
    },
    paragrafos: [
      {
        pt: "Você é responsável pelas atividades realizadas em sua conta e pelo conteúdo que publica, inclusive pela obtenção de autorizações necessárias e pelas consequências de violações de direitos de terceiros.",
        en: "You are responsible for activities performed through your account and for the content you publish, including obtaining necessary permissions and the consequences of violating third-party rights.",
        es: "Eres responsable de las actividades realizadas mediante tu cuenta y del contenido que publicas, incluida la obtención de autorizaciones necesarias y las consecuencias de infringir derechos de terceros.",
      },
      {
        pt: "O Historietas disponibiliza uma plataforma para criação, publicação, descoberta e interação. Dentro dos limites permitidos pela legislação, não se responsabiliza por opiniões, promessas, negociações, relações ou conteúdos criados por usuários e terceiros.",
        en: "Historietas provides a platform for creation, publication, discovery, and interaction. To the extent permitted by law, it is not responsible for opinions, promises, transactions, relationships, or content created by users and third parties.",
        es: "Historietas ofrece una plataforma para creación, publicación, descubrimiento e interacción. Dentro de los límites permitidos por la ley, no se responsabiliza por opiniones, promesas, negociaciones, relaciones o contenidos creados por usuarios y terceros.",
      },
      {
        pt: "Nenhuma disposição destes Termos exclui direitos que não possam ser afastados por contrato, incluindo direitos assegurados pela legislação de proteção ao consumidor e de proteção de dados quando aplicáveis.",
        en: "Nothing in these Terms excludes rights that cannot be waived by contract, including rights provided by consumer protection and data protection laws when applicable.",
        es: "Ninguna disposición de estos Términos excluye derechos que no puedan renunciarse por contrato, incluidos los derechos establecidos por las leyes de protección al consumidor y de protección de datos cuando sean aplicables.",
      },
    ],
  },
  {
    id: "alteracoes",
    numero: "11",
    icon: "refresh",
    titulo: {
      pt: "Alterações destes Termos",
      en: "Changes to these Terms",
      es: "Cambios en estos Términos",
    },
    resumo: {
      pt: "O documento pode ser atualizado para acompanhar mudanças do serviço e da legislação.",
      en: "This document may be updated to reflect service and legal changes.",
      es: "Este documento puede actualizarse para reflejar cambios del servicio y de la legislación.",
    },
    paragrafos: [
      {
        pt: "Estes Termos poderão ser atualizados para refletir novos recursos, alterações operacionais, medidas de segurança, exigências legais ou melhorias de clareza.",
        en: "These Terms may be updated to reflect new features, operational changes, security measures, legal requirements, or clarity improvements.",
        es: "Estos Términos podrán actualizarse para reflejar nuevas funciones, cambios operativos, medidas de seguridad, requisitos legales o mejoras de claridad.",
      },
      {
        pt: "A versão atual indicará a data da última atualização. Quando mudanças relevantes exigirem nova manifestação de consentimento ou aviso específico, isso será solicitado ou comunicado pelos meios disponíveis.",
        en: "The current version will show the date of the latest update. When material changes require renewed consent or specific notice, it will be requested or communicated through available means.",
        es: "La versión actual indicará la fecha de la última actualización. Cuando cambios relevantes requieran un nuevo consentimiento o aviso específico, se solicitará o comunicará mediante los medios disponibles.",
      },
    ],
  },
  {
    id: "legislacao",
    numero: "12",
    icon: "scale",
    titulo: {
      pt: "Legislação aplicável e solução de dúvidas",
      en: "Applicable law and resolution of questions",
      es: "Legislación aplicable y resolución de dudas",
    },
    resumo: {
      pt: "As relações com o Historietas são interpretadas conforme a legislação brasileira aplicável.",
      en: "Relations with Historietas are interpreted under applicable Brazilian law.",
      es: "Las relaciones con Historietas se interpretan conforme a la legislación brasileña aplicable.",
    },
    paragrafos: [
      {
        pt: "Estes Termos são regidos pela legislação da República Federativa do Brasil, respeitadas normas obrigatórias aplicáveis ao usuário em razão de sua localização ou condição.",
        en: "These Terms are governed by the laws of the Federative Republic of Brazil, while respecting mandatory rules applicable to the user due to their location or status.",
        es: "Estos Términos se rigen por las leyes de la República Federativa de Brasil, respetando las normas obligatorias aplicables al usuario por razón de su ubicación o condición.",
      },
      {
        pt: "Antes de iniciar uma disputa formal, as partes devem buscar uma solução de boa-fé pelos canais de atendimento disponíveis. Quando houver relação de consumo, permanecem preservados os direitos e o foro assegurados pela legislação aplicável.",
        en: "Before starting a formal dispute, the parties should seek a good-faith solution through available support channels. Where a consumer relationship exists, the rights and venue provided by applicable law remain preserved.",
        es: "Antes de iniciar una disputa formal, las partes deben buscar una solución de buena fe mediante los canales de atención disponibles. Cuando exista una relación de consumo, se preservan los derechos y el fuero previstos por la legislación aplicable.",
      },
    ],
  },
  {
    id: "contato",
    numero: "13",
    icon: "help",
    titulo: {
      pt: "Contato",
      en: "Contact",
      es: "Contacto",
    },
    resumo: {
      pt: "Dúvidas e solicitações podem ser encaminhadas pela Central de ajuda.",
      en: "Questions and requests may be submitted through the Help center.",
      es: "Las dudas y solicitudes pueden enviarse mediante el Centro de ayuda.",
    },
    paragrafos: [
      {
        pt: "Para dúvidas sobre estes Termos, problemas com a conta, denúncias ou solicitações relacionadas ao conteúdo, utilize a Central de ajuda do Historietas.",
        en: "For questions about these Terms, account issues, reports, or content-related requests, use the Historietas Help center.",
        es: "Para dudas sobre estos Términos, problemas con la cuenta, denuncias o solicitudes relacionadas con contenido, utiliza el Centro de ayuda de Historietas.",
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
