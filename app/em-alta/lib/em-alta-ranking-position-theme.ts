export function obterTemaPosicao(posicao: number) {
  if (posicao === 1) {
    return {
      nome: "Diamante",
      simbolo: "◆",
      accent: "var(--historietas-em-alta-hex-7dd3fc, #7DD3FC)",
      accentSoft: "var(--historietas-em-alta-hex-e0f2fe, #E0F2FE)",
      deep: "var(--historietas-em-alta-hex-061523, #061523)",
      border: "var(--historietas-em-alta-rgba-125-211-252-0-78, rgba(125,211,252,0.78))",
      cardBackground: "var(--historietas-em-alta-hex-2486c2, #2486C2)",
      coverBackground:
        "radial-gradient(circle at 28% 18%, var(--historietas-em-alta-rgba-224-242-254-0-22, rgba(224,242,254,0.22)), transparent 26%), radial-gradient(circle at 80% 92%, var(--historietas-em-alta-rgba-56-189-248-0-22, rgba(56,189,248,0.22)), transparent 32%), linear-gradient(145deg, var(--historietas-em-alta-hex-0b2235, #0B2235) 0%, var(--historietas-em-alta-hex-111c33, #111C33) 52%, var(--historietas-em-alta-hex-090a18, #090A18) 100%)",
      coverOverlay:
        "linear-gradient(180deg, var(--historietas-em-alta-rgba-224-242-254-0-06, rgba(224,242,254,0.06)) 0%, var(--historietas-em-alta-rgba-6-21-35-0-76, rgba(6,21,35,0.76)) 100%), radial-gradient(circle at 18% 12%, var(--historietas-em-alta-rgba-125-211-252-0-22, rgba(125,211,252,0.22)), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-ecfeff, #ECFEFF) 0%, var(--historietas-em-alta-hex-7dd3fc, #7DD3FC) 46%, var(--historietas-em-alta-hex-a78bfa, #A78BFA) 100%)",
      rankText: "var(--historietas-em-alta-hex-061523, #061523)",
      tierBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-236-254-255-0-96, rgba(236,254,255,0.96)) 0%, var(--historietas-em-alta-rgba-125-211-252-0-96, rgba(125,211,252,0.96)) 52%, var(--historietas-em-alta-rgba-167-139-250-0-96, rgba(167,139,250,0.96)) 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "var(--historietas-em-alta-rgba-125-211-252-0-16, rgba(125,211,252,0.16))",
      badgeBorder: "var(--historietas-em-alta-rgba-125-211-252-0-42, rgba(125,211,252,0.42))",
      badgeText: "var(--historietas-em-alta-hex-bae6fd, #BAE6FD)",
      readColor: "var(--historietas-em-alta-hex-7dd3fc, #7DD3FC)",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)",
    };
  }

  if (posicao === 2) {
    return {
      nome: "Rubi",
      simbolo: "◆",
      accent: "var(--historietas-em-alta-hex-fb7185, #FB7185)",
      accentSoft: "var(--historietas-em-alta-hex-ffe4e6, #FFE4E6)",
      deep: "var(--historietas-em-alta-hex-2a0716, #2A0716)",
      border: "var(--historietas-em-alta-rgba-251-113-133-0-74, rgba(251,113,133,0.74))",
      cardBackground: "var(--historietas-em-alta-hex-a32a4b, #A32A4B)",
      coverBackground:
        "radial-gradient(circle at 28% 18%, var(--historietas-em-alta-rgba-255-228-230-0-16, rgba(255,228,230,0.16)), transparent 28%), radial-gradient(circle at 80% 92%, var(--historietas-em-alta-rgba-251-113-133-0-24, rgba(251,113,133,0.24)), transparent 34%), linear-gradient(145deg, var(--historietas-em-alta-hex-3a1020, #3A1020) 0%, var(--historietas-em-alta-hex-28101f, #28101F) 52%, var(--historietas-em-alta-hex-0d0917, #0D0917) 100%)",
      coverOverlay:
        "linear-gradient(180deg, var(--historietas-em-alta-rgba-255-228-230-0-05, rgba(255,228,230,0.05)) 0%, var(--historietas-em-alta-rgba-42-7-22-0-78, rgba(42,7,22,0.78)) 100%), radial-gradient(circle at 18% 12%, var(--historietas-em-alta-rgba-251-113-133-0-24, rgba(251,113,133,0.24)), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-ffe4e6, #FFE4E6) 0%, var(--historietas-em-alta-hex-fb7185, #FB7185) 48%, var(--historietas-em-alta-hex-be123c, #BE123C) 100%)",
      rankText: "#FFFFFF",
      tierBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-ffe4e6, #FFE4E6) 0%, var(--historietas-em-alta-hex-fb7185, #FB7185) 50%, var(--historietas-em-alta-hex-be123c, #BE123C) 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "var(--historietas-em-alta-rgba-251-113-133-0-16, rgba(251,113,133,0.16))",
      badgeBorder: "var(--historietas-em-alta-rgba-251-113-133-0-44, rgba(251,113,133,0.44))",
      badgeText: "var(--historietas-em-alta-hex-fda4af, #FDA4AF)",
      readColor: "var(--historietas-em-alta-hex-fb7185, #FB7185)",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.075)",
    };
  }

  if (posicao === 3) {
    return {
      nome: "Ouro",
      simbolo: "◆",
      accent: "var(--historietas-em-alta-hex-fbbf24, #FBBF24)",
      accentSoft: "var(--historietas-em-alta-hex-fef3c7, #FEF3C7)",
      deep: "var(--historietas-em-alta-hex-271504, #271504)",
      border: "var(--historietas-em-alta-rgba-251-191-36-0-72, rgba(251,191,36,0.72))",
      cardBackground: "var(--historietas-em-alta-hex-b57d22, #B57D22)",
      coverBackground:
        "radial-gradient(circle at 28% 18%, var(--historietas-em-alta-rgba-254-243-199-0-18, rgba(254,243,199,0.18)), transparent 28%), radial-gradient(circle at 80% 92%, var(--historietas-em-alta-rgba-251-191-36-0-24, rgba(251,191,36,0.24)), transparent 34%), linear-gradient(145deg, var(--historietas-em-alta-hex-3a2508, #3A2508) 0%, var(--historietas-em-alta-hex-271808, #271808) 52%, var(--historietas-em-alta-hex-100a14, #100A14) 100%)",
      coverOverlay:
        "linear-gradient(180deg, var(--historietas-em-alta-rgba-254-243-199-0-05, rgba(254,243,199,0.05)) 0%, var(--historietas-em-alta-rgba-39-21-4-0-78, rgba(39,21,4,0.78)) 100%), radial-gradient(circle at 18% 12%, var(--historietas-em-alta-rgba-251-191-36-0-24, rgba(251,191,36,0.24)), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-fef3c7, #FEF3C7) 0%, var(--historietas-em-alta-hex-fbbf24, #FBBF24) 48%, var(--historietas-em-alta-hex-d97706, #D97706) 100%)",
      rankText: "var(--historietas-em-alta-hex-2b1407, #2B1407)",
      tierBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-fef3c7, #FEF3C7) 0%, var(--historietas-em-alta-hex-fbbf24, #FBBF24) 52%, var(--historietas-em-alta-hex-d97706, #D97706) 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "var(--historietas-em-alta-rgba-251-191-36-0-16, rgba(251,191,36,0.16))",
      badgeBorder: "var(--historietas-em-alta-rgba-251-191-36-0-44, rgba(251,191,36,0.44))",
      badgeText: "var(--historietas-em-alta-hex-fcd34d, #FCD34D)",
      readColor: "var(--historietas-em-alta-hex-fbbf24, #FBBF24)",
      shadow:
        "0 18px 38px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.075)",
    };
  }

  if (posicao === 4) {
    return {
      nome: "Prata",
      simbolo: "◆",
      accent: "var(--historietas-em-alta-hex-cbd5e1, #CBD5E1)",
      accentSoft: "var(--historietas-em-alta-hex-f8fafc, #F8FAFC)",
      deep: "var(--historietas-em-alta-hex-101722, #101722)",
      border: "var(--historietas-em-alta-rgba-203-213-225-0-68, rgba(203,213,225,0.68))",
      cardBackground: "var(--historietas-em-alta-hex-7b8aa3, #7B8AA3)",
      coverBackground:
        "radial-gradient(circle at 28% 18%, var(--historietas-em-alta-rgba-248-250-252-0-14, rgba(248,250,252,0.14)), transparent 28%), radial-gradient(circle at 80% 92%, var(--historietas-em-alta-rgba-148-163-184-0-18, rgba(148,163,184,0.18)), transparent 34%), linear-gradient(145deg, var(--historietas-em-alta-hex-26303d, #26303D) 0%, var(--historietas-em-alta-hex-1a202b, #1A202B) 52%, var(--historietas-em-alta-hex-0d0b16, #0D0B16) 100%)",
      coverOverlay:
        "linear-gradient(180deg, var(--historietas-em-alta-rgba-248-250-252-0-04, rgba(248,250,252,0.04)) 0%, var(--historietas-em-alta-rgba-16-23-34-0-78, rgba(16,23,34,0.78)) 100%), radial-gradient(circle at 18% 12%, var(--historietas-em-alta-rgba-203-213-225-0-18, rgba(203,213,225,0.18)), transparent 34%)",
      rankBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-f8fafc, #F8FAFC) 0%, var(--historietas-em-alta-hex-cbd5e1, #CBD5E1) 52%, var(--historietas-em-alta-hex-64748b, #64748B) 100%)",
      rankText: "var(--historietas-em-alta-hex-111827, #111827)",
      tierBackground:
        "linear-gradient(135deg, var(--historietas-em-alta-hex-f8fafc, #F8FAFC) 0%, var(--historietas-em-alta-hex-cbd5e1, #CBD5E1) 52%, var(--historietas-em-alta-hex-64748b, #64748B) 100%)",
      tierText: "#FFFFFF",
      badgeBackground: "var(--historietas-em-alta-rgba-203-213-225-0-13, rgba(203,213,225,0.13))",
      badgeBorder: "var(--historietas-em-alta-rgba-203-213-225-0-38, rgba(203,213,225,0.38))",
      badgeText: "var(--historietas-em-alta-hex-e2e8f0, #E2E8F0)",
      readColor: "var(--historietas-em-alta-hex-cbd5e1, #CBD5E1)",
      shadow:
        "0 18px 38px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)",
    };
  }

  return {
    nome: "Bronze",
    simbolo: "◆",
    accent: "var(--historietas-em-alta-hex-fb923c, #FB923C)",
    accentSoft: "var(--historietas-em-alta-hex-fed7aa, #FED7AA)",
    deep: "var(--historietas-em-alta-hex-241006, #241006)",
    border: "var(--historietas-em-alta-rgba-251-146-60-0-70, rgba(251,146,60,0.70))",
    cardBackground: "var(--historietas-em-alta-hex-9a6535, #9A6535)",
    coverBackground:
      "radial-gradient(circle at 28% 18%, var(--historietas-em-alta-rgba-254-215-170-0-14, rgba(254,215,170,0.14)), transparent 28%), radial-gradient(circle at 80% 92%, var(--historietas-em-alta-rgba-251-146-60-0-22, rgba(251,146,60,0.22)), transparent 34%), linear-gradient(145deg, var(--historietas-em-alta-hex-351d0e, #351D0E) 0%, var(--historietas-em-alta-hex-24140b, #24140B) 52%, var(--historietas-em-alta-hex-100a14, #100A14) 100%)",
    coverOverlay:
      "linear-gradient(180deg, var(--historietas-em-alta-rgba-254-215-170-0-04, rgba(254,215,170,0.04)) 0%, var(--historietas-em-alta-rgba-36-16-6-0-78, rgba(36,16,6,0.78)) 100%), radial-gradient(circle at 18% 12%, var(--historietas-em-alta-rgba-251-146-60-0-20, rgba(251,146,60,0.20)), transparent 34%)",
    rankBackground:
      "linear-gradient(135deg, var(--historietas-em-alta-hex-fed7aa, #FED7AA) 0%, var(--historietas-em-alta-hex-fb923c, #FB923C) 48%, var(--historietas-em-alta-hex-9a3412, #9A3412) 100%)",
    rankText: "#FFFFFF",
    tierBackground:
      "linear-gradient(135deg, var(--historietas-em-alta-hex-fed7aa, #FED7AA) 0%, var(--historietas-em-alta-hex-fb923c, #FB923C) 50%, var(--historietas-em-alta-hex-9a3412, #9A3412) 100%)",
    tierText: "#FFFFFF",
    badgeBackground: "var(--historietas-em-alta-rgba-251-146-60-0-15, rgba(251,146,60,0.15))",
    badgeBorder: "var(--historietas-em-alta-rgba-251-146-60-0-40, rgba(251,146,60,0.40))",
    badgeText: "var(--historietas-em-alta-hex-fdba74, #FDBA74)",
    readColor: "var(--historietas-em-alta-hex-fb923c, #FB923C)",
    shadow:
      "0 18px 38px rgba(0,0,0,0.33), inset 0 1px 0 rgba(255,255,255,0.07)",
  };
}
