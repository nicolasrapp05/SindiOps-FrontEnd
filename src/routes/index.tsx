import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthGuard from "./AuthGuard"
import RoleGuard from "./RoleGuard"
import AppLayout from "@/components/shared/AppLayout"
import { CARGO_GROUPS } from "@/lib/cargo-permissions"

import LoginPage from "@/pages/LoginPage"
import CadastroPage from "@/pages/CadastroPage"
import EsqueciSenhaPage from "@/pages/EsqueciSenhaPage"
import RedefinirSenhaPage from "@/pages/RedefinirSenhaPage"
import PrimeiroAcessoPage from "@/pages/PrimeiroAcessoPage"
import DashboardPage from "@/pages/DashboardPage"
import CondominiosPage from "@/pages/CondominiosPage"
import MoradoresPage from "@/pages/MoradoresPage"
import FornecedoresPage from "@/pages/FornecedoresPage"
import ContratosPage from "@/pages/ContratosPage"
import OcorrenciasPage from "@/pages/OcorrenciasPage"
import OcorrenciaDetalhePage from "@/pages/OcorrenciaDetalhePage"
import ManutencoesPage from "@/pages/ManutencoesPage"
import ManutencoesObrigatoriasPage from "@/pages/ManutencoesObrigatoriasPage"
import ComprasPage from "@/pages/ComprasPage"
import CotacoesPage from "@/pages/CotacoesPage"
import TemplatesPage from "@/pages/TemplatesPage"
import HistoricoEnviosPage from "@/pages/HistoricoEnviosPage"
import RelatoriosPage from "@/pages/RelatoriosPage"
import EquipePage from "@/pages/EquipePage"
import PerfilPage from "@/pages/PerfilPage"
import NotFoundPage from "@/pages/NotFoundPage"

const ALL_ROLES = CARGO_GROUPS.ALL
const EXCEPT_PORTEIRO = CARGO_GROUPS.EXCEPT_PORTEIRO
const SINDICO_ONLY = CARGO_GROUPS.SINDICO_ONLY

export const router = createBrowserRouter([
  /* ─── Rotas públicas ─── */
  { path: "/login", element: <LoginPage /> },
  { path: "/cadastro", element: <CadastroPage /> },
  { path: "/esqueci-senha", element: <EsqueciSenhaPage /> },
  { path: "/redefinir-senha", element: <RedefinirSenhaPage /> },
  { path: "/primeiro-acesso", element: <PrimeiroAcessoPage /> },

  /* ─── Rotas protegidas ─── */
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },

          /* Dashboard — todos os cargos */
          {
            element: <RoleGuard allowedRoles={[...ALL_ROLES]} />,
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "configuracoes/perfil", element: <PerfilPage /> },
            ],
          },

          /* Ocorrências — todos os cargos (porteiro incluso) */
          {
            element: <RoleGuard allowedRoles={[...ALL_ROLES]} />,
            children: [
              { path: "ocorrencias", element: <OcorrenciasPage /> },
              { path: "ocorrencias/:id", element: <OcorrenciaDetalhePage /> },
            ],
          },

          /* Manutenções — zelador, secretário, síndico */
          {
            element: <RoleGuard allowedRoles={[...EXCEPT_PORTEIRO]} />,
            children: [
              { path: "manutencoes", element: <ManutencoesPage /> },
              {
                path: "manutencoes-obrigatorias",
                element: <ManutencoesObrigatoriasPage />,
              },
            ],
          },

          /* Cadastros, Compras, Comunicação, Relatórios — secretário + síndico */
          {
            element: (
              <RoleGuard allowedRoles={[...CARGO_GROUPS.ADMIN]} />
            ),
            children: [
              { path: "condominios", element: <CondominiosPage /> },
              { path: "moradores", element: <MoradoresPage /> },
              { path: "fornecedores", element: <FornecedoresPage /> },
              { path: "contratos", element: <ContratosPage /> },
              { path: "compras", element: <ComprasPage /> },
              { path: "compras/cotacoes", element: <CotacoesPage /> },
              { path: "comunicacao/templates", element: <TemplatesPage /> },
              {
                path: "comunicacao/historico",
                element: <HistoricoEnviosPage />,
              },
              { path: "relatorios", element: <RelatoriosPage /> },
            ],
          },

          /* Equipe — somente síndico */
          {
            element: <RoleGuard allowedRoles={[...SINDICO_ONLY]} />,
            children: [
              { path: "configuracoes/equipe", element: <EquipePage /> },
            ],
          },

          /* 404 — rotas autenticadas inexistentes (com sidebar) */
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },

  /* 404 — URLs públicas inexistentes (sem layout) */
  { path: "*", element: <NotFoundPage /> },
])
