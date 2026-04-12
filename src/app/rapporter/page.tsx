import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { GenerateReportButton } from '@/components/ui/GenerateReportButton';
import { FileText, AlertTriangle, ChevronRight } from 'lucide-react';

export const revalidate = 0;

export default async function RapporterPage() {
  const supabase = createServiceClient();

  const { data: reports } = await supabase
    .from('ai_reports')
    .select('id, report_type, period_start, period_end, content, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  const weeklyReports = (reports || []).filter((r) => r.report_type === 'weekly');
  const alerts = (reports || []).filter((r) => r.report_type === 'alert');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">AI-rapporter</h1>
        <GenerateReportButton />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Varsler
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <Link key={alert.id} href={`/rapporter/${alert.id}`}>
                <div className="flex items-start gap-3 bg-red-900/20 border border-red-700/40 rounded-xl p-3 hover:border-red-600/60 transition-colors">
                  <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">
                      {format(new Date(alert.created_at), 'd. MMM HH:mm', { locale: nb })}
                    </p>
                    <p className="text-sm text-red-200 line-clamp-2">
                      {alert.content.slice(0, 120)}...
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Weekly reports */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Ukentlige rapporter
        </h2>
        {weeklyReports.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500 text-center py-4">
              Ingen rapporter ennå. Generer din første rapport over.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {weeklyReports.map((report) => (
              <Link key={report.id} href={`/rapporter/${report.id}`}>
                <div className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl p-3 hover:border-gray-500 transition-colors">
                  <FileText size={15} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Uke {report.period_start ? format(new Date(report.period_start + 'T12:00:00'), 'w', { locale: nb }) : '?'}
                      {report.period_start && report.period_end && (
                        <span className="text-gray-400 font-normal ml-1 text-xs">
                          ({report.period_start} – {report.period_end})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(report.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {report.content.slice(0, 150)}...
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
