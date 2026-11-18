// O proxy e o handler reconhecem a mesma URL antes de interpretar a sessão.
export function reconhecerRotaPrevia(pathname: string) {
  return /^\/api\/obras\/([^/]+)\/previa\/?$/.exec(pathname);
}
