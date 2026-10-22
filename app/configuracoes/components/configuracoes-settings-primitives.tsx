import Link from "next/link";
import type { ReactNode } from "react";
import type { AtualizarTextoConfiguracoes } from "../lib/configuracoes-callback-types";
import { SvgIcon } from "./configuracoes-svg-icon";
import type { IconName } from "./configuracoes-svg-icon";
import {
  inputErrorStyle,
  inputHelperStyle,
  inputLabelStyle,
  inputRowStyle,
  inputStyle,
  inputTextBoxStyle,
  listCardStyle,
  rowButtonStyle,
  rowChevronStyle,
  rowIconStyle,
  rowLinkStyle,
  rowRightStyle,
  rowStaticStyle,
  rowSubtitleStyle,
  rowTextBoxStyle,
  rowTitleDangerStyle,
  rowTitleStyle,
  rowValueDangerStyle,
  rowValueStyle,
  sectionStyle,
  sectionTitleStyle,
} from "../lib/configuracoes-settings-primitives-styles";

export function ValorLinha({
  children,
  danger = false,
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <span style={danger ? rowValueDangerStyle : rowValueStyle}>
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitleStyle}>{children}</h2>;
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <SectionTitle>{title}</SectionTitle>
      <div style={listCardStyle}>{children}</div>
    </section>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  href,
  onClick,
  danger = false,
  hideChevron = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  hideChevron?: boolean;
}) {
  const content = (
    <>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={rowTextBoxStyle}>
        <span style={danger ? rowTitleDangerStyle : rowTitleStyle}>{title}</span>
        {subtitle ? <span style={rowSubtitleStyle}>{subtitle}</span> : null}
      </span>

      {right ? <span style={rowRightStyle}>{right}</span> : null}

      {!hideChevron ? (
        <span style={rowChevronStyle}>
          <SvgIcon name="chevronRight" size={22} strokeWidth={2.6} />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={rowLinkStyle}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={rowButtonStyle}>
        {content}
      </button>
    );
  }

  return <div style={rowStaticStyle}>{content}</div>;
}

export function SettingsInput({
  icon,
  label,
  value,
  placeholder,
  type = "text",
  helperText,
  error = false,
  maxLength,
  autoComplete,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  helperText?: string;
  error?: boolean;
  maxLength?: number;
  autoComplete?: string;
  onChange: AtualizarTextoConfiguracoes;
}) {
  return (
    <label style={inputRowStyle}>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={inputTextBoxStyle}>
        <span style={inputLabelStyle}>{label}</span>
        <input
          className="configuracoes-input configuracoes-input-transparente"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          maxLength={maxLength}
          autoComplete={autoComplete}
          style={inputStyle}
        />

        {helperText ? (
          <span style={error ? inputErrorStyle : inputHelperStyle}>
            {helperText}
          </span>
        ) : null}
      </span>
    </label>
  );
}
