export function obterLinkPublicacaoComunidade(postId: string) {
  if (typeof window === "undefined") {
    return `/comunidade?post=${encodeURIComponent(postId)}`;
  }

  const url = new URL(window.location.href);
  url.pathname = "/comunidade";
  url.search = `?post=${encodeURIComponent(postId)}`;
  url.hash = "";

  return url.toString();
}
