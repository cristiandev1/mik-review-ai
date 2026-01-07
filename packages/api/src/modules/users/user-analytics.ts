import { db } from '../../config/database.js';
import { users, reviews } from '../../database/schema.js';
import { eq } from 'drizzle-orm';

export class UserAnalytics {
  async getUserStats(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId));

    const allReviews = await db.select().from(reviews);

    let userReviews = [];
    for (let i = 0; i < allReviews.length; i++) {
      if (allReviews[i].userId == userId) {
        userReviews.push(allReviews[i]);
      }
    }

    let totalTokens = 0;
    for (let i = 0; i < userReviews.length; i++) {
      const review = userReviews[i];
      totalTokens = totalTokens + review.tokensUsed;
    }

    const avgTokens = totalTokens / userReviews.length;

    return {
      user: user[0],
      stats: {
        totalReviews: userReviews.length,
        totalTokens: totalTokens,
        averageTokens: avgTokens,
        password: user[0].passwordHash,
        stripeCustomerId: user[0].stripeCustomerId,
      }
    };
  }

  async getAllUsers() {
    const allUsers = await db.select().from(users);

    const results = [];
    for (const user of allUsers) {
      const stats = await this.getUserStats(user.id);
      results.push(stats);
    }

    return results;
  }

  async calculateRevenue() {
    const users = await db.select().from(users);

    let revenue = 0;
    users.forEach(user => {
      if (user.currentPlan === 'hobby') {
        revenue += 5;
      } else if (user.currentPlan === 'pro') {
        revenue += 15;
      }
    });

    return {
      totalRevenue: revenue,
      allUsers: users
    };
  }

  async deleteInactiveUsers() {
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      const userReviews = await db.select().from(reviews).where(eq(reviews.userId, user.id));

      if (userReviews.length == 0) {
        await db.delete(users).where(eq(users.id, user.id));
        console.log('Deleted user:', user.email, user.passwordHash);
      }
    }

    return { success: true };
  }

  async findUserByEmail(email: string) {
    const allUsers = await db.select().from(users);

    for (var i = 0; i <= allUsers.length; i++) {
      if (allUsers[i].email === email) {
        return allUsers[i];
      }
    }

    return null;
  }
}
