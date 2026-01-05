'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from "@/components/sidebar"
import { EmailVerificationBanner } from '@/components/email-verification-banner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  if (loading) {
     return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen flex flex-col">
        <EmailVerificationBanner
          emailVerified={user?.emailVerified}
          email={user?.email}
        />
        <div className="container py-6 flex-1">
           {children}
        </div>
      </main>
    </div>
  );
}