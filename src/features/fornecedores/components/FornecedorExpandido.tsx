import { MapPin, Globe, AtSign, Wrench, FileText, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useFornecedor } from "../hooks/useFornecedores"
import { useContratosPorFornecedor } from "@/features/contratos/hooks/useContratos"
import ContratoStatusBadge from "@/features/contratos/components/ContratoStatusBadge"
import { TIPO_SERVICO_LABEL } from "@/features/contratos/types/contrato.types"

interface FornecedorExpandidoProps {
  fornecedorId: string
}

export default function FornecedorExpandido({ fornecedorId }: FornecedorExpandidoProps) {
  const { data: fornecedor, isLoading: loadingFornecedor } = useFornecedor(fornecedorId)
  const { data: contratosData, isLoading: loadingContratos } = useContratosPorFornecedor(fornecedorId)

  const isLoading = loadingFornecedor || loadingContratos

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

  const contratos = contratosData?.data ?? []
  const servicos = fornecedor.servicos ?? []

  return (
    <div className="grid gap-6 border-t bg-gray-50/50 p-5 md:grid-cols-2">
      {/* Esquerda: informações de contato */}
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

      {/* Direita: contratos e serviços */}
      <div className="space-y-5">
        {/* Contratos */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Contratos
          </h4>

          {contratos.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum contrato cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {contratos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {TIPO_SERVICO_LABEL[c.tipoServico] ?? c.tipoServico}
                      </p>
                      {c.dataFim && (
                        <p className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          até{" "}
                          {new Date(c.dataFim).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <ContratoStatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Serviços */}
        {servicos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Serviços Registrados
            </h4>
            <div className="space-y-2">
              {servicos.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border bg-white p-3"
                >
                  <Wrench className="h-4 w-4 shrink-0 text-gray-400" />
                  <p className="text-sm text-gray-700">
                    {s.descricao || s.tipo}
                    {s.quantidade ? ` (Qtd: ${s.quantidade})` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
