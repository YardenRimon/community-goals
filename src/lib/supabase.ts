import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/env';
import type { Database } from '@/types/database';

const env = getSupabaseEnv();

export const supabase: SupabaseClient<Database> | null = env.configured
  ? createClient<Database>(env.url, env.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseConnectionResult {
  status: 'unconfigured' | 'connected' | 'schema_missing' | 'error';
  message: string;
  latencyMs?: number;
}

export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  if (!supabase) {
    return {
      status: 'unconfigured',
      message: 'ממתין להגדרת פרטי החיבור של Supabase בקובץ .env.local',
    };
  }

  const startedAt = performance.now();

  try {
    const { error } = await supabase
      .from('events')
      .select('id', { head: true, count: 'exact' });

    const latencyMs = Math.round(performance.now() - startedAt);

    if (error) {
      const missingTable =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        error.message.includes('schema cache') ||
        error.message.includes('does not exist');

      if (missingTable) {
        return {
          status: 'schema_missing',
          message:
            'החיבור לפרויקט Supabase הצליח, אך קובץ הסכמה טרם הורץ ב-SQL Editor.',
          latencyMs,
        };
      }

      return {
        status: 'error',
        message: 'לא הצלחנו לאמת את החיבור ל-Supabase. בדוק את הכתובת והמפתח הציבורי.',
        latencyMs,
      };
    }

    return {
      status: 'connected',
      message: 'מחובר ל-Supabase ומסד הנתונים מוכן לעבודה',
      latencyMs,
    };
  } catch {
    return {
      status: 'error',
      message: 'שגיאת תקשורת בעת הבדיקה מול Supabase. בדוק את חיבור הרשת וכתובת הפרויקט.',
    };
  }
}
