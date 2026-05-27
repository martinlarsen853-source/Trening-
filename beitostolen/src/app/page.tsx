'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const StatusDashboard = dynamic(
  () => import('@/components/StatusDashboard').then(m => ({ default: m.StatusDashboard })),
  { ssr: false }
);
const ChildOverview = dynamic(
  () => import('@/components/ChildOverview').then(m => ({ default: m.ChildOverview })),
  { ssr: false }
);

export default function HomePage() {
  const [role, setRole] = useState<'staff-admin' | 'staff-student' | 'other' | null>(null);

  useEffect(() => {
    const leder = localStorage.getItem('lederMode') === 'true';
    const staffRole = localStorage.getItem('staffRole');
    if (leder && staffRole === 'admin') setRole('staff-admin');
    else if (staffRole === 'student') setRole('staff-student');
    else setRole('other');
  }, []);

  if (role === null) return null;

  if (role === 'staff-admin') return <ChildOverview isAdmin={true} />;
  if (role === 'staff-student') return <ChildOverview isAdmin={false} />;
  return (
    <div className="max-w-lg mx-auto">
      <StatusDashboard />
    </div>
  );
}
