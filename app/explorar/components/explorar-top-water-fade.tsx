import { criarExplorarTopWaterFadeStyle } from "../lib/explorar-layout-styles";

type ExplorarTopWaterFadeProps = {
  isDesktop: boolean;
};

export function ExplorarTopWaterFade({
  isDesktop,
}: ExplorarTopWaterFadeProps) {
  return (
    <div
      style={criarExplorarTopWaterFadeStyle(isDesktop)}
      aria-hidden="true"
    />
  );
}
