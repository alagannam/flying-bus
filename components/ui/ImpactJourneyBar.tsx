/**
 * Presentational journey-bar for an Impact campaign.
 *
 * Renders: title, recipient + gear line, progress fill, "$X of $Y" amounts,
 * and a journey-framed "N% to the destination" label.
 *
 * Dollar amounts come in as integer cents. The component is dumb — no fetching,
 * no client state — so it composes safely into both Server Components and
 * client trees.
 *
 * Safe with goal_cents = 0: shows 0% rather than dividing by zero.
 */
type Props = {
  title:           string
  goal_cents:      number
  raised_cents:    number
  recipient_name:  string | null
  gear_summary:    string | null
}

function formatDollars(cents: number): string {
  const whole = Math.max(0, Math.floor(cents / 100))
  return '$' + whole.toLocaleString('en-US')
}

export function ImpactJourneyBar({
  title,
  goal_cents,
  raised_cents,
  recipient_name,
  gear_summary,
}: Props) {
  const safeGoal   = Math.max(0, goal_cents)
  const safeRaised = Math.max(0, raised_cents)

  const pct = safeGoal > 0
    ? Math.min(100, (safeRaised / safeGoal) * 100)
    : 0
  const pctLabel = Math.round(pct)

  const hasRecipientLine = Boolean(recipient_name || gear_summary)

  return (
    <div style={styles.box}>
      <div style={styles.titleRow}>
        <span style={styles.title}>{title}</span>
        <span style={styles.amounts}>
          {formatDollars(safeRaised)} of {formatDollars(safeGoal)}
        </span>
      </div>

      {hasRecipientLine && (
        <p style={styles.recipient}>
          {recipient_name && (
            <span style={styles.recipientName}>{recipient_name}</span>
          )}
          {recipient_name && gear_summary && <span style={styles.sep}> — </span>}
          {gear_summary && <span>{gear_summary}</span>}
        </p>
      )}

      <div
        style={styles.track}
        role="progressbar"
        aria-valuenow={pctLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pctLabel}% to the destination`}
      >
        <div style={{ ...styles.fill, width: `${pct}%` }} />
      </div>

      <p style={styles.journey}>{pctLabel}% to the destination</p>
    </div>
  )
}

const FILL    = '#818CF8'
const TRACK   = '#E0DEF8'
const INK     = '#312E81'
const SURFACE = '#F6F5FE'

const styles = {
  box: {
    background:    SURFACE,
    border:        `1px solid ${TRACK}`,
    borderRadius:  'var(--radius-xl)',
    padding:       'var(--space-5) var(--space-6)',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           'var(--space-3)',
    color:         INK,
  },
  titleRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    gap:            'var(--space-3)',
    flexWrap:       'wrap' as const,
  },
  title: {
    fontSize:   'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
    color:      INK,
  },
  amounts: {
    fontSize:           'var(--text-sm)',
    fontWeight:         'var(--font-semibold)',
    color:              INK,
    fontVariantNumeric: 'tabular-nums',
  },
  recipient: {
    fontSize:   'var(--text-sm)',
    color:      INK,
    margin:     0,
    lineHeight: 'var(--leading-relaxed)',
    opacity:    0.9,
  },
  recipientName: {
    fontWeight: 'var(--font-semibold)',
  },
  sep: {
    opacity: 0.6,
  },
  track: {
    height:       12,
    width:        '100%',
    background:   TRACK,
    borderRadius: 'var(--radius-full)',
    overflow:     'hidden',
  },
  fill: {
    height:       '100%',
    background:   FILL,
    borderRadius: 'var(--radius-full)',
    transition:   'width 200ms ease-out',
  },
  journey: {
    fontSize:      'var(--text-xs)',
    fontWeight:    'var(--font-semibold)',
    color:         INK,
    margin:        0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
} as const
