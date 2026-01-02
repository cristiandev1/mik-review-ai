interface BaseTemplateOptions {
  title: string;
  previewText: string;
  content: string;
}

const styles = {
  body: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  header: 'background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px; text-align: center;',
  headerTitle: 'color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;',
  container: 'background: #ffffff; padding: 40px 32px;',
  h1: 'color: #111827; margin-top: 0; font-size: 20px; font-weight: 600; margin-bottom: 24px;',
  p: 'color: #4b5563; font-size: 16px; margin-bottom: 24px; line-height: 1.6;',
  buttonContainer: 'text-align: center; margin: 32px 0;',
  button: 'background: #4f46e5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: background-color 0.2s;',
  link: 'color: #4f46e5; word-break: break-all; text-decoration: none;',
  footer: 'margin-top: 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 32px;',
};

export const getBaseTemplate = ({ title, previewText, content }: BaseTemplateOptions) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${previewText}">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="padding: 40px 20px;">
    <div style="${styles.body}">
      <div style="${styles.header}">
        <h1 style="${styles.headerTitle}">Mik Review AI</h1>
      </div>

      <div style="${styles.container}">
        ${content}
        
        <div style="${styles.footer}">
          <p style="margin-bottom: 8px;">© ${new Date().getFullYear()} Mik Review AI. All rights reserved.</p>
          <p style="margin: 0;">
            You received this email because you have an account with Mik Review AI.<br>
            If you didn't request this, you can safely ignore it.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const getVerificationEmailHtml = (verificationUrl: string, userName?: string) => {
  const content = `
    <h2 style="${styles.h1}">Verify Your Email Address</h2>
    
    <p style="${styles.p}">Hi ${userName || 'there'},</p>
    
    <p style="${styles.p}">
      Thanks for signing up for Mik Review AI! We're excited to help you automate your code reviews.
      Please verify your email address to get started.
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${verificationUrl}" style="${styles.button}">
        Verify Email Address
      </a>
    </div>

    <p style="${styles.p}">
      Or copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="${styles.link}">${verificationUrl}</a>
    </p>

    <p style="${styles.p}">This link will expire in 24 hours.</p>
  `;

  return getBaseTemplate({
    title: 'Verify Your Email - Mik Review AI',
    previewText: 'Please verify your email address to get started with Mik Review AI',
    content,
  });
};

export const getPasswordResetEmailHtml = (resetUrl: string, userName?: string) => {
  const content = `
    <h2 style="${styles.h1}">Reset Your Password</h2>
    
    <p style="${styles.p}">Hi ${userName || 'there'},</p>
    
    <p style="${styles.p}">
      We received a request to reset the password for your Mik Review AI account.
      If you didn't make this request, you can safely ignore this email.
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${resetUrl}" style="${styles.button}">
        Reset Password
      </a>
    </div>

    <p style="${styles.p}">
      Or copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="${styles.link}">${resetUrl}</a>
    </p>

    <p style="${styles.p}">This link will expire in 1 hour.</p>
  `;

  return getBaseTemplate({
    title: 'Reset Your Password - Mik Review AI',
    previewText: 'Instructions to reset your Mik Review AI password',
    content,
  });
};
