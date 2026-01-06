declare module 'stripe' {
  export default class Stripe {
    constructor(apiKey: string, options?: any);
    customers: {
      create(params: any): Promise<any>;
      retrieve(id: string): Promise<any>;
    };
    checkout: {
      sessions: {
        create(params: any): Promise<any>;
      };
    };
    subscriptions: {
      retrieve(id: string): Promise<any>;
      del(id: string): Promise<any>;
    };
    subscriptionItems: {
      update(id: string, params: any): Promise<any>;
    };
    usageRecords: {
      create(id: string, params: any): Promise<any>;
    };
    webhooks: {
      constructEvent(body: string, signature: string, secret: string): any;
    };
  }
}
