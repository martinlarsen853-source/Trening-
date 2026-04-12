import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 0;

export default async function StrengthSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: session }, { data: sets }] = await Promise.all([
    supabase.from('strength_sessions').select('*').eq('id', id).single(),
    supabase
      .from('strength_sets')
      .select('*')
      .eq('session_id', id)
      .order('exercise_title')
      .order('set_index'),
  ]);

  if (!session) notFound();

  const duration =
    session.end_time
      ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
      : null;

  // Group sets by exercise
  const byExercise = (sets || []).reduce<Record<string, typeof sets>>((acc, s) => {
    if (!acc[s.exercise_title]) acc[s.exercise_title] = [];
    acc[s.exercise_title]!.push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/trening" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{session.title}</h1>
          <p className="text-sm text-gray-400">
            {format(new Date(session.start_time), "EEEE d. MMMM yyyy", { locale: nb })}
            {duration && ` · ${formatDuration(duration)}`}
          </p>
        </div>
      </div>

      {Object.entries(byExercise).map(([exercise, exerciseSets]) => (
        <Card key={exercise}>
          <CardTitle>{exercise}</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left pb-2 pr-3">Sett</th>
                  <th className="text-left pb-2 pr-3">Vekt</th>
                  <th className="text-left pb-2 pr-3">Reps</th>
                  <th className="text-left pb-2 pr-3">Type</th>
                  <th className="text-left pb-2">RPE</th>
                </tr>
              </thead>
              <tbody>
                {(exerciseSets || []).map((s, idx) => (
                  <tr key={s.id} className="border-b border-gray-700/40 last:border-0">
                    <td className="py-1.5 pr-3 text-gray-500">{idx + 1}</td>
                    <td className="py-1.5 pr-3 text-gray-300 tabular-nums">
                      {s.weight_kg ? `${s.weight_kg} kg` : '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-300 tabular-nums">
                      {s.reps || '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-400">
                      {s.set_type || 'normal'}
                    </td>
                    <td className="py-1.5 text-gray-400">
                      {s.rpe || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exerciseSets && exerciseSets.length > 0 && exerciseSets[0].weight_kg && (
            <p className="text-xs text-gray-500 mt-2">
              Maks vekt: {Math.max(...exerciseSets.map((s) => s.weight_kg || 0))} kg ·{' '}
              Totalt volum: {exerciseSets.reduce((sum, s) => sum + (s.weight_kg || 0) * (s.reps || 0), 0).toFixed(0)} kg
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
