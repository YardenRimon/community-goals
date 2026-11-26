export type SupabaseEnvStatus = 'ok' | 'missing' | 'placeholder' | 'invalid';

export interface SupabaseEnvValidation {
  configured: boolean;
  url: string;
  anonKey: string;
  reason: SupabaseEnvStatus;
}

const PLACEHOLDER_TOKENS = [
  'your-project-id',
  'your-public-anon-key',
  'example.supabase.co',
];

export function validateSupabaseEnv(
  rawUrl: string | undefined,
  rawAnonKey: string | undefined,
): SupabaseEnvValidation {
  const url = (rawUrl ?? '').trim();
  const anonKey = (rawAnonKey ?? '').trim();

  if (!url || !anonKey) {
    return { configured: false, url: '', anonKey: '', reason: 'missing' };
  }

  const combinedLower = `${url} ${anonKey}`.toLowerCase();
  if (PLACEHOLDER_TOKENS.some((token) => combinedLower.includes(token))) {
    return { configured: false, url: '', anonKey: '', reason: 'placeholder' };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { configured: false, url: '', anonKey: '', reason: 'invalid' };
    }
  } catch {
    return { configured: false, url: '', anonKey: '', reason: 'invalid' };
  }

  if (anonKey.length < 20) {
    return { configured: false, url: '', anonKey: '', reason: 'invalid' };
  }

  return {
    configured: true,
    url,
    anonKey,
    reason: 'ok',
  };
}

export function getSupabaseEnv(): SupabaseEnvValidation {
  return validateSupabaseEnv(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export const supabaseEnv = getSupabaseEnv();
export const isSupabaseConfigured = supabaseEnv.configured;
