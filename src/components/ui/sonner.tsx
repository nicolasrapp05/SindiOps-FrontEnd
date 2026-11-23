import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useNarrowScreen } from "@/lib/use-narrow-screen"

const Toaster = ({ ...props }: ToasterProps) => {
  const narrow = useNarrowScreen()

  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          fontFamily: "inherit",
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 2500,
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
      position={narrow ? "bottom-center" : "bottom-right"}
      offset={24}
      mobileOffset={{
        top: 16,
        right: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        left: 16,
      }}
      containerAriaLabel="Notificações"
    />
  )
}

export { Toaster }
