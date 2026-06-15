"use client"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, File, ImageIcon, Loader2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface FileUploadProps {
  folder: string
  accept?: string
  onUpload: (url: string, key: string) => void
  maxSizeMB?: number
  label?: string
  className?: string
  defaultValue?: string
}

export function FileUpload({
  folder,
  accept = "image/*",
  onUpload,
  maxSizeMB = 10,
  label = "Upload file",
  className,
  defaultValue,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(defaultValue ?? "")
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const maxSize = maxSizeMB * 1024 * 1024

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File exceeds ${maxSizeMB}MB limit`)
      return
    }
    if (!file.type.startsWith("image") && accept !== "application/pdf") {
      if (accept !== "*") return
    }

    setUploading(true)
    setProgress(30)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProgress(100)
      setPreview(data.url)
      onUpload(data.url, data.key)
      toast.success("Upload complete")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    }
    setUploading(false)
    setProgress(0)
  }, [folder, maxSize, maxSizeMB, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const clearPreview = () => {
    setPreview("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Uploading... {progress}%</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to browse (max {maxSizeMB}MB)
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
