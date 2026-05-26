import { MapPin, Globe, AtSign, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useFornecedor } from "../hooks/useFornecedores"

interface FornecedorExpandidoProps {
  fornecedorId: string
}

export default function FornecedorExpandido({ fornecedorId }: FornecedorExpandidoProps) {
  const { data: fornecedor, isLoading } = useFornecedor(fornecedorId)

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!fornecedor) return null

  const initials = fornecedor.nome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const endereco = [
    fornecedor.enderecoRua,
    fornecedor.enderecoNumero ? `, ${fornecedor.enderecoNumero}` : "",
    fornecedor.enderecoBairro ? ` - ${fornecedor.enderecoBairro}` : "",
    fornecedor.enderecoCidade ? `\n${fornecedor.enderecoCidade}` : "",
    fornecedor.enderecoCep ? ` - CEP ${fornecedor.enderecoCep}` : "",
  ]
    .join("")
    .trim()

  return (
    <div className="grid gap-6 border-t bg-gray-50/50 p-5 md:grid-cols-2">
      {/* Left: Contact info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{fornecedor.nome}</p>
            {fornecedor.nomeContato && (
              <p className="text-sm text-gray-500">Contato: {fornecedor.nomeContato}</p>
            )}
          </div>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Informações de Contato
        </h4>

        {endereco && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span className="whitespace-pre-line">{endereco}</span>
          </div>
        )}

        {fornecedor.website && (
          <a
            href={fornecedor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-emerald-700 hover:underline"
          >
            <Globe className="h-4 w-4" />
            {fornecedor.website.replace(/^https?:\/\//, "")}
          </a>
        )}

        {fornecedor.instagram && (
          <a
            href={`https://instagram.com/${fornecedor.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <AtSign className="h-4 w-4" />
            {fornecedor.instagram}
          </a>
        )}
      </div>

      {/* Right: Services & contracts */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Contratos & Atividades
        </h4>

        {(fornecedor.servicos ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum serviço cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {(fornecedor.servicos ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {s.descricao || s.tipo}
                      {s.quantidade ? ` (Qtd: ${s.quantidade})` : ""}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">Vigente</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
