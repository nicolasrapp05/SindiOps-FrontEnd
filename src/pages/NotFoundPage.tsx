import { Link } from "react-router-dom"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold tracking-tight text-gray-200">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Button asChild className="mt-8">
        <Link to="/dashboard">
          <Home className="mr-2 h-4 w-4" />
          Voltar ao início
        </Link>
      </Button>
    </div>
  )
}
