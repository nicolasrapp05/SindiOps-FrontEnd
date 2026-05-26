import { useEffect } from "react"
import { Link, NavLink } from "react-router-dom"
import { ChevronDown, LogOut, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useAuth } from "@/hooks/useAuth"
import { useCondominios } from "@/features/condominios/hooks/useCondominios"
import { navGroups } from "./sidebar-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const cargo = user?.cargo

  const selectedCondominioId = useCondominioScopeStore(
    (s) => s.selectedCondominioId,
  )
  const selectedCondominioNome = useCondominioScopeStore(
    (s) => s.selectedCondominioNome,
  )
  const setSelectedCondominio = useCondominioScopeStore(
    (s) => s.setSelectedCondominio,
  )
  const reconcileWithCondominiosList = useCondominioScopeStore(
    (s) => s.reconcileWithCondominiosList,
  )

  const {
    data: condominios,
    isLoading: condominiosLoading,
    isError: condominiosError,
    isSuccess: condominiosSuccess,
    status: condominiosStatus,
  } = useCondominios()

  useEffect(() => {
    reconcileWithCondominiosList(condominios, condominiosStatus)
  }, [
    condominios,
    condominiosStatus,
    reconcileWithCondominiosList,
  ])

  const initials = user?.nome
    ? user.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SC"

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => cargo && item.allowedRoles.includes(cargo),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full w-60 flex-col bg-[#0f1b14]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
          <Building className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          SíndiCore
        </span>
      </div>

      {/* Condo selector */}
      <div className="px-3 pb-4">
        {condominiosLoading ? (
          <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Skeleton className="h-4 w-4 shrink-0 rounded bg-white/10" />
            <Skeleton className="h-4 flex-1 rounded bg-white/10" />
            <Skeleton className="h-4 w-4 shrink-0 rounded bg-white/10" />
          </div>
        ) : condominiosError ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-amber-200/90">
            Não foi possível carregar os condomínios.
          </div>
        ) : condominiosSuccess && (!condominios || condominios.length === 0) ? (
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            <p>Nenhum condomínio cadastrado.</p>
            <Link
              to="/condominios"
              onClick={onNavigate}
              className="font-medium text-emerald-400 underline-offset-2 hover:underline"
            >
              Cadastrar condomínio
            </Link>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/80 outline-none transition hover:bg-white/10",
                "focus-visible:ring-2 focus-visible:ring-emerald-500/60 data-[state=open]:bg-white/10",
              )}
            >
              <Building className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="flex-1 truncate">
                {selectedCondominioNome ||
                  selectedCondominioId ||
                  "Selecionar condomínio"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[var(--radix-dropdown-menu-trigger-width)] border border-white/10 bg-[#1a2e22] text-white shadow-lg"
            >
              {condominios?.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  className={cn(
                    "cursor-pointer focus:bg-white/10 focus:text-white",
                    selectedCondominioId === c.id && "bg-white/5",
                  )}
                  onSelect={() => setSelectedCondominio(c.id, c.nome)}
                >
                  <span className="truncate">{c.nome}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/10 focus:text-white"
                asChild
              >
                <Link to="/condominios" onClick={onNavigate}>
                  Gerenciar condomínios…
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-l-2 border-emerald-400 bg-white/10 text-white"
                          : "border-l-2 border-transparent text-white/60 hover:bg-white/5 hover:text-white/90",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-white/10" />

      {/* User footer */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="h-9 w-9 border border-white/20">
          <AvatarFallback className="bg-emerald-700 text-xs text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-white">
            {user?.nome || "Usuário"}
          </p>
          <p className="truncate text-xs capitalize text-white/50">
            {cargo || "—"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
