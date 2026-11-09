import type { ObraLocal } from "./ler-capitulo-work-normalization";

export type IdentidadeLeituraPublica = {
  obraId: string;
  geracao: string;
  revisao: string;
};

export type ContextoLeituraPublica = IdentidadeLeituraPublica & {
  slug: string;
  numeroCapitulo: number;
};

export type ResultadoLeituraPublica =
  | { estado: "ausente" }
  | (IdentidadeLeituraPublica & {
      estado: "disponivel";
      capituloId: string;
      numeroCapitulo: number;
      obra: ObraLocal;
    })
  | (IdentidadeLeituraPublica & {
      estado: "inalterada";
      capituloId: string;
      numeroCapitulo: number;
    });

export function lerRotaPublicaLeitor(pathname: string) {
  const partes = pathname.split("/");
  if (partes.length !== 5 || partes[1] !== "obra" || partes[3] !== "capitulo") return null;
  try {
    const slug = decodeURIComponent(partes[2]);
    const numero = Number(partes[4]);
    if (!slug || slug.length > 200 || slug.includes("/") || !/^\d+$/.test(partes[4]) ||
      !Number.isSafeInteger(numero) || numero <= 0 || numero > 2147483647) return null;
    return { slug, numero };
  } catch {
    return null;
  }
}

export function mesmaProjecaoPublica(a: IdentidadeLeituraPublica, b: IdentidadeLeituraPublica) {
  return a.obraId === b.obraId && a.geracao === b.geracao && a.revisao === b.revisao;
}

// Só copia estado pessoal; nunca recupera texto, publicação ou autoria do cache local.
export function preservarEstadoPessoalLeitor(publica: ObraLocal, pessoal?: ObraLocal): ObraLocal {
  if (!pessoal || publica.id !== pessoal.id) return publica;
  const porId = new Map(pessoal.capitulos.map((capitulo) => [capitulo.id, capitulo]));
  const capitulos = publica.capitulos.map((capitulo) => {
    const anterior = porId.get(capitulo.id);
    if (!anterior) return capitulo;
    const camposPublicos = ["id", "ordem", "titulo", "texto", "criadoEm", "publicado", "visualizacoes"] as const;
    if (camposPublicos.every((campo) => capitulo[campo] === anterior[campo])) return anterior;
    return { ...capitulo, curtiu: anterior.curtiu, salvo: anterior.salvo,
      comentario: anterior.comentario, lido: anterior.lido, lidoEm: anterior.lidoEm };
  });
  const lidos = capitulos.filter((capitulo) => capitulo.lido);
  const ultimo = lidos.find((capitulo) => capitulo.id === pessoal.ultimoCapituloLidoId);
  return { ...publica, capitulos, ultimoCapituloLidoId: ultimo?.id || "",
    ultimaLeituraEm: ultimo?.lidoEm || "", progressoLeitura: capitulos.length ?
      Math.round((lidos.length / capitulos.length) * 100) : 0 };
}

// Uma mutation/rollback pode terminar depois da reconciliação pública. Aplica
// somente seu delta pessoal aos capítulos ainda presentes, não o snapshot antigo.
export function reconciliarMutacaoPessoalLeitor(atuais: ObraLocal[], anteriores: ObraLocal[], novas: ObraLocal[]): ObraLocal[] {
  const obrasAnteriores = new Map(anteriores.map((obra) => [obra.id, obra]));
  const obrasNovas = new Map(novas.map((obra) => [obra.id, obra]));
  return atuais.map((atual) => {
    const antes = obrasAnteriores.get(atual.id);
    const nova = obrasNovas.get(atual.id);
    if (!antes || !nova) return atual;
    const capitulosAnteriores = new Map(antes.capitulos.map((capitulo) => [capitulo.id, capitulo]));
    const capitulosNovos = new Map(nova.capitulos.map((capitulo) => [capitulo.id, capitulo]));
    let mudou = false;
    const capitulos = atual.capitulos.map((capitulo) => {
      const original = capitulosAnteriores.get(capitulo.id);
      const alterado = capitulosNovos.get(capitulo.id);
      if (!original || !alterado) return capitulo;
      const delta: Partial<typeof capitulo> = {};
      for (const campo of ["curtiu", "salvo", "comentario", "lido", "lidoEm"] as const) {
        if (original[campo] !== alterado[campo]) Object.assign(delta, { [campo]: alterado[campo] });
      }
      if (!Object.keys(delta).length) return capitulo;
      mudou = true;
      return { ...capitulo, ...delta };
    });
    if (!mudou) return atual;
    return preservarEstadoPessoalLeitor(atual, { ...nova, capitulos });
  });
}

// Escopo de uma montagem/identidade. Não é cache global ou cache de resultados.
export function criarCoordenadorLeituraPublica() {
  let sequencia = 0;
  let pendente: { chave: string; promessa: Promise<void> } | null = null;
  return {
    invalidar() { sequencia += 1; pendente = null; },
    executar<T>({ chave, carregar, aplicar, falhar, forcar = false }: {
      chave: string; carregar: () => Promise<T>; aplicar: (valor: T) => void;
      falhar: () => void; forcar?: boolean;
    }): Promise<void> {
      if (!forcar && pendente?.chave === chave) return pendente.promessa;
      const atual = ++sequencia;
      const promessa = Promise.resolve().then(carregar).then((valor) => {
        if (atual === sequencia) aplicar(valor);
      }).catch(() => { if (atual === sequencia) falhar(); }).finally(() => {
        if (atual === sequencia) pendente = null;
      });
      pendente = { chave, promessa };
      return promessa;
    },
  };
}
