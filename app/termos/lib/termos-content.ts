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
  | "shield"
  | "users"
  | "scale"
  | "book"
  | "lock"
  | "copyright"
  | "check"
  | "help"
  | "settings"
  | "info";

export type DocumentoPolitica = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
  temas: TextoTraduzido[];
};

export type PrincipioPlataforma = {
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export type EtapaLeitura = {
  numero: string;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export type AtalhoPoliticas = {
  href: string;
  icon: IconName;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
};

export const DOCUMENTOS_POLITICAS: DocumentoPolitica[] = [
  {
    href: "/termos-de-uso",
    icon: "file",
    titulo: {
      pt: "Termos de Uso",
      en: "Terms of Use",
      es: "Términos de Uso",
    },
    descricao: {
      pt: "Explicam as condições para criar uma conta, publicar, ler e utilizar os recursos do Historietas.",
      en: "Explain the conditions for creating an account, publishing, reading, and using Historietas features.",
      es: "Explican las condiciones para crear una cuenta, publicar, leer y utilizar las funciones de Historietas.",
    },
    temas: [
      {
        pt: "Conta e acesso",
        en: "Account and access",
        es: "Cuenta y acceso",
      },
      {
        pt: "Publicação",
        en: "Publishing",
        es: "Publicación",
      },
      {
        pt: "Uso da plataforma",
        en: "Platform use",
        es: "Uso de la plataforma",
      },
      {
        pt: "Responsabilidades",
        en: "Responsibilities",
        es: "Responsabilidades",
      },
    ],
  },
  {
    href: "/politica-de-privacidade",
    icon: "shield",
    titulo: {
      pt: "Política de Privacidade",
      en: "Privacy Policy",
      es: "Política de Privacidad",
    },
    descricao: {
      pt: "Mostra quais dados podem ser utilizados, por que são necessários e quais controles pertencem ao usuário.",
      en: "Shows which data may be used, why it is needed, and which controls belong to the user.",
      es: "Muestra qué datos pueden utilizarse, por qué son necesarios y qué controles pertenecen al usuario.",
    },
    temas: [
      {
        pt: "Dados da conta",
        en: "Account data",
        es: "Datos de la cuenta",
      },
      {
        pt: "Privacidade",
        en: "Privacy",
        es: "Privacidad",
      },
      {
        pt: "Armazenamento",
        en: "Storage",
        es: "Almacenamiento",
      },
      {
        pt: "Direitos do usuário",
        en: "User rights",
        es: "Derechos del usuario",
      },
    ],
  },
  {
    href: "/diretrizes-da-comunidade",
    icon: "users",
    titulo: {
      pt: "Diretrizes da Comunidade",
      en: "Community Guidelines",
      es: "Normas de la Comunidad",
    },
    descricao: {
      pt: "Definem as regras de convivência, publicação responsável, moderação e proteção da comunidade.",
      en: "Define the rules for respectful interaction, responsible publishing, moderation, and community protection.",
      es: "Definen las reglas de convivencia, publicación responsable, moderación y protección de la comunidad.",
    },
    temas: [
      {
        pt: "Respeito",
        en: "Respect",
        es: "Respeto",
      },
      {
        pt: "Conteúdo permitido",
        en: "Allowed content",
        es: "Contenido permitido",
      },
      {
        pt: "Moderação",
        en: "Moderation",
        es: "Moderación",
      },
      {
        pt: "Denúncias",
        en: "Reports",
        es: "Denuncias",
      },
    ],
  },
];

export const PRINCIPIOS_PLATAFORMA: PrincipioPlataforma[] = [
  {
    icon: "copyright",
    titulo: {
      pt: "Respeito à autoria",
      en: "Respect for authorship",
      es: "Respeto por la autoría",
    },
    descricao: {
      pt: "Cada pessoa deve publicar apenas conteúdo próprio ou que tenha autorização para utilizar.",
      en: "Each person must publish only content they own or are authorized to use.",
      es: "Cada persona debe publicar solo contenido propio o que tenga autorización para utilizar.",
    },
  },
  {
    icon: "shield",
    titulo: {
      pt: "Privacidade com controle",
      en: "Privacy with control",
      es: "Privacidad con control",
    },
    descricao: {
      pt: "O usuário escolhe a visibilidade de diferentes áreas do perfil e deve compreender como seus dados são utilizados.",
      en: "Users choose the visibility of different profile areas and should understand how their data is used.",
      es: "El usuario elige la visibilidad de distintas áreas del perfil y debe comprender cómo se utilizan sus datos.",
    },
  },
  {
    icon: "lock",
    titulo: {
      pt: "Segurança da conta",
      en: "Account security",
      es: "Seguridad de la cuenta",
    },
    descricao: {
      pt: "Senhas, sessões e informações de acesso devem ser protegidas e nunca compartilhadas com terceiros.",
      en: "Passwords, sessions, and access information must be protected and never shared with third parties.",
      es: "Las contraseñas, sesiones y datos de acceso deben protegerse y nunca compartirse con terceros.",
    },
  },
  {
    icon: "users",
    titulo: {
      pt: "Convivência responsável",
      en: "Responsible interaction",
      es: "Convivencia responsable",
    },
    descricao: {
      pt: "Comentários, avaliações e publicações devem respeitar outras pessoas e contribuir para um ambiente seguro.",
      en: "Comments, ratings, and posts should respect others and contribute to a safe environment.",
      es: "Los comentarios, valoraciones y publicaciones deben respetar a otras personas y contribuir a un entorno seguro.",
    },
  },
];

export const ETAPAS_LEITURA: EtapaLeitura[] = [
  {
    numero: "1",
    titulo: {
      pt: "Escolha o documento",
      en: "Choose the document",
      es: "Elige el documento",
    },
    descricao: {
      pt: "Abra a página relacionada à sua dúvida ou ao recurso que você pretende utilizar.",
      en: "Open the page related to your question or the feature you intend to use.",
      es: "Abre la página relacionada con tu duda o con la función que deseas utilizar.",
    },
  },
  {
    numero: "2",
    titulo: {
      pt: "Leia os pontos importantes",
      en: "Read the important points",
      es: "Lee los puntos importantes",
    },
    descricao: {
      pt: "Observe as regras sobre conta, conteúdo, privacidade, segurança e participação na comunidade.",
      en: "Review the rules about accounts, content, privacy, security, and community participation.",
      es: "Revisa las reglas sobre cuenta, contenido, privacidad, seguridad y participación en la comunidad.",
    },
  },
  {
    numero: "3",
    titulo: {
      pt: "Consulte quando precisar",
      en: "Review whenever needed",
      es: "Consulta cuando lo necesites",
    },
    descricao: {
      pt: "As páginas permanecem disponíveis para esclarecer dúvidas antes ou depois de utilizar o Historietas.",
      en: "The pages remain available to answer questions before or after using Historietas.",
      es: "Las páginas permanecen disponibles para resolver dudas antes o después de utilizar Historietas.",
    },
  },
];

export const ATALHOS_POLITICAS: AtalhoPoliticas[] = [
  {
    href: "/ajuda",
    icon: "help",
    titulo: {
      pt: "Central de ajuda",
      en: "Help center",
      es: "Centro de ayuda",
    },
    descricao: {
      pt: "Encontre respostas sobre os recursos do site.",
      en: "Find answers about site features.",
      es: "Encuentra respuestas sobre las funciones del sitio.",
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
      pt: "Gerencie conta, privacidade, dados e preferências.",
      en: "Manage your account, privacy, data, and preferences.",
      es: "Gestiona tu cuenta, privacidad, datos y preferencias.",
    },
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
