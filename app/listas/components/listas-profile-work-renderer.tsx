import type { ComponentProps } from "react";
import { ListasProfileWorkItem } from "./listas-profile-work-item";

export function ListasProfileWorkRenderer(
  props: ComponentProps<typeof ListasProfileWorkItem>,
) {
  return <ListasProfileWorkItem {...props} />;
}
