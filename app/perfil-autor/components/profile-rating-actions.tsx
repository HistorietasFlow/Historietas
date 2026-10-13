import { ProfileRatingBox } from "./profile-rating-box";

type ProfileRatingActionProps = {
  ariaLabel: string;
  entidadeAvaliacao: string;
  isDesktop: boolean;
  keyPrefix: string;
  minhaNota: number;
  onRate: (nota: number) => void | Promise<void>;
  salvando?: boolean;
  titulo: string;
};

export function ProfileRatingAction({
  ariaLabel,
  entidadeAvaliacao,
  isDesktop,
  keyPrefix,
  minhaNota,
  onRate,
  salvando,
  titulo,
}: ProfileRatingActionProps) {
  return (
    <ProfileRatingBox
      ariaLabel={ariaLabel}
      entidadeAvaliacao={entidadeAvaliacao}
      isDesktop={isDesktop}
      keyPrefix={keyPrefix}
      minhaNota={minhaNota}
      salvando={salvando}
      titulo={titulo}
      onRate={onRate}
    />
  );
}
