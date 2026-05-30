'use client';
import dynamic from 'next/dynamic';

const ScheduleGrid = dynamic(
  () => import('@/components/ScheduleGrid').then(m => ({ default: m.ScheduleGrid })),
  { ssr: false }
);

export default function TimeplanPage() {
  return (
    <div className="max-w-lg mx-auto">
      <ScheduleGrid />
    </div>
  );
}
