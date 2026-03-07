import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/intranet/')({
  beforeLoad: () => {
    throw redirect({ to: '/intranet/studio' })
  },
  component: () => null,
})
