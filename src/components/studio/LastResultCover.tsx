'use client'

import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { ImageGenerator } from './ImageGenerator'
import { makeDefaultDate } from './utils'
import type { StudioLastWeek } from '#/server/queries'

export function LastResultCover({ lastweek }: { lastweek: StudioLastWeek }) {
  const [date, setDate] = useState(makeDefaultDate(lastweek.sat.date, lastweek.sun.date))

  return (
    <CoverCard title="Résultats du week-end : première page">
      <div className="mb-3">
        <label className="text-sm font-medium">Date :</label>
        <Input value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
      </div>
      <ImageGenerator
        apiUrl="/gen/cover/lw/front"
        requestBody={{ date }}
        downloadFilename="resultats_du_weekend_1.png"
        generateButtonText="Générer la première page"
      />
    </CoverCard>
  )
}
