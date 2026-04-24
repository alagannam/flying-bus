import type { AgeBand } from '@/types/app'

/**
 * All age-band logic is server-side only.
 * DOB is accepted, used to compute band and transition dates, then discarded.
 * Never store raw DOB. Never return DOB to the client.
 */

export function computeAgeBand(dateOfBirth: Date): AgeBand | null {
  const today = new Date()
  const age = getExactAge(dateOfBirth, today)
  if (age < 8 || age >= 19) return null
  if (age <= 10) return '8-10'
  if (age <= 13) return '11-13'
  return '14-18'
}

/**
 * The date the user moves into the next age band.
 * Returns null for 14-18 — platform_exit_date handles that transition.
 */
export function computeAgeBandChangesOn(dateOfBirth: Date, currentBand: AgeBand): Date | null {
  const dob = new Date(dateOfBirth)
  switch (currentBand) {
    case '8-10':
      return new Date(dob.getFullYear() + 11, dob.getMonth(), dob.getDate())
    case '11-13':
      return new Date(dob.getFullYear() + 14, dob.getMonth(), dob.getDate())
    case '14-18':
      return null
  }
}

/** The date the user turns 19 — when they must exit the platform. */
export function computePlatformExitDate(dateOfBirth: Date): Date {
  const dob = new Date(dateOfBirth)
  return new Date(dob.getFullYear() + 19, dob.getMonth(), dob.getDate())
}

/**
 * The next age band after the current one.
 * Used for UI messaging: "You'll become a Leader when you turn 14."
 */
export function nextAgeBand(current: AgeBand): AgeBand | null {
  switch (current) {
    case '8-10':  return '11-13'
    case '11-13': return '14-18'
    case '14-18': return null
  }
}

/**
 * Internal display label for age band — used in dashboards and moderation UI only.
 * Never shown on public profiles or leaderboards.
 */
export function ageBandLabel(band: AgeBand): string {
  switch (band) {
    case '8-10':  return 'Explorer'
    case '11-13': return 'Creator'
    case '14-18': return 'Leader'
  }
}

function getExactAge(dob: Date, at: Date): number {
  let age = at.getFullYear() - dob.getFullYear()
  const monthDiff = at.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}
