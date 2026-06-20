import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  FileText,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  ShoppingCart,
  BarChart2,
  Mail,
  Send,
  FileBarChart,
  UserCog,
  Settings,
} from "lucide-react"
import type { UserCargo } from "@/types"
import { CARGO_GROUPS } from "@/lib/cargo-permissions"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  allowedRoles: UserCargo[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: [...CARGO_GROUPS.ALL] },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Condomínios", href: "/condominios", icon: Building2, allowedRoles: [...CARGO_GROUPS.ADMIN] },
      { label: "Moradores", href: "/moradores", icon: Users, allowedRoles: [...CARGO_GROUPS.ADMIN] },
      { label: "Fornecedores", href: "/fornecedores", icon: Truck, allowedRoles: [...CARGO_GROUPS.ADMIN] },
      { label: "Contratos", href: "/contratos", icon: FileText, allowedRoles: [...CARGO_GROUPS.ADMIN] },
    ],
  },
  {
    title: "Operações",
    items: [
      { label: "Ocorrências", href: "/ocorrencias", icon: AlertTriangle, allowedRoles: [...CARGO_GROUPS.ALL] },
      { label: "Manutenções", href: "/manutencoes", icon: Wrench, allowedRoles: [...CARGO_GROUPS.EXCEPT_PORTEIRO] },
      {
        label: "Manutenções Obrigatórias",
        href: "/manutencoes-obrigatorias",
        icon: ClipboardCheck,
        allowedRoles: [...CARGO_GROUPS.EXCEPT_PORTEIRO],
      },
    ],
  },
  {
    title: "Compras",
    items: [
      { label: "Solicitações", href: "/compras", icon: ShoppingCart, allowedRoles: [...CARGO_GROUPS.ADMIN] },
      { label: "Cotações", href: "/compras/cotacoes", icon: BarChart2, allowedRoles: [...CARGO_GROUPS.ADMIN] },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { label: "Templates", href: "/comunicacao/templates", icon: Mail, allowedRoles: [...CARGO_GROUPS.ADMIN] },
      { label: "Histórico de Envios", href: "/comunicacao/historico", icon: Send, allowedRoles: [...CARGO_GROUPS.ADMIN] },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Relatórios", href: "/relatorios", icon: FileBarChart, allowedRoles: [...CARGO_GROUPS.ADMIN] },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Equipe", href: "/configuracoes/equipe", icon: UserCog, allowedRoles: [...CARGO_GROUPS.SINDICO_ONLY] },
      { label: "Perfil", href: "/configuracoes/perfil", icon: Settings, allowedRoles: [...CARGO_GROUPS.ALL] },
    ],
  },
]
