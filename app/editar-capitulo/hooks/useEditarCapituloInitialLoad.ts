import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";
import { carregarNomeProfileEditarCapitulo } from "../actions/carregar-nome-profile-editar-capitulo";
import { aplicarNomeAutorProfileEditarCapitulo } from "../lib/editar-capitulo-profile-utils";
import { criarLoginHrefEditarCapitulo } from "../lib/editar-capitulo-route-utils";
import {
  carregarObrasLocaisNormalizadas,
  salvarObrasEditarCapituloStorage,
} from "../lib/editar-capitulo-local-work-storage";
import { mapearObraSupabase } from "../lib/editar-capitulo-supabase-mappers";

type CapituloSupabaseRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type ObraLocalEditarCapitulo =
  ReturnType<typeof carregarObrasLocaisNormalizadas>[number];

type UseEditarCapituloInitialLoadParams = {
  router: ReturnType<typeof import("next/navigation").useRouter>;
  setTitulo: (titulo: string) => void;
  setTexto: (texto: string) => void;
};

export function useEditarCapituloInitialLoad({
  router,
  setTitulo,
  setTexto,
}: UseEditarCapituloInitialLoadParams) {
  const [obraId, setObraId] = useState("");
  const [capituloId, setCapituloId] = useState("");
  const [obras, setObras] = useState<ObraLocalEditarCapitulo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";
    const capituloIdParam = params.get("capituloId") || "";
    const atualizarParametrosTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraId(obraIdParam);
        setCapituloId(capituloIdParam);
      }
    }, 0);

    async function carregarCapitulo() {
      try {
        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();
        const userId = dadosUsuario.user?.id || "";

        if (erroUsuario || !userId) {
          if (!cancelado) {
            setVerificandoAcesso(false);
            setCarregando(false);
          }

          router.replace(
            criarLoginHrefEditarCapitulo(obraIdParam, capituloIdParam)
          );
          return;
        }

        if (!cancelado) {
          setVerificandoAcesso(false);
        }

        const nomeProfileAutor = await carregarNomeProfileEditarCapitulo(userId);
        const obrasLocais = aplicarNomeAutorProfileEditarCapitulo(
          carregarObrasLocaisNormalizadas(userId).filter((obra) => {
            const autorId = obra.autorId?.trim() || "";

            return !autorId || autorId === userId;
          }),
          userId,
          nomeProfileAutor
        );
        let obrasAtualizadas = obrasLocais;
        const obraLocal = obrasLocais.find((obra) => obra.id === obraIdParam);
        const capituloLocal =
          obraLocal?.capitulos.find(
            (capitulo) => capitulo.id === capituloIdParam
          ) || null;

        if (capituloLocal && !cancelado) {
          setTitulo(capituloLocal.titulo);
          setTexto(capituloLocal.texto);
        }

        if (obraIdParam) {
          const { data: obraSupabase, error: erroObraSupabase } =
            await supabase
              .from("obras")
              .select(
                "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
              )
              .eq("id", obraIdParam)
              .eq("user_id", userId)
              .limit(1)
              .maybeSingle();

          if (erroObraSupabase) {
            console.warn("Não consegui buscar a obra no Supabase:", erroObraSupabase.message);
          }

          if (obraSupabase) {
            let capitulosSupabase: CapituloSupabaseRow[];

            try {
              capitulosSupabase =
                await carregarTodasPaginasSupabase<CapituloSupabaseRow>({
                  nomeColecao: "capítulos da edição de capítulo",
                  buscarPagina: async (inicio, fim) =>
                    supabase
                      .from("capitulos")
                      .select("id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em")
                      .eq("obra_id", obraIdParam)
                      .eq("user_id", userId)
                      .order("ordem", { ascending: true })
                      .order("id", { ascending: true })
                      .range(inicio, fim),
                });
            } catch (error) {
              console.warn(
                "Não consegui buscar capítulos no Supabase:",
                error,
              );

              if (!cancelado) {
                setObras(obrasLocais);
              }

              return;
            }

            const obraNormalizadaSupabase = mapearObraSupabase(
              obraSupabase,
              capitulosSupabase,
              obraLocal,
              nomeProfileAutor
            );

            obrasAtualizadas = aplicarNomeAutorProfileEditarCapitulo(
              [
                obraNormalizadaSupabase,
                ...obrasLocais.filter((obra) => obra.id !== obraIdParam),
              ],
              userId,
              nomeProfileAutor
            ) as ObraLocalEditarCapitulo[];

            if (
              nomeProfileAutor &&
              obraNormalizadaSupabase.autor !== nomeProfileAutor
            ) {
              void supabase
                .from("obras")
                .update({
                  autor: nomeProfileAutor,
                  atualizado_em: new Date().toISOString(),
                })
                .eq("id", obraIdParam)
                .eq("user_id", userId);
            }

            obrasAtualizadas = salvarObrasEditarCapituloStorage(
              obrasAtualizadas,
              userId
            );

            const capituloSupabase =
              obraNormalizadaSupabase.capitulos.find(
                (capitulo) => capitulo.id === capituloIdParam
              ) || null;

            if (capituloSupabase && !cancelado) {
              setTitulo(capituloSupabase.titulo);
              setTexto(capituloSupabase.texto);
            }
          }
        }

        if (!cancelado) {
          setObras(obrasAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setObras([]);
          setVerificandoAcesso(false);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregarCapitulo();

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarParametrosTimer);
    };
  // Os setters recebidos são estáveis; manter apenas router preserva o lifecycle original.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return {
    obraId,
    capituloId,
    obras,
    setObras,
    carregando,
    verificandoAcesso,
  };
}
