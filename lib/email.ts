import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

/**
 * Sends a password reset email. The reset URL is single-use and expires
 * in 1 hour — the caller is responsible for generating + storing the token.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Reset your Flying Bus password',
      text:
`Hi, someone requested a password reset for your Flying Bus account.
Click the link below to reset your password. This link expires in 1 hour.

${resetUrl}

If you didn't request this, you can safely ignore this email.`,
    })
  } catch (err) {
    console.error('[sendPasswordResetEmail] failed', { to, err })
    throw err
  }
}

/**
 * Sends the parent invite email triggered when a youth signs up and lists
 * a parent email. The invite URL carries a token the parent uses to claim
 * the account and complete linking.
 */
export async function sendParentInviteEmail(
  to: string,
  childDisplayName: string,
  inviteUrl: string,
): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Your child joined The Flying Bus — action needed',
      text:
`Hi, ${childDisplayName} just created an account on The Flying Bus,
a safe global platform where kids create, compete, and help other kids.

As their parent or guardian, we need you to create an account to
complete their registration and manage their safety settings.

Click here to get started: ${inviteUrl}

This link expires in 7 days. If you have questions, reply to this email.`,
    })
  } catch (err) {
    console.error('[sendParentInviteEmail] failed', { to, err })
    throw err
  }
}

/**
 * Sends an email verification link to confirm account ownership.
 * The verify URL carries a single-use token that expires in 24 hours.
 */
export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string,
): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Verify your Flying Bus email',
      text:
`Hi, please verify your email address to complete your
Flying Bus account setup.

Click here to verify: ${verifyUrl}

This link expires in 24 hours.`,
    })
  } catch (err) {
    console.error('[sendEmailVerificationEmail] failed', { to, err })
    throw err
  }
}
