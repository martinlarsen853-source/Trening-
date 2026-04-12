import { createServiceClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ReportChat } from '@/components/ui/ReportChat';

export const revalidate = 0;

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: report, error } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !report) notFound();

  const isAlert = report.report_type === 'alert';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/rapporter" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">
            {isAlert ? 'Varsel' : 'Ukentlig rapport'}
            {report.period_start && !isAlert && (
              <span className="text-gray-400 font-normal text-base ml-2">
                Uke {format(new Date(report.period_start + 'T12:00:00'), 'w', { locale: nb })}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400">
            {format(new Date(report.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
          </p>
        </div>
      </div>

      {/* Report content */}
      <div className={`rounded-xl p-5 border ${isAlert ? 'bg-red-900/20 border-red-700/40' : 'bg-gray-800 border-gray-700'}`}>
        <div
          className="prose-dark"
          dangerouslySetInnerHTML={{
            __html: markdownToHtml(report.content),
          }}
        />
      </div>

      {/* Follow-up chat */}
      {!isAlert && (
        <ReportChat reportContent={report.content} reportId={report.id} />
      )}
    </div>
  );
}

/** Very simple markdown → HTML converter for reports */
function markdownToHtml(md: string): string {
  return md
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/---/g, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[huli])/gm, '<p>')
    .replace(/$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hul])/g, '$1')
    .replace(/(<\/[hul][^>]*>)<\/p>/g, '$1');
}
