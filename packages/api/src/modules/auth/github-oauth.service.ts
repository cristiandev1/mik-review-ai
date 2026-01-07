import { env } from '../../config/env.js';
import { db } from '../../config/database.js';
import { users, apiKeys } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export class GitHubOAuthService {
  /**
   * Exchange code for access token and login user
   */
  async loginWithCode(code: string): Promise<{ token: string; user: any; isNewUser: boolean }> {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new AppError('GitHub credentials not configured', 500);
    }

    // 1. Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json() as any;

    if (tokenData.error) {
      logger.error({ error: tokenData }, 'GitHub OAuth error');
      throw new AppError(`GitHub OAuth failed: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Get User Profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new AppError('Failed to fetch GitHub user');
    }

    const githubUser = await userResponse.json() as GitHubUser;

    // 3. Get User Email (if not public)
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json() as GitHubEmail[];
        const primaryEmail = emails.find(e => e.primary && e.verified);
        if (primaryEmail) {
          email = primaryEmail.email;
        }
      }
    }

    if (!email) {
      throw new AppError('Could not obtain email from GitHub account');
    }

    // 4. Find or Create User
    // Check by GitHub ID first
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.githubId, String(githubUser.id)))
      .limit(1);

    let isNewUser = false;

    if (!user) {
      // Check by email to link accounts
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUserByEmail) {
        // Link existing user
        user = existingUserByEmail;
        await db
          .update(users)
          .set({
            githubId: String(githubUser.id),
            githubAccessToken: accessToken, // TODO: Encrypt this
            avatarUrl: githubUser.avatar_url,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } else {
        // Create new user
        isNewUser = true;
        const userId = nanoid();
        
        // Insert user
        const [newUser] = await db
          .insert(users)
          .values({
            id: userId,
            email: email,
            name: githubUser.name || githubUser.login,
            plan: 'free',
            currentPlan: 'trial',
            emailVerified: true, // GitHub verified
            githubId: String(githubUser.id),
            githubAccessToken: accessToken,
            avatarUrl: githubUser.avatar_url,
          })
          .returning();
        
        user = newUser;

        // Generate API Key
        const apiKeyValue = 'mik_' + nanoid(32);
        await db.insert(apiKeys).values({
          id: nanoid(),
          userId: user.id,
          key: apiKeyValue,
          name: 'Default API Key',
          isActive: true,
        });
      }
    } else {
      // Update token
      await db
        .update(users)
        .set({
          githubAccessToken: accessToken,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // 5. Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user,
      isNewUser,
    };
  }
}
