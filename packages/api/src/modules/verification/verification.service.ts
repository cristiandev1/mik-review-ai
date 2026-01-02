import { db } from '../../config/database.js';
import { users, emailVerificationTokens } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { EmailService } from '../../shared/services/email.service.js';
import { logger } from '../../shared/utils/logger.js';

export class VerificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate and send verification email
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      logger.info({ userId }, 'User already verified, skipping email');
      return;
    }

    // Delete any existing tokens for this user
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));

    // Generate new token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Save token to database
    await db.insert(emailVerificationTokens).values({
      id: nanoid(),
      userId,
      token,
      expiresAt,
    });

    // Send email
    await this.emailService.sendVerificationEmail(user.email, token, user.name || undefined);

    logger.info({ userId, email: user.email }, 'Verification email sent');
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    // Find token in database
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      logger.warn({ token }, 'Invalid verification token');
      return {
        success: false,
        message: 'Invalid verification token',
      };
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      logger.warn({ token, userId: tokenRecord.userId }, 'Verification token expired');

      // Delete expired token
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, tokenRecord.id));

      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      };
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (!user) {
      logger.error({ userId: tokenRecord.userId }, 'User not found for verification token');
      return {
        success: false,
        message: 'User not found',
      };
    }

    if (user.emailVerified) {
      logger.info({ userId: user.id }, 'User already verified');

      // Delete token
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, tokenRecord.id));

      return {
        success: true,
        message: 'Email already verified',
      };
    }

    // Update user email_verified to true
    await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Delete token (one-time use)
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    logger.info({ userId: user.id, email: user.email }, 'Email verified successfully');

    return {
      success: true,
      message: 'Email verified successfully!',
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    // Check if user is already verified
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Send verification email (will delete old tokens and create new one)
    await this.sendVerificationEmail(userId);
  }
}
