import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, X, Loader2, Download, ZoomIn, AlertCircle, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { createPortal } from "react-dom"
import type { MidiaOcorrencia } from "../types/ocorrencia.types"

// Supabase storage sends Cross-Origin-Resource-Policy: same-origin, blocking
// <img> tags cross-origin. We fetch via JS (CORS) and serve via blob URL instead.
function useBlobUrl(remoteUrl: string): { src: string | null; error: boolean } {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!remoteUrl) return
    let objectUrl: string | null = null
    let cancelled = false

    fetch(remoteUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [remoteUrl])

  return { src, error }
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]
const MAX_SIZE = 50 * 1024 * 1024

interface UploadMidiaProps {
  midias: MidiaOcorrencia[]
  onUpload: (file: File, tipo: "image" | "video") => void
  onRemove: (midiaId: string) => void
  isUploading: boolean
}

interface LightboxState {
  url: string
  tipo: "image" | "video"
  index: number
}

function Lightbox({
  state,
  midias,
  onClose,
  onNavigate,
}: {
  state: LightboxState
  midias: MidiaOcorrencia[]
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const isImage = state.tipo === "image"
  const { src: blobSrc, error: blobError } = useBlobUrl(isImage ? state.url : "")
  const mediaSrc = isImage ? (blobSrc ?? "") : state.url

  const handleDownload = async () => {
    try {
      // Para imagens, blobSrc já foi baixado; para vídeos, fetch direto
      let objectUrl: string
      if (blobSrc) {
        objectUrl = blobSrc
      } else {
        const res = await fetch(state.url)
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
      }
      const ext = state.tipo === "video" ? "mp4" : "jpg"
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `midia-${state.index + 1}.${ext}`
      a.click()
      if (!blobSrc) URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error("Erro ao baixar o arquivo")
    }
  }

  const canPrev = state.index > 0
  const canNext = state.index < midias.length - 1

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && canPrev) onNavigate(state.index - 1)
      if (e.key === "ArrowRight" && canNext) onNavigate(state.index + 1)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [state.index, canPrev, canNext, onClose, onNavigate])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-white/60 select-none">
          {state.index + 1} / {midias.length}
        </span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
        >
          <Download className="h-4 w-4" /> Download
        </button>
        <button
          onClick={onClose}
          className="rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Prev / Next */}
      {canPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onNavigate(state.index - 1) }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {canNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); onNavigate(state.index + 1) }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {state.tipo === "image" ? (
          !blobSrc && !blobError ? (
            <div className="flex h-64 w-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : blobError ? (
            <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 text-white/60">
              <AlertCircle className="h-8 w-8" />
              <span className="text-sm">Erro ao carregar imagem</span>
            </div>
          ) : (
            <img
              src={mediaSrc}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
          )
        ) : (
          <video
            src={state.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

function Thumbnail({
  midia,
  index,
  onOpen,
  onRemove,
}: {
  midia: MidiaOcorrencia
  index: number
  onOpen: (index: number) => void
  onRemove: (id: string) => void
}) {
  const isImage = midia.tipoArquivo === "image"
  const { src, error } = useBlobUrl(isImage ? midia.signedUrl : "")

  return (
    <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
      {isImage ? (
        <>
          {!src && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <AlertCircle className="h-5 w-5 text-red-300" />
              <span className="text-[10px] text-red-400">Erro</span>
            </div>
          )}
          {src && (
            <img
              src={src}
              alt={`Mídia ${index + 1}`}
              className="h-full w-full object-cover"
            />
          )}
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100">
          <Play className="h-6 w-6 text-gray-400" />
          <span className="text-[10px] text-gray-400">Vídeo</span>
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-all group-hover:bg-black/40"
        onClick={() => onOpen(index)}
      >
        <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Remove button */}
      <button
        className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 p-0.5 text-white transition hover:bg-red-600 group-hover:block"
        onClick={(e) => { e.stopPropagation(); onRemove(midia.id) }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export default function UploadMidia({ midias, onUpload, onRemove, isUploading }: UploadMidiaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

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

  const openLightbox = (index: number) => {
    const m = midias[index]
    setLightbox({ url: m.signedUrl, tipo: m.tipoArquivo, index })
  }

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      {midias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {midias.map((m, i) => (
            <Thumbnail
              key={m.id}
              midia={m}
              index={i}
              onOpen={openLightbox}
              onRemove={onRemove}
            />
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

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          state={lightbox}
          midias={midias}
          onClose={() => setLightbox(null)}
          onNavigate={openLightbox}
        />
      )}
    </div>
  )
}
