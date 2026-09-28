import { calcularPorcentagemOpcaoEnquete } from "./community-poll-option-percentage";
import {
  deveDesabilitarOpcaoEnqueteComunidade,
  obterLarguraResultadoOpcaoEnqueteComunidade,
  obterTextoStatusOpcaoEnqueteComunidade,
} from "./community-poll-option-state";
import { CommunityPollBox } from "./community-poll-box";
import { CommunityPollOptionButton } from "./community-poll-option-button";
import { CommunityPollOptions } from "./community-poll-options";
import { CommunityPollOptionStatus } from "./community-poll-option-status";
import { CommunityPollOptionText } from "./community-poll-option-text";
import { CommunityPollResultBar } from "./community-poll-result-bar";
import { calcularTotalVotosEnquete } from "./community-poll-total-votes";
import type { ResultadoVotosEnquete } from "./community-poll-votes-result";
import type { PostComunidade } from "./community-post-model";
import { obterOpcoesEnquete } from "./community-valid-poll-options";

type CommunityPostPollProps = {
  post: PostComunidade;
  votosEnquetes: Record<string, string>;
  resultadosEnquetes: ResultadoVotosEnquete;
  votandoEnqueteId: string | null;
  onVotar: (opcao: string) => void;
};

export function CommunityPostPoll({
  post,
  votosEnquetes,
  resultadosEnquetes,
  votandoEnqueteId,
  onVotar,
}: CommunityPostPollProps) {
  return (
    <CommunityPollBox>
      <CommunityPollOptions>
        {obterOpcoesEnquete(post.texto).map((opcao) => {
          const votoAtual = votosEnquetes[post.id] || "";
          const selecionada = votoAtual === opcao;
          const usuarioVotouNaEnquete = Boolean(votoAtual);
          const totalVotos = usuarioVotouNaEnquete
            ? calcularTotalVotosEnquete(resultadosEnquetes, post.id)
            : 0;
          const porcentagem = usuarioVotouNaEnquete
            ? calcularPorcentagemOpcaoEnquete(
                resultadosEnquetes,
                post.id,
                opcao
              )
            : 0;
          const larguraResultado =
            obterLarguraResultadoOpcaoEnqueteComunidade(
              usuarioVotouNaEnquete,
              totalVotos,
              selecionada,
              porcentagem
            );

          return (
            <CommunityPollOptionButton
              key={opcao}
              onClick={() => onVotar(opcao)}
              disabled={deveDesabilitarOpcaoEnqueteComunidade(
                votoAtual,
                votandoEnqueteId,
                post.id
              )}
              selected={selecionada}
            >
              <CommunityPollResultBar
                width={larguraResultado}
                visible={usuarioVotouNaEnquete}
              />

              <CommunityPollOptionText
                selected={selecionada}
              >
                {opcao}
              </CommunityPollOptionText>

              <CommunityPollOptionStatus
                selected={selecionada}
              >
                {obterTextoStatusOpcaoEnqueteComunidade(
                  usuarioVotouNaEnquete,
                  selecionada,
                  totalVotos,
                  porcentagem,
                  votandoEnqueteId === post.id
                )}
              </CommunityPollOptionStatus>
            </CommunityPollOptionButton>
          );
        })}
      </CommunityPollOptions>
    </CommunityPollBox>
  );
}
