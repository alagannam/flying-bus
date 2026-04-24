/**
 * Placeholder used in all Phase 0 stub pages.
 * Replaced with real content in the phase that builds each feature.
 */
export function ComingSoon({ title, phase = 2 }: { title: string; phase?: number }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        🚌
      </div>
      <h1
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        Built in Phase {phase}
      </p>
    </div>
  )
}
