import { historietasThemeCss } from "../../../lib/historietasTheme";
import { comunidadeThemeCss } from "./community-theme-css";

export function CommunityThemeStyles() {
  return <style>{`${historietasThemeCss}${comunidadeThemeCss}`}</style>;
}
