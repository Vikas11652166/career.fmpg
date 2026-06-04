import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow",
    secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
    outline: "text-foreground border-border",
    success: "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    warning: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    info: "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`

  return (
    <div className={combinedClassName} {...props} />
  )
}

export { Badge }
