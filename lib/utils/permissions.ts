import type { AccountType, AgeBand, UserRole } from '@/types/app'

// ── Age-band rules ────────────────────────────────────────────

/** Age 8-10 must have a linked parent before they can submit anything. */
export function requiresGuardianLink(ageBand: AgeBand): boolean {
  return ageBand === '8-10'
}

/** Default value for guardian_links.publish_requires_approval at link creation. */
export function defaultPublishRequiresApproval(ageBand: AgeBand): boolean {
  return ageBand === '8-10'
}

/** Default value for guardian_links.spending_requires_approval at link creation. */
export function defaultSpendingRequiresApproval(ageBand: AgeBand): boolean {
  return ageBand === '8-10'
}

// ── Admin route access ────────────────────────────────────────

/** Can the account type enter /admin at all? */
export function hasAdminAccess(accountType: AccountType): boolean {
  return ['editor', 'moderator', 'admin'].includes(accountType)
}

/**
 * Sub-route checks — called inside Server Components, not middleware.
 * Middleware does coarse account_type gating only.
 */
export function canAccessReviewQueue(roles: UserRole[]): boolean {
  return roles.some(r => r === 'editor' || r === 'admin')
}

export function canAccessFlags(roles: UserRole[]): boolean {
  return roles.some(r => r === 'moderator' || r === 'admin')
}

export function canAccessUserManagement(roles: UserRole[]): boolean {
  return roles.some(r => r === 'moderator' || r === 'admin')
}

export function canAccessCoinAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

export function canAccessImpactAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

export function canAccessRolesAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

export function canAccessSettingsAdmin(roles: UserRole[]): boolean {
  return roles.includes('admin')
}

// ── Content capabilities by age band ─────────────────────────

/** Content types available to each age band in V1. */
export function allowedContentTypes(ageBand: AgeBand): string[] {
  switch (ageBand) {
    case '8-10':
      return ['text'] // Structured prompt responses only
    case '11-13':
      return ['text', 'image', 'story_episode', 'world_window_report']
    case '14-18':
      return ['text', 'image', 'story_episode', 'world_window_report', 'debate']
  }
}

/** Maximum re-submission attempts before auto-reject. */
export const MAX_REVISION_COUNT = 3
