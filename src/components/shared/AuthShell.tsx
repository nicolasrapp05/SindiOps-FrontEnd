import { Building } from "lucide-react"
import type { ReactNode } from "react"

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-col justify-between bg-[#0f1b14] p-10 text-white lg:flex lg:w-1/2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SíndiOps</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Gestão condominial inteligente
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Centralize tudo. Do portão ao relatório.
          </p>
        </div>

        <p className="text-sm text-white/40">
          Feito para síndicos que levam a{" "}
          <span className="font-semibold text-emerald-400">gestão a sério</span>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">SíndiOps</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
