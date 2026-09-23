import { Building, CalendarDays, ClipboardCheck, ShoppingCart } from "lucide-react"
import type { ReactNode } from "react"

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

const highlights = [
  { icon: ClipboardCheck, label: "Ocorrências e manutenções no mesmo lugar" },
  { icon: ShoppingCart, label: "Compras com cotação e aprovação" },
  { icon: CalendarDays, label: "Prazos do condomínio em uma agenda" },
]

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f1b14] p-10 text-white lg:flex lg:w-[46%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.22),transparent_58%)]"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600">
            <Building className="size-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight" translate="no">
            SíndiOps
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance xl:text-5xl">
            A rotina do condomínio, em um só lugar
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-4 text-emerald-200" aria-hidden="true" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/65">
          Feito para síndicos e para a equipe do prédio.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border shadow-[0_1px_2px_hsl(150_20%_10%/0.04)] sm:p-8">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600">
              <Building className="size-4 text-white" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight" translate="no">
              SíndiOps
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
