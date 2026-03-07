'use client'

import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { CoverCard } from './CoverCard'
import { EditableList } from './EditableList'
import { ImageGenerator } from './ImageGenerator'
import { makeDefaultDate } from './utils'
import type { StudioLastWeek } from '#/server/queries'

const CLUB = "HANDBALL SAINT MEDARD D'EYRANS"

function normalizeComp(name: string): string {
  name = name.replace('GIRONDE_U18 FEMININES', '18F').replace('GIRONDE_U18 FEMININE', '18F')
  name = name.replace('GIRONDE_U15 FEMININES', '15F').replace('GIRONDE_U15 FEMININE', '15F')
  name = name.replace('GIRONDE_U13 FEMININES', '13F').replace('GIRONDE_U13 FEMININE', '13F')
  name = name.replace('GIRONDE_U11 FEMININES', '11F').replace('GIRONDE_U11 FEMININE', '11F')
  name = name.replaceAll('GIRONDE_U18 MASCULINS', '18G').replaceAll('GIRONDE_U18 MASCULIN', '18G')
  name = name.replaceAll('GIRONDE_U15 MASCULINS', '15G').replaceAll('GIRONDE_U15 MASCULIN', '15G')
  name = name.replaceAll('GIRONDE_U13 MASCULINS', '13G').replaceAll('GIRONDE_U13 MASCULIN', '13G')
  name = name.replace('GIRONDE_U11 MASCULINS', '11G').replace('GIRONDE_U11 MASCULIN', '11G')
  name = name.replaceAll(/.*GIRONDE_\+16 MASCULIN.*/ig, 'SG')
  name = name.replaceAll(/.*GIRONDE_\+16 FEMININ.*/ig, 'SF')
  return name.split(' ').map(w => w.length > 3 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ')
}

type MatchItem = { competition: string; opponent: string; score1: string; score2: string }

export function LastResultHome({ lastweek }: { lastweek: StudioLastWeek }) {
  const strDate = makeDefaultDate(lastweek.sat.date, lastweek.sun.date)
  const [date, setDate] = useState(strDate)

  const initial: MatchItem[] = lastweek.sat.matches
    .concat(lastweek.sun.matches)
    .filter(m => m.team1.startsWith('HBSME'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      competition: normalizeComp(m.competition),
      opponent: m.team2,
      score1: m.score1 ?? '',
      score2: m.score2 ?? '',
    }))

  const [matches, setMatches] = useState<MatchItem[]>(initial)

  return (
    <CoverCard title="Résultats du week-end : matchs à domicile">
      <div className="mb-3">
        <label className="text-sm font-medium">Date :</label>
        <Input value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
      </div>
      <EditableList
        initialItems={initial}
        fields={[
          { key: 'competition', placeholder: 'Compétition' },
          { key: 'opponent', placeholder: 'Adversaire' },
          { key: 'score1', placeholder: 'Score nous' },
          { key: 'score2', placeholder: 'Score eux' },
        ]}
        onListChange={items => setMatches(items)}
        emptyItem={{ competition: '', opponent: '', score1: '', score2: '' }}
      />
      <ImageGenerator
        apiUrl="/gen/cover/lw/home"
        requestBody={{ date, matches: matches.filter(m => m.score1 !== '' && m.score2 !== '') }}
        downloadFilename={`resultats_matchs_${strDate}_2.png`}
        generateButtonText="Générer matchs domicile"
      />
    </CoverCard>
  )
}
