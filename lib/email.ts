import { Resend } from "resend";

// Inicializar Resend de forma segura
let resend: Resend | null = null;

function initializeResend() {
  if (resend) return resend; // Já inicializado
  
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ RESEND_API_KEY não está configurada!");
      return null;
    }
    resend = new Resend(apiKey);
    return resend;
  } catch (error) {
    console.error("❌ Erro ao inicializar Resend:", error);
    return null;
  }
}

// Email padrão do Resend para testes (ou configure seu domínio verificado)
// O Resend usa "onboarding@resend.dev" para testes, não "delivered@resend.dev"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "onboarding@resend.dev";

interface BugReportEmailData {
  title: string;
  description: string;
  email: string;
  browserInfo?: string;
  userAgent?: string;
  url?: string;
}

interface SupportRequestEmailData {
  title: string;
  description: string;
  category: string;
  email: string;
}

interface ReviewEmailData {
  rating: number;
  comment?: string;
  name?: string;
  email?: string;
}

/**
 * Envia email de notificação para admin quando um bug report é criado
 */
export async function sendBugReportNotification(data: BugReportEmailData) {
  try {
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    console.log(`📧 Sending bug report notification from ${FROM_EMAIL} to ${ADMIN_EMAIL}`);

    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `🐛 Bug Report: ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
              .label { font-weight: bold; color: #6b7280; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🐛 New Bug Report</h1>
              </div>
              <div class="content">
                <h2>${data.title}</h2>
                <p><strong>Description:</strong></p>
                <p>${data.description.replace(/\n/g, "<br>")}</p>
                
                <div class="info-box">
                  <p><span class="label">Reported by:</span> ${data.email}</p>
                  ${data.browserInfo ? `<p><span class="label">Browser:</span> ${data.browserInfo}</p>` : ""}
                  ${data.url ? `<p><span class="label">URL:</span> <a href="${data.url}">${data.url}</a></p>` : ""}
                </div>
                
                ${data.userAgent ? `<p style="font-size: 12px; color: #6b7280;"><strong>User Agent:</strong> ${data.userAgent}</p>` : ""}
              </div>
              <div class="footer">
                <p>This is an automated notification from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending bug report email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log("✅ Bug report notification email sent successfully");
    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending bug report email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de confirmação para o usuário quando um bug report é criado
 */
export async function sendBugReportConfirmation(userEmail: string, title: string) {
  try {
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "Bug Report Received - GoalDigger",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Thank You!</h1>
              </div>
              <div class="content">
                <p>We've received your bug report:</p>
                <p><strong>"${title}"</strong></p>
                <p>Our team will review it and get back to you as soon as possible.</p>
                <p>We appreciate your help in making GoalDigger better!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending bug report confirmation:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log("✅ Bug report confirmation email sent successfully");
    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending bug report confirmation:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de notificação para admin quando um support request é criado
 */
export async function sendSupportRequestNotification(data: SupportRequestEmailData) {
  try {
    console.log("📧 sendSupportRequestNotification - Starting...");
    console.log("📧 FROM_EMAIL:", FROM_EMAIL);
    console.log("📧 ADMIN_EMAIL:", ADMIN_EMAIL);
    
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("❌ Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    const categoryLabels: Record<string, string> = {
      billing: "💳 Billing & Payments",
      technical: "🔧 Technical Support",
      account: "👤 Account Issues",
      feature: "💡 Feature Request",
      general: "📧 General Inquiry",
      other: "❓ Other",
    };

    console.log("📧 Preparing to send email to:", ADMIN_EMAIL);
    console.log("📧 Email from:", FROM_EMAIL);
    
    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `📧 Support Request [${categoryLabels[data.category] || data.category}]: ${data.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .info-box { background: #dbeafe; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
              .label { font-weight: bold; color: #1e40af; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📧 New Support Request</h1>
              </div>
              <div class="content">
                <div class="info-box">
                  <p><span class="label">Category:</span> ${categoryLabels[data.category] || data.category}</p>
                </div>
                <h2>${data.title}</h2>
                <p><strong>Description:</strong></p>
                <p>${data.description.replace(/\n/g, "<br>")}</p>
                <p><span class="label">From:</span> ${data.email}</p>
              </div>
              <div class="footer">
                <p>This is an automated notification from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending support request email:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("❌ Error message:", (error as any).message);
      }
      return { success: false, error };
    }

    console.log("✅ Support request notification email sent successfully");
    console.log("✅ Email data:", JSON.stringify(emailData, null, 2));
    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Exception sending support request email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de confirmação para o usuário quando um support request é criado
 */
export async function sendSupportRequestConfirmation(userEmail: string, title: string, category: string) {
  try {
    console.log("📧 sendSupportRequestConfirmation - Starting...");
    console.log("📧 Sending to user:", userEmail);
    
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    const categoryLabels: Record<string, string> = {
      billing: "Billing & Payments",
      technical: "Technical Support",
      account: "Account Issues",
      feature: "Feature Request",
      general: "General Inquiry",
      other: "Other",
    };

    console.log("📧 Sending confirmation email to:", userEmail);
    
    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "Support Request Received - GoalDigger",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Support Request Received</h1>
              </div>
              <div class="content">
                <p>We've received your support request:</p>
                <p><strong>"${title}"</strong></p>
                <p><strong>Category:</strong> ${categoryLabels[category] || category}</p>
                <p>Our support team will review your request and respond as soon as possible.</p>
                <p>Thank you for contacting GoalDigger support!</p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending support request confirmation:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("❌ Error message:", (error as any).message);
      }
      return { success: false, error };
    }

    console.log("✅ Support request confirmation email sent successfully");
    console.log("✅ Email data:", JSON.stringify(emailData, null, 2));
    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Exception sending support request confirmation:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de notificação para admin quando uma review é criada
 */
export async function sendReviewNotification(data: ReviewEmailData) {
  try {
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    const stars = "⭐".repeat(data.rating);
    const ratingLabels: Record<number, string> = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `⭐ New Review: ${stars} (${data.rating}/5)`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .rating { font-size: 24px; margin: 15px 0; }
              .info-box { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #fbbf24; }
              .label { font-weight: bold; color: #92400e; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">⭐ New Review</h1>
              </div>
              <div class="content">
                <div class="rating">${stars}</div>
                <p><strong>Rating:</strong> ${data.rating}/5 - ${ratingLabels[data.rating] || "Unknown"}</p>
                ${data.comment ? `<p><strong>Comment:</strong></p><p>${data.comment.replace(/\n/g, "<br>")}</p>` : "<p><em>No comment provided</em></p>"}
                <div class="info-box">
                  ${data.name ? `<p><span class="label">Name:</span> ${data.name}</p>` : ""}
                  ${data.email ? `<p><span class="label">Email:</span> ${data.email}</p>` : ""}
                </div>
                <p style="font-size: 12px; color: #6b7280;"><em>Note: This review needs to be approved before being published.</em></p>
              </div>
              <div class="footer">
                <p>This is an automated notification from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending review email:", error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending review email:", error);
    return { success: false, error };
  }
}

/**
 * Envia email de confirmação para o usuário quando uma review é criada
 */
export async function sendReviewConfirmation(userEmail: string, rating: number) {
  try {
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    const stars = "⭐".repeat(rating);
    const ratingLabels: Record<number, string> = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "Thank You for Your Review - GoalDigger",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }
              .rating { font-size: 32px; text-align: center; margin: 20px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Thank You!</h1>
              </div>
              <div class="content">
                <p>We've received your review:</p>
                <div class="rating">${stars}</div>
                <p style="text-align: center;"><strong>${rating}/5 - ${ratingLabels[rating] || "Unknown"}</strong></p>
                <p>Your feedback helps us improve GoalDigger. We truly appreciate you taking the time to share your experience!</p>
                <p style="font-size: 14px; color: #6b7280;"><em>Note: Reviews are moderated before being published to ensure quality.</em></p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending review confirmation:", error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Error sending review confirmation:", error);
    return { success: false, error };
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Envia email de boas-vindas quando um usuário cria uma conta
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string) {
  try {
    console.log("📧 sendWelcomeEmail - Starting...");
    console.log("📧 Sending to user:", userEmail);
    
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    if (!isValidEmail(userEmail)) {
      console.error("❌ Invalid email address:", userEmail);
      return { success: false, error: "Invalid email address" };
    }

    // Verificar se estamos em modo de teste do Resend
    // No modo de teste, só podemos enviar para o email do admin
    if (FROM_EMAIL === "onboarding@resend.dev" && userEmail !== ADMIN_EMAIL) {
      console.warn("⚠️ Resend está em modo de teste. Só é possível enviar para:", ADMIN_EMAIL);
      console.warn("⚠️ Para enviar para outros emails, verifique um domínio no Resend e atualize RESEND_FROM_EMAIL");
      console.warn("⚠️ Email de boas-vindas não enviado para:", userEmail);
      // Em produção, você pode querer retornar um erro ou fazer fallback
      // Por enquanto, apenas logamos o aviso
      return { 
        success: false, 
        error: "Resend test mode: can only send to admin email. Domain verification required for other recipients." 
      };
    }

    console.log("📧 Sending welcome email to:", userEmail);
    
    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "Welcome to GoalDigger! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎉 Welcome to GoalDigger!</h1>
              </div>
              <div class="content">
                <h2>Hello${userName ? ` ${userName}` : ""}!</h2>
                <p>We're thrilled to have you join the GoalDigger community! 🚀</p>
                <p>GoalDigger is your all-in-one productivity platform to help you:</p>
                <ul>
                  <li>📝 Organize your tasks and goals</li>
                  <li>⏱️ Track your time with Pomodoro sessions</li>
                  <li>📊 Monitor your progress and achievements</li>
                  <li>💪 Stay motivated and productive</li>
                </ul>
                <p>Get started by creating your first task or setting up a goal. We're here to help you achieve your dreams!</p>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"}/dashboard" class="button">Go to Dashboard</a>
                </div>
                <p>If you have any questions or need help, don't hesitate to reach out to our support team.</p>
                <p>Happy goal achieving!<br><strong>The GoalDigger Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
                <p>© ${new Date().getFullYear()} GoalDigger. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending welcome email:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("❌ Error message:", (error as any).message);
      }
      return { success: false, error };
    }

    console.log("✅ Welcome email sent successfully");
    console.log("✅ Email data:", JSON.stringify(emailData, null, 2));
    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Exception sending welcome email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de confirmação quando uma subscrição é renovada
 */
export async function sendSubscriptionRenewalEmail(
  userEmail: string,
  plan: string,
  period: string,
  endDate: Date
) {
  try {
    console.log("📧 sendSubscriptionRenewalEmail - Starting...");
    console.log("📧 Sending to user:", userEmail);
    
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    if (!isValidEmail(userEmail)) {
      console.error("❌ Invalid email address:", userEmail);
      return { success: false, error: "Invalid email address" };
    }

    const planLabels: Record<string, string> = {
      plus: "Plus",
      pro: "Pro",
      free: "Free",
    };

    const periodLabels: Record<string, string> = {
      monthly: "Monthly",
      yearly: "Yearly",
    };

    const formattedEndDate = endDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log("📧 Sending subscription renewal email to:", userEmail);
    
    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `✅ Subscription Renewed - GoalDigger ${planLabels[plan] || plan}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .info-box { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">✅ Subscription Renewed!</h1>
              </div>
              <div class="content">
                <h2>Great news!</h2>
                <p>Your GoalDigger subscription has been successfully renewed.</p>
                <div class="info-box">
                  <p><strong>Plan:</strong> ${planLabels[plan] || plan}</p>
                  <p><strong>Billing Period:</strong> ${periodLabels[period] || period}</p>
                  <p><strong>Next Renewal Date:</strong> ${formattedEndDate}</p>
                </div>
                <p>Thank you for continuing to use GoalDigger! Your support helps us keep improving the platform.</p>
                <p>If you have any questions about your subscription, feel free to contact our support team.</p>
                <p>Keep achieving your goals!<br><strong>The GoalDigger Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
                <p>© ${new Date().getFullYear()} GoalDigger. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending subscription renewal email:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("❌ Error message:", (error as any).message);
      }
      return { success: false, error };
    }

    console.log("✅ Subscription renewal email sent successfully");
    console.log("✅ Email data:", JSON.stringify(emailData, null, 2));
    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Exception sending subscription renewal email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

/**
 * Envia email de notificação quando uma cobrança falha
 */
export async function sendPaymentFailedEmail(
  userEmail: string,
  plan: string,
  period?: string
) {
  try {
    console.log("📧 sendPaymentFailedEmail - Starting...");
    console.log("📧 Sending to user:", userEmail);
    
    const resendClient = initializeResend();
    if (!resendClient) {
      console.error("Resend não está configurado. Verifique RESEND_API_KEY.");
      return { success: false, error: "Resend not configured" };
    }

    if (!isValidEmail(userEmail)) {
      console.error("❌ Invalid email address:", userEmail);
      return { success: false, error: "Invalid email address" };
    }

    const planLabels: Record<string, string> = {
      plus: "Plus",
      pro: "Pro",
      free: "Free",
    };

    const periodLabels: Record<string, string> = {
      monthly: "Monthly",
      yearly: "Yearly",
    };

    console.log("📧 Sending payment failed email to:", userEmail);
    
    const { data: emailData, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: "⚠️ Payment Failed - Action Required",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .warning-box { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
              .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">⚠️ Payment Failed</h1>
              </div>
              <div class="content">
                <h2>We couldn't process your payment</h2>
                <p>Unfortunately, we were unable to process the payment for your GoalDigger ${planLabels[plan] || plan}${period ? ` ${periodLabels[period] || period}` : ""} subscription.</p>
                <div class="warning-box">
                  <p><strong>What happened?</strong></p>
                  <p>Your subscription has been temporarily downgraded to the Free plan. Your account and data are safe, but some premium features may no longer be available.</p>
                </div>
                <p><strong>What you need to do:</strong></p>
                <ol>
                  <li>Check your payment method and ensure it's valid and has sufficient funds</li>
                  <li>Update your payment information if needed</li>
                  <li>Resubscribe to restore your premium features</li>
                </ol>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"}/pricing" class="button">Update Payment Method</a>
                </div>
                <p>If you believe this is an error or need assistance, please contact our support team. We're here to help!</p>
                <p>Best regards,<br><strong>The GoalDigger Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email from GoalDigger</p>
                <p>© ${new Date().getFullYear()} GoalDigger. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Error sending payment failed email:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error && typeof error === 'object' && 'message' in error) {
        console.error("❌ Error message:", (error as any).message);
      }
      return { success: false, error };
    }

    console.log("✅ Payment failed email sent successfully");
    console.log("✅ Email data:", JSON.stringify(emailData, null, 2));
    return { success: true, data: emailData };
  } catch (error) {
    console.error("❌ Exception sending payment failed email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
}

