"use client";

import { createPortal } from "react-dom";
import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase/client";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";
import type { HistorietasLanguage } from "../lib/i18n";

export type TipoAlvoDenuncia =
  | "post"
  | "comentario"
  | "comentario_capitulo"
  | "obra"
  | "capitulo"
  | "comentario_obra"
  | "diario_anotacao"
  | "comentario_diario"
  | "perfil";

export type MotivoDenuncia =
  | "conteudo_inadequado"
  | "spam"
  | "assedio"
  | "odio_discriminacao"
  | "ameaca_violencia"
  | "conteudo_sexual"
  | "risco_menor"
  | "plagio_direitos_autorais"
  | "informacoes_pessoais"
  | "fraude"
  | "perfil_falso"
  | "outro";

type DenunciaModalProps = {
  aberto: boolean;
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  alvoTitulo?: string;
  alvoUrl?: string;
  onFechar: () => void;
  onEnviada?: (denunciaId: string) => void;
};

type TextoTraduzido = {
  "pt-BR": string;
  en: string;
  es: string;
};

type OpcaoMotivo = {
  valor: MotivoDenuncia;
  titulo: TextoTraduzido;
  descricao: TextoTraduzido;
  tipos?: TipoAlvoDenuncia[];
};

const LIMITE_DESCRICAO = 1200;

const TEXTOS = {
  titulo: {
    "pt-BR": "Denunciar conteúdo",
    en: "Report content",
    es: "Denunciar contenido",
  },
  tituloPerfil: {
    "pt-BR": "Denunciar perfil",
    en: "Report profile",
    es: "Denunciar perfil",
  },
  subtitulo: {
    "pt-BR":
      "Sua denúncia será enviada de forma confidencial para a equipe de moderação.",
    en: "Your report will be sent confidentially to the moderation team.",
    es: "Tu denuncia será enviada de forma confidencial al equipo de moderación.",
  },
  alvo: {
    "pt-BR": "Conteúdo denunciado",
    en: "Reported content",
    es: "Contenido denunciado",
  },
  motivo: {
    "pt-BR": "Qual é o motivo?",
    en: "What is the reason?",
    es: "¿Cuál es el motivo?",
  },
  motivoObrigatorio: {
    "pt-BR": "Escolha um motivo para continuar.",
    en: "Choose a reason to continue.",
    es: "Elige un motivo para continuar.",
  },
  descricao: {
    "pt-BR": "Explique o problema",
    en: "Explain the problem",
    es: "Explica el problema",
  },
  opcional: {
    "pt-BR": "Opcional",
    en: "Optional",
    es: "Opcional",
  },
  placeholder: {
    "pt-BR":
      "Inclua informações que ajudem a moderação a entender o que aconteceu.",
    en: "Include information that helps moderation understand what happened.",
    es: "Incluye información que ayude a moderación a entender lo ocurrido.",
  },
  aviso: {
    "pt-BR":
      "Envie denúncias verdadeiras. O uso abusivo desta ferramenta pode resultar em restrições na conta.",
    en: "Submit truthful reports. Abusing this tool may result in account restrictions.",
    es: "Envía denuncias verdaderas. El uso abusivo puede generar restricciones en la cuenta.",
  },
  cancelar: {
    "pt-BR": "Cancelar",
    en: "Cancel",
    es: "Cancelar",
  },
  enviar: {
    "pt-BR": "Enviar denúncia",
    en: "Submit report",
    es: "Enviar denuncia",
  },
  enviando: {
    "pt-BR": "Enviando...",
    en: "Sending...",
    es: "Enviando...",
  },
  fechar: {
    "pt-BR": "Fechar denúncia",
    en: "Close report",
    es: "Cerrar denuncia",
  },
  sucessoTitulo: {
    "pt-BR": "Denúncia enviada",
    en: "Report submitted",
    es: "Denuncia enviada",
  },
  sucessoTexto: {
    "pt-BR": "A equipe de moderação analisará o conteúdo.",
    en: "The moderation team will review the content.",
    es: "El equipo de moderación revisará el contenido.",
  },
  concluir: {
    "pt-BR": "Concluir",
    en: "Done",
    es: "Finalizar",
  },
  duplicada: {
    "pt-BR": "Você já possui uma denúncia ativa para este item.",
    en: "You already have an active report for this item.",
    es: "Ya tienes una denuncia activa para este elemento.",
  },
  login: {
    "pt-BR": "Entre na sua conta para enviar uma denúncia.",
    en: "Sign in to submit a report.",
    es: "Inicia sesión para enviar una denuncia.",
  },
  alvoInvalido: {
    "pt-BR": "O item que você tentou denunciar é inválido.",
    en: "The item you tried to report is invalid.",
    es: "El elemento que intentaste denunciar no es válido.",
  },
  erro: {
    "pt-BR": "Não foi possível enviar a denúncia agora. Tente novamente.",
    en: "The report could not be submitted right now. Try again.",
    es: "No se pudo enviar la denuncia ahora. Inténtalo de nuevo.",
  },
} satisfies Record<string, TextoTraduzido>;

const NOMES_ALVO: Record<TipoAlvoDenuncia, TextoTraduzido> = {
  post: {
    "pt-BR": "Publicação da Comunidade",
    en: "Community post",
    es: "Publicación de la Comunidad",
  },
  comentario: {
    "pt-BR": "Comentário da Comunidade",
    en: "Community comment",
    es: "Comentario de la Comunidad",
  },
  comentario_capitulo: {
    "pt-BR": "Comentário de capítulo",
    en: "Chapter comment",
    es: "Comentario de capítulo",
  },
  obra: {
    "pt-BR": "Obra",
    en: "Work",
    es: "Obra",
  },
  capitulo: {
    "pt-BR": "Capítulo",
    en: "Chapter",
    es: "Capítulo",
  },
  comentario_obra: {
    "pt-BR": "Comentário da obra",
    en: "Work comment",
    es: "Comentario de la obra",
  },
  diario_anotacao: {
    "pt-BR": "Anotação do Diário",
    en: "Journal entry",
    es: "Anotación del Diario",
  },
  comentario_diario: {
    "pt-BR": "Comentário do Diário",
    en: "Journal comment",
    es: "Comentario del Diario",
  },
  perfil: {
    "pt-BR": "Perfil",
    en: "Profile",
    es: "Perfil",
  },
};

const OPCOES_MOTIVO: OpcaoMotivo[] = [
  {
    valor: "conteudo_inadequado",
    titulo: {
      "pt-BR": "Conteúdo inadequado",
      en: "Inappropriate content",
      es: "Contenido inadecuado",
    },
    descricao: {
      "pt-BR": "Viola as regras gerais da plataforma.",
      en: "Violates the platform's general rules.",
      es: "Infringe las reglas generales de la plataforma.",
    },
  },
  {
    valor: "spam",
    titulo: {
      "pt-BR": "Spam ou propaganda",
      en: "Spam or advertising",
      es: "Spam o publicidad",
    },
    descricao: {
      "pt-BR": "Conteúdo repetitivo, enganoso ou promocional.",
      en: "Repetitive, misleading, or promotional content.",
      es: "Contenido repetitivo, engañoso o promocional.",
    },
  },
  {
    valor: "assedio",
    titulo: {
      "pt-BR": "Assédio",
      en: "Harassment",
      es: "Acoso",
    },
    descricao: {
      "pt-BR": "Ataques direcionados, perseguição ou intimidação.",
      en: "Targeted attacks, stalking, or intimidation.",
      es: "Ataques dirigidos, persecución o intimidación.",
    },
  },
  {
    valor: "odio_discriminacao",
    titulo: {
      "pt-BR": "Ódio ou discriminação",
      en: "Hate or discrimination",
      es: "Odio o discriminación",
    },
    descricao: {
      "pt-BR": "Ataques contra pessoas ou grupos protegidos.",
      en: "Attacks against protected people or groups.",
      es: "Ataques contra personas o grupos protegidos.",
    },
  },
  {
    valor: "ameaca_violencia",
    titulo: {
      "pt-BR": "Ameaça ou violência",
      en: "Threats or violence",
      es: "Amenazas o violencia",
    },
    descricao: {
      "pt-BR": "Ameaças reais, incentivo ou representação extrema.",
      en: "Real threats, encouragement, or extreme depictions.",
      es: "Amenazas reales, incitación o representaciones extremas.",
    },
  },
  {
    valor: "conteudo_sexual",
    titulo: {
      "pt-BR": "Conteúdo sexual impróprio",
      en: "Improper sexual content",
      es: "Contenido sexual inapropiado",
    },
    descricao: {
      "pt-BR": "Conteúdo sexual que viola as regras ou a classificação.",
      en: "Sexual content that violates rules or age ratings.",
      es: "Contenido sexual que infringe las reglas o la clasificación.",
    },
  },
  {
    valor: "risco_menor",
    titulo: {
      "pt-BR": "Risco envolvendo menor",
      en: "Risk involving a minor",
      es: "Riesgo relacionado con un menor",
    },
    descricao: {
      "pt-BR": "Exploração, aliciamento ou exposição perigosa de menores.",
      en: "Exploitation, grooming, or dangerous exposure of minors.",
      es: "Explotación, captación o exposición peligrosa de menores.",
    },
  },
  {
    valor: "plagio_direitos_autorais",
    titulo: {
      "pt-BR": "Plágio ou direitos autorais",
      en: "Plagiarism or copyright",
      es: "Plagio o derechos de autor",
    },
    descricao: {
      "pt-BR": "Uso ou publicação não autorizada de conteúdo de terceiros.",
      en: "Unauthorized use or publication of someone else's content.",
      es: "Uso o publicación no autorizada de contenido ajeno.",
    },
    tipos: ["obra", "capitulo"],
  },
  {
    valor: "informacoes_pessoais",
    titulo: {
      "pt-BR": "Informações pessoais expostas",
      en: "Exposed personal information",
      es: "Información personal expuesta",
    },
    descricao: {
      "pt-BR": "Divulgação de dados privados sem autorização.",
      en: "Sharing private information without permission.",
      es: "Divulgación de datos privados sin autorización.",
    },
  },
  {
    valor: "fraude",
    titulo: {
      "pt-BR": "Fraude ou golpe",
      en: "Fraud or scam",
      es: "Fraude o estafa",
    },
    descricao: {
      "pt-BR": "Tentativa de enganar, obter dinheiro ou roubar contas.",
      en: "Attempts to deceive, obtain money, or steal accounts.",
      es: "Intentos de engañar, obtener dinero o robar cuentas.",
    },
  },
  {
    valor: "perfil_falso",
    titulo: {
      "pt-BR": "Perfil falso ou se passando por alguém",
      en: "Fake profile or impersonation",
      es: "Perfil falso o suplantación",
    },
    descricao: {
      "pt-BR": "Conta falsa ou que tenta se passar por outra pessoa.",
      en: "A fake account or one impersonating another person.",
      es: "Una cuenta falsa o que suplanta a otra persona.",
    },
    tipos: ["perfil"],
  },
  {
    valor: "outro",
    titulo: {
      "pt-BR": "Outro motivo",
      en: "Another reason",
      es: "Otro motivo",
    },
    descricao: {
      "pt-BR": "Explique o problema no campo abaixo.",
      en: "Explain the problem in the field below.",
      es: "Explica el problema en el campo inferior.",
    },
  },
];

function texto(
  valor: TextoTraduzido,
  idioma: HistorietasLanguage
): string {
  return valor[idioma];
}

function obterCodigoErro(erro: unknown): string {
  if (!erro || typeof erro !== "object") {
    return "";
  }

  return String((erro as { code?: unknown }).code || "");
}

function obterMensagemErro(
  erro: unknown,
  idioma: HistorietasLanguage
): string {
  const codigo = obterCodigoErro(erro);

  if (codigo === "23505") {
    return texto(TEXTOS.duplicada, idioma);
  }

  if (codigo === "42501") {
    return texto(TEXTOS.login, idioma);
  }

  if (codigo === "22023" || codigo === "23502") {
    return texto(TEXTOS.alvoInvalido, idioma);
  }

  return texto(TEXTOS.erro, idioma);
}

export default function DenunciaModal({
  aberto,
  alvoTipo,
  alvoId,
  alvoTitulo = "",
  alvoUrl = "",
  onFechar,
  onEnviada,
}: DenunciaModalProps) {
  const { language } = useHistorietasLanguage();
  const [montado, setMontado] = useState(false);
  const [motivo, setMotivo] = useState<MotivoDenuncia | "">("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const painelRef = useRef<HTMLDivElement | null>(null);
  const botaoFecharRef = useRef<HTMLButtonElement | null>(null);

  const motivosDisponiveis = useMemo(
    () =>
      OPCOES_MOTIVO.filter(
        (opcao) => !opcao.tipos || opcao.tipos.includes(alvoTipo)
      ),
    [alvoTipo]
  );

  const alvoNome = texto(NOMES_ALVO[alvoTipo], language);
  const alvoDescricao = alvoTitulo.trim()
    ? `${alvoNome}: ${alvoTitulo.trim()}`
    : alvoNome;

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setMotivo("");
    setDescricao("");
    setErro("");
    setEnviado(false);
    setEnviando(false);

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focarTimer = window.setTimeout(() => {
      botaoFecharRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focarTimer);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, alvoId, alvoTipo]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !enviando) {
        onFechar();
        return;
      }

      if (evento.key !== "Tab" || !painelRef.current) {
        return;
      }

      const focaveis = Array.from(
        painelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focaveis.length === 0) {
        return;
      }

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto, enviando, onFechar]);

  function fecharModal() {
    if (!enviando) {
      onFechar();
    }
  }

  async function enviarDenuncia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (enviando || enviado) {
      return;
    }

    if (!motivo) {
      setErro(texto(TEXTOS.motivoObrigatorio, language));
      return;
    }

    const alvoIdLimpo = alvoId.trim();

    if (!alvoIdLimpo) {
      setErro(texto(TEXTOS.alvoInvalido, language));
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      const resposta =
        alvoTipo === "perfil"
          ? await supabase.rpc("criar_denuncia_perfil", {
              p_denunciado_id: alvoIdLimpo,
              p_perfil_nome: alvoTitulo.trim(),
              p_perfil_url: alvoUrl.trim(),
              p_motivo: motivo,
              p_descricao: descricao.trim(),
            })
          : await supabase.rpc("criar_denuncia", {
              p_alvo_tipo: alvoTipo,
              p_alvo_id: alvoIdLimpo,
              p_motivo: motivo,
              p_detalhe: descricao.trim(),
            });

      const { data, error } = resposta;

      if (error) {
        setErro(obterMensagemErro(error, language));
        return;
      }

      const primeiroRegistro = Array.isArray(data) ? data[0] : data;
      const denunciaId =
        primeiroRegistro &&
        typeof primeiroRegistro === "object" &&
        "denuncia_id" in primeiroRegistro
          ? String(
              (primeiroRegistro as { denuncia_id?: unknown }).denuncia_id || ""
            )
          : "";

      setEnviado(true);
      onEnviada?.(denunciaId);
    } catch (erroDesconhecido) {
      setErro(obterMensagemErro(erroDesconhecido, language));
    } finally {
      setEnviando(false);
    }
  }

  if (!montado || !aberto || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      style={overlayStyle}
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          fecharModal();
        }
      }}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="denuncia-modal-titulo"
        aria-describedby="denuncia-modal-descricao"
        style={modalStyle}
      >
        <div style={cabecalhoStyle}>
          <div style={cabecalhoTextoStyle}>
            <h2 id="denuncia-modal-titulo" style={tituloStyle}>
              {enviado
                ? texto(TEXTOS.sucessoTitulo, language)
                : texto(
                    alvoTipo === "perfil"
                      ? TEXTOS.tituloPerfil
                      : TEXTOS.titulo,
                    language
                  )}
            </h2>

            <p id="denuncia-modal-descricao" style={subtituloStyle}>
              {enviado
                ? texto(TEXTOS.sucessoTexto, language)
                : texto(TEXTOS.subtitulo, language)}
            </p>
          </div>

          <button
            ref={botaoFecharRef}
            type="button"
            onClick={fecharModal}
            disabled={enviando}
            aria-label={texto(TEXTOS.fechar, language)}
            title={texto(TEXTOS.fechar, language)}
            style={{
              ...botaoFecharStyle,
              opacity: enviando ? 0.55 : 1,
              cursor: enviando ? "not-allowed" : "pointer",
            }}
          >
            ×
          </button>
        </div>

        {enviado ? (
          <div style={sucessoContainerStyle}>
            <div aria-hidden="true" style={sucessoIconeStyle}>
              ✓
            </div>

            <button type="button" onClick={fecharModal} style={botaoPrimarioStyle}>
              {texto(TEXTOS.concluir, language)}
            </button>
          </div>
        ) : (
          <form onSubmit={enviarDenuncia} style={formStyle}>
            <div style={alvoBoxStyle}>
              <span style={rotuloPequenoStyle}>
                {texto(TEXTOS.alvo, language)}
              </span>
              <strong style={alvoTextoStyle}>{alvoDescricao}</strong>
            </div>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>
                {texto(TEXTOS.motivo, language)}
              </legend>

              <div style={motivosListaStyle}>
                {motivosDisponiveis.map((opcao) => {
                  const selecionado = motivo === opcao.valor;

                  return (
                    <label
                      key={opcao.valor}
                      style={{
                        ...motivoItemStyle,
                        ...(selecionado ? motivoItemSelecionadoStyle : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="motivo-denuncia"
                        value={opcao.valor}
                        checked={selecionado}
                        onChange={() => {
                          setMotivo(opcao.valor);
                          setErro("");
                        }}
                        disabled={enviando}
                        style={radioStyle}
                      />

                      <span style={motivoTextoContainerStyle}>
                        <strong style={motivoTituloStyle}>
                          {texto(opcao.titulo, language)}
                        </strong>
                        <span style={motivoDescricaoStyle}>
                          {texto(opcao.descricao, language)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label style={campoDescricaoStyle}>
              <span style={descricaoCabecalhoStyle}>
                <strong>{texto(TEXTOS.descricao, language)}</strong>
                <span style={opcionalStyle}>
                  {texto(TEXTOS.opcional, language)}
                </span>
              </span>

              <textarea
                value={descricao}
                onChange={(evento) => {
                  setDescricao(evento.target.value.slice(0, LIMITE_DESCRICAO));
                  setErro("");
                }}
                maxLength={LIMITE_DESCRICAO}
                rows={4}
                disabled={enviando}
                placeholder={texto(TEXTOS.placeholder, language)}
                style={textareaStyle}
              />

              <span style={contadorStyle}>
                {descricao.length}/{LIMITE_DESCRICAO}
              </span>
            </label>

            <p style={avisoStyle}>{texto(TEXTOS.aviso, language)}</p>

            {erro ? (
              <div role="alert" aria-live="assertive" style={erroStyle}>
                {erro}
              </div>
            ) : null}

            <div style={acoesStyle}>
              <button
                type="button"
                onClick={fecharModal}
                disabled={enviando}
                style={{
                  ...botaoSecundarioStyle,
                  opacity: enviando ? 0.55 : 1,
                  cursor: enviando ? "not-allowed" : "pointer",
                }}
              >
                {texto(TEXTOS.cancelar, language)}
              </button>

              <button
                type="submit"
                disabled={enviando || !motivo}
                style={{
                  ...botaoPrimarioStyle,
                  opacity: enviando || !motivo ? 0.58 : 1,
                  cursor:
                    enviando || !motivo ? "not-allowed" : "pointer",
                }}
              >
                {enviando
                  ? texto(TEXTOS.enviando, language)
                  : texto(TEXTOS.enviar, language)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px",
  background: "rgba(4, 7, 14, 0.72)",
  backdropFilter: "blur(6px)",
};

const modalStyle: CSSProperties = {
  width: "min(100%, 620px)",
  maxHeight: "min(88vh, 820px)",
  overflowY: "auto",
  border: "1px solid var(--historietas-border, rgba(148, 163, 184, 0.22))",
  borderRadius: "22px",
  background: "var(--historietas-surface, #111827)",
  color: "var(--historietas-text, #f8fafc)",
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.44)",
};

const cabecalhoStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px",
  padding: "22px 22px 18px",
  borderBottom:
    "1px solid var(--historietas-border, rgba(148, 163, 184, 0.18))",
  background: "var(--historietas-surface, #111827)",
};

const cabecalhoTextoStyle: CSSProperties = {
  minWidth: 0,
};

const tituloStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
  lineHeight: 1.2,
};

const subtituloStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--historietas-text-muted, #aab4c3)",
  fontSize: "0.94rem",
  lineHeight: 1.55,
};

const botaoFecharStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "38px",
  height: "38px",
  border: "1px solid var(--historietas-border, rgba(148, 163, 184, 0.25))",
  borderRadius: "12px",
  background: "var(--historietas-surface-soft, rgba(255,255,255,0.04))",
  color: "inherit",
  fontSize: "1.55rem",
  lineHeight: 1,
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
  padding: "22px",
};

const alvoBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "14px 16px",
  border:
    "1px solid var(--historietas-border, rgba(148, 163, 184, 0.18))",
  borderRadius: "14px",
  background:
    "var(--historietas-surface-soft, rgba(148, 163, 184, 0.07))",
};

const rotuloPequenoStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #9ca3af)",
  fontSize: "0.76rem",
  fontWeight: 800,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

const alvoTextoStyle: CSSProperties = {
  overflowWrap: "anywhere",
  lineHeight: 1.4,
};

const fieldsetStyle: CSSProperties = {
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
};

const legendStyle: CSSProperties = {
  marginBottom: "12px",
  padding: 0,
  fontWeight: 800,
};

const motivosListaStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const motivoItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "13px 14px",
  border:
    "1px solid var(--historietas-border, rgba(148, 163, 184, 0.18))",
  borderRadius: "14px",
  background: "var(--historietas-surface-soft, rgba(255,255,255,0.025))",
  cursor: "pointer",
  transition: "border-color 160ms ease, background 160ms ease",
};

const motivoItemSelecionadoStyle: CSSProperties = {
  borderColor: "var(--historietas-accent, #8b5cf6)",
  background: "color-mix(in srgb, var(--historietas-accent, #8b5cf6) 14%, transparent)",
};

const radioStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  margin: "2px 0 0",
  accentColor: "var(--historietas-accent, #8b5cf6)",
};

const motivoTextoContainerStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const motivoTituloStyle: CSSProperties = {
  lineHeight: 1.35,
};

const motivoDescricaoStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #9ca3af)",
  fontSize: "0.86rem",
  lineHeight: 1.45,
};

const campoDescricaoStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const descricaoCabecalhoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const opcionalStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #9ca3af)",
  fontSize: "0.78rem",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  resize: "vertical",
  minHeight: "112px",
  boxSizing: "border-box",
  border:
    "1px solid var(--historietas-border, rgba(148, 163, 184, 0.24))",
  borderRadius: "14px",
  padding: "13px 14px",
  outline: "none",
  background: "var(--historietas-input, rgba(2, 6, 23, 0.42))",
  color: "inherit",
  font: "inherit",
  lineHeight: 1.55,
};

const contadorStyle: CSSProperties = {
  justifySelf: "end",
  color: "var(--historietas-text-muted, #9ca3af)",
  fontSize: "0.76rem",
};

const avisoStyle: CSSProperties = {
  margin: 0,
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(245, 158, 11, 0.1)",
  color: "var(--historietas-text, #f8fafc)",
  fontSize: "0.82rem",
  lineHeight: 1.5,
};

const erroStyle: CSSProperties = {
  padding: "12px 14px",
  border: "1px solid rgba(239, 68, 68, 0.34)",
  borderRadius: "12px",
  background: "rgba(239, 68, 68, 0.1)",
  color: "#fecaca",
  fontSize: "0.88rem",
  lineHeight: 1.45,
};

const acoesStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const botaoBaseStyle: CSSProperties = {
  minHeight: "44px",
  padding: "10px 17px",
  borderRadius: "13px",
  fontWeight: 800,
  fontSize: "0.9rem",
};

const botaoSecundarioStyle: CSSProperties = {
  ...botaoBaseStyle,
  border:
    "1px solid var(--historietas-border, rgba(148, 163, 184, 0.26))",
  background: "transparent",
  color: "inherit",
};

const botaoPrimarioStyle: CSSProperties = {
  ...botaoBaseStyle,
  border: 0,
  background: "var(--historietas-accent, #8b5cf6)",
  color: "#ffffff",
};

const sucessoContainerStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "22px",
  padding: "42px 22px 28px",
  textAlign: "center",
};

const sucessoIconeStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  background: "rgba(34, 197, 94, 0.15)",
  color: "#4ade80",
  fontSize: "2.2rem",
  fontWeight: 900,
};