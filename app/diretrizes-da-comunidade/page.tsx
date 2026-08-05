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
  | "users"
  | "heart"
  | "shield"
  | "book"
  | "copyright"
  | "comment"
  | "ban"
  | "alert"
  | "child"
  | "flag"
  | "scale"
  | "refresh"
  | "help"
  | "check"
  | "info"
  | "eye"
  | "lock"
  | "spark";

type SecaoDiretriz = {
  id: string;
  numero: string;
  icon: IconName;
  titulo: TextoTraduzido;
  resumo: TextoTraduzido;
  paragrafos: TextoTraduzido[];
  permitido?: TextoTraduzido[];
  proibido?: TextoTraduzido[];
};

type PrincipioComunidade = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

const ULTIMA_ATUALIZACAO: TextoTraduzido = {
  pt: "28 de julho de 2026",
  en: "July 28, 2026",
  es: "28 de julio de 2026",
};

const PRINCIPIOS_COMUNIDADE: PrincipioComunidade[] = [
  {
    icon: "heart",
    titulo: {
      pt: "Respeito entre pessoas",
      en: "Respect between people",
      es: "Respeto entre personas",
    },
    descricao: {
      pt: "Discordâncias são permitidas; ataques, perseguição e humilhação não são.",
      en: "Disagreement is allowed; attacks, harassment, and humiliation are not.",
      es: "Se permiten los desacuerdos; los ataques, el acoso y la humillación no.",
    },
  },
  {
    icon: "copyright",
    titulo: {
      pt: "Respeito à autoria",
      en: "Respect for authorship",
      es: "Respeto por la autoría",
    },
    descricao: {
      pt: "Publique apenas obras próprias ou materiais que você tenha autorização para utilizar.",
      en: "Publish only your own works or materials you are authorized to use.",
      es: "Publica solo obras propias o materiales que tengas autorización para utilizar.",
    },
  },
  {
    icon: "shield",
    titulo: {
      pt: "Proteção da comunidade",
      en: "Community protection",
      es: "Protección de la comunidad",
    },
    descricao: {
      pt: "Denúncias e moderação ajudam a reduzir abuso, fraude e riscos de segurança.",
      en: "Reports and moderation help reduce abuse, fraud, and security risks.",
      es: "Las denuncias y la moderación ayudan a reducir abusos, fraudes y riesgos de seguridad.",
    },
  },
  {
    icon: "book",
    titulo: {
      pt: "Liberdade criativa com responsabilidade",
      en: "Creative freedom with responsibility",
      es: "Libertad creativa con responsabilidad",
    },
    descricao: {
      pt: "Ficção pode abordar temas difíceis, desde que respeite a lei, o contexto e as regras da plataforma.",
      en: "Fiction may address difficult topics as long as it respects the law, context, and platform rules.",
      es: "La ficción puede abordar temas difíciles siempre que respete la ley, el contexto y las reglas de la plataforma.",
    },
  },
];

const SECOES_DIRETRIZES: SecaoDiretriz[] = [
  {
    id: "objetivo",
    numero: "1",
    icon: "users",
    titulo: {
      pt: "Objetivo e alcance das Diretrizes",
      en: "Purpose and scope of the Guidelines",
      es: "Objetivo y alcance de las Normas",
    },
    resumo: {
      pt: "Estas regras valem para todas as áreas de participação do Historietas.",
      en: "These rules apply to every participation area of Historietas.",
      es: "Estas reglas se aplican a todas las áreas de participación de Historietas.",
    },
    paragrafos: [
      {
        pt: "As Diretrizes da Comunidade explicam o que é esperado de quem publica, comenta, avalia, segue perfis, participa da comunidade ou utiliza qualquer recurso social do Historietas.",
        en: "The Community Guidelines explain what is expected from people who publish, comment, rate, follow profiles, participate in the community, or use any social feature of Historietas.",
        es: "Las Normas de la Comunidad explican lo que se espera de quienes publican, comentan, valoran, siguen perfiles, participan en la comunidad o utilizan cualquier función social de Historietas.",
      },
      {
        pt: "Elas complementam os Termos de Uso e a Política de Privacidade. Quando houver conflito, devem ser consideradas em conjunto com a legislação aplicável e com medidas específicas de segurança ou proteção.",
        en: "They complement the Terms of Use and Privacy Policy. When a conflict arises, they should be considered together with applicable law and specific safety or protection measures.",
        es: "Complementan los Términos de Uso y la Política de Privacidad. Cuando exista un conflicto, deben considerarse junto con la legislación aplicable y con medidas específicas de seguridad o protección.",
      },
    ],
  },
  {
    id: "respeito",
    numero: "2",
    icon: "heart",
    titulo: {
      pt: "Respeito, críticas e convivência",
      en: "Respect, criticism, and interaction",
      es: "Respeto, críticas y convivencia",
    },
    resumo: {
      pt: "Críticas ao conteúdo são permitidas; ataques pessoais e perseguição não são.",
      en: "Content criticism is allowed; personal attacks and harassment are not.",
      es: "Se permiten las críticas al contenido; los ataques personales y el acoso no.",
    },
    paragrafos: [
      {
        pt: "Você pode discordar de uma obra, opinião, avaliação ou decisão de outro usuário. A crítica deve permanecer relacionada ao conteúdo ou ao comportamento observado, sem transformar a discussão em ataque à pessoa.",
        en: "You may disagree with a work, opinion, rating, or another user's decision. Criticism should remain related to the content or observed behavior without turning the discussion into a personal attack.",
        es: "Puedes discrepar de una obra, opinión, valoración o decisión de otro usuario. La crítica debe mantenerse relacionada con el contenido o el comportamiento observado, sin convertirse en un ataque personal.",
      },
      {
        pt: "O contexto, a repetição, a intenção aparente e o impacto sobre a pessoa afetada podem ser considerados na moderação.",
        en: "Context, repetition, apparent intent, and impact on the affected person may be considered during moderation.",
        es: "El contexto, la repetición, la intención aparente y el impacto sobre la persona afectada pueden considerarse durante la moderación.",
      },
    ],
    permitido: [
      {
        pt: "Explicar por que uma história, capítulo, personagem ou decisão narrativa não funcionou para você.",
        en: "Explain why a story, chapter, character, or narrative decision did not work for you.",
        es: "Explicar por qué una historia, capítulo, personaje o decisión narrativa no funcionó para ti.",
      },
      {
        pt: "Discordar com educação e apresentar argumentos relacionados ao tema.",
        en: "Disagree respectfully and provide arguments related to the topic.",
        es: "Discrepar con respeto y presentar argumentos relacionados con el tema.",
      },
      {
        pt: "Bloquear, deixar de seguir ou denunciar uma interação desconfortável.",
        en: "Block, unfollow, or report an uncomfortable interaction.",
        es: "Bloquear, dejar de seguir o denunciar una interacción incómoda.",
      },
    ],
    proibido: [
      {
        pt: "Insultos direcionados, humilhação, perseguição coordenada ou tentativas de constranger alguém repetidamente.",
        en: "Targeted insults, humiliation, coordinated harassment, or repeated attempts to intimidate someone.",
        es: "Insultos dirigidos, humillación, acoso coordinado o intentos repetidos de intimidar a alguien.",
      },
      {
        pt: "Ameaças, incentivo à violência ou divulgação de informações pessoais para causar medo ou dano.",
        en: "Threats, encouragement of violence, or disclosure of personal information to cause fear or harm.",
        es: "Amenazas, incitación a la violencia o divulgación de información personal para causar miedo o daño.",
      },
      {
        pt: "Assédio sexual, mensagens insistentes após recusa ou contato invasivo fora do contexto da plataforma.",
        en: "Sexual harassment, persistent messages after refusal, or invasive contact outside the platform context.",
        es: "Acoso sexual, mensajes insistentes después de una negativa o contacto invasivo fuera del contexto de la plataforma.",
      },
    ],
  },
  {
    id: "odio-discriminacao",
    numero: "3",
    icon: "ban",
    titulo: {
      pt: "Ódio, discriminação e desumanização",
      en: "Hate, discrimination, and dehumanization",
      es: "Odio, discriminación y deshumanización",
    },
    resumo: {
      pt: "Não são permitidos ataques contra pessoas por características protegidas.",
      en: "Attacks against people based on protected characteristics are not allowed.",
      es: "No se permiten ataques contra personas por características protegidas.",
    },
    paragrafos: [
      {
        pt: "O Historietas não permite conteúdo que ataque, inferiorize, desumanize, ameace ou defenda exclusão ou violência contra pessoas ou grupos por raça, cor, etnia, nacionalidade, religião, deficiência, sexo, orientação sexual, identidade de gênero ou outra característica protegida pela legislação.",
        en: "Historietas does not allow content that attacks, degrades, dehumanizes, threatens, or advocates exclusion or violence against people or groups based on race, color, ethnicity, nationality, religion, disability, sex, sexual orientation, gender identity, or another characteristic protected by law.",
        es: "Historietas no permite contenido que ataque, degrade, deshumanice, amenace o promueva la exclusión o violencia contra personas o grupos por raza, color, etnia, nacionalidad, religión, discapacidad, sexo, orientación sexual, identidad de género u otra característica protegida por la ley.",
      },
      {
        pt: "Obras ficcionais, históricas, educativas, jornalísticas ou de denúncia podem retratar preconceito e violência quando o contexto demonstra finalidade narrativa, crítica ou informativa, sem promoção do dano.",
        en: "Fictional, historical, educational, journalistic, or awareness content may portray prejudice and violence when the context demonstrates a narrative, critical, or informative purpose without promoting harm.",
        es: "Las obras de ficción, históricas, educativas, periodísticas o de denuncia pueden representar prejuicio y violencia cuando el contexto demuestra una finalidad narrativa, crítica o informativa, sin promover el daño.",
      },
    ],
    proibido: [
      {
        pt: "Defender superioridade, segregação ou eliminação de grupos protegidos.",
        en: "Advocate superiority, segregation, or elimination of protected groups.",
        es: "Defender la superioridad, segregación o eliminación de grupos protegidos.",
      },
      {
        pt: "Usar ofensas degradantes para atacar diretamente uma pessoa ou comunidade.",
        en: "Use degrading slurs to directly attack a person or community.",
        es: "Utilizar insultos degradantes para atacar directamente a una persona o comunidad.",
      },
      {
        pt: "Celebrar ou incentivar violência real contra pessoas por essas características.",
        en: "Celebrate or encourage real-world violence against people based on these characteristics.",
        es: "Celebrar o incentivar violencia real contra personas por estas características.",
      },
    ],
  },
  {
    id: "violencia-seguranca",
    numero: "4",
    icon: "alert",
    titulo: {
      pt: "Violência, ameaças e segurança",
      en: "Violence, threats, and safety",
      es: "Violencia, amenazas y seguridad",
    },
    resumo: {
      pt: "Ameaças reais, incentivo a ataques e instruções para causar dano não são permitidos.",
      en: "Real threats, encouragement of attacks, and instructions to cause harm are not allowed.",
      es: "No se permiten amenazas reales, incitación a ataques ni instrucciones para causar daño.",
    },
    paragrafos: [
      {
        pt: "Ficção pode conter conflitos, crimes e violência como parte da narrativa. O que não é permitido é utilizar o Historietas para ameaçar pessoas reais, organizar ataques, glorificar agressões reais recentes ou orientar ações com intenção de ferir.",
        en: "Fiction may contain conflict, crime, and violence as part of a narrative. What is not allowed is using Historietas to threaten real people, organize attacks, glorify recent real-world assaults, or guide actions intended to injure.",
        es: "La ficción puede contener conflictos, delitos y violencia como parte de la narrativa. Lo que no está permitido es utilizar Historietas para amenazar a personas reales, organizar ataques, glorificar agresiones reales recientes u orientar acciones con intención de herir.",
      },
      {
        pt: "Conteúdo de conscientização, prevenção, apoio ou recuperação pode ser permitido quando não incentiva o dano e não apresenta instruções perigosas.",
        en: "Awareness, prevention, support, or recovery content may be allowed when it does not encourage harm or provide dangerous instructions.",
        es: "El contenido de concienciación, prevención, apoyo o recuperación puede permitirse cuando no fomenta el daño ni presenta instrucciones peligrosas.",
      },
    ],
    proibido: [
      {
        pt: "Ameaças específicas ou declarações críveis de intenção de ferir pessoas.",
        en: "Specific threats or credible statements of intent to harm people.",
        es: "Amenazas específicas o declaraciones creíbles de intención de dañar a personas.",
      },
      {
        pt: "Coordenação de agressões, perseguição física ou invasão de contas e dispositivos.",
        en: "Coordination of assaults, physical stalking, or intrusion into accounts and devices.",
        es: "Coordinación de agresiones, persecución física o intrusión en cuentas y dispositivos.",
      },
      {
        pt: "Instruções destinadas a facilitar violência, sabotagem ou dano grave.",
        en: "Instructions intended to facilitate violence, sabotage, or serious harm.",
        es: "Instrucciones destinadas a facilitar violencia, sabotaje o daño grave.",
      },
    ],
  },
  {
    id: "menores",
    numero: "5",
    icon: "child",
    titulo: {
      pt: "Proteção de crianças e adolescentes",
      en: "Protection of children and adolescents",
      es: "Protección de niños y adolescentes",
    },
    resumo: {
      pt: "Conteúdo ou comportamento que explore menores recebe prioridade máxima de proteção.",
      en: "Content or behavior that exploits minors receives the highest protection priority.",
      es: "El contenido o comportamiento que explote a menores recibe la máxima prioridad de protección.",
    },
    paragrafos: [
      {
        pt: "É proibido publicar, solicitar, promover, armazenar ou compartilhar material de exploração sexual de crianças e adolescentes, bem como qualquer tentativa de aliciamento, chantagem, sexualização abusiva ou contato impróprio.",
        en: "Publishing, requesting, promoting, storing, or sharing child sexual exploitation material is prohibited, as is any attempt at grooming, blackmail, abusive sexualization, or inappropriate contact.",
        es: "Está prohibido publicar, solicitar, promover, almacenar o compartir material de explotación sexual infantil, así como cualquier intento de captación, chantaje, sexualización abusiva o contacto inapropiado.",
      },
      {
        pt: "Obras de ficção que abordem abuso, proteção ou recuperação devem evitar exploração gráfica e não podem normalizar, erotizar ou incentivar dano contra menores.",
        en: "Fictional works addressing abuse, protection, or recovery should avoid exploitative graphic detail and may not normalize, eroticize, or encourage harm involving minors.",
        es: "Las obras de ficción que aborden abuso, protección o recuperación deben evitar detalles gráficos explotadores y no pueden normalizar, erotizar o fomentar daño relacionado con menores.",
      },
      {
        pt: "Situações com risco imediato podem ser preservadas e encaminhadas às autoridades competentes conforme a legislação.",
        en: "Situations involving immediate risk may be preserved and referred to competent authorities as required by law.",
        es: "Las situaciones con riesgo inmediato pueden conservarse y remitirse a las autoridades competentes conforme a la ley.",
      },
    ],
    proibido: [
      {
        pt: "Conteúdo sexual envolvendo menores reais ou representações destinadas à exploração sexual.",
        en: "Sexual content involving real minors or representations intended for sexual exploitation.",
        es: "Contenido sexual que involucre a menores reales o representaciones destinadas a la explotación sexual.",
      },
      {
        pt: "Pedidos de imagens íntimas, conversas sexualizadas ou tentativa de levar menores para canais privados.",
        en: "Requests for intimate images, sexualized conversations, or attempts to move minors to private channels.",
        es: "Solicitudes de imágenes íntimas, conversaciones sexualizadas o intentos de llevar a menores a canales privados.",
      },
      {
        pt: "Divulgação de dados que possam localizar ou expor uma criança ou adolescente a risco.",
        en: "Disclosure of data that could locate or expose a child or adolescent to risk.",
        es: "Divulgación de datos que puedan localizar o exponer a un niño o adolescente a riesgo.",
      },
    ],
  },
  {
    id: "conteudo-sexual",
    numero: "6",
    icon: "eye",
    titulo: {
      pt: "Conteúdo sexual e nudez",
      en: "Sexual content and nudity",
      es: "Contenido sexual y desnudez",
    },
    resumo: {
      pt: "Conteúdo adulto precisa respeitar a lei, o contexto e a proteção de menores.",
      en: "Adult content must respect the law, context, and protection of minors.",
      es: "El contenido adulto debe respetar la ley, el contexto y la protección de menores.",
    },
    paragrafos: [
      {
        pt: "Temas românticos, afetivos ou sexuais entre adultos podem aparecer em obras de ficção, desde que não violem a lei, não envolvam exploração, coerção real ou menores e não sejam usados para assediar usuários.",
        en: "Romantic, emotional, or sexual themes between adults may appear in fictional works as long as they do not violate the law, involve exploitation, real coercion, or minors, and are not used to harass users.",
        es: "Los temas románticos, afectivos o sexuales entre adultos pueden aparecer en obras de ficción siempre que no infrinjan la ley, no impliquen explotación, coerción real o menores y no se utilicen para acosar a usuarios.",
      },
      {
        pt: "Quando existirem classificações indicativas, avisos de conteúdo ou controles de visibilidade, autores devem utilizá-los de forma honesta e compatível com o material publicado.",
        en: "When age ratings, content warnings, or visibility controls are available, authors should use them honestly and consistently with the published material.",
        es: "Cuando existan clasificaciones por edad, avisos de contenido o controles de visibilidad, los autores deben utilizarlos de forma honesta y coherente con el material publicado.",
      },
      {
        pt: "Obras classificadas como 18+ devem informar os avisos de conteúdo aplicáveis. Temas sexuais não explícitos entre personagens adultos podem fazer parte de uma narrativa, mas o Historietas não é uma plataforma de pornografia e aplica regras mais restritivas a capas, avatares, miniaturas, mangás e outras imagens.",
        en: "Works rated 18+ must include the applicable content warnings. Non-explicit sexual themes between adult characters may be part of a narrative, but Historietas is not a pornography platform and applies stricter rules to covers, avatars, thumbnails, comics, and other images.",
        es: "Las obras clasificadas como 18+ deben incluir las advertencias de contenido aplicables. Los temas sexuales no explícitos entre personajes adultos pueden formar parte de una narrativa, pero Historietas no es una plataforma de pornografía y aplica reglas más estrictas a portadas, avatares, miniaturas, cómics y otras imágenes.",
      },
    ],
    proibido: [
      {
        pt: "Conteúdo sexual não consensual real, exploração sexual ou divulgação íntima sem autorização.",
        en: "Real non-consensual sexual content, sexual exploitation, or unauthorized intimate disclosure.",
        es: "Contenido sexual real no consentido, explotación sexual o divulgación íntima sin autorización.",
      },
      {
        pt: "Uso de comentários, perfil ou comunidade para solicitar encontros ou materiais íntimos de forma invasiva.",
        en: "Use of comments, profiles, or community areas to invasively request meetings or intimate materials.",
        es: "Uso de comentarios, perfiles o áreas comunitarias para solicitar encuentros o materiales íntimos de forma invasiva.",
      },
      {
        pt: "Pornografia, descrições sexuais explícitas publicadas principalmente para excitação, imagens de genitais ou atos sexuais e capas ou miniaturas sexualmente explícitas.",
        en: "Pornography, sexually explicit descriptions published primarily for arousal, images of genitals or sexual acts, and sexually explicit covers or thumbnails.",
        es: "Pornografía, descripciones sexuales explícitas publicadas principalmente para la excitación, imágenes de genitales o actos sexuales y portadas o miniaturas sexualmente explícitas.",
      },
      {
        pt: "Qualquer sexualização de menores.",
        en: "Any sexualization of minors.",
        es: "Cualquier sexualización de menores.",
      },
    ],
  },
  {
    id: "autoria",
    numero: "7",
    icon: "copyright",
    titulo: {
      pt: "Direitos autorais, plágio e identidade",
      en: "Copyright, plagiarism, and identity",
      es: "Derechos de autor, plagio e identidad",
    },
    resumo: {
      pt: "Autores devem publicar apenas conteúdo próprio ou autorizado.",
      en: "Authors must publish only their own or authorized content.",
      es: "Los autores deben publicar solo contenido propio o autorizado.",
    },
    paragrafos: [
      {
        pt: "O Historietas valoriza autoria original. Você deve possuir direitos ou autorização sobre textos, capas, imagens, traduções, adaptações, personagens, marcas e demais materiais utilizados.",
        en: "Historietas values original authorship. You must hold rights or authorization for texts, covers, images, translations, adaptations, characters, trademarks, and other materials used.",
        es: "Historietas valora la autoría original. Debes tener derechos o autorización sobre textos, portadas, imágenes, traducciones, adaptaciones, personajes, marcas y demás materiales utilizados.",
      },
      {
        pt: "Referências, fanfics, paródias, resenhas e obras transformativas podem estar sujeitas a regras específicas e à legislação aplicável. A publicação na plataforma não substitui a necessidade de verificar permissões.",
        en: "References, fan fiction, parodies, reviews, and transformative works may be subject to specific rules and applicable law. Publishing on the platform does not replace the need to verify permissions.",
        es: "Las referencias, fanfics, parodias, reseñas y obras transformativas pueden estar sujetas a reglas específicas y a la legislación aplicable. Publicar en la plataforma no sustituye la necesidad de verificar permisos.",
      },
    ],
    permitido: [
      {
        pt: "Publicar obra própria e identificar corretamente colaboradores.",
        en: "Publish your own work and properly identify collaborators.",
        es: "Publicar una obra propia e identificar correctamente a los colaboradores.",
      },
      {
        pt: "Usar materiais licenciados ou de domínio público respeitando as condições aplicáveis.",
        en: "Use licensed or public-domain materials while respecting applicable conditions.",
        es: "Utilizar materiales con licencia o de dominio público respetando las condiciones aplicables.",
      },
      {
        pt: "Citar trechos curtos quando permitido, com contexto, crédito e finalidade legítima.",
        en: "Quote short excerpts when permitted, with context, credit, and a legitimate purpose.",
        es: "Citar fragmentos breves cuando esté permitido, con contexto, crédito y finalidad legítima.",
      },
    ],
    proibido: [
      {
        pt: "Copiar uma obra inteira ou parte substancial e apresentá-la como própria.",
        en: "Copy an entire work or substantial portion and present it as your own.",
        es: "Copiar una obra completa o una parte sustancial y presentarla como propia.",
      },
      {
        pt: "Utilizar capas, artes ou traduções de terceiros sem permissão quando ela for necessária.",
        en: "Use third-party covers, artwork, or translations without permission when permission is required.",
        es: "Utilizar portadas, arte o traducciones de terceros sin permiso cuando sea necesario.",
      },
      {
        pt: "Imitar identidade, perfil ou comunicação de outra pessoa para enganar usuários.",
        en: "Imitate another person's identity, profile, or communication to deceive users.",
        es: "Imitar la identidad, el perfil o la comunicación de otra persona para engañar a los usuarios.",
      },
    ],
  },
  {
    id: "fraude-spam",
    numero: "8",
    icon: "lock",
    titulo: {
      pt: "Fraude, spam e manipulação",
      en: "Fraud, spam, and manipulation",
      es: "Fraude, spam y manipulación",
    },
    resumo: {
      pt: "Não é permitido manipular métricas, enganar usuários ou comprometer a plataforma.",
      en: "Manipulating metrics, deceiving users, or compromising the platform is not allowed.",
      es: "No se permite manipular métricas, engañar a los usuarios ni comprometer la plataforma.",
    },
    paragrafos: [
      {
        pt: "Interações devem representar ações reais. Seguidores, leituras, curtidas, favoritos, comentários, avaliações e posições de destaque não podem ser comprados, trocados, automatizados ou coordenados para produzir uma impressão falsa.",
        en: "Interactions must represent genuine actions. Followers, reads, likes, favorites, comments, ratings, and ranking positions may not be purchased, exchanged, automated, or coordinated to create a false impression.",
        es: "Las interacciones deben representar acciones reales. Los seguidores, lecturas, me gusta, favoritos, comentarios, valoraciones y posiciones destacadas no pueden comprarse, intercambiarse, automatizarse ni coordinarse para crear una impresión falsa.",
      },
    ],
    proibido: [
      {
        pt: "Golpes, phishing, falsos sorteios, pedidos enganosos de pagamento ou coleta indevida de dados.",
        en: "Scams, phishing, fake giveaways, deceptive payment requests, or improper data collection.",
        es: "Estafas, phishing, sorteos falsos, solicitudes engañosas de pago o recopilación indebida de datos.",
      },
      {
        pt: "Contas automatizadas ou múltiplas contas usadas para inflar números ou atacar outros usuários.",
        en: "Automated or multiple accounts used to inflate numbers or attack other users.",
        es: "Cuentas automatizadas o múltiples cuentas utilizadas para inflar cifras o atacar a otros usuarios.",
      },
      {
        pt: "Malware, links maliciosos, tentativas de invasão, raspagem abusiva ou contorno de controles de acesso.",
        en: "Malware, malicious links, intrusion attempts, abusive scraping, or bypassing access controls.",
        es: "Malware, enlaces maliciosos, intentos de intrusión, extracción abusiva o elusión de controles de acceso.",
      },
      {
        pt: "Publicidade repetitiva, irrelevante ou publicada em massa sem autorização.",
        en: "Repeated, irrelevant, or mass-posted advertising without authorization.",
        es: "Publicidad repetitiva, irrelevante o publicada en masa sin autorización.",
      },
    ],
  },
  {
    id: "privacidade",
    numero: "9",
    icon: "shield",
    titulo: {
      pt: "Privacidade e informações pessoais",
      en: "Privacy and personal information",
      es: "Privacidad e información personal",
    },
    resumo: {
      pt: "Não exponha dados de outras pessoas sem autorização.",
      en: "Do not expose other people's data without authorization.",
      es: "No expongas los datos de otras personas sin autorización.",
    },
    paragrafos: [
      {
        pt: "Não publique endereços, documentos, números de telefone, credenciais, localização em tempo real, imagens íntimas ou outras informações privadas de terceiros sem uma base legítima e autorização adequada.",
        en: "Do not publish addresses, documents, phone numbers, credentials, real-time location, intimate images, or other private information belonging to third parties without a legitimate basis and proper authorization.",
        es: "No publiques direcciones, documentos, números de teléfono, credenciales, ubicación en tiempo real, imágenes íntimas u otra información privada de terceros sin una base legítima y autorización adecuada.",
      },
      {
        pt: "Informações já públicas também podem ser removidas quando forem reunidas ou utilizadas com intenção de assediar, ameaçar, localizar ou causar dano.",
        en: "Information that is already public may also be removed when collected or used to harass, threaten, locate, or cause harm.",
        es: "La información que ya es pública también puede eliminarse cuando se recopile o utilice para acosar, amenazar, localizar o causar daño.",
      },
    ],
    permitido: [
      {
        pt: "Compartilhar seus próprios dados de contato quando você compreender os riscos e isso não violar outras regras.",
        en: "Share your own contact information when you understand the risks and it does not violate other rules.",
        es: "Compartir tus propios datos de contacto cuando comprendas los riesgos y no infrinja otras reglas.",
      },
      {
        pt: "Relatar um fato de interesse público utilizando apenas as informações necessárias e de forma responsável.",
        en: "Report a matter of public interest using only necessary information and doing so responsibly.",
        es: "Informar sobre un asunto de interés público utilizando solo la información necesaria y de forma responsable.",
      },
    ],
    proibido: [
      {
        pt: "Doxxing, exposição de endereço, telefone, documentos, credenciais ou localização com intenção de intimidar.",
        en: "Doxxing or exposing addresses, phone numbers, documents, credentials, or location to intimidate.",
        es: "Doxxing o exposición de direcciones, teléfonos, documentos, credenciales o ubicación con intención de intimidar.",
      },
      {
        pt: "Publicação de imagens íntimas sem consentimento.",
        en: "Publication of intimate images without consent.",
        es: "Publicación de imágenes íntimas sin consentimiento.",
      },
      {
        pt: "Tentativa de obter senhas, códigos de verificação ou acesso à conta de outra pessoa.",
        en: "Attempts to obtain passwords, verification codes, or access to another person's account.",
        es: "Intentos de obtener contraseñas, códigos de verificación o acceso a la cuenta de otra persona.",
      },
    ],
  },
  {
    id: "classificacao-contexto",
    numero: "10",
    icon: "book",
    titulo: {
      pt: "Classificação, avisos e contexto narrativo",
      en: "Ratings, warnings, and narrative context",
      es: "Clasificación, avisos y contexto narrativo",
    },
    resumo: {
      pt: "Autores devem apresentar suas obras de forma honesta e contextualizada.",
      en: "Authors should present their works honestly and with appropriate context.",
      es: "Los autores deben presentar sus obras de forma honesta y contextualizada.",
    },
    paragrafos: [
      {
        pt: "Título, capa, sinopse, gênero, classificação e avisos de conteúdo devem representar razoavelmente a obra. Informações enganosas podem prejudicar leitores e dificultar a aplicação correta dos controles da plataforma.",
        en: "Title, cover, synopsis, genre, rating, and content warnings should reasonably represent the work. Misleading information may harm readers and interfere with proper platform controls.",
        es: "El título, la portada, la sinopsis, el género, la clasificación y los avisos de contenido deben representar razonablemente la obra. La información engañosa puede perjudicar a los lectores y dificultar la aplicación correcta de los controles de la plataforma.",
      },
      {
        pt: "Conteúdo sensível pode receber limitações de alcance, avisos ou exigências adicionais mesmo quando permitido, especialmente para proteger menores e pessoas que não desejam visualizá-lo.",
        en: "Sensitive content may receive reach limitations, warnings, or additional requirements even when allowed, especially to protect minors and people who do not wish to view it.",
        es: "El contenido sensible puede recibir limitaciones de alcance, avisos o requisitos adicionales incluso cuando esté permitido, especialmente para proteger a menores y a personas que no desean verlo.",
      },
    ],
    permitido: [
      {
        pt: "Utilizar avisos claros para violência, abuso, linguagem intensa e outros temas relevantes.",
        en: "Use clear warnings for violence, abuse, strong language, and other relevant themes.",
        es: "Utilizar avisos claros para violencia, abuso, lenguaje intenso y otros temas relevantes.",
      },
      {
        pt: "Retratar assuntos difíceis com finalidade narrativa, crítica, educativa ou de conscientização.",
        en: "Portray difficult subjects for narrative, critical, educational, or awareness purposes.",
        es: "Representar temas difíciles con finalidad narrativa, crítica, educativa o de concienciación.",
      },
    ],
    proibido: [
      {
        pt: "Usar capa, sinopse ou classificação enganosa para ocultar conteúdo que viola regras.",
        en: "Use a misleading cover, synopsis, or rating to conceal rule-violating content.",
        es: "Utilizar una portada, sinopsis o clasificación engañosa para ocultar contenido que infringe las reglas.",
      },
      {
        pt: "Inserir material proibido sob justificativa genérica de ficção sem contexto legítimo.",
        en: "Include prohibited material under a generic claim of fiction without legitimate context.",
        es: "Incluir material prohibido bajo una justificación genérica de ficción sin contexto legítimo.",
      },
    ],
  },
  {
    id: "denuncias",
    numero: "11",
    icon: "flag",
    titulo: {
      pt: "Como denunciar uma violação",
      en: "How to report a violation",
      es: "Cómo denunciar una infracción",
    },
    resumo: {
      pt: "Denúncias devem ser feitas de boa-fé e conter informações úteis para análise.",
      en: "Reports should be made in good faith and include useful review information.",
      es: "Las denuncias deben realizarse de buena fe e incluir información útil para la revisión.",
    },
    paragrafos: [
      {
        pt: "Ao encontrar conteúdo ou comportamento que possa violar estas Diretrizes, utilize as ferramentas de denúncia disponíveis ou a Central de ajuda. Informe o conteúdo, perfil ou interação envolvida e explique de forma objetiva o motivo da denúncia.",
        en: "When you encounter content or behavior that may violate these Guidelines, use available reporting tools or the Help center. Identify the content, profile, or interaction involved and objectively explain the reason for the report.",
        es: "Cuando encuentres contenido o comportamiento que pueda infringir estas Normas, utiliza las herramientas de denuncia disponibles o el Centro de ayuda. Identifica el contenido, perfil o interacción implicada y explica de forma objetiva el motivo de la denuncia.",
      },
      {
        pt: "Não organize denúncias falsas, repetitivas ou coordenadas para silenciar alguém por discordância pessoal. O abuso das ferramentas de denúncia também pode resultar em medidas.",
        en: "Do not organize false, repetitive, or coordinated reports to silence someone over personal disagreement. Abuse of reporting tools may also result in action.",
        es: "No organices denuncias falsas, repetitivas o coordinadas para silenciar a alguien por un desacuerdo personal. El abuso de las herramientas de denuncia también puede generar medidas.",
      },
    ],
    permitido: [
      {
        pt: "Enviar contexto, links, capturas ou informações necessárias para localizar a possível violação.",
        en: "Provide context, links, screenshots, or information needed to locate the possible violation.",
        es: "Proporcionar contexto, enlaces, capturas o información necesaria para localizar la posible infracción.",
      },
      {
        pt: "Comunicar risco imediato, ameaça ou exploração de menor pela forma mais rápida disponível.",
        en: "Report immediate risk, threats, or exploitation of a minor through the fastest available method.",
        es: "Comunicar riesgo inmediato, amenazas o explotación de un menor por el medio más rápido disponible.",
      },
    ],
    proibido: [
      {
        pt: "Fabricar provas, editar contexto de forma enganosa ou denunciar algo que você sabe não ser uma violação.",
        en: "Fabricate evidence, deceptively edit context, or report something you know is not a violation.",
        es: "Fabricar pruebas, editar el contexto de forma engañosa o denunciar algo que sabes que no es una infracción.",
      },
      {
        pt: "Ameaçar alguém com denúncias para obter vantagem, pagamento ou conteúdo.",
        en: "Threaten someone with reports to obtain advantage, payment, or content.",
        es: "Amenazar a alguien con denuncias para obtener ventaja, pago o contenido.",
      },
    ],
  },
  {
    id: "moderacao",
    numero: "12",
    icon: "scale",
    titulo: {
      pt: "Como funciona a moderação",
      en: "How moderation works",
      es: "Cómo funciona la moderación",
    },
    resumo: {
      pt: "As medidas consideram contexto, gravidade, risco e histórico relevante.",
      en: "Actions consider context, severity, risk, and relevant history.",
      es: "Las medidas consideran el contexto, la gravedad, el riesgo y el historial relevante.",
    },
    paragrafos: [
      {
        pt: "A moderação pode ser iniciada por denúncia, detecção técnica, análise administrativa, ordem de autoridade ou outro sinal confiável. Nem toda denúncia resulta em remoção, e nem toda medida exige uma denúncia prévia.",
        en: "Moderation may begin through a report, technical detection, administrative review, authority order, or another reliable signal. Not every report results in removal, and not every action requires a prior report.",
        es: "La moderación puede iniciarse mediante una denuncia, detección técnica, revisión administrativa, orden de autoridad u otra señal fiable. No toda denuncia resulta en eliminación, y no toda medida requiere una denuncia previa.",
      },
      {
        pt: "As medidas podem incluir aviso, redução de alcance, limitação de recursos, remoção de conteúdo, bloqueio de interação, suspensão temporária ou encerramento da conta.",
        en: "Actions may include warnings, reduced reach, feature limitations, content removal, interaction restrictions, temporary suspension, or account closure.",
        es: "Las medidas pueden incluir advertencias, reducción de alcance, limitación de funciones, eliminación de contenido, restricción de interacciones, suspensión temporal o cierre de la cuenta.",
      },
      {
        pt: "Violações graves, risco imediato, exploração de menores, fraude relevante, ameaças ou reincidência podem justificar medidas mais rápidas e severas.",
        en: "Serious violations, immediate risk, exploitation of minors, significant fraud, threats, or repeated violations may justify faster and more severe action.",
        es: "Las infracciones graves, el riesgo inmediato, la explotación de menores, el fraude relevante, las amenazas o la reincidencia pueden justificar medidas más rápidas y severas.",
      },
    ],
  },
  {
    id: "contestacao",
    numero: "13",
    icon: "refresh",
    titulo: {
      pt: "Contestação e correção de decisões",
      en: "Appeals and correction of decisions",
      es: "Apelación y corrección de decisiones",
    },
    resumo: {
      pt: "Quando disponível, usuários podem apresentar contexto adicional e solicitar revisão.",
      en: "When available, users may provide additional context and request review.",
      es: "Cuando esté disponible, los usuarios pueden aportar contexto adicional y solicitar una revisión.",
    },
    paragrafos: [
      {
        pt: "Quando uma medida admitir contestação, a pessoa afetada poderá explicar por que acredita que houve erro, enviar informações relevantes e solicitar nova análise pela Central de ajuda ou pelo canal indicado no aviso.",
        en: "When an action allows appeal, the affected person may explain why they believe an error occurred, provide relevant information, and request a new review through the Help center or the channel indicated in the notice.",
        es: "Cuando una medida permita apelación, la persona afectada podrá explicar por qué cree que hubo un error, proporcionar información relevante y solicitar una nueva revisión mediante el Centro de ayuda o el canal indicado en el aviso.",
      },
      {
        pt: "A contestação não garante reversão. Decisões podem ser mantidas quando a medida estiver de acordo com as regras, a legislação ou a proteção necessária de usuários e terceiros.",
        en: "An appeal does not guarantee reversal. Decisions may be upheld when the action is consistent with the rules, law, or necessary protection of users and third parties.",
        es: "Una apelación no garantiza la reversión. Las decisiones pueden mantenerse cuando la medida sea coherente con las reglas, la ley o la protección necesaria de usuarios y terceros.",
      },
    ],
  },
  {
    id: "atualizacoes",
    numero: "14",
    icon: "spark",
    titulo: {
      pt: "Atualizações destas Diretrizes",
      en: "Updates to these Guidelines",
      es: "Actualizaciones de estas Normas",
    },
    resumo: {
      pt: "As regras podem evoluir conforme surgem novos recursos, riscos e obrigações.",
      en: "The rules may evolve as new features, risks, and obligations emerge.",
      es: "Las reglas pueden evolucionar a medida que surgen nuevas funciones, riesgos y obligaciones.",
    },
    paragrafos: [
      {
        pt: "Estas Diretrizes podem ser atualizadas para melhorar a clareza, responder a novas formas de abuso, acompanhar mudanças da plataforma ou cumprir exigências legais.",
        en: "These Guidelines may be updated to improve clarity, address new forms of abuse, reflect platform changes, or comply with legal requirements.",
        es: "Estas Normas pueden actualizarse para mejorar la claridad, responder a nuevas formas de abuso, reflejar cambios de la plataforma o cumplir requisitos legales.",
      },
      {
        pt: "A versão atual indicará a data da última atualização. Mudanças relevantes poderão ser comunicadas por aviso no site ou outro meio adequado.",
        en: "The current version will show the date of the latest update. Material changes may be communicated through a site notice or another appropriate method.",
        es: "La versión actual indicará la fecha de la última actualización. Los cambios relevantes podrán comunicarse mediante un aviso en el sitio u otro medio adecuado.",
      },
    ],
  },
  {
    id: "contato",
    numero: "15",
    icon: "help",
    titulo: {
      pt: "Dúvidas e contato",
      en: "Questions and contact",
      es: "Dudas y contacto",
    },
    resumo: {
      pt: "A Central de ajuda é o canal para dúvidas, denúncias e revisões.",
      en: "The Help center is the channel for questions, reports, and reviews.",
      es: "El Centro de ayuda es el canal para dudas, denuncias y revisiones.",
    },
    paragrafos: [
      {
        pt: "Para esclarecer uma regra, denunciar uma possível violação ou solicitar revisão de uma medida, utilize a Central de ajuda do Historietas.",
        en: "To clarify a rule, report a possible violation, or request review of an action, use the Historietas Help center.",
        es: "Para aclarar una regla, denunciar una posible infracción o solicitar la revisión de una medida, utiliza el Centro de ayuda de Historietas.",
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
    users: (
      <>
        <path {...common} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle {...common} cx="9" cy="7" r="4" />
        <path {...common} d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path {...common} d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    heart: (
      <path
        {...common}
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
      />
    ),
    shield: (
      <>
        <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path {...common} d="m9 12 2 2 4-4" />
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
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
        <path {...common} d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    ban: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m5.6 5.6 12.8 12.8" />
      </>
    ),
    alert: (
      <>
        <path {...common} d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path {...common} d="M12 9v4M12 17h.01" />
      </>
    ),
    child: (
      <>
        <circle {...common} cx="12" cy="8" r="4" />
        <path {...common} d="M4 21a8 8 0 0 1 16 0M8 4l-2-2M16 4l2-2" />
      </>
    ),
    flag: (
      <>
        <path {...common} d="M5 22V4" />
        <path {...common} d="M5 4h11l-1 4 1 4H5" />
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
    eye: (
      <>
        <path {...common} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle {...common} cx="12" cy="12" r="3" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5M12 17v5M4.9 4.9 8.4 8.4M15.6 15.6l3.5 3.5M2 12h5M17 12h5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5" />
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

export default function DiretrizesDaComunidadePage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-diretrizes-root="true"
    >
      <style>{`${historietasThemeCss}${diretrizesCss}`}</style>

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
                pt: "CONVIVÊNCIA E SEGURANÇA",
                en: "COMMUNITY AND SAFETY",
                es: "CONVIVENCIA Y SEGURIDAD",
              })}
            </span>
            <h1 style={pageTitleStyle}>
              {t({
                pt: "Diretrizes da Comunidade",
                en: "Community Guidelines",
                es: "Normas de la Comunidad",
              })}
            </h1>
          </div>
        </header>

        <section style={heroStyle}>
          <span style={heroIconStyle}>
            <SvgIcon name="users" size={31} strokeWidth={2.05} />
          </span>

          <div style={heroTextStyle}>
            <span style={heroBadgeStyle}>
              <SvgIcon name="check" size={16} strokeWidth={2.35} />
              {t({
                pt: "Regras para uma comunidade segura",
                en: "Rules for a safer community",
                es: "Reglas para una comunidad segura",
              })}
            </span>

            <h2 style={heroTitleStyle}>
              {t({
                pt: "Crie, leia e participe com respeito",
                en: "Create, read, and participate respectfully",
                es: "Crea, lee y participa con respeto",
              })}
            </h2>

            <p style={heroDescriptionStyle}>
              {t({
                pt: "Estas Diretrizes explicam o que é permitido, o que deve ser evitado e como o Historietas age diante de riscos, abusos e violações.",
                en: "These Guidelines explain what is allowed, what should be avoided, and how Historietas responds to risks, abuse, and violations.",
                es: "Estas Normas explican qué está permitido, qué debe evitarse y cómo actúa Historietas ante riesgos, abusos e infracciones.",
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
                pt: "O Historietas apoia liberdade criativa, críticas e debates. Essa liberdade não inclui assédio, exploração, fraude, ameaças, plágio ou exposição indevida de outras pessoas.",
                en: "Historietas supports creative freedom, criticism, and debate. That freedom does not include harassment, exploitation, fraud, threats, plagiarism, or improper exposure of others.",
                es: "Historietas apoya la libertad creativa, las críticas y los debates. Esa libertad no incluye acoso, explotación, fraude, amenazas, plagio ni exposición indebida de otras personas.",
              })}
            </p>
          </div>
        </aside>

        <section
          style={principlesSectionStyle}
          aria-labelledby="principios-diretrizes"
        >
          <div style={sectionHeadingStyle}>
            <span style={sectionKickerStyle}>
              {t({
                pt: "PRINCÍPIOS",
                en: "PRINCIPLES",
                es: "PRINCIPIOS",
              })}
            </span>
            <h2
              id="principios-diretrizes"
              style={sectionTitleStyle}
            >
              {t({
                pt: "A base da comunidade",
                en: "The foundation of the community",
                es: "La base de la comunidad",
              })}
            </h2>
          </div>

          <div style={principlesGridStyle}>
            {PRINCIPIOS_COMUNIDADE.map((principio) => (
              <article
                key={principio.titulo.pt}
                className="diretrizes-principle"
              >
                <span className="diretrizes-principle-icon">
                  <SvgIcon
                    name={principio.icon}
                    size={24}
                    strokeWidth={2.05}
                  />
                </span>

                <div className="diretrizes-principle-copy">
                  <h3>{t(principio.titulo)}</h3>
                  <p>{t(principio.descricao)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div
          style={contentLayoutStyle}
          className="diretrizes-content-layout"
        >
          <nav
            style={tableOfContentsStyle}
            aria-label={t({
              pt: "Índice das Diretrizes da Comunidade",
              en: "Community Guidelines table of contents",
              es: "Índice de las Normas de la Comunidad",
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
              {SECOES_DIRETRIZES.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="diretrizes-toc-link"
                >
                  <span>{secao.numero}</span>
                  <strong>{t(secao.titulo)}</strong>
                </a>
              ))}
            </div>
          </nav>

          <div style={sectionsColumnStyle}>
            {SECOES_DIRETRIZES.map((secao) => (
              <section
                key={secao.id}
                id={secao.id}
                className="diretrizes-section"
                aria-labelledby={`${secao.id}-titulo`}
              >
                <header className="diretrizes-section-header">
                  <span className="diretrizes-section-icon">
                    <SvgIcon
                      name={secao.icon}
                      size={24}
                      strokeWidth={2.05}
                    />
                  </span>

                  <div className="diretrizes-section-heading">
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

                <div className="diretrizes-section-content">
                  {secao.paragrafos.map((paragrafo, index) => (
                    <p key={`${secao.id}-paragrafo-${index}`}>
                      {t(paragrafo)}
                    </p>
                  ))}

                  {secao.permitido?.length ? (
                    <div className="diretrizes-rule-box diretrizes-rule-box-allowed">
                      <div className="diretrizes-rule-title">
                        <SvgIcon
                          name="check"
                          size={20}
                          strokeWidth={2.3}
                        />
                        <strong>
                          {t({
                            pt: "Permitido e recomendado",
                            en: "Allowed and encouraged",
                            es: "Permitido y recomendado",
                          })}
                        </strong>
                      </div>

                      <ul>
                        {secao.permitido.map((item, index) => (
                          <li key={`${secao.id}-permitido-${index}`}>
                            <span className="diretrizes-list-dot">
                              <SvgIcon
                                name="check"
                                size={16}
                                strokeWidth={2.4}
                              />
                            </span>
                            <span>{t(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {secao.proibido?.length ? (
                    <div className="diretrizes-rule-box diretrizes-rule-box-prohibited">
                      <div className="diretrizes-rule-title">
                        <SvgIcon
                          name="ban"
                          size={20}
                          strokeWidth={2.3}
                        />
                        <strong>
                          {t({
                            pt: "Não permitido",
                            en: "Not allowed",
                            es: "No permitido",
                          })}
                        </strong>
                      </div>

                      <ul>
                        {secao.proibido.map((item, index) => (
                          <li key={`${secao.id}-proibido-${index}`}>
                            <span className="diretrizes-list-dot">
                              <SvgIcon
                                name="ban"
                                size={16}
                                strokeWidth={2.4}
                              />
                            </span>
                            <span>{t(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {secao.id === "denuncias" ||
                  secao.id === "contestacao" ||
                  secao.id === "contato" ? (
                    <Link
                      href="/ajuda"
                      className="diretrizes-primary-link"
                    >
                      <SvgIcon
                        name="help"
                        size={20}
                        strokeWidth={2.15}
                      />
                      <span>
                        {t({
                          pt: "Acessar a Central de ajuda",
                          en: "Open the Help center",
                          es: "Acceder al Centro de ayuda",
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
            <SvgIcon name="users" size={24} strokeWidth={2.05} />
          </span>

          <div style={footerTextStyle}>
            <strong>
              {t({
                pt: "Consulte os documentos relacionados",
                en: "Review related documents",
                es: "Consulta los documentos relacionados",
              })}
            </strong>
            <p>
              {t({
                pt: "Os Termos de Uso e a Política de Privacidade complementam estas Diretrizes da Comunidade.",
                en: "The Terms of Use and Privacy Policy complement these Community Guidelines.",
                es: "Los Términos de Uso y la Política de Privacidad complementan estas Normas de la Comunidad.",
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
            <SvgIcon
              name="arrowRight"
              size={19}
              strokeWidth={2.3}
            />
          </Link>
        </footer>
      </div>
    </main>
  );
}

const diretrizesCss = `
  [data-historietas-diretrizes-root="true"] {
    --diretrizes-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 90%,
      transparent
    );
    --diretrizes-control: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 8%,
      transparent
    );
    --diretrizes-control-hover: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 12%,
      transparent
    );
    --diretrizes-border: var(
      --historietas-border-soft,
      rgba(255,255,255,0.10)
    );
    --diretrizes-muted: var(
      --historietas-text-secondary,
      #D4D4D8
    );
    scroll-behavior: smooth;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-principle {
    min-height: 132px;
    border: 1px solid var(--diretrizes-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--diretrizes-card);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-principle-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--diretrizes-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-principle-copy {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-principle-copy h3 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.2;
    font-weight: 830;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-principle-copy p {
    margin: 0;
    color: var(--diretrizes-muted);
    font-size: 12px;
    line-height: 1.48;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-toc-link {
    min-height: 42px;
    border-radius: 11px;
    padding: 8px 9px;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: var(--diretrizes-muted);
    text-decoration: none;
    transition: background 150ms ease, color 150ms ease;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-toc-link:hover {
    background: var(--diretrizes-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-toc-link:focus-visible,
  [data-historietas-diretrizes-root="true"] .diretrizes-primary-link:focus-visible {
    outline: 3px solid color-mix(
      in srgb,
      var(--historietas-accent, #F97316) 70%,
      transparent
    );
    outline-offset: 3px;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-toc-link > span {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--diretrizes-control);
    color: inherit;
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-toc-link strong {
    min-width: 0;
    font-size: 11px;
    line-height: 1.25;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section {
    scroll-margin-top: 16px;
    border: 1px solid var(--diretrizes-border);
    border-radius: 21px;
    padding: clamp(16px, 4vw, 23px);
    background: var(--diretrizes-card);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-header {
    display: grid;
    grid-template-columns: 47px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--diretrizes-border);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-icon {
    width: 47px;
    height: 47px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 20%,
      var(--diretrizes-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-heading {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-heading > span {
    color: var(--historietas-secondary, #7C3AED);
    font-size: 9px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.13em;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-heading h2 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: clamp(18px, 4.7vw, 23px);
    line-height: 1.12;
    font-weight: 870;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-heading p {
    margin: 0;
    color: var(--diretrizes-muted);
    font-size: 12px;
    line-height: 1.42;
    font-weight: 570;
    overflow-wrap: anywhere;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-content {
    padding-top: 16px;
    display: grid;
    gap: 12px;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-section-content > p {
    margin: 0;
    color: var(--diretrizes-muted);
    font-size: 14px;
    line-height: 1.68;
    font-weight: 520;
    overflow-wrap: anywhere;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-box {
    border: 1px solid var(--diretrizes-border);
    border-radius: 15px;
    padding: 13px;
    display: grid;
    gap: 10px;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-box-allowed {
    background: color-mix(
      in srgb,
      #22C55E 8%,
      var(--diretrizes-card)
    );
    border-color: color-mix(
      in srgb,
      #22C55E 28%,
      var(--diretrizes-border)
    );
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-box-prohibited {
    background: color-mix(
      in srgb,
      #EF4444 8%,
      var(--diretrizes-card)
    );
    border-color: color-mix(
      in srgb,
      #EF4444 28%,
      var(--diretrizes-border)
    );
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 13px;
    line-height: 1.2;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-box ul {
    margin: 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-rule-box li {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr);
    align-items: start;
    gap: 9px;
    color: var(--diretrizes-muted);
    font-size: 13px;
    line-height: 1.5;
    font-weight: 550;
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-list-dot {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--diretrizes-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-diretrizes-root="true"] .diretrizes-primary-link {
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
  [data-historietas-diretrizes-root="true"] {
    --diretrizes-card: #050505;
    --diretrizes-control: rgba(255,255,255,0.08);
    --diretrizes-control-hover: rgba(255,255,255,0.12);
    --diretrizes-border: rgba(255,255,255,0.18);
    --diretrizes-muted: #C4C4C8;
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-diretrizes-root="true"] .diretrizes-section-icon {
    background: rgba(255,255,255,0.10);
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-diretrizes-root="true"] .diretrizes-primary-link {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 780px) {
    [data-historietas-diretrizes-root="true"] .diretrizes-content-layout {
      grid-template-columns: 1fr !important;
    }

    [data-historietas-diretrizes-root="true"] nav[aria-label] {
      position: static !important;
      max-height: none !important;
    }

    [data-historietas-diretrizes-root="true"] .diretrizes-section {
      scroll-margin-top: 12px;
    }
  }

  @media (max-width: 620px) {
    [data-historietas-diretrizes-root="true"] .diretrizes-section-header {
      grid-template-columns: 43px minmax(0, 1fr);
      gap: 10px;
    }

    [data-historietas-diretrizes-root="true"] .diretrizes-section-icon {
      width: 43px;
      height: 43px;
      border-radius: 14px;
    }

    [data-historietas-diretrizes-root="true"] .diretrizes-section-content > p {
      font-size: 13px;
      line-height: 1.63;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-diretrizes-root="true"],
    [data-historietas-diretrizes-root="true"] *,
    [data-historietas-diretrizes-root="true"] *::before,
    [data-historietas-diretrizes-root="true"] *::after {
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
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, var(--historietas-surface, #120C1E))",
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

const principlesSectionStyle: CSSProperties = {
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

const principlesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
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