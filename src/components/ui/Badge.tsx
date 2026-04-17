import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 px-2.5 py-1",
    "font-sans text-[11px] font-medium",
    "rounded-full border",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        default:   "bg-iris text-white border-iris",
        coral:     "bg-iris text-white border-iris",
        soft:      "bg-iris-soft text-iris-deep border-transparent",
        outline:   "bg-white text-text border-line",
        ghost:     "bg-surface-sunk text-text-soft border-transparent",
        success:   "bg-[#e7f7ee] text-[#0f7a3d] border-transparent",
        warning:   "bg-[#fff4de] text-[#8a5a00] border-transparent",
        danger:    "bg-[#ffe5e8] text-[#a8232d] border-transparent",
        /* legacy */
        secondary: "bg-surface-sunk text-text border-line",
        lilac:     "bg-iris-soft text-iris-deep border-transparent",
        salmon:    "bg-[#ffe4d4] text-[#a8491a] border-transparent",
        mint:      "bg-[#dff5ec] text-[#0a6a4a] border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
