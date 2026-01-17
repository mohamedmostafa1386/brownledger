import nodemailer from "nodemailer";

// Email Configuration
// Uses SMTP - can be configured for any provider (Gmail, SendGrid, Resend, etc.)

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

// Create transporter based on environment
function getTransporter() {
    const config: EmailConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
        },
    };

    return nodemailer.createTransport(config);
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: options.from || process.env.EMAIL_FROM || "BrownLedger <noreply@brownledger.com>",
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ""),
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.to}: ${options.subject}`);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}

// Email Templates

export function getWelcomeEmailTemplate(userName: string, companyName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; border-radius: 12px; font-size: 24px; font-weight: bold;">
                    BL
                </div>
            </div>
            
            <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px; text-align: center;">
                Welcome to BrownLedger! 🎉
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your account for <strong>${companyName}</strong> has been created successfully. You now have access to a powerful IFRS-compliant accounting system.
            </p>
            
            <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #1e3a5f; margin-top: 0;">Get Started:</h3>
                <ul style="color: #4b5563; padding-left: 20px;">
                    <li>Set up your Chart of Accounts</li>
                    <li>Add your first client or supplier</li>
                    <li>Create your first invoice</li>
                    <li>Explore financial reports</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Go to Dashboard →
                </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 40px;">
                If you have any questions, reply to this email or contact support.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} BrownLedger. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}

export function getPasswordResetTemplate(userName: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; border-radius: 12px; font-size: 24px; font-weight: bold;">
                    BL
                </div>
            </div>
            
            <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px; text-align: center;">
                Reset Your Password
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Reset Password
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px;">
                    If the button doesn't work, copy and paste this URL into your browser:<br>
                    <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
                </p>
            </div>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} BrownLedger. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}

export function getInvoiceEmailTemplate(
    clientName: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    viewLink: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; border-radius: 12px; font-size: 24px; font-weight: bold;">
                    BL
                </div>
            </div>
            
            <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px; text-align: center;">
                Invoice ${invoiceNumber}
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${clientName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please find attached your invoice. Here are the details:
            </p>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #6b7280; padding: 8px 0;">Invoice Number:</td>
                        <td style="color: #1e3a5f; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; padding: 8px 0;">Amount Due:</td>
                        <td style="color: #059669; font-weight: 700; font-size: 18px; text-align: right;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; padding: 8px 0;">Due Date:</td>
                        <td style="color: #1e3a5f; font-weight: 600; text-align: right;">${dueDate}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${viewLink}" 
                   style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    View & Pay Invoice
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions about this invoice, please don't hesitate to contact us.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} BrownLedger. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}

export function getPaymentReminderTemplate(
    clientName: string,
    invoiceNumber: string,
    amount: string,
    daysOverdue: number,
    viewLink: string
): string {
    const urgencyColor = daysOverdue > 30 ? "#dc2626" : daysOverdue > 14 ? "#f59e0b" : "#2563eb";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 20px; border-radius: 12px; font-size: 24px; font-weight: bold;">
                    ⏰
                </div>
            </div>
            
            <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px; text-align: center;">
                Payment Reminder
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Dear ${clientName},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is now 
                <span style="color: ${urgencyColor}; font-weight: 600;">${daysOverdue} days overdue</span>.
            </p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #6b7280; padding: 8px 0;">Invoice Number:</td>
                        <td style="color: #1e3a5f; font-weight: 600; text-align: right;">${invoiceNumber}</td>
                    </tr>
                    <tr>
                        <td style="color: #6b7280; padding: 8px 0;">Outstanding Amount:</td>
                        <td style="color: #dc2626; font-weight: 700; font-size: 20px; text-align: right;">${amount}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${viewLink}" 
                   style="display: inline-block; background: ${urgencyColor}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Pay Now
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you've already made this payment, please disregard this reminder. For any questions, please contact us.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} BrownLedger. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}

export function getInviteEmailTemplate(
    inviterName: string,
    companyName: string,
    role: string,
    inviteLink: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px; border-radius: 12px; font-size: 24px; font-weight: bold;">
                    BL
                </div>
            </div>
            
            <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 20px; text-align: center;">
                You're Invited! 🎉
            </h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on BrownLedger as a <strong>${role}</strong>.
            </p>
            
            <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #1e3a5f; font-size: 18px; margin: 0;">
                    You'll have access to:
                </p>
                <ul style="color: #4b5563; text-align: left; display: inline-block; margin-top: 10px;">
                    <li>Financial reports and statements</li>
                    <li>Invoice and expense management</li>
                    <li>Real-time dashboard insights</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Accept Invitation
                </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                This invitation expires in 7 days.
            </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} BrownLedger. All rights reserved.
        </p>
    </div>
</body>
</html>
`;
}
