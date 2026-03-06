import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/entrainements')({
  component: EntrainementsPage,
})

const CLUB_LOGO = '/logo-hbsme.png'

// ─── données ──────────────────────────────────────────────────────────────────

type Slot = {
  jour: string
  lieu: 'St Medard' | 'Cadaujac' | 'La Brede'
  titre: string
  debut: string
  fin: string
}

const SLOTS: Slot[] = [
  { lieu: 'La Brede',   titre: '18G',       jour: 'lundi',    debut: '19h30', fin: '21h00' },
  { lieu: 'La Brede',   titre: 'Handfit',   jour: 'lundi',    debut: '21h00', fin: '22h15' },
  { lieu: 'St Medard',  titre: '13F',       jour: 'mardi',    debut: '18h00', fin: '19h30' },
  { lieu: 'St Medard',  titre: '15G',       jour: 'mardi',    debut: '19h30', fin: '21h00' },
  { lieu: 'St Medard',  titre: 'SG',        jour: 'mardi',    debut: '21h00', fin: '22h30' },
  { lieu: 'Cadaujac',   titre: '13G',       jour: 'mardi',    debut: '17h30', fin: '19h00' },
  { lieu: 'Cadaujac',   titre: '15F',       jour: 'mardi',    debut: '19h00', fin: '20h30' },
  { lieu: 'Cadaujac',   titre: '18F',       jour: 'mardi',    debut: '20h30', fin: '21h45' },
  { lieu: 'St Medard',  titre: '11G',       jour: 'mercredi', debut: '17h00', fin: '18h30' },
  { lieu: 'St Medard',  titre: '13G',       jour: 'mercredi', debut: '18h30', fin: '20h00' },
  { lieu: 'Cadaujac',   titre: 'SG',        jour: 'mercredi', debut: '21h00', fin: '22h30' },
  { lieu: 'La Brede',   titre: 'SF',        jour: 'mercredi', debut: '21h00', fin: '22h30' },
  { lieu: 'St Medard',  titre: '11 perf.',  jour: 'jeudi',    debut: '16h30', fin: '18h00' },
  { lieu: 'St Medard',  titre: '11F',       jour: 'vendredi', debut: '16h30', fin: '18h00' },
  { lieu: 'St Medard',  titre: '15G+15F',   jour: 'vendredi', debut: '18h00', fin: '19h30' },
  { lieu: 'St Medard',  titre: '18F+18G',   jour: 'vendredi', debut: '19h30', fin: '21h00' },
  { lieu: 'St Medard',  titre: 'Loisir/SF', jour: 'vendredi', debut: '21h00', fin: '22h30' },
  { lieu: 'Cadaujac',   titre: 'SF/Loisir', jour: 'vendredi', debut: '20h30', fin: '22h00' },
  { lieu: 'St Medard',  titre: 'U7',        jour: 'samedi',   debut: '10h15', fin: '11h15' },
  { lieu: 'St Medard',  titre: 'U9',        jour: 'samedi',   debut: '11h15', fin: '12h45' },
  { lieu: 'St Medard',  titre: 'Matchs',    jour: 'samedi',   debut: '13h00', fin: '22h00' },
]

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const LIEUX = ['St Medard', 'Cadaujac', 'La Brede'] as const

// ─── helpers ──────────────────────────────────────────────────────────────────

// 1px = 1min, origine à 9h30
const START_MIN = 9 * 60 + 30

function toMin(h: string) {
  const [hh, mm] = h.split('h').map(Number)
  return hh * 60 + mm
}

function slotStyle(debut: string, fin: string) {
  const top = toMin(debut) - START_MIN
  const height = toMin(fin) - toMin(debut) - 2
  return { top: `${top}px`, height: `${height}px` }
}

const LIEU_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'St Medard': { bg: 'bg-pink-50',   border: 'border-pink-200',  text: 'text-pink-800',  badge: 'bg-pink-100 text-pink-700'  },
  'Cadaujac':  { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  badge: 'bg-blue-100 text-blue-700'  },
  'La Brede':  { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
}

// Lignes horaires affichées sur l'axe temps
const HOUR_TICKS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

// ─── vue desktop ──────────────────────────────────────────────────────────────

const GRID_HEIGHT = 800 // px — couvre 9h30 → ~22h50

function WideCalendar() {
  return (
    <div className="hidden md:block overflow-x-auto pb-4">
      <div className="min-w-[900px]">
        {/* Légende lieux */}
        <div className="flex gap-4 mb-4 justify-end">
          {LIEUX.map((l) => (
            <span key={l} className={`text-xs font-semibold px-3 py-1 rounded-full ${LIEU_STYLE[l].badge}`}>
              {l}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Axe horaire */}
          <div className="w-12 shrink-0 relative" style={{ height: `${GRID_HEIGHT}px` }}>
            {HOUR_TICKS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-xs text-gray-300 -translate-y-2"
                style={{ top: `${(h * 60 - START_MIN)}px` }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Colonnes jours */}
          <div className="flex flex-1 gap-2">
            {JOURS.map((jour) => (
              <div key={jour} className="flex-1 min-w-0">
                {/* Header jour */}
                <div className="text-center text-xs font-black uppercase tracking-wider text-gray-400 bg-gray-100 rounded-lg py-1.5 mb-2">
                  {jour}
                </div>

                {/* Zone temps avec sous-colonnes par lieu */}
                <div
                  className="relative flex gap-1 rounded-xl overflow-hidden bg-white border border-gray-100"
                  style={{ height: `${GRID_HEIGHT}px` }}
                >
                  {/* Lignes horaires de fond */}
                  {HOUR_TICKS.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-gray-50"
                      style={{ top: `${h * 60 - START_MIN}px` }}
                    />
                  ))}

                  {/* Sous-colonnes par lieu */}
                  {LIEUX.map((lieu) => {
                    const slots = SLOTS.filter((s) => s.jour === jour && s.lieu === lieu)
                    if (slots.length === 0) return <div key={lieu} className="flex-1" />
                    return (
                      <div key={lieu} className="flex-1 relative">
                        {slots.map((s, i) => {
                          const st = LIEU_STYLE[s.lieu]
                          return (
                            <div
                              key={i}
                              className={`absolute inset-x-0.5 rounded-lg border ${st.bg} ${st.border} flex flex-col items-center justify-center px-1 overflow-hidden`}
                              style={slotStyle(s.debut, s.fin)}
                            >
                              <span className={`font-black text-xs leading-tight text-center ${st.text}`}>
                                {s.titre}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-0.5 leading-none">
                                {s.debut}
                              </span>
                              <span className="text-[10px] text-gray-400 leading-none">
                                {s.fin}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── vue mobile ───────────────────────────────────────────────────────────────

function MobileCalendar() {
  return (
    <div className="md:hidden space-y-6">
      {/* Légende */}
      <div className="flex flex-wrap gap-2">
        {LIEUX.map((l) => (
          <span key={l} className={`text-xs font-semibold px-3 py-1 rounded-full ${LIEU_STYLE[l].badge}`}>
            {l}
          </span>
        ))}
      </div>

      {JOURS.map((jour) => {
        const slots = SLOTS.filter((s) => s.jour === jour)
        if (slots.length === 0) return null
        const sorted = [...slots].sort((a, b) => toMin(a.debut) - toMin(b.debut))
        return (
          <div key={jour}>
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 pl-1">
              {jour}
            </h2>
            <div className="space-y-2">
              {sorted.map((s, i) => {
                const st = LIEU_STYLE[s.lieu]
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${st.bg} ${st.border}`}
                  >
                    <div className="flex-1">
                      <span className={`font-black text-sm ${st.text}`}>{s.titre}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${LIEU_STYLE[s.lieu].badge}`}>
                      {s.lieu}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                      {s.debut} – {s.fin}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

function EntrainementsPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-4 pt-12 pb-20">
        {/* Intro */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Entraînements</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Consultez le planning de la saison. Que vous soyez débutant ou confirmé,
            il y a une place pour vous dans l'une de nos équipes.
          </p>
          <div className="mt-4 w-16 h-1 bg-pink-600 rounded mx-auto" />
        </div>

        <WideCalendar />
        <MobileCalendar />
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p className="font-bold text-gray-400 mb-1">Handball Saint-Médard d'Eyrans</p>
        <p>© {new Date().getFullYear()} HBSME — Tous droits réservés</p>
      </footer>
    </div>
  )
}
