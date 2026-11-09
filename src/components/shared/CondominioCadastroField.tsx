import { useEffect, useState } from "react"
import Combobox from "@/components/shared/Combobox"
import { Label } from "@/components/ui/label"

export interface CondominioOpcao {
  id: string
  nome: string
}

export function useCondominioCadastro(
  condominioId: string,
  opcoes: CondominioOpcao[] | undefined,
  aberto: boolean,
) {
  const escolher = !!opcoes
  const [escolhido, setEscolhido] = useState("")

  useEffect(() => {
    if (!aberto) return
    setEscolhido(escolher ? "" : condominioId)
  }, [aberto, escolher, condominioId])

  return {
    condominioId: escolher ? escolhido : condominioId,
    campo: escolher ? (
      <div className="space-y-1.5">
        <Label>
          Condomínio
          <span className="text-destructive ml-0.5 relative top-[2px]">*</span>
        </Label>
        <Combobox
          options={opcoes.map((opcao) => ({ value: opcao.id, label: opcao.nome }))}
          value={escolhido}
          onValueChange={setEscolhido}
          placeholder="Selecionar condomínio..."
          searchPlaceholder="Buscar condomínio..."
        />
      </div>
    ) : null,
  }
}
