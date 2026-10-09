import type { CSSProperties } from "react";

export function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      style={checked ? toggleOnStyle : toggleOffStyle}
    >
      <span style={checked ? toggleKnobOnStyle : toggleKnobOffStyle} />
    </button>
  );
}

const toggleBaseStyle: CSSProperties = {
  width: "52px",
  height: "31px",
  borderRadius: "999px",
  border: "0",
  padding: "3px",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "background 160ms ease",
};

const toggleOnStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-end",
  background: "var(--historietas-accent, #F97316)",
};

const toggleOffStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-start",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.18))",
};

const toggleKnobBaseStyle: CSSProperties = {
  width: "25px",
  height: "25px",
  borderRadius: "999px",
  background: "var(--configuracoes-toggle-knob-bg, #FFFFFF)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.28)",
};

const toggleKnobOnStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};

const toggleKnobOffStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};
