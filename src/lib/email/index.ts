/**
 * Email Notifications using Resend
 * 
 * Templates:
 * - Welcome email
 * - Server ready
 * - Payment failed
 * - Payment successful
 * - Trial ending (2 days before)
 * - Trial ended
 * - Subscription cancelled
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@moltbot.ceo";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moltbot.ceo";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("Email skipped (no RESEND_API_KEY):", options.subject);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Moltbot <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      console.error("Email send failed:", await response.text());
      return false;
    }

    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 600; margin-bottom: 32px; }
    .logo span { background: linear-gradient(135deg, #2563eb, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✨ <span>moltbot</span></div>
    ${content}
    <div class="footer">
      <p>© 2025 Moltbot. All rights reserved.</p>
      <p><a href="${APP_URL}" style="color: #666;">moltbot.ceo</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

export async function sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
  const greeting = name ? `Hi ${name}!` : "Welcome!";
  
  return sendEmail({
    to: email,
    subject: "Welcome to Moltbot! 🎉",
    html: baseTemplate(`
      <h1>${greeting}</h1>
      <p>Thanks for signing up for Moltbot. You now have your own AI assistant.</p>
      <p>Here's what's included:</p>
      <ul>
        <li>A dedicated cloud instance</li>
        <li>All communication channels</li>
        <li>Unlimited usage</li>
      </ul>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
      </p>
      <p>Questions? Just reply to this email.</p>
    `),
  });
}

export async function sendServerReadyEmail(email: string, ipAddress: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your server is ready! 🚀",
    html: baseTemplate(`
      <h1>Your server is ready!</h1>
      <p>Great news! Your Moltbot instance is now running.</p>
      <p><strong>Server IP:</strong> <code>${ipAddress}</code></p>
      <p>Next steps:</p>
      <ul>
        <li>Connect your Telegram, Discord, or other channels</li>
        <li>Start chatting with your AI assistant</li>
        <li>Customize your bot's personality</li>
      </ul>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard/server" class="btn">View Server</a>
      </p>
    `),
  });
}

export async function sendPaymentFailedEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Payment failed - action required",
    html: baseTemplate(`
      <h1>Payment failed</h1>
      <p>We couldn't process your latest payment. Please update your payment method to keep your Moltbot running.</p>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard/billing" class="btn">Update Payment Method</a>
      </p>
      <p>If you have any questions, just reply to this email.</p>
    `),
  });
}

export async function sendPaymentSuccessEmail(email: string, amount: number): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Payment received - thank you!",
    html: baseTemplate(`
      <h1>Payment received</h1>
      <p>Thanks for your payment of <strong>$${amount.toFixed(2)}</strong>.</p>
      <p>Your Moltbot subscription is active and your AI assistant is ready to help.</p>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
      </p>
    `),
  });
}

export async function sendTrialEndingEmail(email: string, daysLeft: number): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Your trial ends in ${daysLeft} days`,
    html: baseTemplate(`
      <h1>Your trial is ending soon</h1>
      <p>Your Moltbot free trial ends in <strong>${daysLeft} days</strong>.</p>
      <p>To keep your AI assistant running, subscribe to a paid plan:</p>
      <ul>
        <li><strong>Moltbot ($19.97/mo)</strong> - Everything included</li>
      </ul>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard/billing" class="btn">Upgrade Now</a>
      </p>
    `),
  });
}

export async function sendTrialEndedEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your trial has ended",
    html: baseTemplate(`
      <h1>Your trial has ended</h1>
      <p>Your Moltbot free trial has expired. Your server has been paused.</p>
      <p>Upgrade to a paid plan to reactivate your AI assistant:</p>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard/billing" class="btn">Choose a Plan</a>
      </p>
      <p>We'd love to have you back!</p>
    `),
  });
}

export async function sendCancellationEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "We're sad to see you go",
    html: baseTemplate(`
      <h1>Subscription cancelled</h1>
      <p>Your Moltbot subscription has been cancelled. Your server will be stopped at the end of your billing period.</p>
      <p>Changed your mind? You can resubscribe anytime:</p>
      <p style="margin: 32px 0;">
        <a href="${APP_URL}/dashboard/billing" class="btn">Resubscribe</a>
      </p>
      <p>We'd love to hear your feedback. Just reply to this email.</p>
    `),
  });
}
