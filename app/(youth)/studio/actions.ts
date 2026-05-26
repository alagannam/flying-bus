'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkAndAwardBadges } from '@/lib/badges'

type ActionResult = { error?: string }

async function getYouthSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('youth_profiles')
    .select('age_band')
    .eq('user_id', user.id)
    .single()

  const profile = rawProfile as { age_band: '8-10' | '11-13' | '14-18' } | null
  if (!profile) redirect('/login')

  return { userId: user.id, ageBand: profile.age_band }
}

function validate(title: string, body: string): string | null {
  if (title.length < 3 || title.length > 200)
    return 'Title must be between 3 and 200 characters.'
  if (body.length < 20)
    return 'Your submission must be at least 20 characters long.'
  return null
}

// ── saveDraft ─────────────────────────────────────────────────
// Saves a new draft and redirects to the studio landing page.

export async function saveDraft(formData: FormData): Promise<ActionResult> {
  const title       = String(formData.get('title')        ?? '').trim()
  const body        = String(formData.get('body')         ?? '').trim()
  const clubId      = String(formData.get('club_id')      ?? '').trim() || null
  const challengeId = String(formData.get('challenge_id') ?? '').trim() || null

  const err = validate(title, body)
  if (err) return { error: err }

  const { userId, ageBand } = await getYouthSession()

  const { error } = await createServiceClient()
    .from('submissions')
    .insert({
      youth_user_id: userId,
      title,
      body,
      club_id:       clubId,
      challenge_id:  challengeId,
      age_band:      ageBand,
      status:        'draft',
    })

  if (error) return { error: 'Could not save your draft. Please try again.' }

  redirect('/studio')
}

// ── createAndSubmit ───────────────────────────────────────────
// Saves a new submission and immediately moves it through the
// parent gate (if active) or straight to pending_review.
// Redirects to the submission's detail page on success.

export async function createAndSubmit(formData: FormData): Promise<ActionResult> {
  const title       = String(formData.get('title')        ?? '').trim()
  const body        = String(formData.get('body')         ?? '').trim()
  const clubId      = String(formData.get('club_id')      ?? '').trim() || null
  const challengeId = String(formData.get('challenge_id') ?? '').trim() || null

  const err = validate(title, body)
  if (err) return { error: err }

  const { userId, ageBand } = await getYouthSession()
  const service = createServiceClient()

  // Insert draft first so we have an id for the rest of the flow
  const { data: rawSubmission, error: insertError } = await service
    .from('submissions')
    .insert({
      youth_user_id: userId,
      title,
      body,
      club_id:       clubId,
      challenge_id:  challengeId,
      age_band:      ageBand,
      status:        'draft',
    })
    .select('id')
    .single()

  if (insertError || !rawSubmission) {
    return { error: 'Could not create your submission. Please try again.' }
  }

  const submission = rawSubmission as { id: string }

  // Check whether an active guardian link requires publish approval
  const { data: rawLink } = await service
    .from('guardian_links')
    .select('parent_user_id, publish_requires_approval')
    .eq('child_user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const link = rawLink as { parent_user_id: string; publish_requires_approval: boolean } | null
  const requiresParent = link?.publish_requires_approval === true

  const nextStatus = requiresParent ? 'pending_parent_approval' : 'pending_review'

  const { error: updateError } = await service
    .from('submissions')
    .update({ status: nextStatus, submitted_at: new Date().toISOString() })
    .eq('id', submission.id)

  if (updateError) {
    return { error: 'Could not submit your work. Please try again.' }
  }

  // Notify parent if the gate is active
  if (requiresParent && link?.parent_user_id) {
    await service.from('notifications').insert({
      user_id: link.parent_user_id,
      type: 'parent_approval_needed' as const,
      title: 'New submission waiting for your review',
      body: `Your child submitted "${title}" and needs your approval before it goes to the editors.`,
      reference_id: submission.id,
    })
  }

  // Bump activity streak — tracks consecutive days of creative submission.
  // Best-effort: errors are logged and do not block the redirect.
  // bump_streak is idempotent for the same UTC day, so this is safe to call
  // even if the youth submits multiple times in one day.
  const { error: streakError } = await service.rpc('bump_streak', {
    p_user_id: userId,
  })
  if (streakError) {
    console.error('[createAndSubmit] bump_streak failed', { id: submission.id, streakError })
  } else {
    // Check streak badges only after a successful bump — streak_current is
    // now fresh. Idempotent: already-earned badges are silently skipped.
    await checkAndAwardBadges(userId, service, ['streak_current']).catch(err => {
      console.error('[createAndSubmit] checkAndAwardBadges failed', { id: submission.id, err })
    })
  }

  redirect('/my-submissions')
}

// ── deleteDraft ───────────────────────────────────────────────
// Deletes a draft owned by the current user. Only drafts can be
// deleted — the status filter prevents removing submitted work.
// Used as a bound form action: deleteDraft.bind(null, id)

export async function deleteDraft(id: string): Promise<void> {
  const { userId } = await getYouthSession()

  await createServiceClient()
    .from('submissions')
    .delete()
    .eq('id', id)
    .eq('youth_user_id', userId)  // ownership — defence in depth beyond RLS
    .eq('status', 'draft')        // never delete submitted work via this action

  redirect('/studio')
}
