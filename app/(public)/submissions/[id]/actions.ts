'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

type ActionResult = { error?: string }

const ALLOWED_REASONS = [
  'inappropriate',
  'offensive',
  'spam',
  'misleading',
  'other',
] as const

type Reason = typeof ALLOWED_REASONS[number]

export async function reportSubmission(
  submissionId: string,
  reason: string,
  detail: string | null,
): Promise<ActionResult> {
  // 1. Verify auth — must be signed in to file a report
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to report content.' }

  // 2. Validate reason against the exact DB CHECK constraint values
  if (!ALLOWED_REASONS.includes(reason as Reason)) {
    return { error: 'Invalid reason.' }
  }

  // 3. Validate detail length (DB CHECK is 500, enforce here too)
  if (detail && detail.length > 500) {
    return { error: 'Detail must be 500 characters or fewer.' }
  }

  const service = createServiceClient()

  // 4. Verify the submission exists and is published
  //    Checking status = 'published' means rejected/draft/pending submissions
  //    are not reportable — they are not visible to the public anyway.
  const { data: rawSub } = await service
    .from('submissions')
    .select('id, youth_user_id')
    .eq('id', submissionId)
    .eq('status', 'published')
    .maybeSingle()

  if (!rawSub) return { error: 'Submission not found.' }

  const sub = rawSub as { id: string; youth_user_id: string }

  // 5. Verify the reporter is not the submission author
  //    The page hides the button from authors, but this check is
  //    the authoritative server-side guard.
  if (sub.youth_user_id === user.id) {
    return { error: 'You cannot report your own submission.' }
  }

  // 6. Insert the report.
  //    The UNIQUE(reporter_user_id, target_type, target_id) constraint
  //    handles duplicate reports — no pre-check needed.
  //    .select('id').single() captures the new row's id so the audit
  //    event below can target it (pairs with flag_reviewed by target_id).
  const { data: reportRow, error: insertError } = await service
    .from('content_reports')
    .insert({
      reporter_user_id: user.id,
      target_type:      'submission',
      target_id:        submissionId,
      reason,
      detail:           detail ?? null,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'You have already reported this submission.' }
    }
    console.error('[reportSubmission] insert error', insertError)
    return { error: 'Could not submit your report. Please try again.' }
  }

  // Audit event — best-effort observability. The content_reports row is
  // the source of truth; a missed audit row is logged but does not fail
  // the action. target_type/target_id reference the new report row so
  // this event pairs with the later flag_reviewed event by target_id.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: auditError } = await (service as any).from('audit_events').insert({
      event_type:    'flag_filed',
      actor_user_id: user.id,
      target_type:   'content_report',
      target_id:     reportRow.id,
      payload:       {
        target_submission_id: submissionId,
        reason,
        detail: detail ?? null,
      },
    })
    if (auditError) {
      console.error('[reportSubmission] audit_events insert failed', { reportId: reportRow.id, auditError })
    }
  } catch (err) {
    console.error('[reportSubmission] audit_events insert threw', { reportId: reportRow.id, err })
  }

  return {}
}
