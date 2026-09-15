import type { CSSProperties } from "react";
import { historietasThemeCss } from "../../../lib/historietasTheme";
import {
  containerStyle,
  desktopContainerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  perfilAutorThemeCss,
} from "../styles";
import { LoadingSpinner } from "./loading-spinner";

type ProfilePageStateProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
  loadingLabel?: string;
  message?: string;
};

export function ProfilePageState({
  isDesktop,
  pageThemeStyle,
  loadingLabel,
  message,
}: ProfilePageStateProps) {
  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${perfilAutorThemeCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {loadingLabel ? (
          <LoadingSpinner label={loadingLabel} />
        ) : (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
