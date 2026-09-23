import { useEffect } from "react"
import { Link, NavLink } from "react-router-dom"
import { ChevronDown, LogOut, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import { useAuth } from "@/hooks/useAuth"
import { useCondominios } from "@/features/condominios/hooks/useCondominios"
import { canAccessAdmin } from "@/lib/cargo-permissions"
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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-300"

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

  const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href))

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => cargo && item.allowedRoles.includes(cargo),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full w-64 flex-col bg-[#0f1b14]">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={cn(
          "mx-3 mt-4 flex items-center gap-2.5 rounded-xl px-2 py-2 transition-opacity duration-200 hover:opacity-80",
          focusRing,
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600">
          <Building className="size-4 text-white" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-white" translate="no">
          SíndiOps
        </span>
      </Link>

      <div className="px-3 pb-4 pt-4">
        <p className="mb-1.5 px-1 text-[11px] font-semibold tracking-wide text-white/70">
          Condomínio em uso
        </p>
        {condominiosLoading ? (
          <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <Skeleton className="size-4 shrink-0 rounded bg-white/10" />
            <Skeleton className="h-4 flex-1 rounded bg-white/10" />
          </div>
        ) : condominiosError ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-amber-100">
            Não foi possível carregar os condomínios.
          </div>
        ) : condominiosSuccess && (!condominios || condominios.length === 0) ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/80">
            <p>
              {canAccessAdmin(cargo)
                ? "Nenhum condomínio cadastrado."
                : "Nenhum condomínio liberado para seu acesso."}
            </p>
            {canAccessAdmin(cargo) && (
              <Link
                to="/condominios"
                onClick={onNavigate}
                className={cn(
                  "inline-flex font-medium text-emerald-300 underline-offset-2 hover:underline",
                  focusRing,
                  "rounded-sm",
                )}
              >
                Cadastrar condomínio
              </Link>
            )}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Trocar condomínio em uso"
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white outline-none transition-colors duration-200 hover:bg-white/10",
                "data-[state=open]:bg-white/10",
                focusRing,
              )}
            >
              <Building className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                {selectedCondominioNome ||
                  selectedCondominioId ||
                  "Selecionar condomínio"}
              </span>
              <ChevronDown className="size-4 shrink-0 text-white/70" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[var(--radix-dropdown-menu-trigger-width)] border border-white/10 bg-[#1a2e22] text-white shadow-lg"
            >
              {condominios?.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  className={cn(
                    "min-h-9 cursor-pointer focus:bg-white/10 focus:text-white",
                    selectedCondominioId === c.id && "bg-white/10",
                  )}
                  onSelect={() => setSelectedCondominio(c.id, c.nome)}
                >
                  <span className="truncate">{c.nome}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="min-h-9 cursor-pointer focus:bg-white/10 focus:text-white"
                asChild
              >
                <Link to="/condominios" onClick={onNavigate}>
                  Gerenciar condomínios
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator className="bg-white/10" />

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-4">
        {filteredGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-white/70">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={allHrefs.some(
                      (h) => h !== item.href && h.startsWith(item.href + "/"),
                    )}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
                        focusRing,
                        isActive
                          ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#6ee7b7]"
                          : "text-white/80 hover:bg-white/5 hover:text-white",
                      )
                    }
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-white/10" />

      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          to="/configuracoes/perfil"
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 transition-colors duration-200 hover:bg-white/5",
            focusRing,
          )}
        >
          <Avatar className="size-9 shrink-0 border border-white/20">
            <AvatarFallback className="bg-emerald-700 text-xs font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">
              {user?.nome || "Usuário"}
            </span>
            <span className="block truncate text-xs capitalize text-white/65">
              {cargo || "Sem cargo"}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={logout}
          aria-label="Sair"
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white",
            focusRing,
          )}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </div>
  )
}
