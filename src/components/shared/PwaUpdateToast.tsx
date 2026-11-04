import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useRegisterSW } from "virtual:pwa-register/react"

export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const shown = useRef(false)

  useEffect(() => {
    if (!needRefresh || shown.current) return
    shown.current = true
    toast("Há uma versão nova do SíndiOps", {
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: "Atualizar",
        onClick: () => {
          void updateServiceWorker(true)
        },
      },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
