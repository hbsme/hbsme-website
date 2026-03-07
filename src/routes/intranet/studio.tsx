import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { getNextWeekMatches, getLastWeekResults, getPhotosRs } from '#/server/queries'
import { NextWeekCover } from '#/components/studio/NextWeekCover'
import { NextWeekHome } from '#/components/studio/NextWeekHome'
import { NextWeekExt } from '#/components/studio/NextWeekExt'
import { NextWeekSun } from '#/components/studio/NextWeekSun'
import { LastResultCover } from '#/components/studio/LastResultCover'
import { LastResultHome } from '#/components/studio/LastResultHome'
import { LastResultExt } from '#/components/studio/LastResultExt'

export const Route = createFileRoute('/intranet/studio')({
  component: StudioPage,
  loader: async () => {
    const today = new Date().toISOString().split('T')[0]
    const [nextweek, lastweek, photos] = await Promise.all([
      getNextWeekMatches({ data: today }),
      getLastWeekResults({ data: today }),
      getPhotosRs(),
    ])
    return { nextweek, lastweek, photos }
  },
})

function StudioPage() {
  const { nextweek, lastweek, photos } = Route.useLoaderData()

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Studio</h1>
        <p className="text-sm text-gray-500">Génération des affiches matchs</p>
      </div>

      <Tabs defaultValue="nextweek" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="nextweek">🗓 Prochains matchs</TabsTrigger>
          <TabsTrigger value="lastresult">🏆 Résultats du W.E.</TabsTrigger>
        </TabsList>

        <TabsContent value="nextweek" className="space-y-4">
          <NextWeekCover nextweek={nextweek} photos={photos} />
          <NextWeekHome nextweek={nextweek} />
          <NextWeekExt nextweek={nextweek} />
          <NextWeekSun nextweek={nextweek} />
        </TabsContent>

        <TabsContent value="lastresult" className="space-y-4">
          <LastResultCover lastweek={lastweek} />
          <LastResultHome lastweek={lastweek} />
          <LastResultExt lastweek={lastweek} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
