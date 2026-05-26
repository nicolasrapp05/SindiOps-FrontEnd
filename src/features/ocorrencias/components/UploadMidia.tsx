import { useCallback, useRef, useState } from "react"
import { Upload, X, Video, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { MidiaOcorrencia } from "../types/ocorrencia.types"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]
const MAX_SIZE = 50 * 1024 * 1024

interface UploadMidiaProps {
  midias: MidiaOcorrencia[]
  onUpload: (file: File, tipo: "image" | "video") => void
  onRemove: (midiaId: string) => void
  isUploading: boolean
}

export default function UploadMidia({ midias, onUpload, onRemove, isUploading }: UploadMidiaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const file = files[0]
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Formato não suportado. Use JPEG, PNG, WebP, MP4 ou MOV.")
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error("Arquivo excede o limite de 50MB.")
        return
      }
      const tipo = file.type.startsWith("video") ? "video" : "image"
      onUpload(file, tipo)
    },
    [onUpload],
  )

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {midias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {midias.map((m) => (
            <div key={m.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
              {m.tipoArquivo === "image" ? (
                <img src={m.signedUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Video className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <button
                className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:block"
                onClick={() => onRemove(m.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition ${
          dragOver ? "border-emerald-400 bg-emerald-50/30" : "border-gray-200 hover:border-gray-300"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        ) : (
          <Upload className="h-6 w-6 text-gray-400" />
        )}
        <p className="text-sm text-gray-500">
          {isUploading ? "Enviando..." : "Arraste ou clique para adicionar mídia"}
        </p>
        <p className="text-xs text-gray-400">JPEG, PNG, WebP, MP4, MOV · Máx 50MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
