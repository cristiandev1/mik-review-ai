import api from '../api';

export interface BillingPlan {
  plan: 'trial' | 'hobby' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  seatsPurchased: number;
  seatsUsed: number;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  updatePaymentUrl?: string; // URL to Stripe Customer Portal
}

export interface BillingUsage {
  prsUsed: number;
  prsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  billingMonth: string;
}

export interface CheckoutSession {
  url: string;
}

export const billingApi = {
  getPlan: async (): Promise<BillingPlan> => {
    const response = await api.get('/billing/plan');
    return response.data.data;
  },

  getUsage: async (): Promise<BillingUsage> => {
    const response = await api.get('/billing/usage');
    return response.data.data;
  },

  createCheckout: async (data: { plan: 'hobby' | 'pro'; seats: number; repositoryId?: string }): Promise<CheckoutSession> => {
    const response = await api.post('/billing/checkout', data);
    return response.data.data;
  },

  updateSeats: async (data: { seats: number; subscriptionId: string }): Promise<void> => {
    await api.post('/billing/seats', data);
  },

  cancelSubscription: async (): Promise<void> => {
    await api.post('/billing/cancel');
  },

  updateSeatMode: async (data: { repositoryId: string; mode: 'whitelist' | 'auto-add'; maxSeats?: number }): Promise<void> => {
    await api.patch('/billing/seat-mode', data);
  },

  getRepositorySeats: async (repositoryId: string): Promise<RepositorySeat[]> => {
    const response = await api.get(`/billing/repositories/${repositoryId}/seats`);
    return response.data.data;
  },

  addDeveloper: async (data: { repositoryId: string; githubUsername: string }): Promise<void> => {
    await api.post('/billing/developers', data);
  },

  removeDeveloper: async (data: { repositoryId: string; githubUsername: string }): Promise<void> => {
    await api.delete('/billing/developers', { data });
  },
};

export interface RepositorySeat {
  id: number;
  developerGithubUsername: string;
  isActive: boolean;
  assignedAt: string;
  billingMonth: string;
}
