'use client'

import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { ImageGenerator } from './ImageGenerator'
import { makeDefaultDate } from './utils'
import type { StudioNextWeek } from '#/server/queries'

export function NextWeekCover({ nextweek, photos }: { nextweek: StudioNextWeek; photos: string[] }) {
  const [images, setImages] = useState<{ img1: string; img2: string } | null>(null)
  const [date, setDate] = useState(makeDefaultDate(nextweek.next_sat.date, nextweek.next_sun.date))

  useEffect(() => {
    if (photos.length >= 2) {
      let img1 = photos[Math.floor(Math.random() * photos.length)]
      let img2 = photos[Math.floor(Math.random() * photos.length)]
      while (img1 === img2 && photos.length > 1) img2 = photos[Math.floor(Math.random() * photos.length)]
      setImages({ img1, img2 })
    }
  }, [photos])

  function randomPhoto(exclude: string): string {
    const candidates = photos.filter(p => p !== exclude)
    return candidates[Math.floor(Math.random() * candidates.length)] ?? photos[0]
  }

  return (
    <CoverCard title="Prochains matchs : première page">
      <div className="mb-3">
        <label className="text-sm font-medium">Date :</label>
        <Input value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
      </div>
      {images ? (
        <div className="flex gap-4 mb-2">
          {(['img1', 'img2'] as const).map(key => (
            <div key={key} className="border rounded p-2 flex flex-col gap-2">
              <img src={`/photos-rs/${images[key]}`} alt={key} className="h-32 w-32 object-cover rounded" />
              <Button size="sm" variant="outline" className="cursor-pointer"
                onClick={() => setImages({ ...images, [key]: randomPhoto(images[key]) })}>
                Changer
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Chargement des photos...</p>
      )}
      <ImageGenerator
        apiUrl="/gen/cover/nw/front"
        requestBody={{ date, img1: images?.img1, img2: images?.img2 }}
        downloadFilename={`prochains_matchs_${nextweek.next_sat.date}_1.png`}
        generateButtonText="Générer couverture"
      />
    </CoverCard>
  )
}
