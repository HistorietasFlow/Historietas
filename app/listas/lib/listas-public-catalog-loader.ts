import { supabase } from "../../../lib/supabase/client";
import { normalizarTexto } from "../../../lib/utils";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { timestampData } from "./listas-format-utils";
import { criarPerfilLista } from "./listas-profile-state-utils";
import { idUsuarioValido, pegarTexto } from "./listas-value-utils";

type ObraLista = {
  id: string;
  autorId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  capa: string;
  slug: string;
  link: string;
  publicadaEm: string;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  capitulos: Array<{
    id: string;
    obraId: string;
    titulo: string;
    ordem: number;
    criadoEm: string;
  }>;
  notaMedia: number;
  totalAvaliacoes: number;
};

export async function carregarIdsInteracoesUsuario(userId: string) {
  if (!idUsuarioValido(userId)) {
    return [] as string[];
  }

  const carregarIds = async (
    tabela: "favoritos" | "seguindo_obras" | "concluidas",
  ) => {
    const consultas = {
      favoritos: () =>
        supabase
          .from("favoritos")
          .select("obra_id")
          .eq("user_id", userId),
      seguindo_obras: () =>
        supabase
          .from("seguindo_obras")
          .select("obra_id")
          .eq("user_id", userId),
      concluidas: () =>
        supabase
          .from("concluidas")
          .select("obra_id")
          .eq("user_id", userId),
    };
    const { data, error } = await consultas[tabela]();

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.map(({ obra_id }) => ({ obra_id }));
  };

  const [favoritas, seguindo, concluidas] = await Promise.all([
    carregarIds("favoritos"),
    carregarIds("seguindo_obras"),
    carregarIds("concluidas"),
  ]);

  return Array.from(
    new Set(
      [...favoritas, ...seguindo, ...concluidas]
        .map((registro) => pegarTexto(registro.obra_id))
        .filter(Boolean),
    ),
  );
}

export async function carregarAvaliacoesAutoresPublicos(autorIds: string[]) {
  const idsUnicos = Array.from(
    new Set(autorIds.map((id) => id.trim()).filter(idUsuarioValido)),
  );
  const avaliacoes = new Map<string, { media: number; total: number }>();

  if (idsUnicos.length === 0) {
    return avaliacoes;
  }

  const metricas = await carregarMetricasConteudos({ autorIds: idsUnicos });

  if (!metricas.carregado) {
    return avaliacoes;
  }

  metricas.autores.forEach((metrica) => {
    avaliacoes.set(metrica.id, {
      media: metrica.avaliacao.media,
      total: metrica.avaliacao.total,
    });
  });

  return avaliacoes;
}

export async function carregarAutoresPublicos(obras: ObraLista[]) {
  const idsAutores = Array.from(
    new Set(obras.map((obra) => obra.autorId).filter(idUsuarioValido)),
  );
  const perfisPorId = new Map<string, ReturnType<typeof criarPerfilLista>>();
  const avaliacoesPorAutor = await carregarAvaliacoesAutoresPublicos(idsAutores);
  const tamanhoChunk = 100;

  for (let inicio = 0; inicio < idsAutores.length; inicio += tamanhoChunk) {
    const chunk = idsAutores.slice(inicio, inicio + tamanhoChunk);

    for (const campo of ["user_id", "id"] as const) {
      try {
        const { data, error } = await supabase
          .from("profiles_publicos")
          .select("id,user_id,nome,username,avatar_url,bio,sobre_bio,criado_em")
          .in(campo, chunk)
          .limit(Math.max(chunk.length, 1));

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((registro) => {
          if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
            return;
          }

          const row = registro;
          const userId = pegarTexto(row.user_id ?? row.id);

          if (userId) {
            perfisPorId.set(userId, criarPerfilLista(row, userId, "Usuário"));
          }
        });
      } catch {
        // Os dados das próprias obras servem como fallback.
      }
    }
  }

  const agrupados = new Map<string, ObraLista[]>();

  obras.forEach((obra) => {
    const chave = obra.autorId || normalizarTexto(obra.autor);
    const atuais = agrupados.get(chave) || [];
    atuais.push(obra);
    agrupados.set(chave, atuais);
  });

  return Array.from(agrupados.entries())
    .map(([chave, obrasAutor]) => {
      const primeiraObra = obrasAutor[0];
      const perfil = primeiraObra.autorId
        ? perfisPorId.get(primeiraObra.autorId)
        : undefined;
      const generos = Array.from(
        new Set(obrasAutor.map((obra) => obra.genero).filter(Boolean)),
      ).slice(0, 3);

      const avaliacao = primeiraObra.autorId
        ? avaliacoesPorAutor.get(primeiraObra.autorId)
        : undefined;

      return {
        id: perfil?.userId || primeiraObra.autorId || chave,
        nome: perfil?.nome || primeiraObra.autor,
        username: perfil?.username || "",
        avatar: perfil?.avatar || "",
        bio: perfil?.bio || "Autor no Historietas.",
        totalObras: obrasAutor.length,
        totalCurtidas: obrasAutor.reduce(
          (total, obra) => total + obra.totalCurtidas,
          0,
        ),
        totalComentarios: obrasAutor.reduce(
          (total, obra) => total + obra.totalComentarios,
          0,
        ),
        notaMedia: avaliacao?.media || 0,
        totalAvaliacoes: avaliacao?.total || 0,
        generos,
        criadaEm: obrasAutor
          .map((obra) => obra.publicadaEm)
          .sort((a, b) => timestampData(b) - timestampData(a))[0] || "",
      };
    })
    .sort((a, b) => b.totalObras - a.totalObras || a.nome.localeCompare(b.nome));
}
