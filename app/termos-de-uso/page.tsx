"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";

type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

type IconName =
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

type SecaoTermos = {
  id: string;
  numero: string;
  icon: IconName;
  titulo: TextoTraduzido;
  resumo: TextoTraduzido;
  paragrafos: TextoTraduzido[];
  itens?: TextoTraduzido[];
};

type DestaqueTermos = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

const ULTIMA_ATUALIZACAO: TextoTraduzido = {
  pt: "28 de julho de 2026",
  en: "July 28, 2026",
  es: "28 de julio de 2026",
};

const DESTAQUES_TERMOS: DestaqueTermos[] = [
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

const SECOES_TERMOS: SecaoTermos[] = [
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

function traduzirTexto(
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
    arrowRight: (
      <>
        <path {...common} d="M5 12h14" />
        <path {...common} d="m12 5 7 7-7 7" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
        <path {...common} d="M8 13h8M8 17h6" />
      </>
    ),
    user: (
      <>
        <circle {...common} cx="12" cy="7" r="4" />
        <path {...common} d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </>
    ),
    copyright: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M15 9.5a4 4 0 1 0 0 5" />
      </>
    ),
    shield: (
      <>
        <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path {...common} d="m9 12 2 2 4-4" />
      </>
    ),
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
        <path {...common} d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    alert: (
      <>
        <path {...common} d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path {...common} d="M12 9v4M12 17h.01" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </>
    ),
    ban: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m5.6 5.6 12.8 12.8" />
      </>
    ),
    server: (
      <>
        <rect {...common} x="3" y="3" width="18" height="7" rx="2" />
        <rect {...common} x="3" y="14" width="18" height="7" rx="2" />
        <path {...common} d="M7 6.5h.01M7 17.5h.01" />
      </>
    ),
    scale: (
      <>
        <path {...common} d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z" />
        <path {...common} d="M8 21h8" />
      </>
    ),
    refresh: (
      <>
        <path {...common} d="M20 6v5h-5" />
        <path {...common} d="M4 18v-5h5" />
        <path {...common} d="M18.5 9A7 7 0 0 0 6 6.5L4 11M5.5 15A7 7 0 0 0 18 17.5l2-4.5" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.6 9.1a2.7 2.7 0 0 1 5.1 1.2c0 2-2.7 2.3-2.7 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    info: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 11v5M12 8h.01" />
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

export default function TermosDeUsoPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-uso-root="true"
    >
      <style>{`${historietasThemeCss}${termosUsoCss}`}</style>

      <div style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/termos"
            style={backButtonStyle}
            aria-label={t({
              pt: "Voltar para Termos e políticas",
              en: "Back to Terms and policies",
              es: "Volver a Términos y políticas",
            })}
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.35} />
          </Link>

          <div style={headerTextStyle}>
            <span style={eyebrowStyle}>
              {t({
                pt: "DOCUMENTO OFICIAL",
                en: "OFFICIAL DOCUMENT",
                es: "DOCUMENTO OFICIAL",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Termos de Uso",
                en: "Terms of Use",
                es: "Términos de Uso",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <SvgIcon name="file" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <SvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Leitura recomendada",
                en: "Recommended reading",
                es: "Lectura recomendada",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Regras para utilizar o Historietas",
                en: "Rules for using Historietas",
                es: "Reglas para utilizar Historietas",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Este documento explica as condições para criar uma conta, publicar obras, interagir com a comunidade e utilizar os recursos da plataforma.",
                en: "This document explains the conditions for creating an account, publishing works, interacting with the community, and using platform features.",
                es: "Este documento explica las condiciones para crear una cuenta, publicar obras, interactuar con la comunidad y utilizar las funciones de la plataforma.",
              })}
            </p>

            <span style={updatedAtStyle}>
              {t({
                pt: "Última atualização:",
                en: "Last updated:",
                es: "Última actualización:",
              })}{" "}
              <strong>{t(ULTIMA_ATUALIZACAO)}</strong>
            </span>
          </div>
        </section>

        <aside style={importantNoticeStyle}>
          <span style={importantNoticeIconStyle}>
            <SvgIcon name="info" size={23} strokeWidth={2.1} />
          </span>

          <div style={importantNoticeTextStyle}>
            <strong>
              {t({
                pt: "Resumo importante",
                en: "Important summary",
                es: "Resumen importante",
              })}
            </strong>
            <p>
              {t({
                pt: "Você mantém os direitos sobre suas obras, mas precisa publicar apenas materiais que possa utilizar. O uso do Historietas exige respeito à lei, à comunidade e aos direitos de outras pessoas.",
                en: "You retain the rights to your works, but you must publish only materials you are allowed to use. Using Historietas requires respect for the law, the community, and other people's rights.",
                es: "Conservas los derechos sobre tus obras, pero debes publicar solo materiales que puedas utilizar. El uso de Historietas exige respeto por la ley, la comunidad y los derechos de otras personas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={highlightsSectionStyle}
          aria-labelledby="destaques-termos-uso"
        >
          <div style={sectionHeadingStyle}>
            <span style={sectionKickerStyle}>
              {t({
                pt: "PONTOS PRINCIPAIS",
                en: "KEY POINTS",
                es: "PUNTOS PRINCIPALES",
              })}
            </span>
            <h2
              id="destaques-termos-uso"
              style={sectionTitleStyle}
            >
              {t({
                pt: "O essencial antes de continuar",
                en: "What matters before you continue",
                es: "Lo esencial antes de continuar",
              })}
            </h2>
          </div>

          <div style={highlightsGridStyle}>
            {DESTAQUES_TERMOS.map((destaque) => (
              <article
                key={destaque.titulo.pt}
                className="termos-uso-highlight"
              >
                <span className="termos-uso-highlight-icon">
                  <SvgIcon
                    name={destaque.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>
                <div className="termos-uso-highlight-copy">
                  <h3>{t(destaque.titulo)}</h3>
                  <p>{t(destaque.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div style={contentLayoutStyle} className="termos-uso-content-layout">
          <nav
            style={tableOfContentsStyle}
            aria-label={t({
              pt: "Índice dos Termos de Uso",
              en: "Terms of Use table of contents",
              es: "Índice de los Términos de Uso",
            })}
          >
            <span style={tocLabelStyle}>
              {t({
                pt: "NESTA PÁGINA",
                en: "ON THIS PAGE",
                es: "EN ESTA PÁGINA",
              })}
            </span>

            <div style={tocLinksStyle}>
              {SECOES_TERMOS.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="termos-uso-toc-link"
                >
                  <span>{secao.numero}</span>
                  <strong>{t(secao.titulo)}</strong>
                </a>
              ))}
            </div>
          </nav>

          <div style={sectionsColumnStyle}>
            {SECOES_TERMOS.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="termos-uso-section"
                aria-labelledby={`${secao.id}-titulo`}
              >
                <header className="termos-uso-section-header">
                  <span className="termos-uso-section-icon">
                    <SvgIcon
                      name={secao.icon}
                      size={24}
                      strokeWidth={2.05}
                    />
                  </span>

                  <div className="termos-uso-section-heading">
                    <span>
                      {t({
                        pt: `SEÇÃO ${secao.numero}`,
                        en: `SECTION ${secao.numero}`,
                        es: `SECCIÓN ${secao.numero}`,
                      })}
                    </span>
                    <h2 id={`${secao.id}-titulo`}>
                      {t(secao.titulo)}
                    </h2>
                    <p>{t(secao.resumo)}</p>
                  </div>
                </header>

                <div className="termos-uso-section-content">
                  {secao.paragrafos.map((paragrafo, index) => (
                    <p key={`${secao.id}-paragrafo-${index}`}>
                      {t(paragrafo)}
                    </p>
                  ))}

                  {secao.itens?.length ? (
                    <ul>
                      {secao.itens.map((item, index) => (
                        <li key={`${secao.id}-item-${index}`}>
                          <span className="termos-uso-list-check">
                            <SvgIcon
                              name="check"
                              size={18}
                              strokeWidth={2.35}
                            />
                          </span>
                          <span>{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {secao.id === "direitos-autorais" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Acessar a Central de ajuda",
                          en: "Open the Help center",
                          es: "Acceder al Centro de ayuda",
                        })}
                      </span>
                      <SvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "encerramento" ? (
                    <Link
                      href="/configuracoes"
                      className="termos-uso-inline-link"
                    >
                      <span>
                        {t({
                          pt: "Abrir Configurações da conta",
                          en: "Open account Settings",
                          es: "Abrir Configuración de la cuenta",
                        })}
                      </span>
                      <SvgIcon
                        name="arrowRight"
                        size={19}
                        strokeWidth={2.3}
                      />
                    </Link>
                  ) : null}

                  {secao.id === "contato" ? (
                    <Link
                      href="/ajuda"
                      className="termos-uso-primary-link"
                    >
                      <SvgIcon
                        name="help"
                        size={20}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Ir para a Central de ajuda",
                          en: "Go to the Help center",
                          es: "Ir al Centro de ayuda",
                        })}
                      </span>
                    </Link>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer style={footerStyle}>
          <span style={footerIconStyle}>
            <SvgIcon name="scale" size={24} strokeWidth={2.05} />
          </span>

          <div style={footerTextStyle}>
            <strong>
              {t({
                pt: "Consulte os demais documentos",
                en: "Review the other documents",
                es: "Consulta los demás documentos",
              })}
            </strong>
            <p>
              {t({
                pt: "A Política de Privacidade e as Diretrizes da Comunidade complementam estes Termos de Uso.",
                en: "The Privacy Policy and Community Guidelines complement these Terms of Use.",
                es: "La Política de Privacidad y las Normas de la Comunidad complementan estos Términos de Uso.",
              })}
            </p>
          </div>

          <Link
            href="/termos"
            style={footerLinkStyle}
          >
            <span>
              {t({
                pt: "Termos e políticas",
                en: "Terms and policies",
                es: "Términos y políticas",
              })}
            </span>
            <SvgIcon name="arrowRight" size={19} strokeWidth={2.3} />
          </Link>
        </footer>
      </div>
    </main>
  );
}

const termosUsoCss = `
  [data-historietas-termos-uso-root="true"] {
    --termos-uso-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 90%,
      transparent
    );
    --termos-uso-card-strong: color-mix(
      in srgb,
      var(--historietas-surface-strong, #120C1E) 96%,
      transparent
    );
    --termos-uso-control: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 8%,
      transparent
    );
    --termos-uso-control-hover: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 12%,
      transparent
    );
    --termos-uso-border: var(
      --historietas-border-soft,
      rgba(255,255,255,0.10)
    );
    --termos-uso-muted: var(
      --historietas-text-secondary,
      #D4D4D8
    );
    scroll-behavior: smooth;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight {
    min-height: 130px;
    border: 1px solid var(--termos-uso-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-uso-card);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-uso-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy h3 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.2;
    font-weight: 830;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 12px;
    line-height: 1.48;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link {
    min-height: 42px;
    border-radius: 11px;
    padding: 8px 9px;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: var(--termos-uso-muted);
    text-decoration: none;
    transition: background 150ms ease, color 150ms ease;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link:hover {
    background: var(--termos-uso-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link:focus-visible,
  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link:focus-visible,
  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link:focus-visible {
    outline: 3px solid color-mix(
      in srgb,
      var(--historietas-accent, #F97316) 70%,
      transparent
    );
    outline-offset: 3px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link > span {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-uso-control);
    color: inherit;
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link strong {
    min-width: 0;
    font-size: 11px;
    line-height: 1.25;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section {
    scroll-margin-top: 16px;
    border: 1px solid var(--termos-uso-border);
    border-radius: 21px;
    padding: clamp(16px, 4vw, 23px);
    background: var(--termos-uso-card);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-header {
    display: grid;
    grid-template-columns: 47px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--termos-uso-border);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-icon {
    width: 47px;
    height: 47px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 20%,
      var(--termos-uso-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading > span {
    color: var(--historietas-secondary, #7C3AED);
    font-size: 9px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.13em;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading h2 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: clamp(18px, 4.7vw, 23px);
    line-height: 1.12;
    font-weight: 870;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 12px;
    line-height: 1.42;
    font-weight: 570;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content {
    padding-top: 16px;
    display: grid;
    gap: 12px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 14px;
    line-height: 1.68;
    font-weight: 520;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > ul {
    margin: 2px 0 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > ul > li {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: start;
    gap: 9px;
    color: var(--termos-uso-muted);
    font-size: 13px;
    line-height: 1.52;
    font-weight: 550;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-list-check {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 18%,
      var(--termos-uso-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link {
    width: fit-content;
    min-height: 38px;
    border-radius: 11px;
    padding: 8px 11px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--termos-uso-control);
    border: 1px solid var(--termos-uso-border);
    color: var(--historietas-text-primary, #FFFFFF);
    text-decoration: none;
    font-size: 12px;
    line-height: 1;
    font-weight: 760;
    transition: background 150ms ease, transform 150ms ease;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link:hover {
    background: var(--termos-uso-control-hover);
    transform: translateY(-1px);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link {
    width: fit-content;
    min-height: 42px;
    border-radius: 12px;
    padding: 10px 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    text-decoration: none;
    font-size: 13px;
    line-height: 1;
    font-weight: 820;
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] {
    --termos-uso-card: #050505;
    --termos-uso-card-strong: #000000;
    --termos-uso-control: rgba(255,255,255,0.08);
    --termos-uso-control-hover: rgba(255,255,255,0.12);
    --termos-uso-border: rgba(255,255,255,0.18);
    --termos-uso-muted: #C4C4C8;
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-section-icon,
  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-list-check {
    background: rgba(255,255,255,0.10);
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-section {
      scroll-margin-top: 12px;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-content-layout {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 620px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-section-header {
      grid-template-columns: 43px minmax(0, 1fr);
      gap: 10px;
    }

    [data-historietas-termos-uso-root="true"] .termos-uso-section-icon {
      width: 43px;
      height: 43px;
      border-radius: 14px;
    }

    [data-historietas-termos-uso-root="true"] .termos-uso-section-content > p {
      font-size: 13px;
      line-height: 1.63;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] {
      scroll-padding-top: 12px;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-toc-link {
      min-height: 40px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-termos-uso-root="true"],
    [data-historietas-termos-uso-root="true"] *,
    [data-historietas-termos-uso-root="true"] *::before,
    [data-historietas-termos-uso-root="true"] *::after {
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
  width: "min(980px, calc(100% - 32px))",
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
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
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
  alignItems: "start",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 9%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "13px",
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
  gap: "8px",
};

const heroBadgeStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "28px",
  borderRadius: "999px",
  padding: "6px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 9%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 800,
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
  maxWidth: "720px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

const updatedAtStyle: CSSProperties = {
  width: "fit-content",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 590,
};

const importantNoticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "14px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "11px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 11%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "27px",
};

const importantNoticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const importantNoticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

const highlightsSectionStyle: CSSProperties = {
  marginBottom: "28px",
};

const sectionHeadingStyle: CSSProperties = {
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

const highlightsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(235px, 100%), 1fr))",
  gap: "10px",
};

const contentLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(210px, 250px) minmax(0, 1fr)",
  alignItems: "start",
  gap: "14px",
};

const tableOfContentsStyle: CSSProperties = {
  position: "sticky",
  top: "14px",
  maxHeight: "calc(100vh - 28px)",
  overflowY: "auto",
  borderRadius: "18px",
  padding: "13px",
  background:
    "color-mix(in srgb, var(--historietas-surface, #120C1E) 90%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const tocLabelStyle: CSSProperties = {
  display: "block",
  margin: "2px 5px 9px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

const tocLinksStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
};

const sectionsColumnStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "12px",
};

const footerStyle: CSSProperties = {
  marginTop: "28px",
  borderRadius: "19px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "11px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

const footerIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const footerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.4,
};

const footerLinkStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "11px",
  padding: "9px 11px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 780,
};