import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export function CoverCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
