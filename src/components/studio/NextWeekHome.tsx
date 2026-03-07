'use client'

import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { EditableList, useEditableList } from './EditableList'
import { ImageGenerator } from './ImageGenerator'
import { formatDate, extractTime } from './utils'
import type { StudioNextWeek } from '#/server/queries'

type MatchItem = { oponent: string; category: string; time: string }

export function NextWeekHome({ nextweek }: { nextweek: StudioNextWeek }) {
  const [date, setDate] = useState(formatDate(nextweek.next_sat.date))

  const initial: MatchItem[] = nextweek.next_sat.home
    .map(m => ({ oponent: m.team2, category: m.competition + m.team1.replaceAll(/HBSME */g, ''), time: extractTime(m.date) }))
    .sort((a, b) => a.time.localeCompare(b.time))

  const [list, setList] = useEditableList<MatchItem>(initial)

  return (
    <CoverCard title="Prochains matchs à domicile">
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
        apiUrl="/gen/cover/nw/home"
        requestBody={{ date, list }}
        downloadFilename={`prochains_matchs_${nextweek.next_sat.date}_2.png`}
        generateButtonText="Générer matchs domicile"
      />
    </CoverCard>
  )
}
