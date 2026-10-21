import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import {
  idUsuarioSupabaseValido,
  normalizarUsernameConfiguracoes,
} from "./configuracoes-account-utils";
import { carregarResumoContaSupabase } from "./configuracoes-account-summary-supabase";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "./configuracoes-account-models";
import { salvarPreferencias } from "./configuracoes-account-preferences";
import { traduzirErroUsernameConfiguracoes } from "./configuracoes-error-messages";
import { salvarPreferenciasPrivacidade } from "./configuracoes-privacy-preferences";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";
import { salvarPerfilConfiguracoesSupabase } from "./configuracoes-profile-supabase-saver";
import type {
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "./configuracoes-callback-types";

export async function salvarConfiguracoesPerfil({
  salvando,
  usuarioIdLogado,
  preferencias,
  privacidade,
  usuario,
  language,
  redirecionarLogin,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
  setErroUsername,
  setSalvando,
  setPreferencias,
  setUsuario,
  setResumo,
}: {
  salvando: boolean;
  usuarioIdLogado: string;
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  usuario: UsuarioConfiguracoes | null;
  language: HistorietasLanguage;
  redirecionarLogin: () => void;
  setMensagemAcao: (mensagem: null) => void;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  setErroUsername: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setUsuario: Dispatch<SetStateAction<UsuarioConfiguracoes | null>>;
  setResumo: Dispatch<SetStateAction<ResumoLocal>>;
}) {
  if (salvando) {
    return;
  }

  setMensagemAcao(null);

  const userIdSeguro = usuarioIdLogado.trim();
  const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

  if (!idUsuarioSupabaseValido(userIdSeguro)) {
    redirecionarLogin();
    return;
  }

  if (preferencias.username.trim() && usernameLimpo.length < 3) {
    const mensagem = traduzirTexto(
      "Use pelo menos 3 caracteres no @username.",
      "Use at least 3 characters in the @username.",
      "Usa al menos 3 caracteres en el @username.",
    );

    setErroUsername(mensagem);
    mostrarMensagemAcao("erro", mensagem);
    return;
  }

  const preferenciasNormalizadas: PreferenciasConta = {
    ...preferencias,
    nomeExibicao: preferencias.nomeExibicao.trim(),
    username: usernameLimpo,
    emailContato: preferencias.emailContato.trim(),
  };

  setSalvando(true);
  setErroUsername("");

  try {
    const { data: dadosUsuarioAtual, error: erroUsuarioAtual } =
      await supabase.auth.getUser();
    const usuarioAtualId = dadosUsuarioAtual.user?.id || "";

    if (
      erroUsuarioAtual ||
      !idUsuarioSupabaseValido(usuarioAtualId) ||
      usuarioAtualId !== userIdSeguro
    ) {
      redirecionarLogin();
      return;
    }

    const falhasSincronizacao: string[] = [];

    const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
      userId: userIdSeguro,
      nome:
        preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
      username: usernameLimpo,
    });

    if (!resultadoPerfil.ok) {
      const mensagem = traduzirErroUsernameConfiguracoes(
        resultadoPerfil.erro,
        language,
      );

      setErroUsername(mensagem);
      mostrarMensagemAcao("erro", mensagem);
      return;
    }

    const { error: erroMetadata } = await supabase.auth.updateUser({
      data: {
        nome:
          preferenciasNormalizadas.nomeExibicao ||
          usuario?.nome ||
          "Usuário",
        username: usernameLimpo,
      },
    });

    if (erroMetadata) {
      falhasSincronizacao.push("metadados");
      console.warn(
        "O perfil foi salvo, mas os metadados da autenticação não sincronizaram:",
        erroMetadata.message,
      );
    }

    salvarPreferencias(preferenciasNormalizadas, userIdSeguro);
    const resultadoPrivacidade = await salvarPreferenciasPrivacidade(
      privacidade,
      userIdSeguro,
    );

    if (!resultadoPrivacidade.ok) {
      falhasSincronizacao.push("privacidade");
      console.warn(
        "As preferências de privacidade ficaram salvas neste aparelho, mas não sincronizaram:",
        resultadoPrivacidade.erro,
      );
    }

    setPreferencias(preferenciasNormalizadas);
    setUsuario((usuarioAtual) =>
      usuarioAtual
        ? {
            ...usuarioAtual,
            nome:
              preferenciasNormalizadas.nomeExibicao || usuarioAtual.nome,
            username: usernameLimpo,
            email:
              preferenciasNormalizadas.emailContato || usuarioAtual.email,
          }
        : usuarioAtual,
    );
    setResumo(await carregarResumoContaSupabase(userIdSeguro));

    if (falhasSincronizacao.length > 0) {
      mostrarMensagemAcao(
        "aviso",
        traduzirTexto(
          "As alterações foram salvas neste aparelho, mas parte delas não sincronizou com sua conta.",
          "The changes were saved on this device, but some of them did not sync with your account.",
          "Los cambios se guardaron en este dispositivo, pero algunos no se sincronizaron con tu cuenta.",
        ),
      );
    } else {
      mostrarMensagemAcao(
        "sucesso",
        traduzirTexto(
          "Alterações salvas com sucesso.",
          "Changes saved successfully.",
          "Cambios guardados correctamente.",
        ),
      );
    }
  } catch (error) {
    console.warn("Não consegui salvar as configurações da conta:", error);

    const mensagem = traduzirTexto(
      "Não consegui salvar suas alterações agora.",
      "I could not save your changes right now.",
      "No pude guardar tus cambios ahora.",
    );

    setErroUsername(mensagem);
    mostrarMensagemAcao("erro", mensagem);
  } finally {
    setSalvando(false);
  }
}
