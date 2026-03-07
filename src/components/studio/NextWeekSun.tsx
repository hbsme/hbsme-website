'use client'

import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { EditableList, useEditableList } from './EditableList'
import { ImageGenerator } from './ImageGenerator'
import { formatDate, extractTime } from './utils'
import type { StudioNextWeek } from '#/server/queries'

type MatchItem = { oponent: string; category: string; time: string }

export function NextWeekSun({ nextweek }: { nextweek: StudioNextWeek }) {
  const [date, setDate] = useState('dimanche ' + formatDate(nextweek.next_sun.date))

  const initialHome: MatchItem[] = nextweek.next_sun.home_matchs
    .map(m => ({ oponent: m.team2, category: m.competition + m.team1.replaceAll(/HBSME */g, ''), time: m.date.split('T')[1]?.substring(0, 5) ?? '' }))
    .sort((a, b) => a.time.localeCompare(b.time))

  const initialExt: MatchItem[] = nextweek.next_sun.ext_matchs
    .map(m => ({ oponent: m.team1, category: m.competition + m.team2.replaceAll(/HBSME */g, ''), time: extractTime(m.date) }))
    .sort((a, b) => a.time.localeCompare(b.time))

  const [listHome, setListHome] = useEditableList<MatchItem>(initialHome)
  const [listExt, setListExt] = useEditableList<MatchItem>(initialExt)

  return (
    <CoverCard title="Prochains matchs le dimanche">
      <div className="mb-3">
        <label className="text-sm font-medium">Date :</label>
        <Input value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
      </div>
      <h3 className="font-medium text-sm mt-4 mb-2">Matchs à domicile</h3>
      <EditableList
        initialItems={initialHome}
        fields={[
          { key: 'oponent', placeholder: 'Adversaire' },
          { key: 'category', placeholder: 'Catégorie' },
          { key: 'time', placeholder: 'Heure' },
        ]}
        onListChange={setListHome}
        addButtonText="Ajouter"
        emptyItem={{ oponent: '', category: '', time: '' }}
      />
      <h3 className="font-medium text-sm mt-4 mb-2">Matchs à l'extérieur</h3>
      <EditableList
        initialItems={initialExt}
        fields={[
          { key: 'oponent', placeholder: 'Adversaire' },
          { key: 'category', placeholder: 'Catégorie' },
          { key: 'time', placeholder: 'Heure' },
        ]}
        onListChange={setListExt}
        addButtonText="Ajouter"
        emptyItem={{ oponent: '', category: '', time: '' }}
      />
      <ImageGenerator
        apiUrl="/gen/cover/nw/sun"
        requestBody={{ date, list_home: listHome, list_ext: listExt }}
        downloadFilename={`prochains_matchs_${nextweek.next_sat.date}_4.png`}
        generateButtonText="Générer dimanche"
      />
    </CoverCard>
  )
}
