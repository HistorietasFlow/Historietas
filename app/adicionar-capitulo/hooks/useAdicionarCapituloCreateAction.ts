import type {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
} from "react";
import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { carregarNomeProfileAdicionarCapitulo } from "../actions/carregar-nome-profile-adicionar-capitulo";
import { registrarDiarioNovoCapitulo } from "../actions/registrar-diario-novo-capitulo";
import { registrarNotificacoesNovoCapituloSupabase } from "../actions/registrar-notificacoes-novo-capitulo-supabase";
import { obterOrdemCapitulo, obterProximaOrdemCapitulo } from "../lib/adicionar-capitulo-chapter-order-utils";
import { criarId } from "../lib/adicionar-capitulo-id-utils";
import { aplicarNovoCapituloNasObrasLocais } from "../lib/adicionar-capitulo-local-create-mutation";
import { carregarObrasLocais } from "../lib/adicionar-capitulo-local-work-storage";
import { criarNotificacaoNovoCapitulo } from "../lib/adicionar-capitulo-notification-utils";
import { criarLoginHrefAdicionarCapitulo } from "../lib/adicionar-capitulo-route-utils";
import { validarCapitulo } from "../lib/adicionar-capitulo-validation";
import { sincronizarAutorObraProfileAdicionarCapitulo } from "../actions/sincronizar-autor-obra-profile-adicionar-capitulo";

type RouterAdicionarCapitulo = {
  replace: (href: string) => void;
};

type ObraLocalAdicionarCapitulo = ReturnType<typeof carregarObrasLocais>[number];
type CapituloLocalAdicionarCapitulo =
  ObraLocalAdicionarCapitulo["capitulos"][number];
type NotificacaoLocalAdicionarCapitulo = ReturnType<
  typeof criarNotificacaoNovoCapitulo
>;

type UseAdicionarCapituloCreateActionProps = {
  router: RouterAdicionarCapitulo;
  obraAtual: ObraLocalAdicionarCapitulo | null;
  obraId: string;
  obras: ObraLocalAdicionarCapitulo[];
  usuarioIdLogado: string;
  titulo: string;
  texto: string;
  numeroNovoCapitulo: number;
  processando: boolean;
  criandoCapituloRef: MutableRefObject<boolean>;
  salvarObras: (novasObras: ObraLocalAdicionarCapitulo[]) => void;
  setProcessando: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setCapituloCriado: (
    capitulo: CapituloLocalAdicionarCapitulo | null,
  ) => void;
  setNotificacaoCriada: Dispatch<
    SetStateAction<NotificacaoLocalAdicionarCapitulo | null>
  >;
  setTitulo: Dispatch<SetStateAction<string>>;
  setTexto: Dispatch<SetStateAction<string>>;
  setArquivoImportadoNome: Dispatch<SetStateAction<string>>;
  setArquivoImportadoErro: Dispatch<SetStateAction<string>>;
};

function registrarNotificacaoNovoCapituloLocal(
  notificacao: NotificacaoLocalAdicionarCapitulo,
) {
  return notificacao;
}

export function useAdicionarCapituloCreateAction({
  router,
  obraAtual,
  obraId,
  obras,
  usuarioIdLogado,
  titulo,
  texto,
  numeroNovoCapitulo,
  processando,
  criandoCapituloRef,
  salvarObras,
  setProcessando,
  setErro,
  setCapituloCriado,
  setNotificacaoCriada,
  setTitulo,
  setTexto,
  setArquivoImportadoNome,
  setArquivoImportadoErro,
}: UseAdicionarCapituloCreateActionProps) {
  async function criarCapitulo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!obraAtual || processando || criandoCapituloRef.current) {
      return;
    }

    const erroValidacao = validarCapitulo(
      titulo,
      texto,
      numeroNovoCapitulo,
    );

    if (erroValidacao) {
      setErro(erroValidacao);
      setCapituloCriado(null);
      setNotificacaoCriada(null);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    criandoCapituloRef.current = true;
    setProcessando(true);
    setErro("");

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !user) {
        router.replace(criarLoginHrefAdicionarCapitulo(obraAtual.id || obraId));
        return;
      }

      if (obraAtual.autorId && obraAtual.autorId !== user.id) {
        setErro("Você não tem permissão para adicionar capítulo nesta obra.");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const nomeProfileAutor = await carregarNomeProfileAdicionarCapitulo(user.id);
      const obraAtualComAutorProfile: ObraLocalAdicionarCapitulo = {
        ...obraAtual,
        autor: nomeProfileAutor || obraAtual.autor,
        autorId: obraAtual.autorId || user.id,
      };

      void sincronizarAutorObraProfileAdicionarCapitulo(
        obraAtualComAutorProfile.id,
        user.id,
        nomeProfileAutor,
      );

      const criadoEm = new Date().toISOString();
      let ordemNovoCapitulo = obterProximaOrdemCapitulo(obraAtual.capitulos);
      const tituloFinal =
        titulo.trim() || `Capítulo ${ordemNovoCapitulo}`;
      const textoFinal = texto.trim();

      let novoCapitulo: CapituloLocalAdicionarCapitulo = {
        id: criarId(),
        titulo: tituloFinal,
        texto: textoFinal,
        curtiu: false,
        salvo: false,
        comentario: "",
        criadoEm,
        lido: false,
        lidoEm: "",
        publicado: true,
        ordem: ordemNovoCapitulo,
      };

      const obraEhSupabase = idObraSupabaseValido(obraAtual.id);

      if (obraEhSupabase) {
        const { data: obraAutorizada, error: erroObraAutorizada } = await supabase
          .from("obras")
          .select("id")
          .eq("id", obraAtual.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (erroObraAutorizada) {
          throw new Error(
            `Não consegui confirmar a autoria da obra: ${erroObraAutorizada.message}`,
          );
        }

        if (!obraAutorizada) {
          setErro("Você não tem permissão para adicionar capítulo nesta obra.");

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        const {
          data: ultimoCapituloBanco,
          error: erroUltimoCapituloBanco,
        } = await supabase
          .from("capitulos")
          .select("ordem")
          .eq("obra_id", obraAtual.id)
          .order("ordem", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (erroUltimoCapituloBanco) {
          throw new Error(
            `Não consegui calcular a ordem do novo capítulo: ${erroUltimoCapituloBanco.message}`,
          );
        }

        const ultimaOrdemBanco =
          typeof ultimoCapituloBanco?.ordem === "number" &&
          Number.isInteger(ultimoCapituloBanco.ordem) &&
          ultimoCapituloBanco.ordem >= 1
            ? ultimoCapituloBanco.ordem
            : 0;

        ordemNovoCapitulo = Math.max(
          ordemNovoCapitulo,
          ultimaOrdemBanco + 1,
        );
        novoCapitulo = {
          ...novoCapitulo,
          titulo:
            titulo.trim() || `Capítulo ${ordemNovoCapitulo}`,
          ordem: ordemNovoCapitulo,
        };

        const { data, error } = await supabase
          .from("capitulos")
          .insert({
            obra_id: obraAtual.id,
            user_id: user.id,
            titulo: novoCapitulo.titulo,
            texto: textoFinal,
            ordem: ordemNovoCapitulo,
            publicado: true,
          })
          .select("id, criado_em, ordem")
          .single();

        if (error) {
          throw new Error(`Não consegui salvar capítulo no Supabase: ${error.message}`);
        }

        if (data?.id) {
          novoCapitulo = {
            ...novoCapitulo,
            id: data.id,
            criadoEm:
              typeof data.criado_em === "string" ? data.criado_em : criadoEm,
            ordem:
              typeof data.ordem === "number" &&
              Number.isInteger(data.ordem) &&
              data.ordem >= 1
                ? data.ordem
                : ordemNovoCapitulo,
          };
        }
      }

      const numeroCapituloCriado = obterOrdemCapitulo(
        novoCapitulo,
        ordemNovoCapitulo,
      );
      const novaNotificacao = criarNotificacaoNovoCapitulo(
        obraAtualComAutorProfile,
        novoCapitulo,
        numeroCapituloCriado,
        novoCapitulo.criadoEm || criadoEm,
      );

      const novasObras = aplicarNovoCapituloNasObrasLocais({
        obras,
        obraId: obraAtual.id,
        novoCapitulo,
        nomeProfileAutor,
        usuarioIdLogado,
        userId: user.id,
      });

      salvarObras(novasObras);

      void registrarDiarioNovoCapitulo({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: numeroCapituloCriado,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      void registrarNotificacoesNovoCapituloSupabase({
        userId: user.id,
        obra: obraAtualComAutorProfile,
        capitulo: novoCapitulo,
        numeroCapitulo: numeroCapituloCriado,
        criadoEm: novoCapitulo.criadoEm || criadoEm,
      });

      setNotificacaoCriada(
        registrarNotificacaoNovoCapituloLocal(novaNotificacao),
      );

      setCapituloCriado(novoCapitulo);
      setTitulo("");
      setTexto("");
      setArquivoImportadoNome("");
      setArquivoImportadoErro("");
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não consegui salvar esse capítulo. Tente atualizar a página e criar novamente.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      criandoCapituloRef.current = false;
      setProcessando(false);
    }
  }

  return { criarCapitulo };
}
