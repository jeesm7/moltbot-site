// Email service using Resend
// Gracefully falls back if RESEND_API_KEY is not set

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Moltbot <noreply@moltbot.ceo>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moltbot.ceo";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    console.log(`[Email] No RESEND_API_KEY configured, skipping`);
    return true; // Don't fail if email isn't configured
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Email] Failed to send: ${error}`);
      return false;
    }

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Error sending to ${to}:`, error);
    return false;
  }
}

// Email templates

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
  .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; }
  .logo-text { font-size: 20px; font-weight: 600; color: #18181b; }
  h1 { font-size: 24px; font-weight: 600; color: #18181b; margin: 0 0 16px; }
  p { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 16px; }
  .button { display: inline-block; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 500; margin: 16px 0; }
  .button:hover { background: #4f46e5; }
  .footer { text-align: center; margin-top: 32px; color: #a1a1aa; font-size: 14px; }
  .code { background: #f4f4f5; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #18181b; }
  .highlight { background: #f4f4f5; border-radius: 12px; padding: 24px; margin: 24px 0; }
  .metric { text-align: center; }
  .metric-value { font-size: 32px; font-weight: 700; color: #18181b; }
  .metric-label { font-size: 14px; color: #71717a; }
`;

function emailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">
              <div class="logo-icon"></div>
              <span class="logo-text">moltbot</span>
            </div>
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Moltbot. All rights reserved.</p>
            <p>You're receiving this because you signed up for Moltbot.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Welcome email - sent after signup
export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const greeting = name ? `Hi ${name}` : "Welcome";
  
  const html = emailTemplate(`
    <h1>${greeting}! 🎉</h1>
    <p>Thanks for signing up for Moltbot. You're about to get your very own AI assistant.</p>
    <p>Here's what happens next:</p>
    <ol style="color: #52525b; margin: 16px 0;">
      <li style="margin-bottom: 8px;">We'll deploy a dedicated server just for you</li>
      <li style="margin-bottom: 8px;">You'll connect your communication channels (Telegram, etc.)</li>
      <li style="margin-bottom: 8px;">Start chatting with your AI assistant!</li>
    </ol>
    <a href="${APP_URL}/dashboard" class="button">Go to Dashboard →</a>
    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
      Your AI assistant is ready. We'll guide you through setup.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: "Welcome to Moltbot! 🚀",
    html,
  });
}

// Server ready email - sent when deployment completes
export async function sendServerReadyEmail(email: string, serverIp: string): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Your server is ready! ✅</h1>
    <p>Great news! Your dedicated AI assistant server has been deployed and is now running.</p>
    <div class="highlight">
      <p style="margin: 0; color: #71717a; font-size: 14px;">Server IP Address</p>
      <p class="code" style="margin: 8px 0 0;">${serverIp}</p>
    </div>
    <p>Next step: Connect your communication channels to start using your AI assistant.</p>
    <a href="${APP_URL}/dashboard" class="button">Configure Your Assistant →</a>
  `);

  return sendEmail({
    to: email,
    subject: "Your Moltbot server is ready!",
    html,
  });
}

// Payment failed email
export async function sendPaymentFailedEmail(email: string): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Payment failed ⚠️</h1>
    <p>We couldn't process your latest payment. Your server has been paused to prevent additional charges.</p>
    <p>Please update your payment method to restore access to your AI assistant.</p>
    <a href="${APP_URL}/dashboard/billing" class="button">Update Payment Method →</a>
    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
      If you believe this is an error, please contact support.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: "Action required: Payment failed",
    html,
  });
}

// Payment successful email
export async function sendPaymentSuccessEmail(email: string, amount: string, plan: string): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Payment received ✓</h1>
    <p>Thank you! We've received your payment.</p>
    <div class="highlight">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #71717a;">Plan</span>
        <span style="font-weight: 600; text-transform: capitalize;">${plan}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #71717a;">Amount</span>
        <span style="font-weight: 600;">${amount}</span>
      </div>
    </div>
    <a href="${APP_URL}/dashboard/billing" class="button">View Invoice →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Payment confirmed - ${amount}`,
    html,
  });
}

// Trial ending soon email - sent 2 days before trial ends
export async function sendTrialEndingSoonEmail(email: string, daysLeft: number): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}</h1>
    <p>We hope you've been enjoying your AI assistant! Your free trial will expire soon.</p>
    <p>To continue using Moltbot without interruption, upgrade to a paid plan:</p>
    <div class="highlight" style="text-align: center; padding: 16px; background: white; border-radius: 8px; border: 2px solid #6366f1;">
      <p style="font-weight: 600; margin: 0; color: #6366f1;">Moltbot</p>
      <p style="font-size: 24px; font-weight: 700; margin: 8px 0;">$19.97</p>
      <p style="color: #71717a; font-size: 12px; margin: 0;">/month — everything included</p>
    </div>
    <a href="${APP_URL}/dashboard/billing" class="button">Upgrade Now →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Your Moltbot trial ends in ${daysLeft} days`,
    html,
  });
}

// Trial ended email
export async function sendTrialEndedEmail(email: string): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Your trial has ended</h1>
    <p>Your Moltbot trial has ended. Your server has been paused.</p>
    <p>To restore access to your AI assistant, upgrade to a paid plan. All your data and settings are safe and will be restored when you upgrade.</p>
    <a href="${APP_URL}/dashboard/billing" class="button">Choose a Plan →</a>
    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
      Data is retained for 7 days after trial expiration.
    </p>
  `);

  return sendEmail({
    to: email,
    subject: "Your Moltbot trial has ended",
    html,
  });
}

// Cancellation confirmation email
export async function sendCancellationEmail(email: string): Promise<boolean> {
  const html = emailTemplate(`
    <h1>Subscription cancelled</h1>
    <p>We're sorry to see you go. Your Moltbot subscription has been cancelled.</p>
    <p>Here's what happens next:</p>
    <ul style="color: #52525b; margin: 16px 0;">
      <li style="margin-bottom: 8px;">Your server will be deleted within 24 hours</li>
      <li style="margin-bottom: 8px;">Your data will be retained for 7 days</li>
      <li style="margin-bottom: 8px;">You can reactivate anytime by signing up again</li>
    </ul>
    <p style="color: #71717a; font-size: 14px;">
      Changed your mind? You can reactivate your subscription within 24 hours to keep your server.
    </p>
    <a href="${APP_URL}/pricing" class="button">Reactivate →</a>
  `);

  return sendEmail({
    to: email,
    subject: "Your Moltbot subscription has been cancelled",
    html,
  });
}

// Usage alert email - when approaching limits
export async function sendUsageAlertEmail(email: string, currentUsage: number, limit: number): Promise<boolean> {
  const percentage = Math.round((currentUsage / limit) * 100);
  
  const html = emailTemplate(`
    <h1>Usage alert: ${percentage}% of limit</h1>
    <p>You're approaching your usage limit for this billing period.</p>
    <div class="highlight">
      <div class="metric">
        <div class="metric-value">$${currentUsage.toFixed(2)}</div>
        <div class="metric-label">of $${limit.toFixed(2)} limit used</div>
      </div>
      <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 16px; overflow: hidden;">
        <div style="background: ${percentage > 90 ? '#ef4444' : '#6366f1'}; height: 100%; width: ${percentage}%;"></div>
      </div>
    </div>
    <p>
      ${percentage >= 90 
        ? "Your AI assistant will be paused when you hit the limit."
        : "You can review your usage details in the dashboard."}
    </p>
    <a href="${APP_URL}/dashboard/billing" class="button">Manage Plan →</a>
  `);

  return sendEmail({
    to: email,
    subject: `Moltbot usage at ${percentage}%`,
    html,
  });
}
