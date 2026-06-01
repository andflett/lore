"use client";

import type { ComponentType } from "react";
import { Btn } from "./Btn";
import { GameIcon } from "./GameIcon";
import { Tooltip } from "./Tooltip";
import type { IconName } from "@/lib/icon-paths";

// Radix icons are functional UI glyphs (close, etc.); game icons carry the
// thematic flavour. A button takes exactly one of `icon` (game) or
// `radixIcon` (a Radix icon component).
type RadixIcon = ComponentType<{ className?: string }>;

interface Props {
  icon?: IconName;
  radixIcon?: RadixIcon;
  onClick?: () => void;
  variant?: "metal" | "confirm" | "dim" | "danger" | "default";
  size?: "sm" | "md" | "lg";
  iconSize?: number;
  label: string; // accessible label + tooltip text
  tooltipSide?: "top" | "bottom" | "left" | "right";
  tooltipAlign?: "start" | "center" | "end";
  disabled?: boolean;
}

const ICON_SIZE: Record<NonNullable<Props["size"]>, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function IconButton({
  icon,
  radixIcon: RadixIconComp,
  onClick,
  variant = "metal",
  size = "md",
  iconSize,
  label,
  tooltipSide = "bottom",
  tooltipAlign = "center",
  disabled,
}: Props) {
  const px = iconSize ?? ICON_SIZE[size];
  return (
    <Tooltip label={label} side={tooltipSide} align={tooltipAlign}>
      <Btn
        icon
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        ariaLabel={label}
      >
        {RadixIconComp ? (
          <span style={{ display: "flex", width: px, height: px }}>
            <RadixIconComp className="h-full w-full" />
          </span>
        ) : (
          icon && <GameIcon name={icon} size={px} />
        )}
      </Btn>
    </Tooltip>
  );
}
