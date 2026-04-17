import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
    "font-sans font-medium text-[13px] leading-none",
    "rounded-full",
    "transition-[transform,background,color,box-shadow,border-color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-iris/20",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — white on dark (matches "All campaigns" pill in reference)
        default:
          "bg-white text-[#16181d] border border-white hover:bg-white/90 shadow-[0_6px_16px_-6px_rgba(255,255,255,0.18)]",
        iris:
          "bg-iris text-white border border-iris hover:bg-iris-deep shadow-[0_6px_16px_-6px_rgba(155,140,255,0.55)]",
        coral:
          "bg-iris text-white border border-iris hover:bg-iris-deep shadow-[0_6px_16px_-6px_rgba(155,140,255,0.55)] hover:-translate-y-0.5",
        outline:
          "bg-transparent text-text border border-line-strong hover:bg-surface-sunk hover:border-white/25",
        ghost:
          "bg-transparent text-text-soft hover:text-text hover:bg-white/6 border border-transparent",
        soft:
          "bg-iris-soft text-iris border border-transparent hover:bg-iris/22",
        link:
          "text-iris hover:text-[#b5a9ff] underline underline-offset-4 decoration-[1.5px] border-0 p-0 h-auto rounded-none",
        destructive:
          "bg-down/12 text-down border border-down/30 hover:bg-down hover:text-white hover:border-down",
        secondary:
          "bg-surface-sunk text-text border border-line hover:bg-surface-soft hover:border-line-strong",
        dark:
          "bg-[#0d0f13] text-white border border-white/10 hover:bg-[#17191f]",
      },
      size: {
        default: "h-10 px-5",
        sm:      "h-8  px-3.5 text-[12px]",
        lg:      "h-12 px-6   text-[14px]",
        icon:    "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
