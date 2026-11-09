import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import type { SnapshotObraPublica } from "../../../../lib/cache/obrasPublicas";
import { criarCoordenadorLeituraPublica } from "../../../ler-capitulo/lib/ler-capitulo-public-snapshot";
import { execucaoIdentidadeObraEstaAtual, type IdentidadeAutenticadaObra } from "../lib/obra-auth-identity";
import { aplicarProgressoObra, mesmaVersaoObra, slugRotaObra, snapshotParaObra,
  type ProgressoObra, type ResultadoSnapshotObra } from "../lib/obra-public-snapshot";
import { carregarProgressoObraPublica } from "../lib/obra-public-reading-progress";

export function useObraPublicSnapshot({ inicial, autenticacaoCarregada, usuarioIdLogado, identidadeRef, versaoIdentidade, onIndisponivel }: {
  inicial?: SnapshotObraPublica; autenticacaoCarregada: boolean; usuarioIdLogado: string;
  identidadeRef: MutableRefObject<IdentidadeAutenticadaObra>;
  versaoIdentidade: number;
  onIndisponivel?: () => void;
}) {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState(inicial ?? null);
  const conhecida = useRef(inicial ?? null);
  const [coordenador] = useState(criarCoordenadorLeituraPublica);
  const [erro, setErro] = useState(false);
  const [validando, setValidando] = useState(Boolean(inicial));
  const [rotaConfirmada, setRotaConfirmada] = useState(pathname);
  const [identidadeConfirmada, setIdentidadeConfirmada] = useState(-1);
  const [progresso, setProgresso] = useState<{ chave: string; dados: ProgressoObra }>({ chave: "", dados: [] });
  const sequenciaPessoal = useRef(0);
  const agendarRef = useRef<() => void>(() => {});
  const rolagem = useRef<{ path: string; top: number } | null>(null);
  const [retry, setRetry] = useState(0);
  const habilitado = Boolean(inicial);

  const revalidar = useEffectEvent((forcar = false) => {
    if (!inicial || !autenticacaoCarregada) return;
    const path = window.location.pathname, slug = slugRotaObra(path);
    const identidade = identidadeRef.current;
    if (!slug || identidade.usuarioId !== usuarioIdLogado) return;
    const atual = () => window.location.pathname === path && execucaoIdentidadeObraEstaAtual({
      cancelada: false, identidadeEsperada: identidade, identidadeAtual: identidadeRef.current });
    const anterior = conhecida.current;
    if (anterior && anterior.slug !== slug) onIndisponivel?.();
    const params = new URLSearchParams({ slug });
    if (anterior?.slug === slug) for (const key of ["obraId", "geracao", "revisao"] as const) params.set(key, anterior[key]);
    setValidando(true);
    const versaoPessoal = ++sequenciaPessoal.current;
    void coordenador.executar({ chave: JSON.stringify([path, identidade.usuarioId, identidade.versao]), forcar,
      carregar: async (): Promise<ResultadoSnapshotObra> => {
        const response = await fetch(`/api/obra-publica?${params}`, { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) throw new Error("Obra temporariamente indisponível.");
        const result: ResultadoSnapshotObra = await response.json();
        if (result?.estado === "ausente") return result;
        const next = result?.estado === "disponivel" ? result.snapshot : result?.estado === "inalterada" ? result : null;
        if (!next || next.slug !== slug || !next.obraId || !next.geracao || !/^[1-9][0-9]*$/.test(next.revisao)) throw new Error("Snapshot inválido.");
        if (result.estado === "inalterada" && (!anterior || !mesmaVersaoObra(anterior, next))) throw new Error("Snapshot não disponível.");
        const ultima = conhecida.current;
        if (ultima?.obraId === next.obraId && ultima.geracao === next.geracao && BigInt(next.revisao) < BigInt(ultima.revisao)) throw new Error("Revisão obsoleta.");
        if (result.estado === "disponivel" && (!Array.isArray(result.snapshot.capitulos) || !result.snapshot.obra)) throw new Error("Snapshot incompleto.");
        return result;
      },
      aplicar: result => {
        if (!atual()) return;
        const next = result.estado === "ausente" ? null : result.estado === "disponivel" ? result.snapshot : anterior;
        conhecida.current = next;
        // Igualdade por versão, não por objeto RSC: conserva referências e efeitos.
        setSnapshot(old => old && next && mesmaVersaoObra(old, next) ? old : next);
        setErro(false); setValidando(false); setIdentidadeConfirmada(identidade.versao);
        setRotaConfirmada(path);
        if (!next) { onIndisponivel?.(); setProgresso({ chave: "", dados: [] }); return; }
        const chave = JSON.stringify([next.obraId, next.geracao, identidade.usuarioId, identidade.versao]);
        void carregarProgressoObraPublica(next.obraId, identidade.usuarioId).then(dados => {
          if (atual() && versaoPessoal === sequenciaPessoal.current) setProgresso(old =>
            old.chave === chave && JSON.stringify(old.dados) === JSON.stringify(dados) ? old : { chave, dados });
        }).catch(() => {
          if (atual() && versaoPessoal === sequenciaPessoal.current) setProgresso(old =>
            old.chave === chave ? old : { chave, dados: [] });
          // Sem progresso disponível: padrão conservador, nunca conteúdo/cache de outra conta.
        });
      },
      falhar: () => {
        if (!atual()) return;
        rolagem.current = { path, top: window.scrollY };
        onIndisponivel?.();
        setErro(true); setValidando(false);
      },
    });
  });

  useEffect(() => {
    if (!habilitado || !autenticacaoCarregada) return;
    let quadro = 0;
    const invalidar = () => { coordenador.invalidar(); sequenciaPessoal.current++; };
    const agendar = () => {
      invalidar();
      if (!quadro) quadro = window.requestAnimationFrame(() => { quadro = 0; revalidar(); });
    };
    agendarRef.current = agendar;
    const visibilidade = () => { if (document.visibilityState === "visible") agendar(); };
    const restaurou = (e: PageTransitionEvent) => { if (e.persisted) agendar(); };
    agendar();
    window.addEventListener("focus", agendar);
    window.addEventListener("popstate", agendar);
    window.addEventListener("pageshow", restaurou);
    document.addEventListener("visibilitychange", visibilidade);
    return () => {
      invalidar();
      window.cancelAnimationFrame(quadro); agendarRef.current = () => {};
      window.removeEventListener("focus", agendar);
      window.removeEventListener("popstate", agendar);
      window.removeEventListener("pageshow", restaurou);
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [habilitado, autenticacaoCarregada, usuarioIdLogado, versaoIdentidade, pathname, coordenador]);

  const conferirProps = useEffectEvent(() => {
    if (inicial && (!conhecida.current || !mesmaVersaoObra(inicial, conhecida.current))) agendarRef.current();
  });
  useEffect(() => { conferirProps(); }, [inicial?.obraId, inicial?.geracao, inicial?.revisao]);
  useEffect(() => { if (retry > 0) revalidar(true); }, [retry]);
  useEffect(() => {
    if (erro || !rolagem.current) return;
    const anterior = rolagem.current; rolagem.current = null;
    if (anterior.path !== pathname) return;
    const quadro = window.requestAnimationFrame(() => window.scrollTo({ top: anterior.top, behavior: "instant" }));
    return () => window.cancelAnimationFrame(quadro);
  }, [erro, pathname]);

  const obra = useMemo(() => snapshot ? snapshotParaObra(snapshot) : null, [snapshot]);
  const chavePessoal = snapshot ? JSON.stringify([snapshot.obraId, snapshot.geracao, usuarioIdLogado, versaoIdentidade]) : "";
  const leitura = useMemo(() => obra && progresso.chave === chavePessoal ? aplicarProgressoObra(obra, progresso.dados) : obra, [obra, progresso, chavePessoal]);
  const rotaCorreta = snapshot?.slug === slugRotaObra(pathname);
  const pronta = autenticacaoCarregada && identidadeConfirmada === versaoIdentidade && !erro && rotaCorreta;
  return { obra: !erro && rotaCorreta ? obra : null, leitura: !erro && rotaCorreta ? leitura : null,
    contexto: snapshot ? JSON.stringify([snapshot.obraId, snapshot.geracao]) : "",
    chaveAnexo: snapshot ? JSON.stringify([snapshot.obraId, snapshot.geracao, snapshot.revisao, versaoIdentidade]) : "",
    pronta, interativa: pronta && (!usuarioIdLogado || progresso.chave === chavePessoal),
    erro, validando, carregando: Boolean(inicial && rotaConfirmada !== pathname && !erro),
    tentarNovamente: () => setRetry(valor => valor + 1) };
}
