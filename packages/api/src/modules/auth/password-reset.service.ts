import { db } from '../../config/database.js';
import { users, passwordResetTokens } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { EmailService } from '../../shared/services/email.service.js';
import { logger } from '../../shared/utils/logger.js';

export class PasswordResetService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists
      logger.info({ email }, 'Password reset requested for non-existent email');
      return;
    }

    // Delete existing tokens
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    // Create new token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await db.insert(passwordResetTokens).values({
      id: nanoid(),
      userId: user.id,
      token,
      expiresAt,
    });

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, token, user.name || undefined);
    
    logger.info({ userId: user.id }, 'Password reset email sent');
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Find token
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Check expiry
    if (new Date() > tokenRecord.expiresAt) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));
      return { success: false, message: 'Token expired' };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await db
      .update(users)
      .set({ 
        passwordHash, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, tokenRecord.userId));

    // Delete used token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));

    logger.info({ userId: tokenRecord.userId }, 'Password reset successfully');

    return { success: true, message: 'Password reset successfully' };
  }
}
