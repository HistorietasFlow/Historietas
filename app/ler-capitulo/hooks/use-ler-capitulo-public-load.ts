import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { usePathname } from "next/navigation";
import type { IdentidadeAutenticadaLeitor } from "../lib/ler-capitulo-auth-identity";
import { execucaoIdentidadeLeitorEstaAtual } from "../lib/ler-capitulo-auth-identity";
import { aplicarInteracoesCapitulosSupabase } from "../lib/ler-capitulo-work-read-loader";
import { carregarObrasLocaisNormalizadas } from "../lib/ler-capitulo-local-storage";
import { persistirEstadoPessoalLeituraPublica } from "../lib/ler-capitulo-public-personal-storage";
import type { ObraLocal } from "../lib/ler-capitulo-work-normalization";
import {
  criarCoordenadorLeituraPublica, lerRotaPublicaLeitor,
  mesmaProjecaoPublica, preservarEstadoPessoalLeitor,
  type ContextoLeituraPublica, type ResultadoLeituraPublica,
} from "../lib/ler-capitulo-public-snapshot";

type Props = {
  projecao?: ContextoLeituraPublica;
  obras: ObraLocal[];
  obraId: string;
  capituloId: string;
  autenticacaoCarregada: boolean;
  usuarioIdLogado: string;
  identidadeAutenticadaLeitorRef: MutableRefObject<IdentidadeAutenticadaLeitor>;
  versaoCarregamento: number;
  setObras: Dispatch<SetStateAction<ObraLocal[]>>;
  setObraId: Dispatch<SetStateAction<string>>;
  setCapituloId: Dispatch<SetStateAction<string>>;
  setCarregando: Dispatch<SetStateAction<boolean>>;
  setErroCarregamento: Dispatch<SetStateAction<boolean>>;
};

export function useLerCapituloPublicLoad({ projecao, obras, obraId, capituloId,
  autenticacaoCarregada, usuarioIdLogado, identidadeAutenticadaLeitorRef,
  versaoCarregamento, setObras, setObraId, setCapituloId, setCarregando, setErroCarregamento }: Props) {
  const pathname = usePathname();
  const habilitado = Boolean(projecao);
  const [coordenador] = useState(criarCoordenadorLeituraPublica);
  const [identidadeDadosAplicada, setIdentidadeDadosAplicada] = useState<IdentidadeAutenticadaLeitor | null>(null);
  const [rotaAplicada, setRotaAplicada] = useState(pathname);
  const conhecida = useRef(projecao);
  const rotaSolicitada = useRef("");
  const contextoPessoal = useRef("");
  const [erroPublico, setErroPublico] = useState(false);
  const versaoPessoal = useRef(0);
  const agendarRef = useRef<(novaLeitura?: boolean) => void>(() => {});
  const rolagemAntesErro = useRef<{ pathname: string; top: number } | null>(null);

  const revalidar = useEffectEvent((forcar = false) => {
    if (!projecao || !autenticacaoCarregada) return;
    const rota = lerRotaPublicaLeitor(window.location.pathname);
    const identidade = identidadeAutenticadaLeitorRef.current;
    if (!rota || identidade.usuarioId !== usuarioIdLogado) return;
    const chave = JSON.stringify([rota.slug, rota.numero, identidade.usuarioId, identidade.versao]);
    rotaSolicitada.current = chave;
    const urlEsperada = window.location.pathname;
    const atual = () => window.location.pathname === urlEsperada &&
      execucaoIdentidadeLeitorEstaAtual({ cancelada: false, identidadeEsperada: identidade,
        identidadeAtual: identidadeAutenticadaLeitorRef.current });
    const anterior = conhecida.current;
    const obraAnterior = obras.find((obra) => obra.id === anterior?.obraId);
    const params = new URLSearchParams({ slug: rota.slug, numero: String(rota.numero) });
    if (anterior && obraAnterior) {
      params.set("obraId", anterior.obraId);
      params.set("geracao", anterior.geracao);
      params.set("revisao", anterior.revisao);
    }
    const falhar = () => {
      if (!atual()) return;
      if (!erroPublico) rolagemAntesErro.current = { pathname: urlEsperada, top: window.scrollY };
      setErroPublico(true);
      setErroCarregamento(true);
      setCarregando(false);
    };

    void coordenador.executar({ chave, forcar,
      carregar: async (): Promise<ResultadoLeituraPublica> => {
        // Preserva cookies da proteção Vercel na mesma origem. O handler não
        // interpreta a sessão Supabase e continua usando exclusivamente anon.
        const resposta = await fetch(`/api/leitura-publica?${params}`, { cache: "no-store", credentials: "same-origin" });
        if (!resposta.ok) throw new Error("Confirmação pública indisponível.");
        const resultado: ResultadoLeituraPublica = await resposta.json();
        if (!resultado || !["ausente", "disponivel", "inalterada"].includes(resultado.estado)) throw new Error("Snapshot inválido.");
        if (resultado.estado !== "ausente") {
          if (resultado.numeroCapitulo !== rota.numero || !/^\d+$/.test(resultado.revisao) || !resultado.geracao || !resultado.obraId || !resultado.capituloId) throw new Error("Identidade pública inválida.");
          const ultima = conhecida.current;
          if (ultima?.obraId === resultado.obraId && ultima.geracao === resultado.geracao &&
            BigInt(resultado.revisao) < BigInt(ultima.revisao)) throw new Error("Revisão obsoleta.");
          if (resultado.estado === "inalterada" && (!anterior || !obraAnterior || !mesmaProjecaoPublica(anterior, resultado))) throw new Error("Snapshot ausente.");
          const obra = resultado.estado === "disponivel" ? resultado.obra : obraAnterior;
          if (!obra || obra.id !== resultado.obraId || obra.slug !== rota.slug ||
            !obra.capitulos.some((capitulo) => capitulo.id === resultado.capituloId && capitulo.ordem === rota.numero && capitulo.publicado)) throw new Error("Capítulo público inconsistente.");
        }
        return resultado;
      },
      falhar,
      aplicar: (resultado) => {
        if (!atual()) return;
        setErroPublico(false);
        setErroCarregamento(false);
        setCarregando(false);
        setRotaAplicada(urlEsperada);
        if (resultado.estado === "ausente") {
          conhecida.current = undefined;
          contextoPessoal.current = "";
          versaoPessoal.current += 1;
          setIdentidadeDadosAplicada(null);
          setObras([]);
          return;
        }
        const mudou = !conhecida.current || !mesmaProjecaoPublica(conhecida.current, resultado);
        const mesmaGeracao = conhecida.current?.obraId === resultado.obraId && conhecida.current.geracao === resultado.geracao;
        conhecida.current = { obraId: resultado.obraId, geracao: resultado.geracao,
          revisao: resultado.revisao, slug: rota.slug, numeroCapitulo: rota.numero };
        const publica = resultado.estado === "disponivel" ? resultado.obra : obraAnterior!;
        if (mudou) {
          setObras((atuais) => [preservarEstadoPessoalLeitor(publica,
            mesmaGeracao ? atuais.find((obra) => obra.id === publica.id) : undefined)]);
        }
        setObraId(resultado.obraId);
        setCapituloId(resultado.capituloId);

        // As interações privadas carregam uma vez por identidade/geração, não
        // a cada foco, revisão ou navegação. Nunca substituem conteúdo público.
        const chavePessoal = JSON.stringify([identidade.usuarioId, identidade.versao, resultado.obraId, resultado.geracao]);
        if (contextoPessoal.current === chavePessoal) return;
        contextoPessoal.current = chavePessoal;
        const versao = ++versaoPessoal.current;
        const pessoalAtual = () => versao === versaoPessoal.current &&
          execucaoIdentidadeLeitorEstaAtual({ cancelada: false, identidadeEsperada: identidade,
            identidadeAtual: identidadeAutenticadaLeitorRef.current });
        if (!identidade.usuarioId) {
          setIdentidadeDadosAplicada(identidade);
          return;
        }
        setIdentidadeDadosAplicada(null);
        let local: ObraLocal | undefined;
        try { local = carregarObrasLocaisNormalizadas(identidade.usuarioId).find((obra) => obra.id === publica.id); }
        catch { /* Cache pessoal não é fonte autoritativa de conteúdo público. */ }
        void aplicarInteracoesCapitulosSupabase(preservarEstadoPessoalLeitor(publica, local), identidade.usuarioId).then((pessoal) => {
          if (!pessoalAtual()) return;
          setObras((atuais) => atuais.map((obra) => obra.id === pessoal.id ? preservarEstadoPessoalLeitor(obra, pessoal) : obra));
          persistirEstadoPessoalLeituraPublica([pessoal], identidade.usuarioId);
          setIdentidadeDadosAplicada(identidade);
        }).catch(() => {
          if (!pessoalAtual()) return;
          contextoPessoal.current = "";
          falhar();
        });
      },
    });
  });

  const sincronizarRota = useEffectEvent(() => {
    const rota = lerRotaPublicaLeitor(window.location.pathname);
    const identidade = identidadeAutenticadaLeitorRef.current;
    if (rota && rotaSolicitada.current !== JSON.stringify([rota.slug, rota.numero, identidade.usuarioId, identidade.versao])) revalidar();
  });

  useEffect(() => {
    if (!habilitado || !autenticacaoCarregada) return;
    contextoPessoal.current = "";
    versaoPessoal.current += 1;
    revalidar();
    let quadro = 0;
    let retornando = false;
    const agendar = (novaLeitura = false) => {
      if (novaLeitura) {
        coordenador.invalidar();
        rotaSolicitada.current = "";
      }
      if (quadro) return;
      quadro = window.requestAnimationFrame(() => { quadro = 0; sincronizarRota(); });
    };
    agendarRef.current = agendar;
    const saiu = () => { retornando = true; };
    const foco = () => {
      if (document.visibilityState === "visible" && retornando) {
        retornando = false;
        // Não reutilizar uma leitura iniciada antes do retorno. O trabalho em
        // background pode terminar; somente o novo evento invalida o anterior.
        agendar(true);
      }
    };
    const visibilidade = () => { if (document.visibilityState === "hidden") saiu(); else foco(); };
    const restaurou = (evento: PageTransitionEvent) => {
      if (evento.persisted) { retornando = false; agendar(true); }
    };
    window.addEventListener("blur", saiu);
    window.addEventListener("focus", foco);
    document.addEventListener("visibilitychange", visibilidade);
    window.addEventListener("pageshow", restaurou);
    const navegou = () => agendar(true);
    window.addEventListener("popstate", navegou);
    return () => {
      coordenador.invalidar();
      versaoPessoal.current += 1;
      window.cancelAnimationFrame(quadro);
      agendarRef.current = () => {};
      window.removeEventListener("blur", saiu);
      window.removeEventListener("focus", foco);
      document.removeEventListener("visibilitychange", visibilidade);
      window.removeEventListener("pageshow", restaurou);
      window.removeEventListener("popstate", navegou);
    };
  }, [habilitado, autenticacaoCarregada, usuarioIdLogado, coordenador]);

  useEffect(() => {
    if (!habilitado || !autenticacaoCarregada) return;
    agendarRef.current();
  }, [habilitado, autenticacaoCarregada, pathname, obraId, capituloId, identidadeAutenticadaLeitorRef]);

  // router.refresh() pode entregar outro objeto RSC com a MESMA projeção.
  // Só uma identidade/versão diferente é um novo motivo para confirmar conteúdo.
  const conferirPropsPublicas = useEffectEvent(() => {
    if (projecao && (!conhecida.current || !mesmaProjecaoPublica(projecao, conhecida.current))) revalidar();
  });
  useEffect(() => { conferirPropsPublicas(); }, [projecao?.obraId, projecao?.geracao, projecao?.revisao]);

  useEffect(() => { if (versaoCarregamento > 0) revalidar(true); }, [versaoCarregamento]);

  useEffect(() => {
    if (erroPublico || !rolagemAntesErro.current) return;
    const anterior = rolagemAntesErro.current;
    rolagemAntesErro.current = null;
    if (anterior.pathname !== pathname || !Number.isFinite(anterior.top)) return;
    const quadro = window.requestAnimationFrame(() => window.scrollTo({ top: anterior.top, behavior: "instant" }));
    return () => window.cancelAnimationFrame(quadro);
  }, [erroPublico, pathname]);

  const aguardandoRota = Boolean(projecao && rotaAplicada !== pathname);
  return { identidadeDadosAplicada: erroPublico || aguardandoRota ? null : identidadeDadosAplicada,
    aguardandoRota,
  };
}
