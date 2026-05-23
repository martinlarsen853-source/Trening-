'use client';
import dynamic from 'next/dynamic';

const StatusDashboard = dynamic(
  () => import('@/components/StatusDashboard').then(m => ({ default: m.StatusDashboard })),
  { ssr: false }
);

export default function StatusPage() {
  return (
    <div className="max-w-lg mx-auto">
      <StatusDashboard />
    </div>
  );
}
