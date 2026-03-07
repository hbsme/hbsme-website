// Studio utils — helpers de formatage de dates

export function makeMonth(month: string): string {
  const months: Record<string, string> = {
    '01': 'Janv.', '02': 'Févr.', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juil.', '08': 'Août',
    '09': 'Sept.', '10': 'Oct.', '11': 'Nov.', '12': 'Déc.',
  }
  return months[month] ?? ''
}

export function makeDefaultDate(satDate: string, sunDate: string): string {
  const satMonth = satDate.split('-')[1]
  const sunMonth = sunDate.split('-')[1]
  const satDay = satDate.split('-')[2]
  const sunDay = sunDate.split('-')[2]
  if (satMonth === sunMonth) return `${satDay} et ${sunDay} ${makeMonth(satMonth)}`
  return `${satDay} ${makeMonth(satMonth)} et ${sunDay} ${makeMonth(sunMonth)}`
}

export function formatDate(date: string): string {
  const months: Record<string, string> = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
  }
  const parts = date.split('-')
  if (parts.length !== 3) return date
  return `${parts[2]} ${months[parts[1]]} ${parts[0]}`
}

export function extractTime(datetime: string): string {
  const date = new Date(datetime)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}
