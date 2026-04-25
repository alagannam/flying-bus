import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteDraft } from './actions'

export const metadata: Metadata = { title: 'Submission Studio' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function StudioPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawDrafts } = await supabase
    .from('submissions')
    .select('id, title, created_at')
    .eq('youth_user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const drafts = (rawDrafts ?? []) as { id: string; title: string; created_at: string }[]

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.top}>
          <div>
            <h1 style={styles.heading}>Submission Studio</h1>
            <p style={styles.sub}>Create something and share it with the world.</p>
          </div>
          <a href="/studio/new" style={styles.newBtn}>+ New submission</a>
        </div>

        <section>
          <h2 style={styles.sectionHeading}>Saved drafts</h2>

          {drafts.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>No drafts saved yet.</p>
              <a href="/studio/new" style={styles.emptyLink}>Start your first submission →</a>
            </div>
          ) : (
            <ul style={styles.list}>
              {drafts.map(draft => {
                const deleteWithId = deleteDraft.bind(null, draft.id)
                return (
                  <li key={draft.id} style={styles.item}>
                    <div style={styles.itemInfo}>
                      <a href={`/my-submissions/${draft.id}`} style={styles.itemTitle}>
                        {draft.title}
                      </a>
                      <span style={styles.itemMeta}>Saved {formatDate(draft.created_at)}</span>
                    </div>
                    <form action={deleteWithId}>
                      <button type="submit" style={styles.deleteBtn}>Delete</button>
                    </form>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background)',
    padding: 'var(--space-8) var(--space-6)',
  },
  container: {
    maxWidth: 'var(--container-lg)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-8)',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    color: 'var(--color-text)',
  },
  sub: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--space-1)',
  },
  newBtn: {
    display: 'inline-block',
    padding: 'var(--space-3) var(--space-6)',
    background: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    borderRadius: 'var(--radius-full)',
    textDecoration: 'none',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  sectionHeading: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text)',
    marginBottom: 'var(--space-4)',
  },
  empty: {
    padding: 'var(--space-12)',
    textAlign: 'center' as const,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px dashed var(--color-border)',
  },
  emptyText: {
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-3)',
  },
  emptyLink: {
    color: 'var(--color-primary)',
    fontWeight: 'var(--font-medium)',
    fontSize: 'var(--text-sm)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-2)',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-4)',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 'var(--space-4) var(--space-5)',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  itemMeta: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    padding: 'var(--space-1) var(--space-3)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
} as const
