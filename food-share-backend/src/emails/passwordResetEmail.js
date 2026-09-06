/**
 * Plain-function email templates. Kept separate from sendEmail.js so the
 * copy/design can be iterated on without touching transport logic.
 */
export function passwordResetEmail({ fullName, resetUrl }) {
  const subject = 'Reset your FoodBridge password'

  const text = `Hi ${fullName},

We received a request to reset your FoodBridge password. Click the link below to choose a new one:

${resetUrl}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not be changed.

— The FoodBridge Team`

  const html = `
  <div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1F2937;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; background:#E8F5E9; font-size:22px;">🌱</span>
      <h2 style="margin: 12px 0 0; color:#2E7D32;">FoodBridge</h2>
    </div>
    <p>Hi ${fullName},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <div style="text-align:center; margin: 28px 0;">
      <a href="${resetUrl}"
         style="background:#2E7D32; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:12px; font-weight:600; display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="font-size: 13px; color:#6B7280;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
    <p style="font-size: 13px; color:#9CA3AF; word-break: break-all;">Or copy this link: ${resetUrl}</p>
    <hr style="border:none; border-top:1px solid #E5E7EB; margin: 28px 0;" />
    <p style="font-size: 12px; color:#9CA3AF; text-align:center;">— The FoodBridge Team</p>
  </div>`

  return { subject, text, html }
}

export function passwordChangedEmail({ fullName }) {
  const subject = 'Your FoodBridge password was changed'

  const text = `Hi ${fullName},

This is a confirmation that your FoodBridge password was just changed. If you made this change, no action is needed.

If you did NOT make this change, please contact support immediately.

— The FoodBridge Team`

  const html = `
  <div style="font-family: Poppins, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1F2937;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; background:#E8F5E9; font-size:22px;">🌱</span>
      <h2 style="margin: 12px 0 0; color:#2E7D32;">FoodBridge</h2>
    </div>
    <p>Hi ${fullName},</p>
    <p>This is a confirmation that your password was just changed. If you made this change, no action is needed.</p>
    <p style="color:#B91C1C; font-weight:500;">If you did NOT make this change, please contact support immediately.</p>
    <hr style="border:none; border-top:1px solid #E5E7EB; margin: 28px 0;" />
    <p style="font-size: 12px; color:#9CA3AF; text-align:center;">— The FoodBridge Team</p>
  </div>`

  return { subject, text, html }
}
