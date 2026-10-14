import type { CSSProperties } from "react";

type Categoria<T extends string> = {
  rotulo: string;
  valor: T;
};

type ListasProfileCategoryControlsProps<T extends string> = {
  bloqueado: boolean;
  categoriaAtiva: T;
  categorias: readonly Categoria<T>[];
  contagens: Record<T, { length: number }>;
  controlsStyle: CSSProperties;
  modo: "perfil" | "obras" | "autores";
  onTrocarCategoria: (categoria: T) => void;
  tabActiveStyle: CSSProperties;
  tabCountStyle: CSSProperties;
  tabStyle: CSSProperties;
  tabsStyle: CSSProperties;
};

export function ListasProfileCategoryControls<T extends string>({
  bloqueado,
  categoriaAtiva,
  categorias,
  contagens,
  controlsStyle,
  modo,
  onTrocarCategoria,
  tabActiveStyle,
  tabCountStyle,
  tabStyle,
  tabsStyle,
}: ListasProfileCategoryControlsProps<T>) {
  if (modo !== "perfil" || bloqueado) {
    return null;
  }

  return (
    <section style={controlsStyle}>
      <div style={tabsStyle} aria-label="Categorias da lista">
        {categorias.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => onTrocarCategoria(item.valor)}
            style={categoriaAtiva === item.valor ? tabActiveStyle : tabStyle}
          >
            {item.rotulo}
            <span style={tabCountStyle}>{contagens[item.valor].length}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
