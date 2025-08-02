import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      position="top-right"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast backdrop-blur-md rounded-xl border group-[.toaster]:shadow-xl group-[.toaster]:bg-white/80 dark:group-[.toaster]:bg-zinc-900/80 group-[.toaster]:border-zinc-200 dark:group-[.toaster]:border-zinc-700 group-[.toaster]:text-foreground",
          title: "text-sm font-semibold",
          description: "group-[.toast]:text-xs text-muted-foreground leading-snug",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
