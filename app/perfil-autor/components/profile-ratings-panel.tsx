import { ProfileRatingAction } from "./profile-rating-actions";

type ProfileRatingsPanelProps = {
  avaliacaoAutorAcaoVisivel: boolean;
  avaliacaoAutorMinhaNota: number;
  avaliacaoDiarioAcaoVisivel: boolean;
  avaliacaoDiarioMinhaNota: number;
  avaliacaoDiarioSalvando: boolean;
  isDesktop: boolean;
  onAvaliarAutor: (nota: number) => void | Promise<void>;
  onAvaliarDiarioPerfil: (nota: number) => void | Promise<void>;
};

export function ProfileRatingsPanel({
  avaliacaoAutorAcaoVisivel,
  avaliacaoAutorMinhaNota,
  avaliacaoDiarioAcaoVisivel,
  avaliacaoDiarioMinhaNota,
  avaliacaoDiarioSalvando,
  isDesktop,
  onAvaliarAutor,
  onAvaliarDiarioPerfil,
}: ProfileRatingsPanelProps) {
  return (
    <>
      {avaliacaoAutorAcaoVisivel && (
        <ProfileRatingAction
          ariaLabel="Avaliação do autor"
          entidadeAvaliacao="autor"
          isDesktop={isDesktop}
          keyPrefix="avaliacao-autor"
          minhaNota={avaliacaoAutorMinhaNota}
          titulo="AVALIE ESTE AUTOR"
          onRate={onAvaliarAutor}
        />
      )}

      {avaliacaoDiarioAcaoVisivel && (
        <ProfileRatingAction
          ariaLabel="Avaliação do Diário"
          entidadeAvaliacao="Diário"
          isDesktop={isDesktop}
          keyPrefix="avaliacao-diario-perfil"
          minhaNota={avaliacaoDiarioMinhaNota}
          salvando={avaliacaoDiarioSalvando}
          titulo="AVALIE ESTE DIÁRIO"
          onRate={onAvaliarDiarioPerfil}
        />
      )}
    </>
  );
}
