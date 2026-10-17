type AbaSeguimentoPagina = "seguidores" | "seguindo";
type AbaConteudoSeguindo = "seguidores" | "obras" | "pessoas";

export function criarLoginHrefSeguindo() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/seguindo";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/seguindo";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

export function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function obterParametrosSociaisSeguindoUrl(userIdLogado: string) {
  if (typeof window === "undefined") {
    return {
      aba: "seguindo" as AbaSeguimentoPagina,
      perfilId: "",
      perfilNome: "",
      conteudo: "obras" as AbaConteudoSeguindo,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const abaValor = params.get("aba");
  const abaParam = abaValor === "seguidores" ? "seguidores" : "seguindo";
  const conteudoParam = params.get("conteudo");
  const conteudoSeguro: AbaConteudoSeguindo =
    conteudoParam === "seguidores" ||
    conteudoParam === "pessoas" ||
    conteudoParam === "obras"
      ? conteudoParam
      : abaValor === "seguidores"
        ? "seguidores"
        : abaValor === "seguindo"
          ? "pessoas"
          : "obras";
  const perfilIdParam = (
    params.get("userId") ||
    params.get("autorId") ||
    ""
  ).trim();
  const perfilNomeParam = (
    params.get("autor") ||
    params.get("nome") ||
    ""
  ).trim();
  const perfilIdSeguro = idUsuarioSupabaseValido(perfilIdParam)
    ? perfilIdParam
    : abaParam === "seguidores" && !conteudoParam
      ? userIdLogado
      : "";

  return {
    aba: abaParam as AbaSeguimentoPagina,
    perfilId: perfilIdSeguro,
    perfilNome: perfilNomeParam,
    conteudo: conteudoSeguro,
  };
}

export function criarHrefPerfilAutorSeguindo(
  nomeAutor: string,
  autorId?: string,
) {
  const params = new URLSearchParams();
  const nomeAutorLimpo = nomeAutor.trim() || "Autor não informado";
  const autorIdLimpo = autorId?.trim() || "";

  params.set("autor", nomeAutorLimpo);

  if (autorIdLimpo) {
    params.set("autorId", autorIdLimpo);
  }

  return `/perfil-autor?${params.toString()}`;
}

export function criarHrefPerfilUsuarioSeguindo(usuario: {
  id: string;
  nome: string;
}) {
  const params = new URLSearchParams();

  params.set("userId", usuario.id);
  params.set("autorId", usuario.id);
  params.set("autor", usuario.nome.trim() || "Usuário");

  return `/perfil-autor?${params.toString()}`;
}
