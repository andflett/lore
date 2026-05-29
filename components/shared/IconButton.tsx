"use client";

import { Btn } from "./Btn";
import { GameIcon } from "./GameIcon";
import { Tooltip } from "./Tooltip";

interface Props {
  icon: string;
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
  onClick,
  variant = "metal",
  size = "md",
  iconSize,
  label,
  tooltipSide = "bottom",
  tooltipAlign = "center",
  disabled,
}: Props) {
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
        <GameIcon name={icon} size={iconSize ?? ICON_SIZE[size]} />
      </Btn>
    </Tooltip>
  );
}
