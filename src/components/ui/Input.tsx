import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full bg-surface-sunk border border-line rounded-xl",
          "px-4 py-2 font-sans text-[14px] text-text placeholder:text-text-mute",
          "transition-[border-color,box-shadow,background] duration-200",
          "focus-visible:outline-none focus-visible:border-iris focus-visible:shadow-ring focus-visible:bg-surface-soft",
          "hover:border-line-strong",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
