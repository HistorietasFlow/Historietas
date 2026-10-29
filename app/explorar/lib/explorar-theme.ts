import type { TemaCategoriaExplorar } from "../components/explorar-section-components";

export function obterTemaCategoria(): TemaCategoriaExplorar {
  return {
    accent: "#FFFFFF",
    secondary: "#A1A1AA",
    bgStart: "#000000",
    bgMid: "#000000",
    bgEnd: "#000000",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
    titleTo: "#FFFFFF",
    activeSurface: "rgba(255,255,255,0.10)",
    secondarySurface: "rgba(255,255,255,0.06)",
    secondaryButtonText: "#FFFFFF",
    activeBackground: "#050505",
    pageBackground: "#000000",
    heroBackground: "#000000",
  };
}

export function criarTemaPaginaVisualExplorar(): TemaCategoriaExplorar {
  return obterTemaCategoria();
}
