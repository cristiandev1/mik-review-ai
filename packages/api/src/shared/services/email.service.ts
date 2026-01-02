import { logger } from '../utils/logger.js';
import { env } from '../../config/env.js';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = env.EMAIL_FROM;
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   */
  private initializeTransporter(): void {
    if (!env.EMAIL_PASSWORD) {
      logger.warn('EMAIL_PASSWORD not set, emails will be logged only');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: parseInt(env.EMAIL_PORT, 10),
        secure: parseInt(env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });

      logger.info({ host: env.EMAIL_HOST, port: env.EMAIL_PORT }, 'Email transporter initialized');
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to initialize email transporter');
    }
  }

  /**
   * Send an email
   * In development without EMAIL_PASSWORD, logs the email instead of sending
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      if (!this.transporter || !env.EMAIL_PASSWORD) {
        // Development mode or no email config: just log the email
        logger.info(
          {
            to: options.to,
            subject: options.subject,
            from: this.fromEmail,
          },
          '📧 [DEV] Email would be sent'
        );
        logger.debug(
          {
            html: options.html.substring(0, 200) + '...',
            text: options.text?.substring(0, 200),
          },
          'Email content preview'
        );
        return;
      }

      // Send email via Nodemailer
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(
        {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
        'Email sent successfully'
      );
    } catch (error: any) {
      logger.error({ err: error, to: options.to }, 'Failed to send email');
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL || 'http://localhost:3001'}/auth/verify-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Mik Review AI</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>

    <p>Hi ${userName || 'there'}! 👋</p>

    <p>Thanks for signing up for Mik Review AI! Please verify your email address by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                font-weight: bold;">
        Verify Email Address
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Or copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px;">
      This link will expire in 24 hours. If you didn't create an account with Mik Review AI, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Hi ${userName || 'there'}!

Thanks for signing up for Mik Review AI! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with Mik Review AI, you can safely ignore this email.

Best regards,
Mik Review AI Team
    `.trim();

    await this.send({
      to: email,
      subject: 'Verify Your Email - Mik Review AI',
      html,
      text,
    });
  }
}
