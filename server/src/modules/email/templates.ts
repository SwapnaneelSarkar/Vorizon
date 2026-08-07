/** Minimal, inline-styled HTML templates that render well in every client. */

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr><td style="font-size:20px;font-weight:700;color:#111827;padding-bottom:16px;">Vorizon</td></tr>
          <tr><td style="font-size:17px;font-weight:600;color:#111827;padding-bottom:12px;">${title}</td></tr>
          <tr><td style="font-size:14px;line-height:22px;color:#374151;">${bodyHtml}</td></tr>
          <tr><td style="font-size:12px;color:#9ca3af;padding-top:24px;border-top:1px solid #e5e7eb;">
            You are receiving this because you have an account on Vorizon.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const codeBox = (code: string) =>
  `<div style="font-size:28px;letter-spacing:8px;font-weight:700;color:#111827;background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">${code}</div>`;

export function welcomeTemplate(name: string, appUrl: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to Vorizon',
    html: layout(
      `Welcome aboard, ${name}!`,
      `<p>Your organization is set up and ready. Build your first AI employee, upload contacts, and launch a campaign in minutes.</p>
       <p style="margin:24px 0;"><a href="${appUrl}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Open Vorizon</a></p>
       <p>Need help getting started? Just reply to this email.</p>`,
    ),
  };
}

export function otpTemplate(code: string, purpose: string): { subject: string; html: string } {
  return {
    subject: `${code} is your Vorizon verification code`,
    html: layout(
      'Your verification code',
      `<p>Use this code to ${purpose}. It expires in 15 minutes.</p>
       ${codeBox(code)}
       <p>If you didn't request this, you can safely ignore this email.</p>`,
    ),
  };
}

export function passwordResetTemplate(code: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Vorizon password',
    html: layout(
      'Password reset requested',
      `<p>Enter this code on the reset screen to choose a new password. It expires in 15 minutes.</p>
       ${codeBox(code)}
       <p>If you didn't request a reset, your account is still secure and no action is needed.</p>`,
    ),
  };
}

export function notificationTemplate(
  heading: string,
  message: string,
  cta?: { label: string; url: string },
): { subject: string; html: string } {
  return {
    subject: heading,
    html: layout(
      heading,
      `<p>${message}</p>` +
        (cta
          ? `<p style="margin:24px 0;"><a href="${cta.url}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${cta.label}</a></p>`
          : ''),
    ),
  };
}
