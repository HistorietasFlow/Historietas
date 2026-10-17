import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { TamanhoFonte } from "../components/ler-capitulo-reader-content";
import { carregarPerfilComentarioLeitor, type PerfilComentarioLeitor } from "../lib/ler-capitulo-comments-read-loader";
import { carregarPreferenciasLeitura, salvarPreferenciasLeitura } from "../lib/ler-capitulo-reading-preferences";

type SessaoPreferenciasLeitor = {
  usuarioIdLogado: string;
  tamanhoFonte: TamanhoFonte;
  mostrarLinhaProgresso: boolean;
  preferenciasCarregadas: boolean;
  setUsuarioIdLogado: Dispatch<SetStateAction<string>>;
  setPerfilComentarioLeitor: Dispatch<SetStateAction<PerfilComentarioLeitor>>;
  setTamanhoFonte: Dispatch<SetStateAction<TamanhoFonte>>;
  setMostrarLinhaProgresso: Dispatch<SetStateAction<boolean>>;
  setPreferenciasCarregadas: Dispatch<SetStateAction<boolean>>;
};

export function useLerCapituloSessionPreferences({
  usuarioIdLogado,
  tamanhoFonte,
  mostrarLinhaProgresso,
  preferenciasCarregadas,
  setUsuarioIdLogado,
  setPerfilComentarioLeitor,
  setTamanhoFonte,
  setMostrarLinhaProgresso,
  setPreferenciasCarregadas,
}: SessaoPreferenciasLeitor) {
  useEffect(() => {
    let cancelado = false;

    async function carregarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (!cancelado) {
          setUsuarioIdLogado(data.user?.id || "");
        }
      } catch {
        if (!cancelado) {
          setUsuarioIdLogado("");
        }
      }
    }

    void carregarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelado) {
        setUsuarioIdLogado(session?.user?.id || "");
      }
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
    // Os setters pertencem à página e são estáveis; a assinatura continua registrada uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  useEffect(() => {
    let cancelado = false;

    async function carregarPerfilComentario() {
      if (!usuarioIdLogado) {
        window.setTimeout(() => {
          if (!cancelado) {
            setPerfilComentarioLeitor({
              userId: "",
              nome: "Usuário",
              avatar: "",
            });
          }
        }, 0);
        return;
      }

      const perfil = await carregarPerfilComentarioLeitor(usuarioIdLogado);

      if (!cancelado) {
        setPerfilComentarioLeitor(perfil);
      }
    }

    void carregarPerfilComentario();

    return () => {
      cancelado = true;
    };
    // Os setters pertencem à página e são estáveis; preservar a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!usuarioIdLogado.trim()) {
      return;
    }

    const carregarPreferenciasTimer = window.setTimeout(() => {
      const preferencias = carregarPreferenciasLeitura(usuarioIdLogado);

      setTamanhoFonte(preferencias.tamanhoFonte);
      setMostrarLinhaProgresso(preferencias.mostrarLinhaProgresso);
      setPreferenciasCarregadas(true);
    }, 0);

    return () => {
      window.clearTimeout(carregarPreferenciasTimer);
    };
    // Os setters pertencem à página e são estáveis; preservar a dependência original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioIdLogado]);

  useEffect(() => {
    if (!preferenciasCarregadas) {
      return;
    }

    salvarPreferenciasLeitura(
      {
        tamanhoFonte,
        mostrarLinhaProgresso,
        versaoTamanhoFonte: 2,
      },
      usuarioIdLogado
    );
  }, [preferenciasCarregadas, tamanhoFonte, mostrarLinhaProgresso, usuarioIdLogado]);
}
