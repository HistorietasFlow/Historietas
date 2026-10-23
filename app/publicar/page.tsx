"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { publicarPageCss } from "./lib/publicar-page-css";
import {
  calcularMinutosLeitura,
  campoValido,
  contarCaracteresValidos,
  contarPalavras,
  limparTextoPersonalizado,
  nomeArquivoParaTitulo,
  textoPersonalizadoValido,
} from "./lib/publicar-text-utils";
import {
  criarUuidSeguro,
} from "./lib/publicar-id-utils";
import {
  arquivoImagemAceito,
  arquivoObraAceito,
  arquivoTextoAceito,
  identificarCategoriaArquivo,
} from "./lib/publicar-file-utils";
import {
  calcularProgressoLeitura,
  normalizarClassificacaoIndicativaPublicar,
} from "./lib/publicar-work-utils";
import {
  normalizarObraSalva,
  obraPertenceAoUsuarioPublicar,
} from "./lib/publicar-local-work-utils";
import { salvarObrasLocalmente } from "./lib/publicar-file-backup-storage-utils";
import {
  lerStorageUsuarioPublicar,
} from "./lib/publicar-user-storage-utils";
import { obterNomeMetadataPublicar } from "./lib/publicar-auth-utils";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  LIMITE_TAGS_OBRA,
  OUTRA_TAG_VALUE,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
  STORAGE_KEY,
  TAMANHO_MAXIMO_ARQUIVO_OBRA,
  TAMANHO_MAXIMO_ARQUIVO_TEXTO,
  TAMANHO_MAXIMO_CAPA,
} from "./lib/publicar-static-options";
import type {
  ArquivoObraLocal,
  ArquivoStoragePublicar,
  CapituloLocal,
  ObraLocal,
  ObraSalva,
} from "./lib/publicar-models";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { formatarTamanhoArquivo, normalizarTexto } from "../../lib/utils";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../../lib/i18n";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  ehClassificacao18,
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../lib/historietasAdultContent";
import {
  desfazerPublicacaoParcialPublicar,
  enviarArquivoStorage,
} from "./lib/publicar-storage-operations";
import { registrarDiarioPublicacao } from "./lib/publicar-diary-activity";
import { criarSlugUnicoSupabase } from "./lib/publicar-slug-supabase-loader";
import { carregarNomePerfilPublicar } from "./lib/publicar-profile-loader";
import {
  PublicarLoadingShell,
  PublicarPageShell,
} from "./components/PublicarPageShell";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarCoverUpload } from "./components/PublicarCoverUpload";
import { PublicarContentFileUpload } from "./components/PublicarContentFileUpload";
import { PublicarSynopsisField } from "./components/PublicarSynopsisField";
import { PublicarFormActions } from "./components/PublicarFormActions";
import { PublicarBasicFields } from "./components/PublicarBasicFields";
import { PublicarFormatGenreFields } from "./components/PublicarFormatGenreFields";
import { PublicarTagClassificationFields } from "./components/PublicarTagClassificationFields";
import {
  pageStyle,
  safeTextStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
} from "./lib/publicar-layout-styles";
import { criarDecoracaoPaginaStyle } from "./lib/publicar-page-decoration-style";
import {
  desktopFormPanelStyle,
  desktopFullWidthErrorBoxStyle,
  desktopMainGridSingleStyle,
  errorBoxStyle,
  formPanelStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";


type ChaveTextoPublicar = keyof (typeof TEXTOS_PUBLICAR)["pt-BR"];

const TEXTOS_PUBLICAR = {
  "pt-BR": {
    voltarHome: "Voltar para a Home",
    novaObra: "NOVA OBRA",
    notificacoes: "Notificações",
    notificacoesNaoLidas: "não lidas",
    ajusteNecessario: "Ajuste necessário:",
    capaSelecionada: "Capa selecionada",
    adicionarCapa: "Adicionar capa",
    dicaCapa: "Imagem vertical. Tamanho máximo: 2 MB.",
    escolherImagem: "Escolher imagem",
    remover: "Remover",
    tituloObra: "Título da obra",
    dicaTitulo: "Mínimo 3 letras ou números.",
    nomeAutor: "Nome do autor",
    dicaAutor: "Pode ser nome, nickname ou estúdio.",
    formato: "Formato",
    escolherFormato: "Escolha o formato",
    outroFormato: "Outro formato",
    digiteFormato: "Digite o formato",
    generoPrincipal: "Gênero principal",
    escolherGenero: "Escolha um gênero",
    outroGenero: "Outro gênero",
    digiteGenero: "Digite o gênero",
    tag: "Tag",
    escolherTag: "Escolha uma tag",
    outraTag: "Outra tag",
    digiteTag: "Digite a tag",
    classificacaoIndicativa: "Classificação indicativa",
    escolherClassificacao: "Escolha a classificação",
    sinopse: "Sinopse",
    resumoChamativo: "Escreva um resumo chamativo de sua história...",
    minimoSinopse: "Mínimo 20 letras ou números.",
    palavras: "palavras",
    adicionarConteudoArquivo: "Adicionar conteúdo por arquivo",
    opcional: "Opcional",
    comoUsarArquivo: "Como deseja usar este arquivo?",
    arquivoCompletoAnexado: "Arquivo completo anexado",
    primeiroCapituloImportado: "Primeiro capítulo importado",
    enviarArquivo: "Enviar PDF, texto ou imagem",
    dicaArquivoPendente: "Arquivos TXT e MD podem ser anexados como obra completa ou transformados no primeiro capítulo.",
    dicaArquivo: "PDF e imagens serão anexados. Arquivos TXT e MD permitem escolher entre anexo completo ou primeiro capítulo. Máximo: 5 MB.",
    texto: "Texto",
    primeiroCapitulo: "Primeiro capítulo",
    transformarCapitulo: "Transformar em capítulo",
    anexarArquivoCompleto: "Anexar arquivo completo",
    cancelar: "Cancelar",
    trocarArquivo: "Trocar arquivo",
    escolherArquivo: "Escolher arquivo",
    anexadoObra: "anexado à obra",
    titulo: "Título",
    salvando: "Salvando...",
    criarObra: "Criar obra",
    progresso: "Progresso",
    previaObra: "PRÉVIA DA OBRA",
    obraSemTitulo: "Obra sem título",
    classificacao: "Classificação",
    por: "Por",
    autorNaoInformado: "Autor não informado",
    capituloAbreviado: "cap.",
    capituloPronto: "1 cap. pronto",
    semCapitulo: "sem capítulo",
    primeiroCapituloMaiusculo: "PRIMEIRO CAPÍTULO",
    minLeitura: "min de leitura",
    genero: "Gênero",
    previa: "Prévia",
    previaAqui: "A prévia aparece aqui",
    dicaPrevia: "Preencha título, autor, gênero e capa para ver como a obra vai ficar.",
    imagem: "Imagem",
    arquivo: "Arquivo",
    livre: "Livre",
  },
  en: {
    voltarHome: "Back to Home",
    novaObra: "NEW WORK",
    notificacoes: "Notifications",
    notificacoesNaoLidas: "unread",
    ajusteNecessario: "Action required:",
    capaSelecionada: "Cover selected",
    adicionarCapa: "Add cover",
    dicaCapa: "Vertical image. Maximum size: 2 MB.",
    escolherImagem: "Choose image",
    remover: "Remove",
    tituloObra: "Work title",
    dicaTitulo: "At least 3 letters or numbers.",
    nomeAutor: "Author name",
    dicaAutor: "It may be a name, nickname, or studio.",
    formato: "Format",
    escolherFormato: "Choose the format",
    outroFormato: "Other format",
    digiteFormato: "Enter the format",
    generoPrincipal: "Main genre",
    escolherGenero: "Choose a genre",
    outroGenero: "Other genre",
    digiteGenero: "Enter the genre",
    tag: "Tag",
    escolherTag: "Choose a tag",
    outraTag: "Other tag",
    digiteTag: "Enter the tag",
    classificacaoIndicativa: "Age rating",
    escolherClassificacao: "Choose the age rating",
    sinopse: "Synopsis",
    resumoChamativo: "Write an engaging summary of your story...",
    minimoSinopse: "At least 20 letters or numbers.",
    palavras: "words",
    adicionarConteudoArquivo: "Add content from a file",
    opcional: "Optional",
    comoUsarArquivo: "How would you like to use this file?",
    arquivoCompletoAnexado: "Full file attached",
    primeiroCapituloImportado: "First chapter imported",
    enviarArquivo: "Upload PDF, text, or image",
    dicaArquivoPendente: "TXT and MD files can be attached as a full work or turned into the first chapter.",
    dicaArquivo: "PDFs and images will be attached. TXT and MD files let you choose between a full attachment or a first chapter. Maximum: 5 MB.",
    texto: "Text",
    primeiroCapitulo: "First chapter",
    transformarCapitulo: "Turn into chapter",
    anexarArquivoCompleto: "Attach full file",
    cancelar: "Cancel",
    trocarArquivo: "Change file",
    escolherArquivo: "Choose file",
    anexadoObra: "attached to the work",
    titulo: "Title",
    salvando: "Saving...",
    criarObra: "Create work",
    progresso: "Progress",
    previaObra: "WORK PREVIEW",
    obraSemTitulo: "Untitled work",
    classificacao: "Age rating",
    por: "By",
    autorNaoInformado: "Author not provided",
    capituloAbreviado: "ch.",
    capituloPronto: "1 ch. ready",
    semCapitulo: "no chapter",
    primeiroCapituloMaiusculo: "FIRST CHAPTER",
    minLeitura: "min read",
    genero: "Genre",
    previa: "Preview",
    previaAqui: "The preview appears here",
    dicaPrevia: "Fill in the title, author, genre, and cover to see how the work will look.",
    imagem: "Image",
    arquivo: "File",
    livre: "All ages",
  },
  es: {
    voltarHome: "Volver al inicio",
    novaObra: "NUEVA OBRA",
    notificacoes: "Notificaciones",
    notificacoesNaoLidas: "sin leer",
    ajusteNecessario: "Ajuste necesario:",
    capaSelecionada: "Portada seleccionada",
    adicionarCapa: "Añadir portada",
    dicaCapa: "Imagen vertical. Tamaño máximo: 2 MB.",
    escolherImagem: "Elegir imagen",
    remover: "Eliminar",
    tituloObra: "Título de la obra",
    dicaTitulo: "Mínimo 3 letras o números.",
    nomeAutor: "Nombre del autor",
    dicaAutor: "Puede ser un nombre, apodo o estudio.",
    formato: "Formato",
    escolherFormato: "Elige el formato",
    outroFormato: "Otro formato",
    digiteFormato: "Escribe el formato",
    generoPrincipal: "Género principal",
    escolherGenero: "Elige un género",
    outroGenero: "Otro género",
    digiteGenero: "Escribe el género",
    tag: "Etiqueta",
    escolherTag: "Elige una etiqueta",
    outraTag: "Otra etiqueta",
    digiteTag: "Escribe la etiqueta",
    classificacaoIndicativa: "Clasificación por edad",
    escolherClassificacao: "Elige la clasificación",
    sinopse: "Sinopsis",
    resumoChamativo: "Escribe un resumen atractivo de tu historia...",
    minimoSinopse: "Mínimo 20 letras o números.",
    palavras: "palabras",
    adicionarConteudoArquivo: "Añadir contenido desde un archivo",
    opcional: "Opcional",
    comoUsarArquivo: "¿Cómo deseas usar este archivo?",
    arquivoCompletoAnexado: "Archivo completo adjunto",
    primeiroCapituloImportado: "Primer capítulo importado",
    enviarArquivo: "Subir PDF, texto o imagen",
    dicaArquivoPendente: "Los archivos TXT y MD pueden adjuntarse como obra completa o convertirse en el primer capítulo.",
    dicaArquivo: "Los PDF y las imágenes se adjuntarán. Los archivos TXT y MD permiten elegir entre un adjunto completo o el primer capítulo. Máximo: 5 MB.",
    texto: "Texto",
    primeiroCapitulo: "Primer capítulo",
    transformarCapitulo: "Convertir en capítulo",
    anexarArquivoCompleto: "Adjuntar archivo completo",
    cancelar: "Cancelar",
    trocarArquivo: "Cambiar archivo",
    escolherArquivo: "Elegir archivo",
    anexadoObra: "adjunto a la obra",
    titulo: "Título",
    salvando: "Guardando...",
    criarObra: "Crear obra",
    progresso: "Progreso",
    previaObra: "VISTA PREVIA DE LA OBRA",
    obraSemTitulo: "Obra sin título",
    classificacao: "Clasificación",
    por: "Por",
    autorNaoInformado: "Autor no informado",
    capituloAbreviado: "cap.",
    capituloPronto: "1 cap. listo",
    semCapitulo: "sin capítulo",
    primeiroCapituloMaiusculo: "PRIMER CAPÍTULO",
    minLeitura: "min de lectura",
    genero: "Género",
    previa: "Vista previa",
    previaAqui: "La vista previa aparece aquí",
    dicaPrevia: "Completa el título, autor, género y portada para ver cómo quedará la obra.",
    imagem: "Imagen",
    arquivo: "Archivo",
    livre: "Todo público",
  },
} as const;

const MENSAGENS_ERRO_PUBLICAR: Record<HistorietasLanguage, Record<string, string>> = {
  "pt-BR": {},
  en: {
    "O título precisa ter pelo menos 3 letras ou números. Não pode ser só ponto.": "The title must contain at least 3 letters or numbers. It cannot consist only of punctuation.",
    "O nome do autor precisa ter pelo menos 2 letras ou números.": "The author name must contain at least 2 letters or numbers.",
    "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": "The custom format must contain 3 to 14 characters, without commas, emojis, or unsupported symbols.",
    "Escolha o formato da obra.": "Choose the work format.",
    "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": "The custom genre must contain 3 to 14 characters, without commas, emojis, or unsupported symbols.",
    "Escolha o gênero principal da obra.": "Choose the work's main genre.",
    "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.": "The custom tag must contain 2 to 10 characters, without commas, emojis, or unsupported symbols, and cannot repeat the genre or format.",
    "Escolha a classificação indicativa da obra.": "Choose the work's age rating.",
    "Selecione pelo menos um aviso de conteúdo para a obra 18+.": "Select at least one content warning for the 18+ work.",
    "A sinopse precisa ter pelo menos 20 letras ou números.": "The synopsis must contain at least 20 letters or numbers.",
    "O arquivo importado precisa ter pelo menos 20 letras ou números para virar o primeiro capítulo.": "The imported file must contain at least 20 letters or numbers to become the first chapter.",
    "Escolha um arquivo de imagem válido.": "Choose a valid image file.",
    "A capa precisa ter no máximo 2 MB.": "The cover must be no larger than 2 MB.",
    "Não consegui carregar essa imagem.": "I couldn't load this image.",
    "Não consegui carregar esse arquivo.": "I couldn't load this file.",
    "Para virar capítulo, o arquivo de texto precisa ter no máximo 900 KB. Você ainda pode anexá-lo como arquivo completo.": "To become a chapter, the text file must be no larger than 900 KB. You can still attach it as a full file.",
    "Esse arquivo tem pouco texto para virar um capítulo.": "This file does not contain enough text to become a chapter.",
    "Não consegui ler esse arquivo.": "I couldn't read this file.",
    "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF.": "Choose a PDF, TXT, MD, or an image in PNG, JPG, WEBP, or GIF format.",
    "O arquivo precisa ter no máximo 5 MB.": "The file must be no larger than 5 MB.",
    "Entre na sua conta antes de publicar uma obra.": "Sign in before publishing a work.",
    "Não consegui encontrar um nome de autor válido no seu perfil. Atualize seu perfil ou preencha o nome do autor.": "I couldn't find a valid author name in your profile. Update your profile or enter the author name.",
    "O navegador recusou salvar dados locais porque o armazenamento está cheio.": "The browser couldn't save local data because its storage is full.",
    "Não consegui salvar a obra agora. Tente novamente.": "I couldn't save the work right now. Try again.",
    "A obra foi publicada, mas não consegui abrir o Painel do Autor. Acesse o painel antes de tentar publicar novamente.": "The work was published, but I couldn't open the Author Dashboard. Open the dashboard before trying to publish again.",
  },
  es: {
    "O título precisa ter pelo menos 3 letras ou números. Não pode ser só ponto.": "El título debe tener al menos 3 letras o números. No puede contener solamente signos.",
    "O nome do autor precisa ter pelo menos 2 letras ou números.": "El nombre del autor debe tener al menos 2 letras o números.",
    "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": "El formato personalizado debe tener entre 3 y 14 caracteres, sin comas, emojis ni símbolos no admitidos.",
    "Escolha o formato da obra.": "Elige el formato de la obra.",
    "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho.": "El género personalizado debe tener entre 3 y 14 caracteres, sin comas, emojis ni símbolos no admitidos.",
    "Escolha o gênero principal da obra.": "Elige el género principal de la obra.",
    "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.": "La etiqueta personalizada debe tener entre 2 y 10 caracteres, sin comas, emojis ni símbolos no admitidos, y no puede repetir el género ni el formato.",
    "Escolha a classificação indicativa da obra.": "Elige la clasificación por edad de la obra.",
    "Selecione pelo menos um aviso de conteúdo para a obra 18+.": "Selecciona al menos una advertencia de contenido para la obra 18+.",
    "A sinopse precisa ter pelo menos 20 letras ou números.": "La sinopsis debe tener al menos 20 letras o números.",
    "O arquivo importado precisa ter pelo menos 20 letras ou números para virar o primeiro capítulo.": "El archivo importado debe tener al menos 20 letras o números para convertirse en el primer capítulo.",
    "Escolha um arquivo de imagem válido.": "Elige un archivo de imagen válido.",
    "A capa precisa ter no máximo 2 MB.": "La portada debe tener como máximo 2 MB.",
    "Não consegui carregar essa imagem.": "No pude cargar esta imagen.",
    "Não consegui carregar esse arquivo.": "No pude cargar este archivo.",
    "Para virar capítulo, o arquivo de texto precisa ter no máximo 900 KB. Você ainda pode anexá-lo como arquivo completo.": "Para convertirse en capítulo, el archivo de texto debe tener como máximo 900 KB. También puedes adjuntarlo como archivo completo.",
    "Esse arquivo tem pouco texto para virar um capítulo.": "Este archivo no tiene suficiente texto para convertirse en un capítulo.",
    "Não consegui ler esse arquivo.": "No pude leer este archivo.",
    "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF.": "Elige un PDF, TXT, MD o una imagen en formato PNG, JPG, WEBP o GIF.",
    "O arquivo precisa ter no máximo 5 MB.": "El archivo debe tener como máximo 5 MB.",
    "Entre na sua conta antes de publicar uma obra.": "Inicia sesión antes de publicar una obra.",
    "Não consegui encontrar um nome de autor válido no seu perfil. Atualize seu perfil ou preencha o nome do autor.": "No pude encontrar un nombre de autor válido en tu perfil. Actualiza tu perfil o escribe el nombre del autor.",
    "O navegador recusou salvar dados locais porque o armazenamento está cheio.": "El navegador no pudo guardar datos locales porque el almacenamiento está lleno.",
    "Não consegui salvar a obra agora. Tente novamente.": "No pude guardar la obra ahora. Inténtalo de nuevo.",
    "A obra foi publicada, mas não consegui abrir o Painel do Autor. Acesse o painel antes de tentar publicar novamente.": "La obra fue publicada, pero no pude abrir el Panel del Autor. Abre el panel antes de intentar publicar nuevamente.",
  },
};

function obterTextoPublicar(
  idioma: HistorietasLanguage,
  chave: ChaveTextoPublicar,
) {
  return TEXTOS_PUBLICAR[idioma][chave] || TEXTOS_PUBLICAR["pt-BR"][chave];
}

function traduzirClassificacaoPublicar(
  idioma: HistorietasLanguage,
  classificacao: string,
) {
  return classificacao === "Livre"
    ? obterTextoPublicar(idioma, "livre")
    : classificacao;
}

function traduzirMensagemPublicar(
  idioma: HistorietasLanguage,
  mensagem: string,
): string {
  if (!mensagem || idioma === "pt-BR") {
    return mensagem;
  }

  const mensagemExata = MENSAGENS_ERRO_PUBLICAR[idioma][mensagem];

  if (mensagemExata) {
    return mensagemExata;
  }

  const prefixos = idioma === "en"
    ? [
        ["Erro ao enviar ", "Error uploading "],
        ["Não consegui preparar o endereço da obra: ", "I couldn't prepare the work address: "],
        ["Não consegui salvar a obra agora: ", "I couldn't save the work: "],
        ["Não consegui salvar o capítulo inicial: ", "I couldn't save the first chapter: "],
        ["A obra foi preparada, mas não pôde ser publicada: ", "The work was prepared but couldn't be published: "],
      ]
    : [
        ["Erro ao enviar ", "Error al subir "],
        ["Não consegui preparar o endereço da obra: ", "No pude preparar la dirección de la obra: "],
        ["Não consegui salvar a obra agora: ", "No pude guardar la obra: "],
        ["Não consegui salvar o capítulo inicial: ", "No pude guardar el primer capítulo: "],
        ["A obra foi preparada, mas não pôde ser publicada: ", "La obra fue preparada, pero no pudo publicarse: "],
      ];

  for (const [prefixoOriginal, prefixoTraduzido] of prefixos) {
    if (mensagem.startsWith(prefixoOriginal)) {
      return `${prefixoTraduzido}${mensagem.slice(prefixoOriginal.length)}`;
    }
  }

  const sufixoParcial =
    " A publicação parcial não pôde ser removida automaticamente. Confira o Painel do Autor antes de tentar novamente.";

  if (mensagem.endsWith(sufixoParcial)) {
    const base = mensagem.slice(0, -sufixoParcial.length);
    const baseTraduzida: string = traduzirMensagemPublicar(idioma, base);

    return idioma === "en"
      ? `${baseTraduzida} The partial publication couldn't be removed automatically. Check the Author Dashboard before trying again.`
      : `${baseTraduzida} La publicación parcial no pudo eliminarse automáticamente. Revisa el Panel del Autor antes de intentarlo de nuevo.`;
  }

  return mensagem;
}

export default function PublicarPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [genero, setGenero] = useState("");
  const [generoPersonalizado, setGeneroPersonalizado] = useState("");
  const [formato, setFormato] = useState("");
  const [formatoPersonalizado, setFormatoPersonalizado] = useState("");
  const [classificacaoIndicativa, setClassificacaoIndicativa] = useState("");
  const [avisosConteudo18, setAvisosConteudo18] = useState<AvisoConteudo18[]>([]);
  const [sinopse, setSinopse] = useState("");
  const [tags, setTags] = useState("");
  const [tagPersonalizada, setTagPersonalizada] = useState("");
  const [usarTagPersonalizada, setUsarTagPersonalizada] = useState(false);
  const [capa, setCapa] = useState("");
  const [capaNome, setCapaNome] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaErro, setCapaErro] = useState("");
  const [arquivoObra, setArquivoObra] = useState<ArquivoObraLocal | null>(null);
  const [arquivoObraArquivo, setArquivoObraArquivo] = useState<File | null>(null);
  const [arquivoObraErro, setArquivoObraErro] = useState("");
  const [arquivoCapituloNome, setArquivoCapituloNome] = useState("");
  const [arquivoCapituloTitulo, setArquivoCapituloTitulo] = useState("");
  const [arquivoCapituloTexto, setArquivoCapituloTexto] = useState("");
  const [arquivoCapituloErro, setArquivoCapituloErro] = useState("");
  const [arquivoTextoPendente, setArquivoTextoPendente] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [verificandoAutenticacao, setVerificandoAutenticacao] = useState(true);
  const isDesktop = usePublicarDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language: idioma } = useHistorietasLanguage();
  const t = (chave: ChaveTextoPublicar) => obterTextoPublicar(idioma, chave);

  usePublicarInitialAccess({
    router,
    setAutor,
    setVerificandoAutenticacao,
  });

  const jaSalvouRef = useRef(false);
  const capaInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoConteudoInputRef = useRef<HTMLInputElement | null>(null);

  const tagsDaObra = useMemo(() => {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, LIMITE_TAGS_OBRA);
  }, [tags]);

  const formatoEhPersonalizado = formato === OUTRO_FORMATO_VALUE;
  const generoEhPersonalizado = genero === OUTRO_GENERO_VALUE;
  const formatoFinal = formatoEhPersonalizado
    ? formatoPersonalizado.trim().replace(/\s+/g, " ")
    : formato.trim();
  const generoFinal = generoEhPersonalizado
    ? generoPersonalizado.trim().replace(/\s+/g, " ")
    : genero.trim();
  const tagPersonalizadaFinal = tagPersonalizada.trim().replace(/\s+/g, " ");
  const formatoPersonalizadoValido =
    !formatoEhPersonalizado ||
    textoPersonalizadoValido(
      formatoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const generoPersonalizadoValido =
    !generoEhPersonalizado ||
    textoPersonalizadoValido(
      generoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const tagPersonalizadaValida =
    !usarTagPersonalizada ||
    (textoPersonalizadoValido(
      tagPersonalizada,
      2,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    ) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(formatoFinal) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(generoFinal));

  const tituloValido = campoValido(titulo, 3);
  const autorValido = campoValido(autor, 2);
  const generoValido = Boolean(generoFinal) && generoPersonalizadoValido;
  const formatoValido = Boolean(formatoFinal) && formatoPersonalizadoValido;
  const classificacaoFinal = normalizarClassificacaoIndicativaPublicar(
    classificacaoIndicativa,
  );
  const classificacao18Selecionada = ehClassificacao18(classificacaoFinal);
  const avisosConteudo18Normalizados = normalizarAvisosConteudo18(
    avisosConteudo18,
    classificacaoFinal,
  );
  const classificacaoValida = Boolean(classificacaoFinal) &&
    (!classificacao18Selecionada || avisosConteudo18.length > 0);
  const sinopseValida = campoValido(sinopse, 20);

  const sinopseCaracteresValidos = contarCaracteresValidos(sinopse);
  const sinopsePalavras = contarPalavras(sinopse);
  const temArquivoObra = Boolean(arquivoObra);
  const arquivoObraTamanhoTexto = arquivoObra
    ? formatarTamanhoArquivo(arquivoObra.tamanho)
    : "";
  const arquivoObraTipoTexto = arquivoObra
    ? arquivoObra.categoria === "imagem"
      ? t("imagem")
      : arquivoObra.categoria === "documento"
      ? "PDF"
      : arquivoObra.categoria === "texto"
      ? t("texto")
      : t("arquivo")
    : "";
  const arquivoTextoPendenteTamanhoTexto = arquivoTextoPendente
    ? formatarTamanhoArquivo(arquivoTextoPendente.size)
    : "";
  const temCapituloImportado = Boolean(arquivoCapituloTexto.trim());
  const temConteudoPorArquivo = Boolean(arquivoObra || temCapituloImportado);
  const arquivoCapituloPalavras = contarPalavras(arquivoCapituloTexto);
  const arquivoCapituloMinutos = calcularMinutosLeitura(arquivoCapituloTexto);
  const arquivoCapituloCaracteresValidos = contarCaracteresValidos(
    arquivoCapituloTexto
  );
  const arquivoCapituloValido =
    !temCapituloImportado || arquivoCapituloCaracteresValidos >= 20;

  const progresso = useMemo(() => {
    const camposValidos = [
      tituloValido,
      autorValido,
      generoValido,
      formatoValido,
      classificacaoValida,
      sinopseValida,
    ].filter(Boolean).length;

    return Math.round((camposValidos / 6) * 100);
  }, [
    tituloValido,
    autorValido,
    generoValido,
    formatoValido,
    classificacaoValida,
    sinopseValida,
  ]);

  const previewTemConteudo = Boolean(
    titulo.trim() ||
      autor.trim() ||
      generoFinal ||
      formatoFinal ||
      classificacaoIndicativa.trim() ||
      sinopse.trim() ||
      tags.trim() ||
      capa ||
      temArquivoObra ||
      temCapituloImportado
  );

  function validarFormulario() {
    if (!tituloValido) {
      return "O título precisa ter pelo menos 3 letras ou números. Não pode ser só ponto.";
    }

    if (!autorValido) {
      return "O nome do autor precisa ter pelo menos 2 letras ou números.";
    }

    if (!formatoValido) {
      return formatoEhPersonalizado
        ? "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o formato da obra.";
    }

    if (!generoValido) {
      return generoEhPersonalizado
        ? "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o gênero principal da obra.";
    }

    if (!tagPersonalizadaValida) {
      return "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.";
    }

    if (!classificacaoFinal) {
      return "Escolha a classificação indicativa da obra.";
    }

    if (classificacao18Selecionada && avisosConteudo18.length === 0) {
      return "Selecione pelo menos um aviso de conteúdo para a obra 18+.";
    }

    if (!sinopseValida) {
      return "A sinopse precisa ter pelo menos 20 letras ou números.";
    }

    if (temCapituloImportado && !arquivoCapituloValido) {
      return "O arquivo importado precisa ter pelo menos 20 letras ou números para virar o primeiro capítulo.";
    }

    return "";
  }

  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    setErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivoImagemAceito(arquivo)) {
      setCapaErro("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setCapaErro("A capa precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setCapaErro("Não consegui carregar essa imagem.");
        return;
      }

      setCapa(resultado);
      setCapaNome(arquivo.name);
      setCapaArquivo(arquivo);
    };

    leitor.onerror = () => {
      setCapaErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerCapa() {
    setCapa("");
    setCapaNome("");
    setCapaArquivo(null);
    setCapaErro("");

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  function limparArquivoAnexado() {
    setArquivoObra(null);
    setArquivoObraArquivo(null);
    setArquivoObraErro("");
  }

  function limparCapituloImportado() {
    setArquivoCapituloNome("");
    setArquivoCapituloTitulo("");
    setArquivoCapituloTexto("");
    setArquivoCapituloErro("");
  }

  function alternarAvisoConteudo18(aviso: AvisoConteudo18) {
    setAvisosConteudo18((avisosAtuais) =>
      avisosAtuais.includes(aviso)
        ? avisosAtuais.filter((item) => item !== aviso)
        : [...avisosAtuais, aviso],
    );
    setErro("");
  }

  function atualizarSinopse(valor: string) {
    setSinopse(valor);
    setErro("");
  }

  function atualizarTitulo(valor: string) {
    setTitulo(valor);
    setErro("");
  }

  function atualizarAutor(valor: string) {
    setAutor(valor);
    setErro("");
  }

  function atualizarFormato(valor: string) {
    setFormato(valor);

    if (valor !== OUTRO_FORMATO_VALUE) {
      setFormatoPersonalizado("");
    }

    setErro("");
  }

  function atualizarFormatoPersonalizado(valor: string) {
    setFormatoPersonalizado(
      limparTextoPersonalizado(
        valor,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      )
    );
    setErro("");
  }

  function atualizarGenero(valor: string) {
    setGenero(valor);

    if (valor !== OUTRO_GENERO_VALUE) {
      setGeneroPersonalizado("");
    }

    setErro("");
  }

  function atualizarGeneroPersonalizado(valor: string) {
    setGeneroPersonalizado(
      limparTextoPersonalizado(
        valor,
        LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
      )
    );
    setErro("");
  }

  function atualizarClassificacaoIndicativa(valor: string) {
    setClassificacaoIndicativa(valor);

    if (!ehClassificacao18(valor)) {
      setAvisosConteudo18([]);
    }

    setErro("");
  }

  function limparSelecaoConteudoArquivo() {
    limparArquivoAnexado();
    limparCapituloImportado();
    setArquivoTextoPendente(null);

    if (arquivoConteudoInputRef.current) {
      arquivoConteudoInputRef.current.value = "";
    }
  }

  function anexarArquivoCompleto(arquivo: File) {
    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setArquivoObraErro("Não consegui carregar esse arquivo.");
        return;
      }

      limparCapituloImportado();
      setArquivoObra({
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        tamanho: arquivo.size,
        conteudo: resultado,
        categoria: identificarCategoriaArquivo(arquivo),
        criadoEm: new Date().toISOString(),
      });
      setArquivoObraArquivo(arquivo);
      setArquivoTextoPendente(null);

      if (arquivoConteudoInputRef.current) {
        arquivoConteudoInputRef.current.value = "";
      }
    };

    leitor.onerror = () => {
      setArquivoObraErro("Não consegui carregar esse arquivo.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function transformarArquivoTextoEmCapitulo(arquivo: File) {
    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_TEXTO) {
      setArquivoCapituloErro(
        "Para virar capítulo, o arquivo de texto precisa ter no máximo 900 KB. Você ainda pode anexá-lo como arquivo completo."
      );
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";
      const textoImportado = resultado.replace(/\r\n/g, "\n").trim();

      if (contarCaracteresValidos(textoImportado) < 20) {
        setArquivoCapituloErro(
          "Esse arquivo tem pouco texto para virar um capítulo."
        );
        return;
      }

      limparArquivoAnexado();
      setArquivoCapituloNome(arquivo.name);
      setArquivoCapituloTitulo(nomeArquivoParaTitulo(arquivo.name));
      setArquivoCapituloTexto(textoImportado);
      setArquivoTextoPendente(null);

      if (arquivoConteudoInputRef.current) {
        arquivoConteudoInputRef.current.value = "";
      }
    };

    leitor.onerror = () => {
      setArquivoCapituloErro("Não consegui ler esse arquivo.");
    };

    leitor.readAsText(arquivo, "UTF-8");
  }

  function cancelarEscolhaArquivoTexto() {
    setArquivoTextoPendente(null);
    setArquivoObraErro("");
    setArquivoCapituloErro("");

    if (arquivoConteudoInputRef.current) {
      arquivoConteudoInputRef.current.value = "";
    }
  }

  function selecionarConteudoArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivoObraAceito(arquivo)) {
      setArquivoObraErro(
        "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF."
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_OBRA) {
      setArquivoObraErro("O arquivo precisa ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (arquivoTextoAceito(arquivo)) {
      setArquivoTextoPendente(arquivo);
      return;
    }

    anexarArquivoCompleto(arquivo);
  }

  function tagEstaSelecionada(tag: string) {
    return tagsDaObra.some((tagAtual) => {
      return normalizarTexto(tagAtual) === normalizarTexto(tag);
    });
  }

  function atualizarTagPersonalizada(valor: string) {
    const textoLimpo = limparTextoPersonalizado(
      valor,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    );

    setTagPersonalizada(textoLimpo);
    setTags(
      textoPersonalizadoValido(
        textoLimpo,
        2,
        LIMITE_CARACTERES_TAG_PERSONALIZADA
      )
        ? textoLimpo.trim().replace(/\s+/g, " ")
        : ""
    );
    setErro("");
  }

  function adicionarTagSelecionada(tag: string) {
    if (!tag) {
      return;
    }

    if (tag === OUTRA_TAG_VALUE) {
      setUsarTagPersonalizada(true);
      setTags(
        textoPersonalizadoValido(
          tagPersonalizada,
          2,
          LIMITE_CARACTERES_TAG_PERSONALIZADA
        )
          ? tagPersonalizada.trim().replace(/\s+/g, " ")
          : ""
      );
      setErro("");
      return;
    }

    if (tagEstaSelecionada(tag)) {
      return;
    }

    setUsarTagPersonalizada(false);
    setTagPersonalizada("");
    setTags(tag);
    setErro("");
  }

  function atualizarTagSelecionada(tag: string) {
    if (!tag) {
      setUsarTagPersonalizada(false);
      setTagPersonalizada("");
      setTags("");
      setErro("");
      return;
    }

    adicionarTagSelecionada(tag);
  }

  async function salvarObra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (jaSalvouRef.current) {
      return;
    }

    setErro("");
    jaSalvouRef.current = true;
    setProcessando(true);

    const arquivosEnviados: ArquivoStoragePublicar[] = [];
    let obraCriadaId = "";
    let publicacaoConcluida = false;

    try {
      const { data: dadosUsuario, error: erroUsuario } =
        await supabase.auth.getUser();

      if (erroUsuario || !dadosUsuario.user) {
        throw new Error("Entre na sua conta antes de publicar uma obra.");
      }

      const userId = dadosUsuario.user.id;
      const autorFallbackPublicacao =
        autor.trim() ||
        obterNomeMetadataPublicar({
          email: dadosUsuario.user.email || "",
          user_metadata: dadosUsuario.user.user_metadata || {},
        });
      const autorFinalPublicacao = await carregarNomePerfilPublicar(
        userId,
        autorFallbackPublicacao
      );

      if (!campoValido(autorFinalPublicacao, 2)) {
        throw new Error(
          "Não consegui encontrar um nome de autor válido no seu perfil. Atualize seu perfil ou preencha o nome do autor."
        );
      }

      setAutor(autorFinalPublicacao);

      const obrasSalvasTexto = lerStorageUsuarioPublicar(STORAGE_KEY, userId);
      let obrasSalvasJson: unknown = [];

      if (obrasSalvasTexto) {
        try {
          obrasSalvasJson = JSON.parse(obrasSalvasTexto);
        } catch {
          obrasSalvasJson = [];
        }
      }

      const obrasSalvas: ObraLocal[] = Array.isArray(obrasSalvasJson)
        ? (obrasSalvasJson as ObraSalva[]).map((obra, index) =>
            normalizarObraSalva(obra, index)
          )
        : [];

      const obraId = criarUuidSeguro();
      const slug = await criarSlugUnicoSupabase(titulo.trim(), obrasSalvas);
      const criadaEm = new Date().toISOString();
      const capituloId = temCapituloImportado ? criarUuidSeguro() : "";
      const capitulosIniciais: CapituloLocal[] = temCapituloImportado
        ? [
            {
              id: capituloId,
              titulo: arquivoCapituloTitulo.trim() || "Capítulo 1",
              texto: arquivoCapituloTexto.trim(),
              curtiu: false,
              salvo: false,
              comentario: "",
              criadoEm: criadaEm,
              lido: false,
              lidoEm: "",
            },
          ]
        : [];

      const capaBloqueadaPorClassificacao =
        ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO &&
        ehClassificacao18(classificacaoFinal);
      const capaEnviada =
        capaArquivo && !capaBloqueadaPorClassificacao
          ? await enviarArquivoStorage("capas-obras", userId, capaArquivo)
          : null;

      if (capaEnviada) {
        arquivosEnviados.push(capaEnviada);
      }

      const arquivoObraEnviado =
        arquivoObra && arquivoObraArquivo
          ? await enviarArquivoStorage(
              "arquivos-obras",
              userId,
              arquivoObraArquivo
            )
          : null;

      if (arquivoObraEnviado) {
        arquivosEnviados.push(arquivoObraEnviado);
      }

      const capaUrlSupabase = capaEnviada?.publicUrl || "";
      const capaNomePersistivel = capaBloqueadaPorClassificacao ? "" : capaNome;
      const arquivoObraReferenciaSupabase =
        arquivoObraEnviado?.caminho || "";
      const link = `/obra/${slug}`;

      const { error: erroObra } = await supabase.from("obras").insert({
        id: obraId,
        user_id: userId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        genero: generoFinal,
        formato: formatoFinal,
        classificacao_indicativa: classificacaoFinal,
        avisos_conteudo: avisosConteudo18Normalizados,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa_url: capaUrlSupabase,
        capa_nome: capaNomePersistivel,
        arquivo_url: arquivoObraReferenciaSupabase,
        arquivo_nome: arquivoObra?.nome || "",
        arquivo_tipo: arquivoObra?.tipo || "",
        arquivo_tamanho: arquivoObra?.tamanho || 0,
        arquivo_categoria: arquivoObra?.categoria || "outro",
        publicado: false,
        visualizacoes: 0,
        slug,
        link,
        criada_em: criadaEm,
        atualizado_em: criadaEm,
      });

      if (erroObra) {
        throw new Error(`Não consegui salvar a obra agora: ${erroObra.message}`);
      }

      obraCriadaId = obraId;

      if (capitulosIniciais.length > 0) {
        const { error: erroCapitulo } = await supabase.from("capitulos").insert(
          capitulosIniciais.map((capitulo, index) => ({
            id: capitulo.id,
            obra_id: obraId,
            user_id: userId,
            titulo: capitulo.titulo,
            texto: capitulo.texto,
            ordem: index + 1,
            publicado: true,
            criado_em: criadaEm,
            atualizado_em: criadaEm,
          }))
        );

        if (erroCapitulo) {
          throw new Error(
            `Não consegui salvar o capítulo inicial: ${erroCapitulo.message}`
          );
        }
      }

      const { data: obraPublicada, error: erroPublicarObra } = await supabase
        .from("obras")
        .update({
          publicado: true,
          atualizado_em: criadaEm,
        })
        .eq("id", obraId)
        .eq("user_id", userId)
        .select("id, publicado")
        .maybeSingle();

      if (
        erroPublicarObra ||
        !obraPublicada?.id ||
        obraPublicada.publicado !== true
      ) {
        const detalheErro =
          erroPublicarObra?.message ||
          "a atualização não confirmou a publicação da obra.";

        throw new Error(
          `A obra foi preparada, mas não pôde ser publicada: ${detalheErro}`
        );
      }

      const novaObra: ObraLocal = {
        id: obraId,
        titulo: titulo.trim(),
        autor: autorFinalPublicacao,
        autorId: userId,
        genero: generoFinal,
        formato: formatoFinal,
        classificacaoIndicativa: classificacaoFinal,
        avisosConteudo: avisosConteudo18Normalizados,
        sinopse: sinopse.trim(),
        tags: tagsDaObra.length > 0 ? tagsDaObra : ["sem tags"],
        capa: capaUrlSupabase,
        capaNome: capaNomePersistivel,
        arquivoObra: arquivoObra
          ? {
              ...arquivoObra,
              conteudo: arquivoObraReferenciaSupabase,
              criadoEm: criadaEm,
            }
          : null,
        publicado: true,
        capitulos: capitulosIniciais,
        criadaEm,
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: calcularProgressoLeitura(capitulosIniciais),
        visualizacoes: 0,
        totalCurtidas: 0,
        totalComentarios: 0,
        totalSalvos: 0,
        totalLidos: 0,
        slug,
        link,
      };

      await registrarDiarioPublicacao({
        userId,
        obraId,
        tipo: "publicou_obra",
        tituloObra: novaObra.titulo,
        criadaEm,
      });

      if (capituloId) {
        await registrarDiarioPublicacao({
          userId,
          obraId,
          capituloId,
          tipo: "publicou_capitulo",
          tituloObra: novaObra.titulo,
          tituloCapitulo: capitulosIniciais[0]?.titulo || "Capítulo 1",
          criadaEm,
        });
      }

      const obrasSalvasDoUsuario = obrasSalvas.filter((obra) =>
        obraPertenceAoUsuarioPublicar(obra, userId),
      );
      const novasObrasDoUsuario = [
        novaObra,
        ...obrasSalvasDoUsuario.filter((obra) => obra.id !== novaObra.id),
      ];

      salvarObrasLocalmente(novasObrasDoUsuario, userId);

      publicacaoConcluida = true;
      router.replace("/painel-autor");
      router.refresh();
    } catch (erroDesconhecido) {
      const publicacaoDesfeita = publicacaoConcluida
        ? false
        : await desfazerPublicacaoParcialPublicar(
            obraCriadaId,
            arquivosEnviados
          );

      jaSalvouRef.current = publicacaoConcluida || !publicacaoDesfeita;
      setProcessando(false);

      const mensagemBase =
        erroDesconhecido instanceof Error &&
        erroDesconhecido.name === "QuotaExceededError"
          ? "O navegador recusou salvar dados locais porque o armazenamento está cheio."
          : erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar a obra agora. Tente novamente.";
      const mensagem = publicacaoConcluida
        ? "A obra foi publicada, mas não consegui abrir o Painel do Autor. Acesse o painel antes de tentar publicar novamente."
        : publicacaoDesfeita
        ? mensagemBase
        : `${mensagemBase} A publicação parcial não pôde ser removida automaticamente. Confira o Painel do Autor antes de tentar novamente.`;

      setErro(mensagem);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  if (verificandoAutenticacao) {
    return <PublicarLoadingShell isDesktop={isDesktop} pageThemeStyle={pageThemeStyle} />;
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${publicarPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◇", "+"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoPaginaStyle()}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <PublicarPageShell
        isDesktop={isDesktop}
        novaObra={t("novaObra")}
        voltarHome={t("voltarHome")}
      >
        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <form onSubmit={salvarObra} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            {erro && (
              <div style={isDesktop ? desktopFullWidthErrorBoxStyle : errorBoxStyle}>
                <strong style={safeTextStyle}>{t("ajusteNecessario")}</strong>
                <span style={safeTextStyle}>{traduzirMensagemPublicar(idioma, erro)}</span>
              </div>
            )}


            <PublicarCoverUpload
              capa={capa}
              capaErro={capaErro}
              capaInputRef={capaInputRef}
              capaNome={capaNome}
              isDesktop={isDesktop}
              onRemoverCapa={removerCapa}
              onSelecionarCapa={selecionarCapa}
              t={t}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />


            <PublicarBasicFields
              autor={autor}
              isDesktop={isDesktop}
              onAutorChange={atualizarAutor}
              onTituloChange={atualizarTitulo}
              t={t}
              titulo={titulo}
            />

            <PublicarFormatGenreFields
              formato={formato}
              formatoEhPersonalizado={formatoEhPersonalizado}
              formatoPersonalizado={formatoPersonalizado}
              genero={genero}
              generoEhPersonalizado={generoEhPersonalizado}
              generoPersonalizado={generoPersonalizado}
              idioma={idioma}
              isDesktop={isDesktop}
              onFormatoChange={atualizarFormato}
              onFormatoPersonalizadoChange={atualizarFormatoPersonalizado}
              onGeneroChange={atualizarGenero}
              onGeneroPersonalizadoChange={atualizarGeneroPersonalizado}
              t={t}
            />

            <PublicarTagClassificationFields
              avisosConteudo18={avisosConteudo18}
              classificacao18Selecionada={classificacao18Selecionada}
              classificacaoIndicativa={classificacaoIndicativa}
              idioma={idioma}
              isDesktop={isDesktop}
              onAlternarAviso={alternarAvisoConteudo18}
              onClassificacaoChange={atualizarClassificacaoIndicativa}
              onTagChange={atualizarTagSelecionada}
              onTagPersonalizadaChange={atualizarTagPersonalizada}
              t={t}
              tagPersonalizada={tagPersonalizada}
              tagsDaObra={tagsDaObra}
              usarTagPersonalizada={usarTagPersonalizada}
            />

            <PublicarSynopsisField
              caracteresValidos={sinopseCaracteresValidos}
              isDesktop={isDesktop}
              onSinopseChange={atualizarSinopse}
              palavras={sinopsePalavras}
              sinopse={sinopse}
              sinopseValida={sinopseValida}
              t={t}
            />


            <PublicarContentFileUpload
              arquivoCapituloErro={arquivoCapituloErro}
              arquivoCapituloMinutos={arquivoCapituloMinutos}
              arquivoCapituloNome={arquivoCapituloNome}
              arquivoCapituloPalavras={arquivoCapituloPalavras}
              arquivoCapituloTitulo={arquivoCapituloTitulo}
              arquivoConteudoInputRef={arquivoConteudoInputRef}
              arquivoObra={arquivoObra}
              arquivoObraErro={arquivoObraErro}
              arquivoObraTamanhoTexto={arquivoObraTamanhoTexto}
              arquivoObraTipoTexto={arquivoObraTipoTexto}
              arquivoTextoPendente={arquivoTextoPendente}
              arquivoTextoPendenteTamanhoTexto={arquivoTextoPendenteTamanhoTexto}
              isDesktop={isDesktop}
              onAnexarArquivoCompleto={anexarArquivoCompleto}
              onCancelarEscolhaArquivoTexto={cancelarEscolhaArquivoTexto}
              onLimparSelecaoConteudoArquivo={limparSelecaoConteudoArquivo}
              onSelecionarConteudoArquivo={selecionarConteudoArquivo}
              onTransformarArquivoTextoEmCapitulo={transformarArquivoTextoEmCapitulo}
              t={t}
              temCapituloImportado={temCapituloImportado}
              temConteudoPorArquivo={temConteudoPorArquivo}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />

            <PublicarFormActions
              cancelar={t("cancelar")}
              criarObra={t("criarObra")}
              isDesktop={isDesktop}
              processando={processando}
              progresso={progresso}
              progressoRotulo={t("progresso")}
              salvando={t("salvando")}
            />
          </form>

          <PublicarWorkPreview
            arquivoCapituloMinutos={arquivoCapituloMinutos}
            arquivoCapituloPalavras={arquivoCapituloPalavras}
            arquivoCapituloTitulo={arquivoCapituloTitulo}
            autor={autor}
            capa={capa}
            classificacaoTexto={
              classificacaoFinal
                ? traduzirClassificacaoPublicar(idioma, classificacaoFinal)
                : t("classificacao")
            }
            formatoFinal={formatoFinal}
            generoFinal={generoFinal}
            idioma={idioma}
            isDesktop={isDesktop}
            previewTemConteudo={previewTemConteudo}
            t={(chave) => t(chave as ChaveTextoPublicar)}
            temCapituloImportado={temCapituloImportado}
            titulo={titulo}
          />
        </section>
      </PublicarPageShell>
    </main>
  );
}
