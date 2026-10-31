import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  criarHrefAceiteTermos,
  verificarAceiteTermosPublicacao,
} from "../../../lib/aceiteTermos";
import { carregarNomeProfileAdicionarCapitulo } from "../actions/carregar-nome-profile-adicionar-capitulo";
import {
  aplicarAutorProfileAdicionarCapitulo,
} from "../lib/adicionar-capitulo-profile-utils";
import {
  criarLoginHrefAdicionarCapitulo,
} from "../lib/adicionar-capitulo-route-utils";
import {
  carregarObrasLocais,
  salvarObrasAdicionarCapituloStorage,
} from "../lib/adicionar-capitulo-local-work-storage";
import {
  atualizarObrasLocaisDoUsuario,
  filtrarObrasDoUsuario,
} from "../lib/adicionar-capitulo-ownership-utils";
import { normalizarObraSupabase } from "../lib/adicionar-capitulo-supabase-work-normalizer";
import { mesclarObrasComSupabase } from "../lib/adicionar-capitulo-work-merge-utils";

type RouterAdicionarCapitulo = {
  replace: (href: string) => void;
};

type ObraLocalAdicionarCapitulo = ReturnType<typeof carregarObrasLocais>[number];

export function useAdicionarCapituloInitialLoad({
  router,
}: {
  router: RouterAdicionarCapitulo;
}) {
  const [obraId, setObraId] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocalAdicionarCapitulo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const params = new URLSearchParams(window.location.search);
    const obraIdParam = params.get("obraId") || "";
    const atualizarObraIdTimer = window.setTimeout(() => {
      if (!cancelado) {
        setObraId(obraIdParam);
      }
    }, 0);

    async function carregarDados() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (erroUsuario || !user) {
          setUsuarioIdLogado("");
          setCarregando(false);
          router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
          return;
        }

        const statusAceite = await verificarAceiteTermosPublicacao();

        if (cancelado) {
          return;
        }

        if (!statusAceite.aceito) {
          const redirectTo = obraIdParam
            ? `/adicionar-capitulo?obraId=${encodeURIComponent(obraIdParam)}`
            : "/adicionar-capitulo";
          router.replace(criarHrefAceiteTermos(redirectTo));
          return;
        }

        setUsuarioIdLogado(user.id);

        const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);

        let todasObrasLocais: ObraLocalAdicionarCapitulo[] = [];
        let obrasLocais: ObraLocalAdicionarCapitulo[] = [];

        try {
          todasObrasLocais = carregarObrasLocais(user.id);
          obrasLocais = aplicarAutorProfileAdicionarCapitulo(
            filtrarObrasDoUsuario(todasObrasLocais, user.id),
            user.id,
            nomeProfileAutor
          );
        } catch {
          todasObrasLocais = [];
          obrasLocais = [];
        }

        let obrasFinais = obrasLocais;

        try {
          const { data, error } = await supabase
            .from("obras")
            .select(
              "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em,capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em,atualizado_em)"
            )
            .eq("user_id", user.id)
            .order("criada_em", { ascending: false })
            .limit(80);

          if (!error && Array.isArray(data)) {
            const obrasLocaisPorId = new Map(
              obrasLocais.map((obra) => [obra.id, obra])
            );

            const obrasSupabase = data.map((obra, index) =>
              normalizarObraSupabase(
                obra,
                index,
                obrasLocaisPorId.get(obra.id),
                nomeProfileAutor
              )
            );

            obrasFinais = aplicarAutorProfileAdicionarCapitulo(
              mesclarObrasComSupabase(obrasLocais, obrasSupabase),
              user.id,
              nomeProfileAutor
            );
            const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
              todasObrasLocais,
              obrasFinais,
              user.id
            );

            salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, user.id);
          }
        } catch {
          // Se o Supabase falhar, mantém somente as obras locais do usuário logado.
        }

        if (cancelado) {
          return;
        }

        setObras(obrasFinais);
        setCarregando(false);
      } catch {
        if (cancelado) {
          return;
        }

        setUsuarioIdLogado("");
        setObras([]);
        setCarregando(false);
        router.replace(criarLoginHrefAdicionarCapitulo(obraIdParam));
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
      window.clearTimeout(atualizarObraIdTimer);
    };
  }, [router]);

  return {
    obraId,
    usuarioIdLogado,
    obras,
    carregando,
    setObras,
  };
}
