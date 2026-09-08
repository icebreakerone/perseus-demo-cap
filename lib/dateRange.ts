/**
 * The metering window the CAP asks the EDP for.
 *
 * Deliberately import-free: this module is loaded by the Next.js API route, by
 * a 'use client' component and by the CLI (which runs under tsx with its own
 * package.json), so it must not reach for next/*, node builtins or path
 * aliases.
 */

export interface IDateRange {
  /** YYYY-MM-DD, UTC, inclusive. */
  from: string
  /** YYYY-MM-DD, UTC, exclusive. */
  to: string
}

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10)

/**
 * The previous twelve complete calendar months, in UTC.
 *
 * Aligned to month boundaries rather than "today minus a year" so that every
 * bucket in the monthly chart is a whole month and the bars are comparable; a
 * literal rolling year touches thirteen months, two of them partial. This is
 * also the window the resource API describes its own 396 day MAX_WINDOW as
 * covering, and what the sharing consent copy promises the user.
 *
 * 365 or 366 days, so always inside that cap.
 */
export const lastTwelveCompleteMonths = (
  now: Date = new Date(),
): IDateRange => {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return {
    from: toDateOnly(new Date(Date.UTC(year - 1, month, 1))),
    to: toDateOnly(new Date(Date.UTC(year, month, 1))),
  }
}
