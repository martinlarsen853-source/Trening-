import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';

/** Format seconds as mm:ss pace string */
export function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm) return '—';
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/** Format seconds as h:mm:ss duration string */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format meters to km with one decimal */
export function formatDistance(meters: number | null): string {
  if (!meters) return '—';
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format sleep seconds to hours with one decimal */
export function formatSleep(seconds: number | null): string {
  if (!seconds) return '—';
  return `${(seconds / 3600).toFixed(1)}t`;
}

/** Format date to Norwegian locale */
export function formatDate(dateStr: string | null, fmt = 'd. MMM yyyy'): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), fmt, { locale: nb });
  } catch {
    return dateStr;
  }
}

/** Format date relative (e.g. "3 dager siden") */
export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: nb });
  } catch {
    return dateStr;
  }
}

/** TSB/Form color coding */
export function tsbColor(tsb: number | null): string {
  if (tsb === null) return 'text-gray-400';
  if (tsb > 5) return 'text-green-400';
  if (tsb >= -10) return 'text-yellow-400';
  return 'text-red-400';
}

export function tsbLabel(tsb: number | null): string {
  if (tsb === null) return 'Ukjent';
  if (tsb > 10) return 'Frisk';
  if (tsb > 5) return 'Klar';
  if (tsb >= -10) return 'Optimal';
  if (tsb >= -25) return 'Sliten';
  return 'Overbelastet';
}

/** HRV trend color */
export function hrvColor(current: number | null, avg7d: number | null): string {
  if (!current || !avg7d) return 'text-gray-400';
  const ratio = current / avg7d;
  if (ratio >= 0.97) return 'text-green-400';
  if (ratio >= 0.90) return 'text-yellow-400';
  return 'text-red-400';
}

/** Acute:chronic ratio risk */
export function aclrRisk(atl: number | null, ctl: number | null): { color: string; label: string } {
  if (!atl || !ctl || ctl === 0) return { color: 'text-gray-400', label: 'Ukjent' };
  const ratio = atl / ctl;
  if (ratio < 0.8) return { color: 'text-blue-400', label: 'Lett' };
  if (ratio <= 1.3) return { color: 'text-green-400', label: 'Optimal' };
  if (ratio <= 1.5) return { color: 'text-yellow-400', label: 'Forsiktig' };
  return { color: 'text-red-400', label: 'Høy risiko' };
}

/** cn helper for Tailwind class merging */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
