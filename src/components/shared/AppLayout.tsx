import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCondominioScopeStore } from "@/store/condominio-scope-store"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { pathname } = useLocation()
  const condoNome = useCondominioScopeStore((s) => s.selectedCondominioNome)

  useEffect(() => {
    document.getElementById("conteudo")?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
      >
        Ir para o conteúdo
      </a>

      <aside className="hidden xl:flex" data-sidebar>
        <Sidebar />
      </aside>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="overscroll-contain border-none p-0 data-[side=left]:w-64 data-[side=left]:max-w-64"
          data-sidebar
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Sidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-14 items-center gap-2 border-b border-white/10 bg-[#0f1b14] px-3 pt-[env(safe-area-inset-top)] text-white xl:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            aria-label="Abrir menu"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight" translate="no">
              SíndiOps
            </p>
            {condoNome ? (
              <p className="truncate text-xs text-white/75">{condoNome}</p>
            ) : (
              <p className="text-xs text-white/60">Selecione um condomínio</p>
            )}
          </div>
        </header>

        <main
          id="conteudo"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-canvas px-4 py-6 outline-none md:px-8 md:py-8"
        >
          <div key={pathname} className="rise-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
