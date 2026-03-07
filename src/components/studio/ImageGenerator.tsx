'use client'

import { useState } from 'react'
import { Button } from '#/components/ui/button'

interface ImageGeneratorProps {
  apiUrl: string
  requestBody: Record<string, unknown>
  downloadFilename: string
  generateButtonText?: string
  downloadButtonText?: string
  loadingText?: string
  aspectRatio?: string
}

export function ImageGenerator({
  apiUrl,
  requestBody,
  downloadFilename,
  generateButtonText = 'Générer',
  downloadButtonText = 'Télécharger',
  loadingText = 'Génération...',
  aspectRatio = '16 / 9',
}: ImageGeneratorProps) {
  const [imageSrc, setImageSrc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.arrayBuffer()
      setImageSrc(URL.createObjectURL(new Blob([data])))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!imageSrc) return
    const a = document.createElement('a')
    a.href = imageSrc
    a.download = downloadFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-md p-3">
      <div className="flex gap-2 mb-2">
        <Button onClick={generate} disabled={loading} className="cursor-pointer">
          {loading ? loadingText : generateButtonText}
        </Button>
        <Button variant="outline" onClick={download} disabled={!imageSrc}>
          {downloadButtonText}
        </Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Generated"
          style={{ width: '100%', height: 'auto', aspectRatio, objectFit: 'contain', backgroundColor: 'white' }}
        />
      )}
    </div>
  )
}
