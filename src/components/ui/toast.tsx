import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

// ═══════════════════════════════════════════════════════════
// VIEWPORT - Position en bas au centre, style Apple
// ═══════════════════════════════════════════════════════════
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Position en bas au centre
      "fixed bottom-0 left-1/2 -translate-x-1/2 z-[100]",
      "flex flex-col-reverse items-center gap-3",
      "p-4 pb-[max(16px,env(safe-area-inset-bottom))]",
      "w-full max-w-[400px]",
      "outline-none",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// ═══════════════════════════════════════════════════════════
// TOAST VARIANTS - Design premium glassmorphism
// ═══════════════════════════════════════════════════════════
const toastVariants = cva(
  cn(
    // Base styles
    "group pointer-events-auto relative flex w-full items-start gap-3",
    "overflow-hidden p-4 pr-10",
    // Glassmorphism premium
    "backdrop-blur-2xl",
    "rounded-2xl",
    "border",
    // Shadow premium
    "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
    // Animations
    "transition-all duration-300 ease-out",
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=move]:transition-none",
    // Custom animations
    "data-[state=open]:animate-toast-enter",
    "data-[state=closed]:animate-toast-exit"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-white/95 border-gray-200/60",
          "text-gray-900"
        ),
        success: cn(
          "bg-emerald-50/95 border-emerald-200/60",
          "text-emerald-900",
          "shadow-[0_8px_32px_-8px_rgba(16,185,129,0.15)]"
        ),
        destructive: cn(
          "bg-red-50/95 border-red-200/60",
          "text-red-900",
          "shadow-[0_8px_32px_-8px_rgba(239,68,68,0.15)]"
        ),
        warning: cn(
          "bg-amber-50/95 border-amber-200/60",
          "text-amber-900",
          "shadow-[0_8px_32px_-8px_rgba(245,158,11,0.15)]"
        ),
        info: cn(
          "bg-blue-50/95 border-blue-200/60",
          "text-blue-900",
          "shadow-[0_8px_32px_-8px_rgba(59,130,246,0.15)]"
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// ═══════════════════════════════════════════════════════════
// TOAST ROOT - Avec icône automatique
// ═══════════════════════════════════════════════════════════
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  // Icône selon le variant
  const Icon = React.useMemo(() => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={2} />;
      case 'destructive':
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" strokeWidth={2} />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" strokeWidth={2} />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" strokeWidth={2} />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={2} />;
    }
  }, [variant]);

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* Icône */}
      <div className="mt-0.5">
        {Icon}
      </div>
      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

// ═══════════════════════════════════════════════════════════
// TOAST ACTION
// ═══════════════════════════════════════════════════════════
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center",
      "rounded-xl px-3",
      "bg-gray-900 text-white text-[13px] font-medium",
      "hover:bg-black active:scale-95",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

// ═══════════════════════════════════════════════════════════
// TOAST CLOSE - Bouton fermer élégant
// ═══════════════════════════════════════════════════════════
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3",
      "w-6 h-6 rounded-full",
      "flex items-center justify-center",
      "bg-black/5 hover:bg-black/10",
      "text-gray-400 hover:text-gray-600",
      "transition-all duration-200",
      "opacity-60 hover:opacity-100",
      "active:scale-90",
      "focus:outline-none focus:ring-2 focus:ring-gray-400",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

// ═══════════════════════════════════════════════════════════
// TOAST TITLE
// ═══════════════════════════════════════════════════════════
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-[14px] font-semibold leading-tight tracking-[-0.01em]",
      className
    )}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

// ═══════════════════════════════════════════════════════════
// TOAST DESCRIPTION
// ═══════════════════════════════════════════════════════════
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-[13px] leading-snug opacity-80 mt-0.5",
      className
    )}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
