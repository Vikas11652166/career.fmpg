import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Core styling variants mapped to FMPG colors
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer"
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:scale-[1.01] hover:shadow-lg active:scale-95",
      destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 active:scale-95",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:scale-[1.01] active:scale-95",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-11 px-6 py-2.5",
      sm: "h-9 rounded-xl px-4 text-xs",
      lg: "h-12 rounded-3xl px-8 text-base",
      icon: "h-10 w-10 rounded-full",
    }

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <Comp
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
