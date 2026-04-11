import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — fixed, always visible ≥1280px */}
      <aside className="hidden xl:flex" data-sidebar>
        <Sidebar />
      </aside>

      {/* Mobile/tablet sheet sidebar — <1280px */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="data-[side=left]:w-60 data-[side=left]:max-w-60 border-none p-0"
          data-sidebar
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <Sidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — visible only on <1280px for hamburger trigger */}
        <header className="flex h-14 items-center border-b border-white/10 bg-[#0f1b14] px-4 text-white xl:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSheetOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <span className="ml-3 text-sm font-semibold tracking-tight text-white">
            SíndiCore
          </span>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f5f5f7] p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
