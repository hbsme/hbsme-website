'use client'

import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { EditableList, useEditableList } from './EditableList'
import { ImageGenerator } from './ImageGenerator'
import { formatDate, extractTime } from './utils'
import type { StudioNextWeek } from '#/server/queries'

type MatchItem = { oponent: string; category: string; time: string }

export function NextWeekExt({ nextweek }: { nextweek: StudioNextWeek }) {
  const [date, setDate] = useState(formatDate(nextweek.next_sat.date))

  const initial: MatchItem[] = nextweek.next_sat.ext
    .map(m => ({ oponent: m.team1, category: m.competition + m.team2.replaceAll(/HBSME */g, ''), time: extractTime(m.date) }))
    .sort((a, b) => a.time.localeCompare(b.time))

  const [list, setList] = useEditableList<MatchItem>(initial)

  return (
    <CoverCard title="Prochains matchs à l'extérieur">
      <div className="mb-3">
        <label className="text-sm font-medium">Date :</label>
        <Input value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
      </div>
      <EditableList
        initialItems={initial}
        fields={[
          { key: 'oponent', placeholder: 'Adversaire' },
          { key: 'category', placeholder: 'Catégorie' },
          { key: 'time', placeholder: 'Heure' },
        ]}
        onListChange={setList}
        addButtonText="Ajouter un match"
        emptyItem={{ oponent: '', category: '', time: '' }}
      />
      <ImageGenerator
        apiUrl="/gen/cover/nw/ext"
        requestBody={{ date, list }}
        downloadFilename={`prochains_matchs_${nextweek.next_sat.date}_3.png`}
        generateButtonText="Générer matchs extérieur"
      />
    </CoverCard>
  )
}
