import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const premiumButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
        outline:
          "border-2 border-purple-400/50 bg-white/80 backdrop-blur-sm hover:bg-purple-50 hover:border-purple-500 hover:scale-105 active:scale-95",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 shadow hover:shadow-lg hover:scale-105 active:scale-95",
        ghost: "hover:bg-purple-100/50 hover:text-purple-700 hover:scale-105 active:scale-95",
        link: "text-purple-600 underline-offset-4 hover:underline hover:text-purple-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
PremiumButton.displayName = "PremiumButton"

export { PremiumButton, premiumButtonVariants }
