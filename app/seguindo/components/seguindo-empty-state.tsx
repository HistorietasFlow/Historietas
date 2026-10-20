"use client";

import type { ReactNode } from "react";

type SeguindoEmptyStateProps = {
  children: ReactNode;
};

export function SeguindoEmptyState({ children }: SeguindoEmptyStateProps) {
  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}
