'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Onboarding } from '@/components/Onboarding';

const StatusDashboard = dynamic(
  () => import('@/components/StatusDashboard').then(m => ({ default: m.StatusDashboard })),
  { ssr: false }
);
const ChildOverview = dynamic(
  () => import('@/components/ChildOverview').then(m => ({ default: m.ChildOverview })),
  { ssr: false }
);

export default function HomePage() {
  const [role, setRole] = useState<'staff-admin' | 'staff-student' | 'ledsager' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const leder = localStorage.getItem('lederMode') === 'true';
    const staffRole = localStorage.getItem('staffRole');
    if (leder || staffRole === 'admin') setRole('staff-admin');
    else if (staffRole === 'student') setRole('staff-student');
    else {
      setRole('ledsager');
      if (!localStorage.getItem('onboardingDone')) setShowOnboarding(true);
    }
  }, []);

  if (role === null) return null;

  if (showOnboarding) return <Onboarding onDone={() => setShowOnboarding(false)} />;
  if (role === 'staff-admin') return <ChildOverview isAdmin={true} />;
  if (role === 'staff-student') return <ChildOverview isAdmin={false} />;
  return (
    <div className="max-w-lg mx-auto">
      <StatusDashboard />
    </div>
  );
}
