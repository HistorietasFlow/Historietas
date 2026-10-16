import type { TipoRanking } from "./em-alta-models";

export function obterTemaRanking(tipo: TipoRanking) {
  if (tipo === "geral") {
    return {
      icone: "👑",
      label: "Ranking Mestre",
      titleColor: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
      accent: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
      border:
        "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 42%, transparent)",
      borderStrong:
        "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 58%, transparent)",
      glow: "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 12%, transparent)",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-41-27-53-0-82, rgba(41,27,53,0.82)) 0%, var(--historietas-em-alta-rgba-18-12-30-0-92, rgba(18,12,30,0.92)) 100%)",
    };
  }

  if (tipo === "lidas") {
    return {
      icone: "👁",
      label: "Alcance",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-38bdf8, #38BDF8)",
      border: "var(--historietas-em-alta-rgba-56-189-248-0-42, rgba(56,189,248,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-56-189-248-0-58, rgba(56,189,248,0.58))",
      glow: "var(--historietas-em-alta-rgba-56-189-248-0-12, rgba(56,189,248,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-18-36-54-0-82, rgba(18,36,54,0.82)) 0%, var(--historietas-em-alta-rgba-11-17-32-0-92, rgba(11,17,32,0.92)) 100%)",
    };
  }

  if (tipo === "curtidas") {
    return {
      icone: "❤",
      label: "Reação",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-fb7185, #FB7185)",
      border: "var(--historietas-em-alta-rgba-251-113-133-0-42, rgba(251,113,133,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-251-113-133-0-58, rgba(251,113,133,0.58))",
      glow: "var(--historietas-em-alta-rgba-251-113-133-0-12, rgba(251,113,133,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-54-20-38-0-82, rgba(54,20,38,0.82)) 0%, var(--historietas-em-alta-rgba-29-13-27-0-92, rgba(29,13,27,0.92)) 100%)",
    };
  }

  if (tipo === "comentadas") {
    return {
      icone: "💬",
      label: "Discussão",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-c084fc, #C084FC)",
      border: "var(--historietas-em-alta-rgba-192-132-252-0-42, rgba(192,132,252,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-192-132-252-0-58, rgba(192,132,252,0.58))",
      glow: "var(--historietas-em-alta-rgba-192-132-252-0-12, rgba(192,132,252,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-40-25-62-0-82, rgba(40,25,62,0.82)) 0%, var(--historietas-em-alta-rgba-20-12-34-0-92, rgba(20,12,34,0.92)) 100%)",
    };
  }

  if (tipo === "salvas") {
    return {
      icone: "👥",
      label: "Seguidores",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-34d399, #34D399)",
      border: "var(--historietas-em-alta-rgba-52-211-153-0-42, rgba(52,211,153,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-52-211-153-0-58, rgba(52,211,153,0.58))",
      glow: "var(--historietas-em-alta-rgba-52-211-153-0-11, rgba(52,211,153,0.11))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-17-48-39-0-82, rgba(17,48,39,0.82)) 0%, var(--historietas-em-alta-rgba-10-29-25-0-92, rgba(10,29,25,0.92)) 100%)",
    };
  }

  if (tipo === "recentes") {
    return {
      icone: "✨",
      label: "Novidade",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-f472b6, #F472B6)",
      border: "var(--historietas-em-alta-rgba-244-114-182-0-42, rgba(244,114,182,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-244-114-182-0-58, rgba(244,114,182,0.58))",
      glow: "var(--historietas-em-alta-rgba-244-114-182-0-11, rgba(244,114,182,0.11))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-54-22-45-0-82, rgba(54,22,45,0.82)) 0%, var(--historietas-em-alta-rgba-30-13-31-0-92, rgba(30,13,31,0.92)) 100%)",
    };
  }

  return {
    icone: "📚",
    label: "Conteúdo",
    titleColor: "#FFFFFF",
    accent: "var(--historietas-em-alta-hex-a78bfa, #A78BFA)",
    border: "var(--historietas-em-alta-rgba-167-139-250-0-42, rgba(167,139,250,0.42))",
    borderStrong: "var(--historietas-em-alta-rgba-167-139-250-0-58, rgba(167,139,250,0.58))",
    glow: "var(--historietas-em-alta-rgba-167-139-250-0-12, rgba(167,139,250,0.12))",
    background:
      "linear-gradient(135deg, var(--historietas-em-alta-rgba-37-27-60-0-82, rgba(37,27,60,0.82)) 0%, var(--historietas-em-alta-rgba-18-12-34-0-92, rgba(18,12,34,0.92)) 100%)",
  };
}
