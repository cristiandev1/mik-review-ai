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
    const { getVerificationEmailHtml } = await import('./email-templates.js');
    
    const html = getVerificationEmailHtml(verificationUrl, userName);

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

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}`;
    const { getPasswordResetEmailHtml } = await import('./email-templates.js');
    
    const html = getPasswordResetEmailHtml(resetUrl, userName);

    const text = `
Hi ${userName || 'there'}!

We received a request to reset the password for your Mik Review AI account.
Please reset your password by clicking the link below:

${resetUrl}

This link will expire in 1 hour. If you didn't make this request, you can safely ignore this email.

Best regards,
Mik Review AI Team
    `.trim();

    await this.send({
      to: email,
      subject: 'Reset Your Password - Mik Review AI',
      html,
      text,
    });
  }
}
