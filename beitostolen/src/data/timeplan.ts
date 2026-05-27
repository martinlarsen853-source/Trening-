import type { TimeplanDay } from '@/lib/supabase';

// Statisk buffer fjernet — all data hentes fra Supabase.
export const STATIC_WEEKS: Record<string, TimeplanDay[]> = {};
