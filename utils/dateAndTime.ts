export function getTimeOfDay(): string {
  const currentHour: number = new Date().getHours()

  if (currentHour >= 5 && currentHour < 12) return 'morning'
  else if (currentHour >= 12 && currentHour < 18) return 'afternoon'

  return 'evening'
}

export function parseUTCDate(date: string): string {
  const utcDate = new Date(date)
  return utcDate.toLocaleDateString('en-GB')
}
