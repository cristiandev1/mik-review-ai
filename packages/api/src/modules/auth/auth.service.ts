import { db } from '../../config/database.js';
import { users, apiKeys } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../../config/env.js';
import { VerificationService } from '../verification/verification.service.js';
import type { SignupInput, LoginInput } from './auth.schemas.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

export class AuthService {
  async signup(input: SignupInput) {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const userId = nanoid();
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: input.email,
        passwordHash,
        name: input.name || null,
        plan: 'free',
        emailVerified: false, // In production, send verification email
      })
      .returning();

    // Auto-generate first API key
    const apiKeyValue = 'mik_' + nanoid(32);
    await db.insert(apiKeys).values({
      id: nanoid(),
      userId: user.id,
      key: apiKeyValue,
      name: 'Default API Key',
      isActive: true,
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Send verification email
    const verificationService = new VerificationService();
    try {
      await verificationService.sendVerificationEmail(user.id);
    } catch (error: any) {
      // Log error but don't fail signup if email fails
      logger.error({ err: error }, 'Failed to send verification email');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.emailVerified,
      },
      token,
      apiKey: apiKeyValue,
    };
  }

  async login(input: LoginInput) {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash || '');
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        emailVerified: users.emailVerified,
        githubAccessToken: users.githubAccessToken,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }
}
