import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type GrupoPerfil<T> = [string, T[]];

type ListasResultsSectionProps<ItemPerfil, Obra, Autor> = {
  agruparPorMes: boolean;
  autoresVisiveis: Autor[];
  bloqueado: boolean;
  erro: string;
  gruposPerfil: GrupoPerfil<ItemPerfil>[];
  hasMore: boolean;
  itensPerfilVisiveis: ItemPerfil[];
  listSectionStyle: CSSProperties;
  loadMoreButtonStyle: CSSProperties;
  carregando: boolean;
  modo: "perfil" | "obras" | "autores";
  monthGroupStyle: CSSProperties;
  monthTitleStyle: CSSProperties;
  obrasVisiveis: Obra[];
  onCarregarMais: () => void;
  renderizarAutor: (autor: Autor) => ReactNode;
  renderizarItemPerfil: (item: ItemPerfil) => ReactNode;
  renderizarObraPublica: (obra: Obra) => ReactNode;
  rowsStyle: CSSProperties;
  stateIconStyle: CSSProperties;
  stateLinkStyle: CSSProperties;
  stateStyle: CSSProperties;
  stateTextStyle: CSSProperties;
  totalResultados: number;
  worksRowsStyle: CSSProperties;
};

export function ListasResultsSection<ItemPerfil, Obra, Autor>({
  agruparPorMes,
  autoresVisiveis,
  bloqueado,
  erro,
  gruposPerfil,
  hasMore,
  itensPerfilVisiveis,
  listSectionStyle,
  loadMoreButtonStyle,
  carregando,
  modo,
  monthGroupStyle,
  monthTitleStyle,
  obrasVisiveis,
  onCarregarMais,
  renderizarAutor,
  renderizarItemPerfil,
  renderizarObraPublica,
  rowsStyle,
  stateIconStyle,
  stateLinkStyle,
  stateStyle,
  stateTextStyle,
  totalResultados,
  worksRowsStyle,
}: ListasResultsSectionProps<ItemPerfil, Obra, Autor>) {
  return (
    <section style={listSectionStyle} aria-live="polite">
      {carregando && (
        <div style={stateStyle}>
          <span className="historietas-list-spinner" aria-hidden="true" />
          <strong>Organizando a lista...</strong>
        </div>
      )}

      {!carregando && bloqueado && (
        <div style={stateStyle}>
          <span style={stateIconStyle}>🔒</span>
          <strong>Esta lista é privada</strong>
          <span style={stateTextStyle}>
            O dono do perfil escolheu quem pode visualizar esta seção.
          </span>
          <Link href="/perfil-autor" style={stateLinkStyle}>
            Voltar ao perfil
          </Link>
        </div>
      )}

      {!carregando && erro && !bloqueado && (
        <div style={stateStyle}>
          <span style={stateIconStyle}>!</span>
          <strong>Não foi possível abrir a lista</strong>
          <span style={stateTextStyle}>{erro}</span>
        </div>
      )}

      {!carregando && !bloqueado && !erro && totalResultados === 0 && (
        <div style={stateStyle}>
          <span style={stateIconStyle}>⌕</span>
          <strong>Nenhum item encontrado</strong>
        </div>
      )}

      {!carregando && !bloqueado && !erro && totalResultados > 0 && (
        <>
          {modo === "perfil" &&
            (agruparPorMes
              ? gruposPerfil.map(([mes, itens]) => (
                  <section key={mes} style={monthGroupStyle}>
                    <h2 style={monthTitleStyle}>{mes}</h2>
                    <div style={worksRowsStyle}>
                      {itens.map(renderizarItemPerfil)}
                    </div>
                  </section>
                ))
              : (
                  <div style={worksRowsStyle}>
                    {itensPerfilVisiveis.map(renderizarItemPerfil)}
                  </div>
                ))}

          {modo === "obras" && (
            <div style={worksRowsStyle}>
              {obrasVisiveis.map(renderizarObraPublica)}
            </div>
          )}

          {modo === "autores" && (
            <div style={rowsStyle}>{autoresVisiveis.map(renderizarAutor)}</div>
          )}

          {hasMore && (
            <button
              type="button"
              onClick={onCarregarMais}
              style={loadMoreButtonStyle}
            >
              Carregar mais
            </button>
          )}
        </>
      )}
    </section>
  );
}
