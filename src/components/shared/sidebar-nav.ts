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

const ALL: UserCargo[] = ["sindico", "secretario", "zelador", "porteiro"]
const EXCEPT_PORTEIRO: UserCargo[] = ["sindico", "secretario", "zelador"]
const ADMIN: UserCargo[] = ["sindico", "secretario"]
const SINDICO_ONLY: UserCargo[] = ["sindico"]

export const navGroups: NavGroup[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ALL },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Condomínios", href: "/condominios", icon: Building2, allowedRoles: ADMIN },
      { label: "Moradores", href: "/moradores", icon: Users, allowedRoles: ADMIN },
      { label: "Fornecedores", href: "/fornecedores", icon: Truck, allowedRoles: ADMIN },
      { label: "Contratos", href: "/contratos", icon: FileText, allowedRoles: ADMIN },
    ],
  },
  {
    title: "Operações",
    items: [
      { label: "Ocorrências", href: "/ocorrencias", icon: AlertTriangle, allowedRoles: ALL },
      { label: "Manutenções", href: "/manutencoes", icon: Wrench, allowedRoles: EXCEPT_PORTEIRO },
      { label: "Manutenções Obrigatórias", href: "/manutencoes-obrigatorias", icon: ClipboardCheck, allowedRoles: EXCEPT_PORTEIRO },
    ],
  },
  {
    title: "Compras",
    items: [
      { label: "Solicitações", href: "/compras", icon: ShoppingCart, allowedRoles: ADMIN },
      { label: "Cotações", href: "/compras/cotacoes", icon: BarChart2, allowedRoles: ADMIN },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { label: "Templates", href: "/comunicacao/templates", icon: Mail, allowedRoles: ADMIN },
      { label: "Histórico de Envios", href: "/comunicacao/historico", icon: Send, allowedRoles: ADMIN },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Relatórios", href: "/relatorios", icon: FileBarChart, allowedRoles: ADMIN },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Equipe", href: "/configuracoes/equipe", icon: UserCog, allowedRoles: SINDICO_ONLY },
      { label: "Perfil", href: "/configuracoes/perfil", icon: Settings, allowedRoles: ALL },
    ],
  },
]
