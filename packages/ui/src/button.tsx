import { type ButtonHTMLAttributes, forwardRef } from "react"
import { clsx } from "clsx"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200":          variant === "default",
          "bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700":                        variant === "danger",
          "h-7 px-2 text-xs":    size === "sm",
          "h-9 px-4 text-sm":    size === "md",
          "h-11 px-6 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"
