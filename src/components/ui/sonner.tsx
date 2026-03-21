import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      offset={20}
      gap={8}
      duration={3000}
      visibleToasts={3}
      expand={false}
      richColors={false}
      closeButton={true}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `
            group toast 
            bg-white/95 backdrop-blur-2xl 
            text-gray-900 
            border border-gray-200/60 
            shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] 
            rounded-2xl 
            px-4 py-3
            min-h-0
            max-w-[90vw] sm:max-w-[360px]
          `,
          title: "text-[14px] font-semibold text-gray-900 leading-tight",
          description: "text-[13px] text-gray-500 leading-snug mt-0.5",
          actionButton: "bg-gray-900 text-white hover:bg-black rounded-xl text-[13px] font-medium px-3 py-1.5",
          cancelButton: "bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-[13px] font-medium px-3 py-1.5",
          closeButton: `
            !bg-gray-100 hover:!bg-gray-200 
            !border-0 
            !text-gray-500 hover:!text-gray-700
            !rounded-full
            !w-6 !h-6
            !right-2 !top-2
            transition-all
          `,
          success: `
            !bg-emerald-50/95 backdrop-blur-2xl 
            !border-emerald-200/60 
            !shadow-[0_8px_30px_-10px_rgba(16,185,129,0.2)]
            [&>div>svg]:!text-emerald-500
          `,
          error: `
            !bg-red-50/95 backdrop-blur-2xl 
            !border-red-200/60 
            !shadow-[0_8px_30px_-10px_rgba(239,68,68,0.2)]
            [&>div>svg]:!text-red-500
          `,
          warning: `
            !bg-amber-50/95 backdrop-blur-2xl 
            !border-amber-200/60 
            !shadow-[0_8px_30px_-10px_rgba(245,158,11,0.2)]
            [&>div>svg]:!text-amber-500
          `,
          info: `
            !bg-blue-50/95 backdrop-blur-2xl 
            !border-blue-200/60 
            !shadow-[0_8px_30px_-10px_rgba(59,130,246,0.2)]
            [&>div>svg]:!text-blue-500
          `,
        },
        style: {
          // Safe area pour mobile
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
